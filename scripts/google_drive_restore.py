#!/usr/bin/env python3
"""Restore a Drive backup into an isolated directory without the source checkout."""
import argparse, hashlib, json, os, subprocess, tarfile, tempfile, urllib.parse, urllib.request
from pathlib import Path, PurePosixPath

API = "https://www.googleapis.com/drive/v3"
# Independently recorded by backup run 45349573134; SHA256SUMS cannot hash itself.
EXPECTED_SHA256SUMS = {
    "20261124T181104Z-45349573134": "481a01747a200c51b5b9c3ba761be230bd66c6fc8f6bde4eb12789a2514dd967",
}

def req(url, headers=None):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=120) as r:
        return r.read()

def token():
    data = urllib.parse.urlencode({
        "client_id": os.environ["GOOGLE_OAUTH_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_OAUTH_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    q = urllib.request.Request("https://oauth2.googleapis.com/token", data=data,
                               headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(q, timeout=60) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"OAuth token request failed (HTTP {exc.code})") from None
    value = result.get("access_token")
    if not value:
        raise RuntimeError("OAuth response lacks access_token")
    return value

def list_backup_files(folder_id, backup_id, access):
    # Escape query literals before URL encoding to avoid query-language injection.
    folder = folder_id.replace("\\", "\\\\").replace("'", "\\'")
    bid = backup_id.replace("\\", "\\\\").replace("'", "\\'")
    query = f"'{folder}' in parents and trashed=false and appProperties has {{ key='backupId' and value='{bid}' }}"
    page_token, files = None, []
    while True:
        params = {"q": query, "fields": "nextPageToken,files(id,name,appProperties)",
                  "pageSize": "1000"}
        if page_token:
            params["pageToken"] = page_token
        data = json.loads(req(API + "/files?" + urllib.parse.urlencode(params),
                              {"Authorization": "Bearer " + access}))
        batch = data.get("files")
        if not isinstance(batch, list):
            raise RuntimeError("Drive restore inventory lacks files array")
        files.extend(batch)
        page_token = data.get("nextPageToken")
        if not page_token:
            return files

def verify_downloaded_artifacts(directory, downloaded_names):
    sums = directory / "SHA256SUMS"
    if not sums.is_file():
        raise RuntimeError("Checksum manifest missing.")

    manifest_entries = []
    for line in sums.read_text(encoding="utf-8-sig").splitlines():
        if len(line) < 67 or line[64:66] not in {"  ", " *"}:
            raise RuntimeError("Malformed SHA256SUMS entry.")
        digest = line[:64]
        if any(char not in "0123456789abcdefABCDEF" for char in digest):
            raise RuntimeError("Malformed SHA256SUMS digest.")
        name = line[66:]
        if Path(name).name != name or name in {".", ".."}:
            raise RuntimeError("Unsafe checksum filename.")
        manifest_entries.append((digest.lower(), name))

    manifest_names = [name for _, name in manifest_entries]
    expected = set(downloaded_names) - {"SHA256SUMS"}
    if len(set(manifest_names)) != len(manifest_names) or set(manifest_names) != expected:
        raise RuntimeError("Checksum manifest does not cover exactly the backup artifacts.")

    sums_digest = hashlib.sha256(sums.read_bytes()).hexdigest()
    expected_sums_digest = EXPECTED_SHA256SUMS.get(os.environ.get("BACKUP_ID", ""))
    if not expected_sums_digest or sums_digest != expected_sums_digest:
        raise RuntimeError("SHA256SUMS file does not match the independently recorded backup digest.")

    verified = {"SHA256SUMS": sums_digest}
    for expected_digest, name in manifest_entries:
        artifact = directory / name
        if artifact.is_symlink() or not artifact.is_file():
            raise RuntimeError(f"Checksum artifact is missing or unsafe: {name}")
        digest = hashlib.sha256()
        with artifact.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(block)
        actual_digest = digest.hexdigest()
        if actual_digest != expected_digest:
            raise RuntimeError(f"Checksum mismatch for {name}.")
        verified[name] = actual_digest
    return verified

def safe_extract_snapshot(snapshot, destination):
    with tarfile.open(snapshot, "r:gz") as archive:
        members = archive.getmembers()
        seen = set()
        for member in members:
            name = PurePosixPath(member.name)
            if name.is_absolute() or ".." in name.parts:
                raise RuntimeError("Unsafe archive path detected; extraction refused")
            normalized = str(name)
            if normalized in seen:
                raise RuntimeError("Duplicate archive path detected; extraction refused")
            seen.add(normalized)
            if not (member.isdir() or member.isfile()):
                raise RuntimeError("Archive links or special files are not allowed")
        archive.extractall(destination, members=members)

def clone_and_verify_bundle(bundle, repo_dir):
    subprocess.run(["git", "clone", "--quiet", str(bundle), str(repo_dir)], check=True)
    # bundle verify requires a Git repository; the newly restored clone is the isolated verifier.
    subprocess.run(["git", "bundle", "verify", str(bundle)], cwd=repo_dir, check=True, stdout=subprocess.DEVNULL)
    return subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo_dir, check=True,
                          capture_output=True, text=True).stdout.strip()

def verify_snapshot_matches_commit(repo_dir, snapshot_dir, commit):
    listing = subprocess.run(["git", "ls-tree", "-rz", "--full-tree", commit],
                             cwd=repo_dir, check=True, capture_output=True).stdout
    checked = 0
    for record in listing.split(b"\0"):
        if not record:
            continue
        metadata, raw_path = record.split(b"\t", 1)
        mode, object_type, _object_id = metadata.decode("ascii").split()
        relative = Path(raw_path.decode("utf-8"))
        candidate = snapshot_dir / relative
        if mode == "120000":
            raise RuntimeError("Snapshot contains a symbolic link; safe snapshot comparison refused")
        if object_type != "blob" or mode not in {"100644", "100755"}:
            continue
        if candidate.is_symlink() or not candidate.is_file():
            raise RuntimeError(f"Snapshot is missing a regular tracked file: {relative}")
        with candidate.open("rb") as stream:
            # Apply Git's clean filters (including core.autocrlf) before
            # comparing a working-tree snapshot with the canonical Git blob.
            git_path = relative.as_posix()
            actual = subprocess.run(["git", "hash-object", f"--path={git_path}", "--stdin"],
                                    cwd=repo_dir, input=stream.read(), check=True,
                                    capture_output=True).stdout.decode("ascii").strip()
        if actual != _object_id:
            raise RuntimeError(f"Snapshot content differs from Git Bundle at: {relative}")
        checked += 1
    if checked == 0:
        raise RuntimeError("No tracked regular files were checked in the snapshot")
    return checked

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--backup-id", required=True)
    p.add_argument("--folder-id", default=os.environ.get("GOOGLE_DRIVE_FOLDER_ID"))
    p.add_argument("--target", required=True)
    args = p.parse_args()
    if not args.folder_id:
        raise SystemExit("Missing --folder-id or GOOGLE_DRIVE_FOLDER_ID")
    target = Path(args.target).resolve()
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        raise SystemExit("Target must be an empty directory.")
    target.mkdir(parents=True, exist_ok=True)
    access = token()
    files = list_backup_files(args.folder_id, args.backup_id, access)
    if not files:
        raise SystemExit("No files for this backup ID.")
    counts = set()
    for item in files:
        try:
            counts.add(int((item.get("appProperties") or {}).get("backupCount", "0")))
        except ValueError:
            raise SystemExit("Invalid backupCount metadata; restore refused.")
    if len(counts) != 1 or counts != {len(files)}:
        raise SystemExit("Incomplete or inconsistent backup set; restore refused.")
    names = [item.get("name") for item in files]
    if any(not isinstance(name, str) or not name or Path(name).name != name or name in {".", ".."} for name in names):
        raise SystemExit("Unsafe Drive filename; restore refused.")
    if len(set(names)) != len(names):
        raise SystemExit("Duplicate Drive filenames; restore refused.")
    with tempfile.TemporaryDirectory(prefix="legion-restore-") as td:
        d = Path(td)
        for item in files:
            raw = req(API + "/files/" + urllib.parse.quote(item["id"], safe="") + "?alt=media",
                      {"Authorization": "Bearer " + access})
            (d / item["name"]).write_bytes(raw)
        verified_hashes = verify_downloaded_artifacts(d, names)
        bundle = d / "legion-multiversal.bundle"
        snapshot = d / "legion-multiversal-source.tar.gz"
        manifest = d / "backup-manifest.txt"
        if not bundle.is_file() or not snapshot.is_file() or not manifest.is_file():
            raise SystemExit("Required artifacts missing.")
        manifest_text = manifest.read_text(encoding="utf-8")
        commit_line = next((line for line in manifest_text.splitlines() if line.startswith("commit=")), None)
        if not commit_line:
            raise SystemExit("Backup manifest lacks source commit.")
        expected_commit = commit_line.split("=", 1)[1].strip()
        repo_dir = target / "repository-from-bundle"
        actual_commit = clone_and_verify_bundle(bundle, repo_dir)
        if actual_commit != expected_commit:
            raise SystemExit("Git Bundle HEAD does not match backup manifest commit.")
        snap_dir = target / "source-snapshot"
        snap_dir.mkdir()
        safe_extract_snapshot(snapshot, snap_dir)
        checked_files = verify_snapshot_matches_commit(repo_dir, snap_dir, actual_commit)
        print(json.dumps({"restore": "success", "backup_id": args.backup_id,
                          "target": str(target), "bundle_repo": str(repo_dir),
                          "snapshot": str(snap_dir), "commit": actual_commit,
                          "snapshot_files_verified": checked_files, "isolated": True,
                          "artifact_sha256": verified_hashes}, indent=2))

if __name__ == "__main__":
    main()
