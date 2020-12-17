from bleuio_lib.bleuio_funcs import BleuIo  # //FIXME går det att importera endast BleuIO?
from serial import SerialException
from time import sleep
import re

my_dongle = None
connected = False
uuid_pattern = re.compile(
    '[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{22}')

while not connected:
    try:
        # Connect to dongle
        my_dongle = BleuIo(port='COM6', debug=True)
        # Start the deamon (background process handler) for RX and TX data.
        my_dongle.start_daemon()

        connected = True
    except SerialException:
        print('Dongle not found. Please connect your dongle')
        sleep(5)

print('\nConnected to dongle\n'
      'Welcome to iBeacon example!\n')

# Prompting user to enter a iBeacon UUID url to be broadcast
user_input = input(
    'Enter the iBeacon UUID (x) string with Major (j), '
    'Minor (n) and TX (t)\n'
    '(Example: ebbaaf47-0e4f-4c65-8b08-dd07c98c41ca0000000000):\n')

while user_input.casefold() != 'stop':

    # Starts the beacon if the UUID matches the correct format
    if bool(uuid_pattern.match(user_input)):
        # Sets the UUID as data to be advertised
        my_dongle.at_advdatai(user_input)
        print('iBeacon created with uuid: {}\n'.format(user_input))

        # Start advertising
        my_dongle.at_advstart('0', '200', '3000', '3')  # starts advertising
        print('Advertising..\n')

        user_input = input('Enter "STOP" to terminate script\n')
    else:
        user_input = input('The UUID was not correctly formatted\n'
                           'Please try again '
                           'or enter "STOP" to terminate the script\n')

print('Terminating script')
my_dongle.at_advstop()
my_dongle.stop_daemon()
