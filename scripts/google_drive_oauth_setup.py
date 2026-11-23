#!/usr/bin/env python3
"""One-time local OAuth refresh-token bootstrap. Never commit the output."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlencode, urlparse, parse_qs
import os, secrets, urllib.request, json

client=os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
secret=os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
if not client or not secret:
    raise SystemExit("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in your local environment.")
redirect="http://127.0.0.1:8765/callback"
state=secrets.token_urlsafe(32)
params={"client_id":client,"redirect_uri":redirect,"response_type":"code","scope":"https://www.googleapis.com/auth/drive.file","access_type":"offline","prompt":"consent","state":state}
print("Authorize locally in your browser. This script listens only on localhost.")
print("OAuth URL:", "https://accounts.google.com/o/oauth2/v2/auth?"+urlencode(params))
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query=parse_qs(urlparse(self.path).query)
        if query.get("state",[""])[0]!=state:
            self.send_response(400);self.end_headers();self.wfile.write(b"Invalid OAuth state.");return
        code=query.get("code",[""])[0]
        payload=urlencode({"code":code,"client_id":client,"client_secret":secret,"redirect_uri":redirect,"grant_type":"authorization_code"}).encode()
        req=urllib.request.Request("https://oauth2.googleapis.com/token",data=payload,headers={"Content-Type":"application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req) as response: token=json.loads(response.read())
        self.send_response(200);self.end_headers();self.wfile.write(b"OAuth authorization completed. Close this tab.")
        print("\nREFRESH TOKEN (copy securely into GitHub Actions secret GOOGLE_OAUTH_REFRESH_TOKEN):")
        print(token.get("refresh_token","MISSING"))
        print("Token data will not be written to disk.")
        import threading
        threading.Thread(target=self.server.shutdown,daemon=True).start()
    def log_message(self,*args): pass
HTTPServer(("127.0.0.1",8765),Handler).serve_forever()
