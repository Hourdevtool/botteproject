from machine import Pin
from time import sleep_us

class HX711:
    def __init__(self, d_out, pd_sck, gain=128):
        self.pSCK = Pin(pd_sck, Pin.OUT)
        self.DOUT = Pin(d_out, Pin.IN)

        self.pSCK.value(0)

        if gain == 128:
            self.GAIN = 1
        elif gain == 64:
            self.GAIN = 3
        elif gain == 32:
            self.GAIN = 2

    def is_ready(self):
        return self.DOUT.value() == 0

    def read(self):
        while not self.is_ready():
            pass

        data = 0

        for i in range(24):
            self.pSCK.value(1)
            sleep_us(1)
            data = (data << 1) | self.DOUT.value()
            self.pSCK.value(0)
            sleep_us(1)

        for i in range(self.GAIN):
            self.pSCK.value(1)
            sleep_us(1)
            self.pSCK.value(0)
            sleep_us(1)

        if data & 0x800000:
            data |= ~0xffffff

        return data
