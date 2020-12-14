from bleuio_lib.bleuio_funcs import BleuIo
from serial import SerialException
from time import sleep
import re

my_dongle = None
connected = False
address_pattern = re.compile(
    r'\[[0-1]\][a-zA-Z0-9:]{2}:[a-zA-Z0-9:]{2}:[a-zA-Z0-9:]{2}:'
    r'[a-zA-Z0-9:]{2}:[a-zA-Z0-9:]{2}:[a-zA-Z0-9:]{2}')

while not connected:
    try:
        # Specify the COM PORT connected to the dongle
        my_dongle = BleuIo(port='COM6')
        # Start the deamon (background process handler) for RX and TX data.
        my_dongle.start_daemon()

        connected = True
    except SerialException:
        print('Dongle not found. Please connect your dongle')
        sleep(5)

print('Connected to dongle\n\n'
      'Welcome to the Bluetooth device Scanning example!\n\n')

# Set the dongle in central role if not already set
if "Central role" not in str(my_dongle.at_gapstatus()):
    my_dongle.at_central()

try:
    user_input = input('Enter:\n'
                       '"1" Continuous scan\n'
                       '"2" Scan for a limited time\n'
                       '"3" Scan a target device\n')

    if user_input == '1':
        # "Continuous scan" option

        # Start scanning for bluetooth devices
        my_dongle.at_gapscan()
        log = ['']

        while True:
            # Filters the response leaving only the necessary
            # information to the user
            response = str(my_dongle.rx_buffer)
            response = response.replace('b\'\\r\\n', '')
            response = response.replace('b\'\'', '')
            response = response.replace('\\r\\n\'', '')
            response = response.replace('\\n', '')
            response = response.replace('\\r\\r', '\n')

            # Stores the latest response unless it has already been stored
            # filters out empty responses
            if not log[-1] == response:
                print(response)
                log.append(response)

    elif user_input == '2':
        # "Scan for a limited time" option

        time_limit = input('Enter time limit:\n')

        while not time_limit.isdigit():
            time_limit = input('Wrong input please try again')

        # Starts scan with entered time limit
        response = my_dongle.at_gapscan(int(time_limit))

        # Prints the result
        for result in response:
            print(result)

    elif user_input == '3':
        # "Scan a target device" option

        # Prompting user to enter a device address scanned for
        device_address = input('Enter device type and address:\n'
                               'Example: [0]40:48:FD:E5:2C:EF\n')

        # Checks the url against regex pattern to match required format
        if bool(address_pattern.match(device_address)):
            print("Scanning target device: {}".format(device_address))

            # Prints the result
            while True:
                # //todo går det att hålla consistency och inte använda print()?
                print(my_dongle.at_scantarget(device_address))  # scans after a device with entered address

        else:
            device_address = input(
                'The address was not correctly formatted\n'
                'Please try again')

except KeyboardInterrupt:
    # Stops eventual continuous scan and stops the dongle
    my_dongle.stop_scan()
    my_dongle.stop_daemon()
    exit()
