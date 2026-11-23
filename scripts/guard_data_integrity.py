#!/usr/bin/env python3
"""Guard critical repository data against accidental deletion and roster loss."""
from __future__ import annotations
import argparse, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/integrity-manifest.json"
def bootstrap_critical_files(base_ref: str) -> list[str]:
    """Derive the first inventory from the immutable base tree, never PR constants."""
    tracked = git("ls-tree", "-r", "--name-only", base_ref).splitlines()
    return sorted(
        path for path in tracked
        if path.endswith(".json")
        and ("/" not in path or path.startswith("data/") and path.count("/") == 1)
        and path != "package.json"
    )

def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout.strip()

def unsafe_repo_path(relative: str) -> tuple[bool, str]:
    """Reject traversal and symlinks in any component of a protected repo path."""
    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        return True, "ruta absoluta o con traversal"
    current = ROOT
    for part in candidate.parts:
        current = current / part
        if current.is_symlink():
            return True, f"componente simbólico: {current.relative_to(ROOT)}"
    return False, ""


def load_manifest():
    unsafe, reason = unsafe_repo_path("data/integrity-manifest.json")
    if unsafe:
        raise RuntimeError(f"Manifiesto de integridad inseguro ({reason})")
    return json.loads(MANIFEST.read_text(encoding="utf-8"))

def load_baseline_manifest(base_ref: str):
    try:
        return json.loads(git("show", f"{base_ref}:data/integrity-manifest.json"))
    except RuntimeError as exc:
        # Bootstrap only when the manifest genuinely does not exist on base.
        # Other git failures remain fatal; never silently downgrade.
        message = str(exc)
        if "does not exist in" not in message and "exists on disk, but not in" not in message:
            raise
        baseline_roster = json.loads(git("show", f"{base_ref}:data/roster.json"))
        return {
            "critical_files": bootstrap_critical_files(base_ref),
            "protected_roster_ids": sorted(
                profile["id"] for profile in baseline_roster.get("heroes", [])
                if isinstance(profile, dict) and profile.get("id")
            ),
            "authorized_roster_removals": [],
        }

def check(base_ref: str, recovery_report: bool = False) -> list[str]:
    errors = []
    try:
        baseline_manifest = load_baseline_manifest(base_ref)
        manifest = load_manifest()
        policy_keys = ("critical_files", "protected_roster_ids", "authorized_roster_removals")
        for key in policy_keys:
            if manifest.get(key) != baseline_manifest.get(key):
                errors.append(
                    f"Política de integridad modificada en el mismo PR ({key}); "
                    "la autorización/inventario debe existir en la línea base revisada."
                )
        critical = set(baseline_manifest["critical_files"])
        ids = set(baseline_manifest["protected_roster_ids"])
        removals = {item["id"]: item for item in baseline_manifest.get("authorized_roster_removals", [])}
    except Exception as exc:
        return [f"No se pudo cargar la política de integridad de la línea base {base_ref}: {exc}"]
    changed = git("diff", "--name-status", f"{base_ref}...HEAD").splitlines()
    deleted = set()
    for line in changed:
        fields = line.split("\t")
        if len(fields) >= 2 and fields[0].startswith("D"):
            deleted.add(fields[-1])
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
        current = json.loads((ROOT / "data/roster.json").read_text(encoding="utf-8"))
        old_ids = {profile.get("id") for profile in baseline.get("heroes", [])}
        new_ids = {profile.get("id") for profile in current.get("heroes", [])}
        removed = old_ids - new_ids
        added = new_ids - old_ids
        missing_protected = ids - new_ids
        for identifier in sorted(removed):
            authorization = removals.get(identifier)
            if not authorization or not authorization.get("reason") or not authorization.get("reference"):
                errors.append(f"Perfil eliminado sin autorización explícita (ID {identifier!r}); registrar motivo y referencia en manifest.")
        for identifier in sorted(missing_protected - set(removals)):
            errors.append(f"ID protegido ausente del roster: {identifier}")
        for identifier in sorted(added):
            print(f"ROSTER: nuevo ID detectado: {identifier}")
    except Exception as exc:
        errors.append(f"No se pudo comparar el roster con {base_ref}: {exc}")
    if recovery_report:
        print("\nRECUPERACIÓN COMPROBABLE (Git):")
        for path in sorted(critical):
            try:
                sha = git("rev-parse", f"{base_ref}:{path}")
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
