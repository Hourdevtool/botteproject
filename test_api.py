import requests

print("Testing API...")
url = "http://127.0.0.1/bottle_api/api/operator/machines/1/config"
payload = {
    "type": "money",
    "base_prices": {
        "clear": 20.0,
        "opaque": 15.0,
        "brown": 10.0
    }
}
try:
    res = requests.put(url, json=payload)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)

print("Fetching Status...")
url2 = "http://127.0.0.1/bottle_api/api/user/machines/1/status"
try:
    res2 = requests.get(url2)
    print("Status:", res2.status_code)
    print("Response:", res2.text)
except Exception as e:
    print("Error:", e)
