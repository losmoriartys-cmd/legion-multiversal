import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
import scripts.google_drive_backup as backup
import scripts.google_drive_restore as restore

class DriveBackupFailureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.file = self.root / "artifact.bin"
        self.file.write_bytes(b"backup bytes")

    def tearDown(self):
        self.tmp.cleanup()

    def test_invalid_token_json_fails_closed(self):
        with patch.dict("os.environ", {"GOOGLE_OAUTH_CLIENT_ID":"x", "GOOGLE_OAUTH_CLIENT_SECRET":"x", "GOOGLE_OAUTH_REFRESH_TOKEN":"x"}), patch.object(backup, "request", return_value=(b'{"error":"invalid_grant"}', {})):
            with self.assertRaisesRegex(RuntimeError, "lacks access_token"):
                backup.access_token()

    def test_http_400_oauth_failure_is_sanitized(self):
        import urllib.error
        error = urllib.error.HTTPError("https://oauth2.googleapis.com/token", 400, "Bad Request", {}, None)
        with patch.dict("os.environ", {"GOOGLE_OAUTH_CLIENT_ID":"x", "GOOGLE_OAUTH_CLIENT_SECRET":"x", "GOOGLE_OAUTH_REFRESH_TOKEN":"x"}), patch.object(backup, "request", side_effect=error):
            with self.assertRaisesRegex(RuntimeError, "HTTP 400"):
                backup.access_token()

    def test_invalid_json_oauth_response_fails_closed(self):
        with patch.dict("os.environ", {"GOOGLE_OAUTH_CLIENT_ID":"x", "GOOGLE_OAUTH_CLIENT_SECRET":"x", "GOOGLE_OAUTH_REFRESH_TOKEN":"x"}), patch.object(backup, "request", return_value=(b"not-json", {})):
            with self.assertRaisesRegex(RuntimeError, "invalid JSON"):
                backup.access_token()

    def test_upload_missing_id_aborts(self):
        with patch.object(backup, "request", return_value=(b"{}", {})):
            with self.assertRaisesRegex(RuntimeError, "file ID"):
                backup.upload(self.file, "folder", "token", "bid", 1)

    def test_truncated_download_detected(self):
        with patch.object(backup, "upload", return_value={"id":"id", "name":self.file.name}), patch.object(backup, "download", side_effect=lambda _id,p,_t:p.write_bytes(b"short")):
            with self.assertRaisesRegex(RuntimeError, "Checksum mismatch"):
                backup.upload_and_verify([self.file], "folder", "token", "bid", self.root)

    def test_checksum_mismatch_detected(self):
        with patch.object(backup, "upload", return_value={"id":"id", "name":self.file.name}), patch.object(backup, "download", side_effect=lambda _id,p,_t:p.write_bytes(b"tampered")):
            with self.assertRaisesRegex(RuntimeError, "Checksum mismatch"):
                backup.upload_and_verify([self.file], "folder", "token", "bid", self.root)

    def test_failure_on_second_upload_leaves_no_success_result(self):
        second = self.root / "second.bin"
        second.write_bytes(b"second")
        with patch.object(backup, "upload", side_effect=[{"id":"one","name":self.file.name}, RuntimeError("upload failed")]):
            with self.assertRaisesRegex(RuntimeError, "upload failed"):
                backup.upload_and_verify([self.file, second], "folder", "token", "bid", self.root)

    def test_empty_backup_set_refused(self):
        with self.assertRaisesRegex(RuntimeError, "Empty backup set"):
            backup.upload_and_verify([], "folder", "token", "bid", self.root)

    def test_inventory_pagination_is_followed(self):
        pages = [
            (json.dumps({"files":[{"id":"a"}], "nextPageToken":"next"}).encode(), {}),
            (json.dumps({"files":[{"id":"b"}]}).encode(), {}),
        ]
        with patch.object(backup, "request", side_effect=pages) as mocked:
            result = backup.list_managed("folder", "token")
        self.assertEqual([x["id"] for x in result], ["a", "b"])
        self.assertEqual(mocked.call_count, 2)
        self.assertIn("pageToken=next", mocked.call_args_list[1].args[0])

    def test_inventory_missing_files_array_fails_closed(self):
        with patch.object(backup, "request", return_value=(b'{}', {})):
            with self.assertRaisesRegex(RuntimeError, "lacks files array"):
                backup.list_managed("folder", "token")

    def test_retention_requires_complete_old_set(self):
        old = "2020-01-01T00:00:00Z"
        complete = [{"id":"a","createdTime":old,"appProperties":{"legionBackup":"true","backupId":"old","backupCount":"2"}},
                    {"id":"b","createdTime":old,"appProperties":{"legionBackup":"true","backupId":"old","backupCount":"2"}}]
        now = datetime(2026,1,1,tzinfo=timezone.utc)
        self.assertEqual(len(backup.expired_candidates(complete, "new", now)), 1)
        self.assertEqual(backup.expired_candidates(complete[:1], "new", now), [])
        malformed = [dict(complete[0], createdTime="not-a-date"), complete[1]]
        self.assertEqual(backup.expired_candidates(malformed, "new", now), [])

    def test_inventory_failure_after_verification_aborts_rotation_analysis(self):
        with patch.object(backup, "upload", return_value={"id":"id","name":self.file.name}), patch.object(backup, "download", side_effect=lambda _id,p,_t:p.write_bytes(self.file.read_bytes())), patch.object(backup, "list_managed", side_effect=RuntimeError("inventory unavailable")):
            with self.assertRaisesRegex(RuntimeError, "inventory unavailable"):
                backup.run_backup("folder", "token", "new", [self.file], self.root)

    def test_restore_rejects_duplicate_drive_names_before_download(self):
        files = [{"id":"1","name":"same.bin","appProperties":{"backupCount":"2"}},
                 {"id":"2","name":"same.bin","appProperties":{"backupCount":"2"}}]
        with patch.object(restore, "token", return_value="token"), patch.object(restore, "list_backup_files", return_value=files), patch.dict("os.environ", {}, clear=True):
            target = self.root / "target"
            with patch("sys.argv", ["restore", "--backup-id","b","--folder-id","f","--target",str(target)]):
                with self.assertRaises(SystemExit):
                    restore.main()

    def test_restore_rejects_symlink_and_hardlink_tar_members(self):
        import tarfile
        for member_type in (tarfile.SYMTYPE, tarfile.LNKTYPE):
            with self.subTest(member_type=member_type):
                archive = self.root / ("link-" + str(member_type) + ".tar.gz")
                with tarfile.open(archive, "w:gz") as tf:
                    info = tarfile.TarInfo("link")
                    info.type = member_type
                    info.linkname = "../../outside"
                    tf.addfile(info)
                with self.assertRaisesRegex(RuntimeError, "links or special"):
                    restore.safe_extract_snapshot(archive, self.root / ("out-" + str(member_type)))

    def test_restore_rejects_path_traversal(self):
        import tarfile
        archive = self.root / "traversal.tar.gz"
        with tarfile.open(archive, "w:gz") as tf:
            info = tarfile.TarInfo("../escape")
            info.size = 1
            import io
            tf.addfile(info, io.BytesIO(b"x"))
        with self.assertRaisesRegex(RuntimeError, "Unsafe archive path"):
            restore.safe_extract_snapshot(archive, self.root / "out")


    def test_snapshot_content_must_match_bundle_commit(self):
        import subprocess
        repo_dir = self.root / "repo"
        repo_dir.mkdir()
        subprocess.run(["git", "init", "-q", "-b", "main"], cwd=repo_dir, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=repo_dir, check=True)
        subprocess.run(["git", "config", "user.name", "Backup Test"], cwd=repo_dir, check=True)
        (repo_dir / "tracked.txt").write_text("original content", encoding="utf-8")
        subprocess.run(["git", "add", "tracked.txt"], cwd=repo_dir, check=True)
        subprocess.run(["git", "commit", "-qm", "fixture"], cwd=repo_dir, check=True)
        commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo_dir, check=True,
                                capture_output=True, text=True).stdout.strip()
        snapshot = self.root / "snapshot"
        snapshot.mkdir()
        (snapshot / "tracked.txt").write_text("original content", encoding="utf-8")
        self.assertEqual(restore.verify_snapshot_matches_commit(repo_dir, snapshot, commit), 1)
        (snapshot / "tracked.txt").write_text("tampered content", encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "differs from Git Bundle"):
            restore.verify_snapshot_matches_commit(repo_dir, snapshot, commit)

    def test_bundle_clones_and_verifies_inside_isolated_repository(self):
        import subprocess
        source = self.root / "source"
        source.mkdir()
        subprocess.run(["git", "init", "-q", "-b", "main"], cwd=source, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=source, check=True)
        subprocess.run(["git", "config", "user.name", "Backup Test"], cwd=source, check=True)
        (source / "tracked.txt").write_text("bundle content", encoding="utf-8")
        subprocess.run(["git", "add", "tracked.txt"], cwd=source, check=True)
        subprocess.run(["git", "commit", "-qm", "fixture"], cwd=source, check=True)
        expected = subprocess.run(["git", "rev-parse", "HEAD"], cwd=source, check=True,
                                  capture_output=True, text=True).stdout.strip()
        bundle = self.root / "fixture.bundle"
        subprocess.run(["git", "bundle", "create", str(bundle), "--all"], cwd=source, check=True)
        restored = self.root / "restored"
        actual = restore.clone_and_verify_bundle(bundle, restored)
        self.assertEqual(actual, expected)


    def test_restore_validates_manifest_coverage_and_file_hashes(self):
        artifact = self.root / "legion-multiversal.bundle"
        artifact.write_bytes(b"valid bundle placeholder")
        snapshot = self.root / "legion-multiversal-source.tar.gz"
        snapshot.write_bytes(b"valid snapshot placeholder")
        sums = self.root / "SHA256SUMS"
        manifest = (
            f"{backup.sha256(artifact)} *{artifact.name}\n"
            f"{backup.sha256(snapshot)}  {snapshot.name}\n"
        )
        sums.write_text(manifest, encoding="utf-8")
        names = [artifact.name, snapshot.name, sums.name]
        restore.verify_downloaded_artifacts(self.root, names)
        snapshot.write_bytes(b"tampered snapshot")
        with self.assertRaisesRegex(RuntimeError, "Checksum mismatch"):
            restore.verify_downloaded_artifacts(self.root, names)
        sums.write_text(manifest.splitlines()[0] + "\\n", encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "does not cover exactly"):
            restore.verify_downloaded_artifacts(self.root, names)

if __name__ == "__main__":
    unittest.main()
