#!/usr/bin/env python3
"""Guard critical repository data against accidental deletion or unsafe path changes."""
from __future__ import annotations
import argparse, json, re, subprocess, sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/integrity-manifest.json"


def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def unsafe_repo_path(relative: str) -> tuple[bool, str]:
    """Fail closed for non-canonical paths and symlinks in every component."""
    if not isinstance(relative, str) or not relative:
        return True, "ruta vacía o no textual"
    if "\\" in relative or relative.startswith("//"):
        return True, "separadores ambiguos"
    candidate = PurePosixPath(relative)
    if candidate.is_absolute() or relative.startswith("/") or ".." in candidate.parts:
        return True, "ruta absoluta o con traversal"
    if str(candidate) != relative or any(part in ("", ".") for part in relative.split("/")):
        return True, "ruta no canónica o ambigua"
    current = ROOT
    try:
        for part in candidate.parts:
            current = current / part
            if current.is_symlink():
                return True, f"componente simbólico: {current.relative_to(ROOT)}"
    except (OSError, ValueError):
        return True, "no se pudo verificar la ruta"
    return False, ""


def load_manifest():
    unsafe, reason = unsafe_repo_path("data/integrity-manifest.json")
    if unsafe:
        raise RuntimeError(f"Manifiesto de integridad inseguro ({reason})")
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("Manifiesto inválido: raíz debe ser un objeto.")
    return payload


def bootstrap_critical_files(base_ref: str) -> list[str]:
    tracked = git("ls-tree", "-r", "--name-only", base_ref).splitlines()
    return sorted(
        path for path in tracked
        if path.endswith(".json")
        and ("/" not in path or path.startswith("data/") and path.count("/") == 1)
        and path != "package.json"
    )


def load_baseline_manifest(base_ref: str):
    try:
        return json.loads(git("show", f"{base_ref}:data/integrity-manifest.json"))
    except RuntimeError as exc:
        message = str(exc)
        if "does not exist in" not in message and "exists on disk, but not in" not in message:
            raise
        baseline_roster = json.loads(git("show", f"{base_ref}:data/roster.json"))
        heroes = baseline_roster.get("heroes", [])
        if not isinstance(heroes, list):
            raise RuntimeError("Roster de línea base inválido durante bootstrap.")
        return {
            "critical_files": bootstrap_critical_files(base_ref),
            "protected_roster_ids": sorted(
                profile["id"] for profile in heroes
                if isinstance(profile, dict) and isinstance(profile.get("id"), str) and profile["id"]
            ),
            "authorized_roster_removals": [],
        }


def validate_inventory(manifest: dict, label: str, errors: list[str]) -> set[str]:
    paths = manifest.get("critical_files")
    if not isinstance(paths, list) or not paths or any(not isinstance(p, str) for p in paths):
        errors.append(f"Inventario crítico inválido en {label}: debe ser una lista no vacía de rutas.")
        return set()
    if len(paths) != len(set(paths)):
        errors.append(f"Inventario crítico duplicado en {label}.")
    normalized = set()
    for path in paths:
        unsafe, reason = unsafe_repo_path(path)
        if unsafe:
            errors.append(f"Ruta de inventario insegura en {label}: {path!r} ({reason}).")
        normalized.add(path)
    return normalized


def validate_authorizations(items, label: str, errors: list[str]) -> dict:
    if not isinstance(items, list):
        errors.append(f"Registro de autorizaciones inválido en {label}: se esperaba una lista.")
        return {}
    indexed = {}
    for item in items:
        if not isinstance(item, dict):
            errors.append(f"Autorización inválida en {label}: se esperaba un objeto.")
            continue
        identifier = item.get("id")
        if not isinstance(identifier, str) or not identifier.strip():
            errors.append(f"Autorización inválida en {label}: cada registro requiere un ID.")
            continue
        if identifier in indexed:
            errors.append(f"Autorización duplicada para el ID {identifier!r} en {label}.")
        if set(item) != {"id", "reason", "reference"}:
            errors.append(f"Autorización inválida para {identifier!r} en {label}: campos inesperados o ausentes.")
        if not isinstance(item.get("reason"), str) or not item["reason"].strip():
            errors.append(f"Autorización de retiro sin motivo válido (ID {identifier!r}).")
        if not isinstance(item.get("reference"), str) or not item["reference"].strip():
            errors.append(f"Autorización de retiro sin referencia válida (ID {identifier!r}).")
        indexed[identifier] = item
    return indexed


def parse_diff(base_ref: str) -> list[tuple[str, list[str]]]:
    raw = git("diff", "--name-status", "-M", f"{base_ref}...HEAD")
    entries = []
    for line in raw.splitlines():
        fields = line.split("\t")
        if not fields or not fields[0]:
            raise RuntimeError("Salida de diff inválida: estado vacío.")
        status = fields[0]
        if status.startswith(("R", "C")):
            if not re.fullmatch(r"[RC](?:100|[1-9]?[0-9])", status) or len(fields) != 3:
                raise RuntimeError(f"Salida de diff inválida para {status}: {line!r}")
        elif status not in {"A", "M", "D", "T"} or len(fields) != 2:
            raise RuntimeError(f"Salida de diff inválida: {line!r}")
        if any(not path or "\x00" in path for path in fields[1:]):
            raise RuntimeError(f"Salida de diff con ruta vacía o inválida: {line!r}")
        entries.append((status, fields[1:]))
    return entries


