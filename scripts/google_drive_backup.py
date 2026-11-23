#!/usr/bin/env python3
"""Google Drive backup. Upload+download+checksum must finish before retention is considered."""
from __future__ import annotations
import hashlib, json, os, subprocess, tempfile, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

API="https://www.googleapis.com/drive/v3"
UPLOAD="https://www.googleapis.com/upload/drive/v3/files"
RETENTION_DAYS=30

def request(url,method="GET",headers=None,data=None):
    req=urllib.request.Request(url,data=data,method=method,headers=headers or {})
    with urllib.request.urlopen(req,timeout=120) as response:return response.read(),response.headers

def access_token():
    payload=urllib.parse.urlencode({"client_id":os.environ["GOOGLE_OAUTH_CLIENT_ID"],"client_secret":os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],"refresh_token":os.environ["GOOGLE_OAUTH_REFRESH_TOKEN"],"grant_type":"refresh_token"}).encode()
    raw,_=request("https://oauth2.googleapis.com/token","POST",{"Content-Type":"application/x-www-form-urlencoded"},payload)
    token=json.loads(raw).get("access_token")
    if not token: raise RuntimeError("OAuth token response lacks access_token")
    return token

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""):h.update(block)
    return h.hexdigest()

def upload(path,folder,token,backup_id,expected_count):
    boundary="legion-"+backup_id
    meta=json.dumps({"name":path.name,"parents":[folder],"appProperties":{"legionBackup":"true","backupId":backup_id,"backupCount":str(expected_count)}}).encode()
    body=(b"--"+boundary.encode()+b"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+meta+
          b"\r\n--"+boundary.encode()+b"\r\nContent-Type: application/octet-stream\r\n\r\n"+path.read_bytes()+
          b"\r\n--"+boundary.encode()+b"--\r\n")
    raw,_=request(UPLOAD+"?uploadType=multipart&fields=id,name,createdTime,size,appProperties","POST",{"Authorization":"Bearer "+token,"Content-Type":"multipart/related; boundary="+boundary},body)
    result=json.loads(raw)
    if not result.get("id"):raise RuntimeError("Drive upload response lacks file ID")
    return result

def list_managed(folder,token):
    q="'"+folder+"' in parents and trashed=false and appProperties has { key='legionBackup' and value='true' }"
    raw,_=request(API+"/files?q="+urllib.parse.quote(q)+"&fields=files(id,name,createdTime,appProperties)&pageSize=1000",headers={"Authorization":"Bearer "+token})
    return json.loads(raw).get("files",[])

def download(file_id,path,token):
    raw,_=request(API+"/files/"+urllib.parse.quote(file_id,safe="")+"?alt=media",headers={"Authorization":"Bearer "+token})
    path.write_bytes(raw)

def upload_and_verify(files,folder,token,backup_id,workdir):
    if not files:raise RuntimeError("Empty backup set; retention skipped")
    uploaded=[]
    for path in files:
        remote=upload(path,folder,token,backup_id,len(files))
        uploaded.append({"id":remote["id"],"name":remote["name"],"sha256":sha256(path),"backupId":backup_id})
    if len(uploaded)!=len(files):raise RuntimeError("Incomplete uploads; retention skipped")
    for item,path in zip(uploaded,files):
        verify=Path(workdir)/("verify-"+path.name)
        download(item["id"],verify,token)
        if sha256(path)!=sha256(verify):raise RuntimeError("Checksum mismatch; retention skipped")
    return uploaded

def expired_candidates(inventory,backup_id,now=None):
    now=now or datetime.now(timezone.utc)
    cutoff=now-timedelta(days=RETENTION_DAYS)
    groups={}
    for item in inventory:
        props=item.get("appProperties") or {}
        if props.get("legionBackup")!="true":continue
        bid=props.get("backupId")
        if bid:groups.setdefault(bid,[]).append(item)
    expired=[]
    for bid,items in groups.items():
        if bid==backup_id:continue
        counts={int((i.get("appProperties") or {}).get("backupCount","0")) for i in items}
        dates=[datetime.fromisoformat(i["createdTime"].replace("Z","+00:00")) for i in items if i.get("createdTime")]
        # Fail closed: only identify a set when metadata count and actual count match.
        if counts=={len(items)} and len(items)>1 and len(dates)==len(items) and max(dates)<cutoff:
            expired.append({"backup_id":bid,"files":items})
    return expired

def run_backup(folder,token,backup_id,files,workdir):
    uploaded=upload_and_verify(files,folder,token,backup_id,workdir)
    # Inventory/retention discovery is after verification; deletion intentionally disabled.
    inventory=list_managed(folder,token)
    candidates=expired_candidates(inventory,backup_id)
    return {"result":"verified","backup_id":backup_id,"files":uploaded,"expired_candidates":len(candidates),"automatic_deletion":"disabled_non_atomic_drive_api"}

def main():
    folder=os.environ["GOOGLE_DRIVE_FOLDER_ID"]
    token=access_token()
    backup_id=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")+"-"+os.environ.get("GITHUB_RUN_ID","local")
    with tempfile.TemporaryDirectory(prefix="legion-drive-backup-") as td:
        out=Path(td)/"backup-output"
        subprocess.run(["bash","scripts/create_repo_backup.sh",str(out)],check=True)
        files=sorted(p for p in out.iterdir() if p.is_file())
        result=run_backup(folder,token,backup_id,files,td)
        print(json.dumps(result,indent=2))

if __name__=="__main__":main()
