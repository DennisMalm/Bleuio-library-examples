from bleuio_lib.bleuio_funcs import BleuIo
from serial import SerialException
from time import sleep
import re

my_dongle = None
connected = False
eddystone_pattern = re.compile(r'^(?=.*\d)[A-Za-z:\d]{2,172}$')

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

print('\nConnected to dongle\n'
      'Welcome to the Eddystone example!\n\n')

# Prompting user to enter a Eddystone url to be broadcast
user_input = input('Enter the Eddystone formatted url:\n'
                   'Example: 0d:16:aa:fe:10:00:03:67:6f:6f:67:6c:65:07 '
                   '(https://google.com)\n')

while user_input.casefold() != 'stop':

    # Checks the address against regex pattern to match required format
    if bool(eddystone_pattern.match(user_input)):
        # Data to be advertised
        my_dongle.at_advdata(user_input)
        # Starts advertising
        my_dongle.at_advstart('0', '200', '3000', '0')

        print('Advertising {}'.format(user_input))

        user_input = input('Enter "STOP" to terminate script\n')
    else:
        user_input = input('The url was not correctly formatted\n'
                           'Please try again '
                           'or enter "STOP" to terminate the script\n')

print('Terminating script')
my_dongle.at_advstop()
my_dongle.stop_daemon()
