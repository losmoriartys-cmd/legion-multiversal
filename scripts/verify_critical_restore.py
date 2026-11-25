#!/usr/bin/env python3
"""Verify the 14 BASE-02 critical files in an isolated restored snapshot."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path, PurePosixPath


def verify_critical_files(repository: Path, snapshot: Path, commit: str) -> list[dict[str, str]]:
    manifest_path = snapshot / "data/integrity-manifest.json"
    if manifest_path.is_symlink() or not manifest_path.is_file():
        raise RuntimeError("Restored integrity manifest is missing or unsafe.")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    critical = manifest.get("critical_files")
    if (not isinstance(critical, list) or len(critical) != 14
            or any(not isinstance(item, str) for item in critical)
            or len(set(critical)) != 14):
        raise RuntimeError("Restored critical-file inventory must contain exactly 14 unique paths.")

    results: list[dict[str, str]] = []
    for relative in critical:
        pure = PurePosixPath(relative)
        if (not relative or pure.is_absolute() or ".." in pure.parts
                or "\\\\" in relative or str(pure) != relative):
            raise RuntimeError(f"Unsafe or non-canonical critical path: {relative!r}")

        candidate = snapshot.joinpath(*pure.parts)
        current = snapshot
        for part in pure.parts:
            current = current / part
            if current.is_symlink():
                raise RuntimeError(f"Symlink in restored critical path: {relative}")
        if not candidate.is_file():
            raise RuntimeError(f"Missing restored critical file: {relative}")

        expected = subprocess.run(
            ["git", "-C", str(repository), "show", f"{commit}:{relative}"],
            check=True, capture_output=True,
        ).stdout
        actual = candidate.read_bytes()
        expected_hash = hashlib.sha256(expected).hexdigest()
        actual_hash = hashlib.sha256(actual).hexdigest()
        if actual_hash != expected_hash:
            raise RuntimeError(f"SHA-256 mismatch for restored critical file: {relative}")
        results.append({"path": relative, "sha256": actual_hash})

    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True, type=Path)
    parser.add_argument("--snapshot", required=True, type=Path)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--output", type=Path, default=Path("critical-files-sha256.json"))
    args = parser.parse_args()

    results = verify_critical_files(args.repository, args.snapshot, args.commit)
    report = {
        "result": "verified",
        "commit": args.commit,
        "critical_files_verified": len(results),
        "files": results,
    }
    args.output.write_text(json.dumps(report, indent=2) + "\\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    print("RESTORE_CRITICAL_FILES: PASS (14/14 SHA-256 match)")


if __name__ == "__main__":
    main()
