from bleuio_lib.bleuio_funcs import BleuIo
from serial import SerialException
from time import sleep

# This script will receive data from a central dongle
# and echo it back to the central

my_dongle = None
connected_to_dongle = False
message = ''
connected_to_central = False

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


# Set the dongle in peripheral role if not already set
if "Peripheral role" not in str(my_dongle.at_gapstatus()):
    my_dongle.at_peripheral()

# Starts advertising so it can be detected
my_dongle.at_advstart()

try:
    time_out_counter = 0

    while not connected_to_central:
        # Get information from the dongle
        # to see if it's connected to the central
        status = my_dongle.at_gapstatus()

        # Checks for information about connection
        if '\\nConnected\\r' in str(status):
            print('\nConnected to {}'.format("central"))

            # TODO fixa
            print(my_dongle._serial.read(my_dongle._serial.inWaiting()).decode())

            # Disconnects and stops the dongle
            my_dongle.at_gapdisconnect()
            my_dongle.stop_daemon()

        # sleep(2)

except KeyboardInterrupt:
    # Disconnects and stops the dongle
    my_dongle.at_gapdisconnect()
    my_dongle.stop_daemon()
    exit()