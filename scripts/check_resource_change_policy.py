#!/usr/bin/env python3
"""Enforce staged, hash-specific approvals for editorial and identity resources."""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "data/resource-protection-policy.json"
AUTH_PATH = ROOT / "data/resource-change-authorizations.json"
HASH_RE = re.compile(r"^[0-9a-f]{64}$")
AUTH_FIELDS = {"id", "path", "action", "from_sha256", "to_sha256", "reason", "reference"}


def git_bytes(*args: str) -> bytes:
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode("utf-8", "replace").strip() or f"git {' '.join(args)} failed")
    return result.stdout


def git_text(*args: str) -> str:
    return git_bytes(*args).decode("utf-8", "strict")


def safe_path(value: object) -> tuple[bool, str]:
    if not isinstance(value, str) or not value or "\\" in value:
        return False, "ruta vacía o separadores ambiguos"
    candidate = PurePosixPath(value)
    if candidate.is_absolute() or value.startswith("/") or ".." in candidate.parts or str(candidate) != value:
        return False, "ruta absoluta, traversal o no canónica"
    if any(part in {"", "."} for part in value.split("/")):
        return False, "ruta ambigua"
    current = ROOT
    try:
        for part in candidate.parts:
            current = current / part
            if current.is_symlink():
                return False, f"componente simbólico: {current.relative_to(ROOT)}"
    except (OSError, ValueError):
        return False, "no se pudo verificar la ruta"
    return True, ""


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def blob_hash_at(ref: str, path: str) -> str | None:
    valid, reason = safe_path(path)
    if not valid:
        raise RuntimeError(f"Ruta insegura {path!r}: {reason}")
    try:
        return sha256_bytes(git_bytes("show", f"{ref}:{path}"))
    except RuntimeError as exc:
        message = str(exc).lower()
        if "does not exist in" in message or "exists on disk, but not in" in message or "path" in message and "not exist" in message:
            return None
        raise


def working_hash(path: str) -> str | None:
    valid, reason = safe_path(path)
    if not valid:
        raise RuntimeError(f"Ruta insegura {path!r}: {reason}")
    target = ROOT / path
    if not target.exists():
        return None
    if not target.is_file():
        raise RuntimeError(f"El recurso no es un archivo regular: {path}")
    return sha256_bytes(target.read_bytes())


def load_json_at(ref: str, path: str, default: dict) -> dict:
    try:
        payload = json.loads(git_text("show", f"{ref}:{path}"))
    except RuntimeError as exc:
        if "does not exist in" in str(exc) or "exists on disk, but not in" in str(exc):
            return default
        raise
    if not isinstance(payload, dict):
        raise RuntimeError(f"{path}: la raíz JSON debe ser un objeto")
    return payload


def classify(path: str, policy: dict) -> str:
    if path in policy.get("routine_generated_data", []):
        return "routine_generated_data"
    if path == policy.get("policy_file") or path in policy.get("explicit_paths", []):
        return "explicit_authorization"
    if any(fnmatch.fnmatch(path, pattern) for pattern in policy.get("explicit_patterns", [])):
        return "explicit_authorization"
    suffix = PurePosixPath(path).suffix.lower()
    if suffix in set(policy.get("explicit_extensions", [])):
        return "explicit_authorization"
    return "review_and_checks"


