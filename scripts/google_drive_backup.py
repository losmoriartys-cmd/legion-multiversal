#!/usr/bin/env python3
"""Create a verified backup set in Drive. Retention is applied only after verification."""
from __future__ import annotations
import hashlib, json, os, subprocess, tempfile, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

API = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"
RETENTION_DAYS = 30

def request(url, method="GET", headers=None, data=None):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read(), response.headers

def access_token():
    payload=urllib.parse.urlencode({"client_id":os.environ["GOOGLE_OAUTH_CLIENT_ID"],"client_secret":os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],"refresh_token":os.environ["GOOGLE_OAUTH_REFRESH_TOKEN"],"grant_type":"refresh_token"}).encode()
    raw,_=request("https://oauth2.googleapis.com/token","POST",{"Content-Type":"application/x-www-form-urlencoded"},payload)
    return json.loads(raw)["access_token"]

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): h.update(block)
    return h.hexdigest()

def upload(path, folder, token, backup_id):
    boundary="legion-"+backup_id
    metadata=json.dumps({"name":path.name,"parents":[folder],"appProperties":{"legionBackup":"true","backupId":backup_id}}).encode()
    body=(b"--"+boundary.encode()+b"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+metadata+
          b"\r\n--"+boundary.encode()+b"\r\nContent-Type: application/octet-stream\r\n\r\n"+path.read_bytes()+
          b"\r\n--"+boundary.encode()+b"--\r\n")
    raw,_=request(UPLOAD+"?uploadType=multipart&fields=id,name,createdTime,size,appProperties","POST",
      {"Authorization":"Bearer "+token,"Content-Type":"multipart/related; boundary="+boundary},body)
    return json.loads(raw)

def list_managed(folder, token):
    query="'"+folder+"' in parents and trashed=false and appProperties has { key='legionBackup' and value='true' }"
    url=API+"/files?q="+urllib.parse.quote(query)+"&fields=files(id,name,createdTime,appProperties)&pageSize=1000"
    raw,_=request(url,headers={"Authorization":"Bearer "+token})
    return json.loads(raw).get("files",[])

def download(file_id, path, token):
    raw,_=request(API+"/files/"+urllib.parse.quote(file_id,safe="")+"?alt=media",headers={"Authorization":"Bearer "+token})
    path.write_bytes(raw)

def main():
    folder=os.environ["GOOGLE_DRIVE_FOLDER_ID"]
    token=access_token()
    backup_id=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")+"-"+os.environ.get("GITHUB_RUN_ID","local")
    with tempfile.TemporaryDirectory(prefix="legion-drive-backup-") as td:
        root=Path(td); out=root/"backup-output"
        subprocess.run(["bash","scripts/create_repo_backup.sh",str(out)],check=True)
        files=sorted(p for p in out.iterdir() if p.is_file())
        if not files: raise RuntimeError("Backup script generated no files")
        # Phase 1: upload every artifact; no deletion is allowed in this phase.
        uploaded=[]
        for path in files:
            remote=upload(path,folder,token,backup_id)
            uploaded.append({"id":remote["id"],"name":remote["name"],"sha256":sha256(path),"backupId":backup_id})
        # Phase 2: download and verify all uploaded artifacts. Any failure aborts retention.
        for item,path in zip(uploaded,files):
            verify=root/("verify-"+path.name)
            download(item["id"],verify,token)
            if sha256(path)!=sha256(verify):
                raise RuntimeError("Checksum mismatch. Retention skipped; previous backups preserved.")
        if len(uploaded)!=len(files):
            raise RuntimeError("Incomplete backup set. Retention skipped.")
        # Phase 3: expire whole backup sets only; never delete a partial or current set.
        cutoff=datetime.now(timezone.utc)-timedelta(days=RETENTION_DAYS)
        inventory=list_managed(folder,token)
        grouped={}
        for item in inventory:
            props=item.get("appProperties") or {}
            bid=props.get("backupId")
            if bid: grouped.setdefault(bid,[]).append(item)
        current=set(uploaded_ids:= [x["id"] for x in uploaded])
        expired=[]
        for bid,items in grouped.items():
            if bid==backup_id or current.intersection(i["id"] for i in items): continue
            dates=[]
            for item in items:
                if item.get("createdTime"):
                    dates.append(datetime.fromisoformat(item["createdTime"].replace("Z","+00:00")))
            # Only delete a complete, identifiable group whose every file is older than cutoff.
            if dates and max(dates)<cutoff:
                expired.extend(items)
        deleted=0
        for item in expired:
            request(API+"/files/"+urllib.parse.quote(item["id"],safe=""),"DELETE",{"Authorization":"Bearer "+token})
            deleted+=1
        print(json.dumps({"result":"verified","backup_id":backup_id,"files":uploaded,"expired_deleted":deleted},indent=2))

if __name__=="__main__":
    main()
