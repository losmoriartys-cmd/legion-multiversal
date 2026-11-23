#!/usr/bin/env python3
"""Restore a Drive backup set into a new isolated directory without the source checkout."""
import json, os, subprocess, tempfile, urllib.parse, urllib.request
from pathlib import Path
API="https://www.googleapis.com/drive/v3"
def req(url,headers=None):
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers or {}),timeout=120) as r:return r.read()
def token():
    data=urllib.parse.urlencode({"client_id":os.environ["GOOGLE_OAUTH_CLIENT_ID"],"client_secret":os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],"refresh_token":os.environ["GOOGLE_OAUTH_REFRESH_TOKEN"],"grant_type":"refresh_token"}).encode()
    q=urllib.request.Request("https://oauth2.googleapis.com/token",data=data,headers={"Content-Type":"application/x-www-form-urlencoded"})
    with urllib.request.urlopen(q,timeout=60) as r:return json.loads(r.read())["access_token"]
def main():
    import argparse
    p=argparse.ArgumentParser();p.add_argument("--backup-id",required=True);p.add_argument("--folder-id",default=os.environ.get("GOOGLE_DRIVE_FOLDER_ID"));p.add_argument("--target",required=True);args=p.parse_args()
    if not args.folder_id:raise SystemExit("Missing --folder-id or GOOGLE_DRIVE_FOLDER_ID")
    target=Path(args.target).resolve()
    if target.exists() and any(target.iterdir()):raise SystemExit("Target must be empty.")
    target.mkdir(parents=True,exist_ok=True);t=token()
    query="'"+args.folder_id+"' in parents and trashed=false and appProperties has { key='backupId' and value='"+args.backup_id+"' }"
    url=API+"/files?q="+urllib.parse.quote(query)+"&fields=files(id,name,appProperties)&pageSize=1000"
    files=json.loads(req(url,{"Authorization":"Bearer "+t})).get("files",[])
    if not files:raise SystemExit("No files for this backup ID.")
    expected={int((f.get("appProperties") or {}).get("backupCount","0")) for f in files}
    if expected!={len(files)}:raise SystemExit("Incomplete backup set; restore refused.")
    with tempfile.TemporaryDirectory(prefix="legion-restore-") as td:
        d=Path(td)
        for f in files:
            name=Path(f["name"]).name
            if name in (".",".."):raise SystemExit("Unsafe filename rejected")
            (d/name).write_bytes(req(API+"/files/"+urllib.parse.quote(f["id"],safe="")+"?alt=media",{"Authorization":"Bearer "+t}))
        sums=d/"SHA256SUMS"
        if not sums.exists():raise SystemExit("Checksum manifest missing.")
        subprocess.run(["sha256sum","-c",str(sums)],cwd=d,check=True)
        bundle=d/"legion-multiversal.bundle";snapshot=d/"legion-multiversal-source.tar.gz"
        if not bundle.exists() or not snapshot.exists():raise SystemExit("Required artifacts missing.")
        subprocess.run(["git","bundle","verify",str(bundle)],check=True)
        repo_dir=target/"repository-from-bundle"
        subprocess.run(["git","clone",str(bundle),str(repo_dir)],check=True)
        snap_dir=target/"source-snapshot";snap_dir.mkdir()
        listing=subprocess.run(["tar","-tzf",str(snapshot)],check=True,capture_output=True,text=True).stdout.splitlines()
        for entry in listing:
            candidate=Path(entry)
            if candidate.is_absolute() or ".." in candidate.parts:
                raise SystemExit("Unsafe archive path detected; extraction refused.")
        subprocess.run(["tar","-xzf",str(snapshot),"-C",str(snap_dir)],check=True)
        print(json.dumps({"restore":"success","backup_id":args.backup_id,"target":str(target),"bundle_repo":str(repo_dir),"snapshot":str(snap_dir),"isolated":True},indent=2))
if __name__=="__main__":main()
