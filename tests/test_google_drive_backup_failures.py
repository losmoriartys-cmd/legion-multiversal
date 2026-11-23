import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import scripts.google_drive_backup as backup

class DriveBackupFailureTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name)
        self.file=self.root/"artifact.bin"
        self.file.write_bytes(b"backup bytes")
    def tearDown(self): self.tmp.cleanup()

    def test_invalid_token_response_fails_closed(self):
        with patch.dict("os.environ",{"GOOGLE_OAUTH_CLIENT_ID":"x","GOOGLE_OAUTH_CLIENT_SECRET":"x","GOOGLE_OAUTH_REFRESH_TOKEN":"x"}), patch.object(backup,"request",return_value=(b'{"error":"invalid_grant"}',{})):
            with self.assertRaises(RuntimeError): backup.access_token()

    def test_incomplete_upload_response_aborts(self):
        with patch.object(backup,"request",return_value=(b'{}',{})):
            with self.assertRaises(RuntimeError): backup.upload(self.file,"folder","token","bid",1)

    def test_truncated_download_detected(self):
        with patch.object(backup,"upload",return_value={"id":"file-id","name":self.file.name}), patch.object(backup,"download",side_effect=lambda _id,p,_token:p.write_bytes(b"truncated")):
            with self.assertRaisesRegex(RuntimeError,"Checksum mismatch"):
                backup.upload_and_verify([self.file],"folder","token","bid",self.root)

    def test_checksum_mismatch_detected(self):
        with patch.object(backup,"upload",return_value={"id":"file-id","name":self.file.name}), patch.object(backup,"download",side_effect=lambda _id,p,_token:p.write_bytes(b"corrupted")):
            with self.assertRaisesRegex(RuntimeError,"Checksum mismatch"):
                backup.upload_and_verify([self.file],"folder","token","bid",self.root)

    def test_incomplete_backup_set_refuses_empty_or_missing_artifacts(self):
        with self.assertRaisesRegex(RuntimeError,"Empty backup set"):
            backup.upload_and_verify([],"folder","token","bid",self.root)

    def test_retention_candidate_requires_complete_old_set(self):
        old="2020-01-01T00:00:00Z"
        complete=[{"id":"a","createdTime":old,"appProperties":{"legionBackup":"true","backupId":"old","backupCount":"2"}},
                 {"id":"b","createdTime":old,"appProperties":{"legionBackup":"true","backupId":"old","backupCount":"2"}}]
        incomplete=[complete[0]]
        now=backup.datetime(2026,1,1,tzinfo=backup.timezone.utc)
        self.assertEqual(len(backup.expired_candidates(complete,"new",now)),1)
        self.assertEqual(backup.expired_candidates(incomplete,"new",now),[])

    def test_retention_inventory_failure_after_verification_stops(self):
        with patch.object(backup,"upload",return_value={"id":"file-id","name":self.file.name}), patch.object(backup,"download",side_effect=lambda _id,p,_token:p.write_bytes(self.file.read_bytes())), patch.object(backup,"list_managed",side_effect=RuntimeError("rotation inventory unavailable")):
            with self.assertRaisesRegex(RuntimeError,"rotation inventory unavailable"):
                backup.run_backup("folder","token","new",[self.file],self.root)
        # No deletion function is called anywhere in the engine: prior backups remain untouched.

if __name__=="__main__":unittest.main()
