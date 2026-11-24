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
        import io, tarfile
        archive = self.root / "links.tar.gz"
        with tarfile.open(archive, "w:gz") as tf:
            info = tarfile.TarInfo("link")
            info.type = tarfile.SYMTYPE
            info.linkname = "../../outside"
            tf.addfile(info)
        with self.assertRaisesRegex(RuntimeError, "links or special"):
            restore.safe_extract_snapshot(archive, self.root / "out")

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

if __name__ == "__main__":
    unittest.main()