def check(base_ref: str, recovery_report: bool = False) -> list[str]:
    errors = []
    try:
        baseline_manifest = load_baseline_manifest(base_ref)
        manifest = load_manifest()
        baseline_critical = validate_inventory(baseline_manifest, "línea base", errors)
        current_critical = validate_inventory(manifest, "PR", errors)
        for key in ("critical_files", "protected_roster_ids"):
            if manifest.get(key) != baseline_manifest.get(key):
                errors.append(
                    f"Política de integridad modificada en el mismo PR ({key}); "
                    "el inventario y los IDs protegidos solo cambian mediante una política externa revisada."
                )
        critical = baseline_critical
        ids = set(baseline_manifest.get("protected_roster_ids", []))
        baseline_authorizations = baseline_manifest.get("authorized_roster_removals", [])
        current_authorizations = manifest.get("authorized_roster_removals", [])
        baseline_auth = validate_authorizations(baseline_authorizations, "línea base", errors)
        current_auth = validate_authorizations(current_authorizations, "PR", errors)
        for identifier, authorization in baseline_auth.items():
            if current_auth.get(identifier) != authorization:
                errors.append(
                    f"Autorización histórica modificada o eliminada (ID {identifier!r}); "
                    "los registros aprobados son inmutables."
                )
        new_authorizations = [
            authorization for identifier, authorization in current_auth.items()
            if identifier not in baseline_auth
        ]
        authorized_removals = baseline_auth
    except Exception as exc:
        return [f"No se pudo cargar la política de integridad de la línea base {base_ref}: {exc}"]

    try:
        changed = parse_diff(base_ref)
    except Exception as exc:
        return [f"No se pudo verificar el diff de integridad (fail-closed): {exc}"]

    if new_authorizations:
        authorization_only = bool(changed) and all(
            status == "M" and paths == ["data/integrity-manifest.json"]
            for status, paths in changed
        )
        if not authorization_only:
            errors.append(
                "La Fase A de autorización solo puede modificar data/integrity-manifest.json; "
                "se detectaron cambios adicionales en el PR."
            )

    deleted = set()
    renamed = []
    for status, paths in changed:
        if status.startswith("D"):
            deleted.add(paths[-1])
        elif status.startswith("R"):
            renamed.append((paths[0], paths[1]))
            deleted.add(paths[0])
    for old, new in renamed:
        if old in critical:
            errors.append(f"Renombrado de archivo crítico bloqueado: {old} -> {new}.")
    for path in sorted(deleted & critical):
        errors.append(f"Archivo crítico eliminado: {path}. Restaurar o documentar una baja autorizada.")

    for path in sorted(critical):
        unsafe, reason = unsafe_repo_path(path)
        if unsafe:
            errors.append(f"Ruta crítica insegura: {path} ({reason})")
        elif not (ROOT / path).is_file():
            errors.append(f"Inventario crítico ausente en el árbol actual: {path}")

    try:
        baseline = json.loads(git("show", f"{base_ref}:data/roster.json"))
        current_path = ROOT / "data/roster.json"
        unsafe, reason = unsafe_repo_path("data/roster.json")
        if unsafe:
            raise RuntimeError(f"roster path unsafe: {reason}")
        current = json.loads(current_path.read_text(encoding="utf-8"))
        if not isinstance(baseline.get("heroes"), list) or not isinstance(current.get("heroes"), list):
            raise RuntimeError("estructura heroes inválida")
        old_ids = {profile.get("id") for profile in baseline["heroes"] if isinstance(profile, dict)}
        new_ids = {profile.get("id") for profile in current["heroes"] if isinstance(profile, dict)}
        removed, added = old_ids - new_ids, new_ids - old_ids
        missing_protected = ids - new_ids
        if new_authorizations and (removed or added or any(status != "M" or paths != ["data/integrity-manifest.json"] for status, paths in changed)):
            errors.append(
                "La autorización de retiro debe aprobarse en un PR separado, sin cambios al roster; "
                "no se puede autorizar y ejecutar un retiro en el mismo PR."
            )
        for authorization in new_authorizations:
            identifier = authorization.get("id")
            if identifier not in ids or identifier not in old_ids:
                errors.append(f"Autorización de retiro para ID no protegido o inexistente: {identifier!r}.")
        for identifier in sorted(removed):
            authorization = authorized_removals.get(identifier)
            if not authorization or not authorization.get("reason") or not authorization.get("reference"):
                errors.append(f"Perfil eliminado sin autorización explícita (ID {identifier!r}); registrar motivo y referencia en manifest.")
        for identifier in sorted(missing_protected - set(authorized_removals)):
            errors.append(f"ID protegido ausente del roster: {identifier}")
        for identifier in sorted(added):
            print(f"ROSTER: nuevo ID detectado: {identifier}")
    except Exception as exc:
        errors.append(f"No se pudo comparar el roster con {base_ref}: {exc}")

    if recovery_report:
        print("\nRECUPERACIÓN COMPROBABLE (Git):")
        for path in sorted(critical):
            try:
                sha = git("rev-parse", f"{base_ref}:{path}").strip()
                print(f"OK {path} — objeto histórico disponible {sha[:12]}")
                print(f"  Recuperar: git restore --source {base_ref} -- {path}")
            except Exception:
                print(f"NO RECUPERABLE desde {base_ref}: {path}")
    return errors


def main():
    parser = argparse.ArgumentParser(description="Inventario crítico, detección de eliminaciones, integridad del roster y evidencia de recuperación Git.")
    parser.add_argument("--base-ref", default="origin/main", help="Referencia base para comparar")
    parser.add_argument("--recovery-report", action="store_true", help="Verifica disponibilidad histórica y muestra comandos de recuperación")
    args = parser.parse_args()
    try:
        errors = check(args.base_ref, args.recovery_report)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    if errors:
        print("\nPROTECCIÓN DE DATOS: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1
    print("PROTECCIÓN DE DATOS: PASS — inventario crítico presente, eliminaciones controladas y roster íntegro.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
