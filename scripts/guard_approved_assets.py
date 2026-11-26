#!/usr/bin/env python3
"""Fail-closed guard for the curated, approved editorial asset inventory.

The manifest stores Git blob object IDs (SHA-1), not signatures. They are used
to detect accidental replacement/deletion and to enforce a two-PR approval
protocol. They do not provide tamper-proof provenance against an administrator
who can change both the guard and the repository rules.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "data/approved-assets-manifest.json"
REQUIRED_ROOTS = ["assets/carnet", "assets/heroes"]
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg", ".gif"}
BLOB_RE = re.compile(r"^[0-9a-f]{40}$")


def git(*args: str, check: bool = True) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and result.returncode:
        raise RuntimeError(
            "git " + " ".join(args) + " failed: " + (result.stderr.strip() or result.stdout.strip())
        )
    return result.stdout.strip()


def safe_path(value: object) -> bool:
    if not isinstance(value, str) or not value or "\\" in value:
        return False
    path = PurePosixPath(value)
    return (
        not path.is_absolute()
        and path.as_posix() == value
        and all(part not in ("", ".", "..") for part in path.parts)
    )


def has_symlink_component(path: str) -> bool:
    current = ROOT
    for component in PurePosixPath(path).parts:
        current = current / component
        if current.is_symlink():
            return True
    return False


def read_manifest_worktree() -> dict:
    path = ROOT / MANIFEST
    if path.is_symlink() or not path.is_file():
        raise ValueError(f"{MANIFEST} ausente, no regular o enlazado simbólicamente")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("el manifiesto debe ser un objeto JSON")
    return data


def read_manifest_ref(base_ref: str) -> dict | None:
    result = subprocess.run(
        ["git", "show", f"{base_ref}:{MANIFEST}"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode:
        # A missing manifest is only valid for the one-time bootstrap.
        return None
    data = json.loads(result.stdout)
    if not isinstance(data, dict):
        raise ValueError(f"{MANIFEST} en {base_ref} no es un objeto JSON")
    return data


def validate_manifest(data: dict, label: str) -> list[str]:
    errors: list[str] = []
    if data.get("version") != 1:
        errors.append(f"{label}: version debe ser 1")
    if data.get("algorithm") != "git-blob-sha1":
        errors.append(f"{label}: algorithm debe ser git-blob-sha1")
    roots = data.get("protected_roots")
    if roots != REQUIRED_ROOTS:
        errors.append(f"{label}: protected_roots debe ser exactamente {REQUIRED_ROOTS!r}")

    assets = data.get("protected_assets")
    if not isinstance(assets, dict) or not assets:
        errors.append(f"{label}: protected_assets debe ser un objeto no vacío")
        assets = {}
    for path, blob in assets.items():
        if not safe_path(path):
            errors.append(f"{label}: ruta insegura en protected_assets: {path!r}")
        if not isinstance(blob, str) or not BLOB_RE.fullmatch(blob):
            errors.append(f"{label}: Git blob inválido para {path!r}")

    approvals = data.get("approved_updates")
    if not isinstance(approvals, list):
        errors.append(f"{label}: approved_updates debe ser una lista")
        approvals = []
    seen: set[tuple[str, str, str, str]] = set()
    for index, approval in enumerate(approvals):
        prefix = f"{label}: approved_updates[{index}]"
        if not isinstance(approval, dict):
            errors.append(f"{prefix} debe ser un objeto")
            continue
        if set(approval) != {"operation", "path", "before_blob", "after_blob", "reason", "reference"}:
            errors.append(f"{prefix} tiene campos faltantes o inesperados")
            continue
        operation = approval.get("operation")
        path = approval.get("path")
        before_blob = approval.get("before_blob")
        after_blob = approval.get("after_blob")
        reason = approval.get("reason")
        reference = approval.get("reference")
        if operation not in ("replace", "add"):
            errors.append(f"{prefix}: operation debe ser replace o add")
        if not safe_path(path):
            errors.append(f"{prefix}: ruta insegura")
        if operation == "replace" and (not isinstance(before_blob, str) or not BLOB_RE.fullmatch(before_blob)):
            errors.append(f"{prefix}: before_blob inválido para replace")
        if operation == "add" and before_blob != "absent":
            errors.append(f"{prefix}: before_blob debe ser absent para add")
        if not isinstance(after_blob, str) or not BLOB_RE.fullmatch(after_blob):
            errors.append(f"{prefix}: after_blob debe ser un Git blob SHA-1")
        if operation == "replace" and before_blob == after_blob:
            errors.append(f"{prefix}: before_blob y after_blob no pueden ser iguales")
        if not isinstance(reason, str) or not reason.strip():
            errors.append(f"{prefix}: reason es obligatorio")
        if not isinstance(reference, str) or not reference.strip():
            errors.append(f"{prefix}: reference es obligatorio")
        key = (str(operation), str(path), str(before_blob), str(after_blob))
        if key in seen:
            errors.append(f"{prefix}: autorización duplicada")
        seen.add(key)
    return errors


def diff_statuses(base_ref: str) -> list[tuple[str, str]]:
    raw = git("diff", "--name-status", "--no-renames", f"{base_ref}...HEAD")
    parsed: list[tuple[str, str]] = []
    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) != 2 or parts[0] not in {"A", "M", "D", "T"}:
            raise RuntimeError(f"formato de git diff no reconocido: {line!r}")
        if not safe_path(parts[1]):
            raise RuntimeError(f"ruta insegura en git diff: {parts[1]!r}")
        parsed.append((parts[0], parts[1]))
    return parsed


def blob_at_ref(ref: str, path: str) -> str | None:
    result = subprocess.run(
        ["git", "rev-parse", f"{ref}:{path}"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode:
        return None
    value = result.stdout.strip()
    return value if BLOB_RE.fullmatch(value) else None


def blob_in_worktree(path: str) -> str | None:
    target = ROOT / path
    if target.is_symlink() or not target.is_file():
        return None
    result = subprocess.run(
        ["git", "hash-object", "--", path],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode:
        return None
    value = result.stdout.strip()
    return value if BLOB_RE.fullmatch(value) else None


def image_paths_at_ref(ref: str, root: str) -> set[str]:
    raw = git("ls-tree", "-r", "--name-only", ref, "--", root + "/")
    return {
        path for path in raw.splitlines()
        if PurePosixPath(path).suffix.lower() in IMAGE_SUFFIXES
    }


def validate_approvals_against_base(
    new_approvals: list[dict],
    base_assets: dict[str, str],
    base_ref: str,
) -> list[str]:
    errors: list[str] = []
    seen_paths: set[tuple[str, str]] = set()
    for index, approval in enumerate(new_approvals):
        operation = approval["operation"]
        path = approval["path"]
        before_blob = approval["before_blob"]
        after_blob = approval["after_blob"]
        key = (operation, path)
        if key in seen_paths:
            errors.append(f"autorización nueva duplicada para {path}")
        seen_paths.add(key)

        if operation == "replace":
            expected = base_assets.get(path)
            if expected is None:
                errors.append(f"replace no autorizado: {path} no pertenece al inventario de main")
            elif before_blob != expected:
                errors.append(f"replace no autorizado: before_blob no coincide con main para {path}")
            elif blob_at_ref(base_ref, path) != expected:
                errors.append(f"replace no autorizado: el asset base no coincide con el manifiesto: {path}")
        elif operation == "add":
            if path in base_assets or blob_at_ref(base_ref, path) is not None:
                errors.append(f"add no autorizado: {path} ya existe en main")
            if before_blob != "absent":
                errors.append(f"add no autorizado: before_blob debe ser absent para {path}")

        # Phase A never writes the proposed bytes. A replacement keeps the old
        # file unchanged; an addition keeps the proposed path absent.
        if operation == "replace":
            if blob_in_worktree(path) != before_blob:
                errors.append(f"Fase A inválida: el asset existente debe permanecer intacto: {path}")
        elif operation == "add":
            if (ROOT / path).exists() or has_symlink_component(path):
                errors.append(f"Fase A inválida: la nueva ruta debe permanecer ausente: {path}")
    return errors


def check(base_ref: str) -> tuple[list[str], str]:
    errors: list[str] = []
    try:
        git("rev-parse", "--verify", f"{base_ref}^{{commit}}")
        statuses = diff_statuses(base_ref)
        changed = {path: status for status, path in statuses}

        current = read_manifest_worktree()
        errors.extend(validate_manifest(current, "manifiesto candidato"))
        if errors:
            return errors, "invalid-manifest"

        current_assets: dict[str, str] = current["protected_assets"]
        current_approvals: list[dict] = current["approved_updates"]

        # Always require complete coverage of the canonical roster asset directories.
        base_root_images = set().union(*(image_paths_at_ref(base_ref, root) for root in REQUIRED_ROOTS))
        head_root_images = set().union(*(image_paths_at_ref("HEAD", root) for root in REQUIRED_ROOTS))
        manifest_root_images = {
            path for path in current_assets
            if any(path.startswith(root + "/") for root in REQUIRED_ROOTS)
            and PurePosixPath(path).suffix.lower() in IMAGE_SUFFIXES
        }

        base_manifest = read_manifest_ref(base_ref)
        if base_manifest is None:
            if MANIFEST not in changed or changed[MANIFEST] != "A":
                errors.append(f"bootstrap inválido: {MANIFEST} debe agregarse en este PR")
            if current_approvals:
                errors.append("bootstrap inválido: approved_updates debe empezar vacío")
            if manifest_root_images != base_root_images:
                errors.append("bootstrap inválido: deben incluirse todas las imágenes de assets/carnet y assets/heroes presentes en main")
            if head_root_images != base_root_images:
                errors.append("bootstrap inválido: no se permiten altas, bajas ni renombres de imágenes de Roster en el mismo PR")

            for path, expected in current_assets.items():
                base_blob = blob_at_ref(base_ref, path)
                work_blob = blob_in_worktree(path)
                if base_blob is None:
                    errors.append(f"bootstrap inválido: asset inexistente en main: {path}")
                elif base_blob != expected:
                    errors.append(f"bootstrap inválido: la huella no coincide con main: {path}")
                if work_blob != expected:
                    errors.append(f"bootstrap inválido: el asset cambió durante la creación del baseline: {path}")
            changed_assets = set(changed) & set(current_assets)
            if changed_assets:
                errors.append("bootstrap inválido: el PR inicial no puede reemplazar assets protegidos: " + ", ".join(sorted(changed_assets)))
            return errors, "bootstrap"

        errors.extend(validate_manifest(base_manifest, "manifiesto de main"))
        if errors:
            return errors, "invalid-main-manifest"

        base_assets: dict[str, str] = base_manifest["protected_assets"]
        base_approvals: list[dict] = base_manifest["approved_updates"]
        if current["protected_roots"] != base_manifest["protected_roots"]:
            errors.append("protected_roots no puede cambiar en un PR de assets")
        if not set(base_assets).issubset(set(current_assets)):
            errors.append("no se pueden retirar rutas del inventario protegido")

        # Historical approvals are append-only. A PR cannot rewrite or erase prior authorization.
        if current_approvals[:len(base_approvals)] != base_approvals:
            errors.append("el historial de approved_updates es inmutable y no puede reescribirse")
        if errors:
            return errors, "invalid-inventory-or-history"

        new_approvals = current_approvals[len(base_approvals):]
        if new_approvals:
            if set(changed) != {MANIFEST}:
                errors.append("Fase A inválida: un PR de autorización solo puede modificar data/approved-assets-manifest.json")
            if current_assets != base_assets:
                errors.append("Fase A inválida: no se pueden actualizar hashes en el mismo PR que autoriza")
            if head_root_images != base_root_images:
                errors.append("Fase A inválida: no se pueden agregar o retirar archivos del Roster en el mismo PR que autoriza")
            errors.extend(validate_approvals_against_base(new_approvals, base_assets, base_ref))
            for path, expected in base_assets.items():
                if blob_in_worktree(path) != expected:
                    errors.append(f"Fase A inválida: el asset protegido cambió antes de ejecutar la autorización: {path}")
            return errors, "phase-a"

        if current_approvals != base_approvals:
            errors.append("approved_updates solo puede ampliarse en Fase A")
            return errors, "invalid-approval-history"

        # Phase B: asset bytes and their manifest fingerprint change together,
        # but only using a prior Phase-A authorization already present on main.
        removed_inventory = set(base_assets) - set(current_assets)
        if removed_inventory:
            errors.append("no se pueden retirar assets del inventario: " + ", ".join(sorted(removed_inventory)))
            return errors, "invalid-inventory"

        changed_manifest_paths = {
            path for path in set(base_assets) | set(current_assets)
            if base_assets.get(path) != current_assets.get(path)
        }
        root_added = head_root_images - base_root_images
        root_removed = base_root_images - head_root_images
        if root_removed:
            errors.append("no se pueden eliminar o renombrar imágenes protegidas de Roster: " + ", ".join(sorted(root_removed)))

        changed_asset_paths = {
            path for path in changed
            if path in base_assets or path in current_assets
        }
        if changed_asset_paths != changed_manifest_paths:
            errors.append(
                "el diff de assets y los hashes del manifiesto deben coincidir exactamente; "
                f"diff={sorted(changed_asset_paths)}, manifiesto={sorted(changed_manifest_paths)}"
            )

        for path in changed_manifest_paths:
            before_blob = base_assets.get(path)
            after_blob = current_assets.get(path)
            if after_blob is None:
                errors.append(f"no se permite quitar el hash protegido de {path}")
                continue
            if before_blob is None:
                if not safe_path(path):
                    errors.append(f"ruta nueva inválida: {path}")
                matches = [
                    item for item in base_approvals
                    if item["operation"] == "add"
                    and item["path"] == path
                    and item["before_blob"] == "absent"
                    and item["after_blob"] == after_blob
                ]
            else:
                matches = [
                    item for item in base_approvals
                    if item["operation"] == "replace"
                    and item["path"] == path
                    and item["before_blob"] == before_blob
                    and item["after_blob"] == after_blob
                ]
            if not matches:
                errors.append(f"cambio de asset sin autorización previa en main: {path}")
            if blob_in_worktree(path) != after_blob:
                errors.append(f"el contenido actual no coincide con el hash aprobado para {path}")

        for path, expected in base_assets.items():
            if path in changed_manifest_paths:
                continue
            actual = blob_in_worktree(path)
            if actual != expected:
                errors.append(f"asset protegido alterado sin actualizar el manifiesto autorizado: {path}")

        for path in root_added:
            if path not in changed_manifest_paths:
                errors.append(f"nueva imagen en directorio de Roster sin alta autorizada en el manifiesto: {path}")

        return errors, "phase-b" if changed_manifest_paths else "steady-state"

    except (RuntimeError, ValueError, json.JSONDecodeError, OSError) as exc:
        return [f"guardia interrumpida en modo fail-closed: {exc}"], "blocked"


def main() -> int:
    parser = argparse.ArgumentParser(description="Protege assets editoriales aprobados contra reemplazos no autorizados.")
    parser.add_argument("--base-ref", required=True, help="Referencia Git base, normalmente origin/main")
    args = parser.parse_args()

    errors, phase = check(args.base_ref)
    if errors:
        print("PROTECCIÓN DE ASSETS: FAIL")
        print("Fase:", phase)
        for error in errors:
            print("-", error)
        print("\nRecuperación sugerida para un asset aprobado alterado:")
        print(f"git restore --source {args.base_ref} -- <ruta-del-asset>")
        return 1

    print("PROTECCIÓN DE ASSETS: PASS")
    print("Fase:", phase)
    print("Assets protegidos:", len(read_manifest_worktree()["protected_assets"]))
    print("Roots de Roster:", ", ".join(REQUIRED_ROOTS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
