"""Create (or update) the Fabric Empires semantic model item from the local TMDL.

Idempotent: if an item with the same display name already exists it is updated
via updateDefinition rather than creating a duplicate. Fabric will happily hold
two items with the same name, and two Direct Lake models over one database is a
confusing thing to leave behind.
"""

import base64
import json
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.request

AZ = r"C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
WS = "5249380b-543f-4e2b-ab7a-39d5ae7633e8"
NAME = "Fabric Empires"
ROOT = pathlib.Path(r"C:\Users\alkorn\repos\fabric-empires\fabric\Fabric Empires.SemanticModel")
API = "https://api.fabric.microsoft.com/v1"

tok = subprocess.run(
    [AZ, "account", "get-access-token", "--resource", "https://api.fabric.microsoft.com",
     "--query", "accessToken", "-o", "tsv"],
    capture_output=True, text=True, check=True).stdout.strip()
H = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


def call(method: str, url: str, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=H, method=method)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            raw = r.read().decode("utf-8")
            return r.status, dict(r.headers), (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code} on {method} {url}\n{e.read().decode('utf-8','replace')[:1500]}")


def parts() -> list[dict]:
    out = []
    for p in sorted(ROOT.rglob("*")):
        if p.is_file():
            out.append({
                "path": p.relative_to(ROOT).as_posix(),
                "payload": base64.b64encode(p.read_bytes()).decode("ascii"),
                "payloadType": "InlineBase64",
            })
    return out


def wait(headers, label):
    loc = headers.get("Location")
    if not loc:
        return
    for _ in range(90):
        time.sleep(4)
        st, _h, body = call("GET", loc)
        state = (body or {}).get("status")
        if state in ("Succeeded", "Completed"):
            print(f"  {label}: {state}")
            return
        if state == "Failed":
            raise SystemExit(f"{label} FAILED: {json.dumps(body)[:1200]}")
    raise SystemExit(f"{label}: timed out")


_s, _h, listing = call("GET", f"{API}/workspaces/{WS}/semanticModels")
existing = next((i for i in listing.get("value", []) if i["displayName"] == NAME), None)

definition = {"parts": parts()}
print(f"{len(definition['parts'])} parts")

if existing:
    print(f"updating existing semantic model {existing['id']}")
    st, h, _ = call("POST", f"{API}/workspaces/{WS}/semanticModels/{existing['id']}/updateDefinition",
                    {"definition": definition})
    wait(h, "updateDefinition")
    model_id = existing["id"]
else:
    print("creating new semantic model")
    st, h, body = call("POST", f"{API}/workspaces/{WS}/semanticModels",
                       {"displayName": NAME, "definition": definition})
    if st == 202:
        wait(h, "create")
        _s, _h, listing = call("GET", f"{API}/workspaces/{WS}/semanticModels")
        body = next(i for i in listing["value"] if i["displayName"] == NAME)
    model_id = body["id"]

print(f"\nSEMANTIC MODEL ID: {model_id}")
pathlib.Path(r"C:\Users\alkorn\repos\temp\fe_model_id.txt").write_text(model_id, encoding="utf-8")
