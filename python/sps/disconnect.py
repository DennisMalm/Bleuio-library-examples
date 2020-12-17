from datetime import datetime
from bleuio_lib.bleuio_funcs import BleuIo
from serial import SerialException
from time import sleep

connected = False
my_dongle = None

while not connected:
    try:
        # Connect to dongle
        my_dongle = BleuIo(port='COM6')
        # Start the deamon (background process handler) for rx and tx data.
        my_dongle.start_daemon()

        connected = True
    except SerialException:
        print('Dongle not found. Please connect your dongle')
        sleep(5)

my_dongle.send_command("AT+GAPDISCONNECT")
my_dongle.stop_daemon()
