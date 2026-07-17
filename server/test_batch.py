import requests
import time
import json

base_url = "http://127.0.0.1/bottle_api/api"

print("1. Logging in...")
login_payload = {"phonenumber": "123"}
res = requests.post(f"{base_url}/user/machines/1/login", json=login_payload)
print(res.status_code, res.text)
if res.status_code == 200:
    token = res.json().get("token")
    print("2. Batch deposit...")
    headers = {"Authorization": f"Bearer {token}"}
    deposit_payload = {
        "bottles": [
            {"type": "clear", "weight": 1.0, "earned": 20},
            {"type": "opaque", "weight": 1.0, "earned": 15}
        ]
    }
    res2 = requests.post(f"{base_url}/user/machines/1/batch_deposit", json=deposit_payload, headers=headers)
    print(res2.status_code, res2.text)
