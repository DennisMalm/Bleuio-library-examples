from datetime import datetime

from bleuio_lib.bleuio_funcs import BleuIo
from serial import SerialException
from time import sleep


def reformat_response(response: str) -> str:
    """
    Reformat the response for easier readability
    :param response: str
    :returns: a list of strings representing the header columns
    """
    response = response.replace('\\r\\n\\r\\n', '\n')
    response = response.replace('\\r\\n\\r', '\n')
    response = response.replace('\\r', '\n')
    response = response.replace('\\n', '')

    # Adds date of log
    reformatted_response = "Date of log: "
    reformatted_response += datetime.now().strftime('%D')
    reformatted_response += '\n'

    # Reformat each line
    for line in response.split():
        if len(line) == 19:
            # Adds time of response
            reformatted_response += '['
            reformatted_response += datetime.now().strftime("%H:%M:%S")
            reformatted_response += '] '
            reformatted_response += line
            reformatted_response += ' '
        if len(line) == 62:
            reformatted_response += line
            reformatted_response += '\n'

    return reformatted_response


my_dongle = None
connected = False

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
      'Welcome to the Bluetooth device Scan and Store example!\n\n')

# Set the dongle in central role if not already set
if "Central role" not in str(my_dongle.at_gapstatus()):
    my_dongle.at_central()  # sets dongle in central role

user_input = input(
    'Enter something such as a Manufacturer Specific (MFS) ID to scan for '
    'and store in a file or just leave it blank to scan all:\n')

try:
    # Scans with a specific id or all devices if none is provided
    my_dongle.at_findscandata(user_input)

    log = ""

    while user_input.casefold() != 'stop':
        user_input = input('Enter "STOP" to stop scanning\n')

        # If the user stops the scan log reformat and log the response
        if user_input.casefold() == 'stop':
            log = str(my_dongle.rx_response)
            log = reformat_response(log)

    # Saves the log to scan_log.txt
    with open('scan_log.txt', 'w') as scan_log:
        scan_log.write(log)

    # Stop the dongle when scan is complete
    my_dongle.stop_scan()
    my_dongle.stop_daemon()

except KeyboardInterrupt:
    # Stop the dongle
    my_dongle.stop_scan()
    my_dongle.stop_daemon()
    exit()
