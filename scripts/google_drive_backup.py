#!/usr/bin/env python3
"""Upload verified repository backups to Google Drive using the narrow drive.file scope.

Only files created by this application in the explicitly selected folder are managed.
Old backups are deleted only after the new upload has been downloaded and SHA-256 verified.
"""
from __future__ import annotations
import hashlib, json, os, subprocess, sys, tempfile, urllib.parse, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

API = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"
SCOPE = "https://www.googleapis.com/auth/drive.file"
RETENTION_DAYS = 30

def request(url, method="GET", headers=None, data=None):
    req=urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read(), response.headers

def access_token():
    client=os.environ["GOOGLE_OAUTH_CLIENT_ID"]
    secret=os.environ["GOOGLE_OAUTH_CLIENT_SECRET"]
    refresh=os.environ["GOOGLE_OAUTH_REFRESH_TOKEN"]
    payload=urllib.parse.urlencode({"client_id":client,"client_secret":secret,"refresh_token":refresh,"grant_type":"refresh_token"}).encode()
    body,_=request("https://oauth2.googleapis.com/token","POST",{"Content-Type":"application/x-www-form-urlencoded"},payload)
    return json.loads(body)["access_token"]

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): h.update(block)
    return h.hexdigest()

def upload(path, folder, token):
    boundary="legionbackupboundary"
    metadata=json.dumps({"name":path.name,"parents":[folder],"appProperties":{"legionBackup":"true"}}).encode()
    data=path.read_bytes()
    body=(b"--"+boundary.encode()+b"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+metadata+
          b"\r\n--"+boundary.encode()+b"\r\nContent-Type: application/octet-stream\r\n\r\n"+data+
          b"\r\n--"+boundary.encode()+b"--\r\n")
    raw,_=request(UPLOAD+"?uploadType=multipart&fields=id,name,createdTime,size,appProperties","POST",
      {"Authorization":"Bearer "+token,"Content-Type":"multipart/related; boundary="+boundary},body)
    return json.loads(raw)

def list_backups(folder, token):
    q=urllib.parse.quote("'" + folder + "' in parents and trashed=false and appProperties has { key='legionBackup' and value='true' }")
    url=API+"/files?q="+q+"&fields=files(id,name,createdTime,size,appProperties)&orderBy=createdTime"
    raw,_=request(url,headers={"Authorization":"Bearer "+token})
    return json.loads(raw).get("files",[])

def download(file_id, path, token):
    raw,_=request(API+"/files/"+file_id+"?alt=media",headers={"Authorization":"Bearer "+token})
    path.write_bytes(raw)

def main():
    folder=os.environ["GOOGLE_DRIVE_FOLDER_ID"]
    token=access_token()
    with tempfile.TemporaryDirectory(prefix="legion-drive-backup-") as td:
        out=Path(td)/"backup-output"
        subprocess.run(["bash","scripts/create_repo_backup.sh",str(out)],check=True)
        files=sorted(out.iterdir())
        # Upload only the generated backup package, manifest and checksum.
        uploaded=[]
        for path in files:
            if not path.is_file(): continue
            remote=upload(path,folder,token)
            verify=Path(td)/("verify-"+path.name)
            download(remote["id"],verify,token)
            local_hash=sha256(path); remote_hash=sha256(verify)
            if local_hash != remote_hash:
                raise RuntimeError("SHA-256 mismatch; retention was NOT applied")
            uploaded.append({"id":remote["id"],"name":remote["name"],"sha256":local_hash})
        if not uploaded or any(not item["sha256"] for item in uploaded):
            raise RuntimeError("No complete verified backup; retention was NOT applied")
        # Retention runs only after every new file has been downloaded and verified.
        cutoff=datetime.now(timezone.utc)-timedelta(days=RETENTION_DAYS)
        backups=list_backups(folder,token)
        expired=[]
        for item in backups:
            created=datetime.fromisoformat(item["createdTime"].replace("Z","+00:00"))
            if created < cutoff and item["id"] not in {x["id"] for x in uploaded}:
                expired.append(item)
        for item in expired:
            url=API+"/files/"+item["id"]
            request(url,"DELETE",{"Authorization":"Bearer "+token})
        print(json.dumps({"result":"verified","files":uploaded,"expired_deleted":len(expired)},indent=2))

if __name__=="__main__":
    main()