def validate_ledger(payload: dict, label: str, policy: dict) -> tuple[dict, list[str]]:
    errors: list[str] = []
    items = payload.get("authorizations")
    if payload.get("schema_version") != 1 or not isinstance(items, list):
        return {}, [f"{label}: ledger inválido; requiere schema_version=1 y authorizations como lista"]
    indexed: dict[str, dict] = {}
    transition_keys: set[tuple] = set()
    for item in items:
        if not isinstance(item, dict) or set(item) != AUTH_FIELDS:
            errors.append(f"{label}: cada autorización debe contener exactamente {sorted(AUTH_FIELDS)}")
            continue
        identifier = item.get("id")
        if not isinstance(identifier, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", identifier):
            errors.append(f"{label}: ID de autorización inválido: {identifier!r}")
            continue
        if identifier in indexed:
            errors.append(f"{label}: ID de autorización duplicado: {identifier}")
        path = item.get("path")
        valid, reason = safe_path(path)
        if not valid:
            errors.append(f"{label}: ruta insegura para {identifier}: {reason}")
        if path == policy.get("authorization_file") or classify(path if isinstance(path, str) else "", policy) != "explicit_authorization":
            errors.append(f"{label}: {identifier} no apunta a un recurso que requiera autorización explícita")
        action = item.get("action")
        before, after = item.get("from_sha256"), item.get("to_sha256")
        if action == "add":
            valid_hashes = before is None and isinstance(after, str) and bool(HASH_RE.fullmatch(after))
        elif action == "update":
            valid_hashes = isinstance(before, str) and bool(HASH_RE.fullmatch(before)) and isinstance(after, str) and bool(HASH_RE.fullmatch(after)) and before != after
        elif action == "delete":
            valid_hashes = isinstance(before, str) and bool(HASH_RE.fullmatch(before)) and after is None
        else:
            valid_hashes = False
        if not valid_hashes:
            errors.append(f"{label}: hashes/acción incompatibles para {identifier}")
        if not isinstance(item.get("reason"), str) or not item["reason"].strip():
            errors.append(f"{label}: {identifier} requiere un motivo")
        if not isinstance(item.get("reference"), str) or not item["reference"].strip():
            errors.append(f"{label}: {identifier} requiere issue/PR/referencia trazable")
        key = (path, action, before, after)
        if key in transition_keys:
            errors.append(f"{label}: transición duplicada para {path}")
        transition_keys.add(key)
        indexed[identifier] = item
    return indexed, errors


def normalize_changes(changed: list[tuple[str, list[str]]]) -> list[str]:
    paths: list[str] = []
    for status, values in changed:
        if status.startswith(("R", "C")):
            paths.extend(values)
        else:
            paths.extend(values)
    return paths


def evaluate_changes(
    policy: dict,
    baseline_payload: dict,
    current_payload: dict,
    changed: list[tuple[str, list[str]]],
    base_hash,
    head_hash,
) -> list[str]:
    errors: list[str] = []
    base_auth, e1 = validate_ledger(baseline_payload, "línea base", policy)
    current_auth, e2 = validate_ledger(current_payload, "PR", policy)
    errors.extend(e1)
    errors.extend(e2)

    for identifier, record in base_auth.items():
        if current_auth.get(identifier) != record:
            errors.append(f"Autorización histórica modificada o eliminada: {identifier}")

    new_auth = [record for identifier, record in current_auth.items() if identifier not in base_auth]
    auth_file = policy.get("authorization_file", "data/resource-change-authorizations.json")
    auth_file_changed = any(auth_file in paths for _, paths in changed)

    if new_auth:
        phase_a_only = bool(changed) and all(
            status in {"A", "M"} and paths == [auth_file]
            for status, paths in changed
        )
        if not phase_a_only:
            errors.append("FASE A bloqueada: agregar autorizaciones requiere un PR que modifique únicamente el ledger.")
        for record in new_auth:
            path = record["path"]
            expected_before = record["from_sha256"]
            try:
                actual_before = base_hash(path)
            except Exception as exc:
                errors.append(f"No se pudo comprobar el estado previo de {path}: {exc}")
                continue
            if actual_before != expected_before:
                errors.append(f"FASE A: from_sha256 no coincide con main para {path}")
        if auth_file_changed and not phase_a_only:
            errors.append("El ledger de autorizaciones no puede combinarse con cambios de recursos.")

    elif auth_file_changed:
        bootstrap_empty = (
            not base_auth and not current_auth and len(changed) == 1
            and changed[0] == ("A", [auth_file])
        )
        if not bootstrap_empty:
            errors.append("El ledger de autorizaciones es append-only: no se permiten cambios ni borrados de registros existentes.")

    if new_auth:
        # Phase A only records a proposal. The resource must remain exactly at its baseline state.
        return errors

    resource_changes: list[tuple[str, str, str | None, str | None]] = []
    for status, values in changed:
        entries: list[tuple[str, str]] = []
        if status.startswith("R"):
            entries.extend([("D", values[0]), ("A", values[1])])
        elif status.startswith("C"):
            entries.append(("A", values[-1]))
        elif status in {"A", "M", "D", "T"}:
            entries.append((status, values[0]))
        else:
            errors.append(f"Estado de diff no reconocido: {status}")
            continue
        for operation, path in entries:
            if path == auth_file:
                continue
            if classify(path, policy) != "explicit_authorization":
                continue
            try:
                before = base_hash(path)
                after = head_hash(path)
                if path == policy.get("policy_file") and before is None and after is not None:
                    # One-time bootstrap: the policy defines what future policy edits protect.
                    continue
                after = head_hash(path)
            except Exception as exc:
                errors.append(f"No se pudo calcular la transición de {path}: {exc}")
                continue
            if before is None and after is not None:
                action = "add"
            elif before is not None and after is None:
                action = "delete"
            elif before is not None and after is not None and before != after:
                action = "update"
            elif before == after:
                continue
            else:
                errors.append(f"No se pudo determinar la transición del recurso {path}")
                continue
            resource_changes.append((path, action, before, after))

    available = {
        (record.get("path"), record.get("action"), record.get("from_sha256"), record.get("to_sha256")): identifier
        for identifier, record in base_auth.items()
    }
    for path, action, before, after in resource_changes:
        key = (path, action, before, after)
        if key not in available:
            errors.append(
                f"Cambio sensible sin autorización previa: {path} ({action}, "
                f"{before or '∅'} -> {after or '∅'}). Aprobar primero en un PR separado."
            )
    return errors


def parse_diff(base_ref: str) -> list[tuple[str, list[str]]]:
    raw = git_text("diff", "--name-status", "-M", f"{base_ref}...HEAD")
    entries = []
    for line in raw.splitlines():
        fields = line.split("\t")
        if not fields or not fields[0]:
            raise RuntimeError(f"Salida de diff inválida: {line!r}")
        status = fields[0]
        if status.startswith(("R", "C")):
            if not re.fullmatch(r"[RC](?:100|[1-9]?[0-9])", status) or len(fields) != 3:
                raise RuntimeError(f"Salida de diff inválida: {line!r}")
        elif status not in {"A", "M", "D", "T"} or len(fields) != 2:
            raise RuntimeError(f"Salida de diff inválida: {line!r}")
        entries.append((status, fields[1:]))
    return entries


def recovery_report(base_ref: str, changed: list[tuple[str, list[str]]], policy: dict) -> list[str]:
    output = ["RECUPERACIÓN DE RECURSOS (Git):"]
    seen: set[str] = set()
    for status, values in changed:
        paths = values if status.startswith(("R", "C")) else values[:1]
        for path in paths:
            if path in seen or classify(path, policy) != "explicit_authorization":
                continue
            seen.add(path)
            try:
                object_id = git_text("rev-parse", f"{base_ref}:{path}").strip()
                output.append(f"OK {path} — objeto base {object_id[:12]}")
                output.append(f"  Rollback: git restore --source {base_ref} -- {path}")
            except Exception:
                output.append(f"NO EXISTE EN LA BASE: {path} (revisar si es un alta autorizada)")
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Autoriza cambios sensibles en dos fases y conserva recuperación reproducible.")
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument("--recovery-report", action="store_true")
    args = parser.parse_args()
    try:
        policy = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
        baseline = load_json_at(args.base_ref, policy["authorization_file"], {"schema_version": 1, "authorizations": []})
        current = json.loads(AUTH_PATH.read_text(encoding="utf-8"))
        changed = parse_diff(args.base_ref)
        errors = evaluate_changes(policy, baseline, current, changed,
                                  lambda path: blob_hash_at(args.base_ref, path),
                                  working_hash)
        for line in recovery_report(args.base_ref, changed, policy) if args.recovery_report else []:
            print(line)
        if errors:
            print("RESOURCE CHANGE POLICY: FAIL", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            return 1
        print("RESOURCE CHANGE POLICY: PASS — rutina validada o transición sensible previamente autorizada.")
        return 0
    except Exception as exc:
        print(f"RESOURCE CHANGE POLICY: ERROR — fail-closed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
