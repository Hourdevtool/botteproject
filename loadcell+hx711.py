'''from hx711 import HX711
from time import sleep

hx = HX711(d_out=4, pd_sck=5)

offset = hx.read()
scale = 409

while True:
    raw = hx.read()
    weight = abs(raw - offset) / scale

    if weight < 2:
        weight = 0

    print(round(weight), "g")

    sleep(0.02)      # อ่าน 50 ครั้ง/วินาที '''
from hx711 import HX711
from time import sleep

hx = HX711(d_out=4, pd_sck=5)

print("Calibrating...")

offset = hx.read()

scale = 409          # ค่าเดิม
correction = 1.25    # ตัวคูณชดเชย

while True:
    raw = hx.read()

    weight = abs(raw - offset) / scale

    # ชดเชยการชั่งแนวเอียง
    weight = weight * correction

    if weight < 2:
        weight = 0

    print("Raw =", raw,
          "Weight =", round(weight, 1), "g")

    sleep(0.05)