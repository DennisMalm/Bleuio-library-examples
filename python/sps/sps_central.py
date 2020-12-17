from bleuio_lib.bleuio_funcs import BleuIo
from serial import SerialException
from time import sleep

my_dongle = None
connected_to_dongle = False
message = ''
connected_to_peripheral = False

# This script will send data from a central dongle(my_dongle)
# to a peripheral device(target_device_address)
# which in turn will echo it back to the central

# target device needs to be set in peripheral role and advertising
target_device_address = '[0]40:48:FD:E5:2C:EF'

while not connected_to_dongle:
    try:
        # Specify the COM PORT connected to the dongle
        my_dongle = BleuIo(port='COM6')
        # Start the deamon (background process handler) for RX and TX data.
        my_dongle.start_daemon()

        connected_to_dongle = True
    except SerialException:
        print('Dongle not found. Please connect your dongle')
        sleep(5)

print('Connected to dongle\n\n'
      'Welcome to the BleuIO SPS example!\n\n')  # //TODO byt namn på de andra

# Set the dongle in central role if not already set
if "Central role" not in str(my_dongle.at_gapstatus()):
    my_dongle.at_central()

# # //TODO kontrollera alla sleep()


# target_dongle_address = input('Enter the target address:\n')

# Requests connection with target
my_dongle.at_gapconnect(target_device_address)
# Fetch information about the connection
response = my_dongle.rx_response

try:
    time_out_counter = 0

    while not connected_to_peripheral:
        # Checks if a connection been made
        if 'CONNECTED.' in str(response):
            connected_to_peripheral = True
            print('\nConnected to {}'.format(target_device_address))
        # Tries to connect 5 times
        elif time_out_counter < 5:
            print('Trying to connect to target device')
            sleep(3)
            time_out_counter += 1
        else:
            print('Connection timed out')
            break

    if connected_to_peripheral:
        message = input('\nEnter a message to send to the peripheral:\n')
        # Sends provided message to the connected device
        print(my_dongle.at_spssend(message))

        print('printas inte ut')

    # Disconnects and stops the dongle
    my_dongle.at_gapdisconnect()
    my_dongle.stop_daemon()

except KeyboardInterrupt:
    # Disconnects and stops the dongle
    my_dongle.at_gapdisconnect()
    my_dongle.stop_daemon()
    exit()
