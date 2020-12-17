import * as my_dongle from 'bleuio'
import 'regenerator-runtime/runtime'

const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const iBeaconButton = document.querySelector('#iBeaconButton')
const uuidInputField = document.querySelector('#uuidInputField')

let connected = false
let advertising = false

const handleConnectButton = async () => {
    if (!connected) {

        // Connect to dongle
        await my_dongle.at_connect()
        sleep(150)

        connectButton.textContent = 'Disconnect'
        output.textContent = 'Connected to dongle'

        connected = true

        // Enable the eddystone button which is disabled by default to avoid errors
        iBeaconButton.addEventListener('click', handleIBeaconButton)
        toggleButton('Create an iBeacon', true)

    } else {

        // Stop advertising
        await executeCommand(my_dongle.at_advstop())

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        output.textContent = 'Dongle disconnected'

        // Disable the iBeacon button to avoid errors
        toggleButton('Create an iBeacon', false)
        iBeaconButton.removeEventListener('click', handleIBeaconButton)

        connectButton.textContent = 'Connect'
    }
}

connectButton.addEventListener('click', handleConnectButton)

/**
 * Calls the dongles advertise function (at_advdata())
 * and provides an Eddystone url as the data
 * Notice that the iBeacon uses a different function, at_advdatai() 
 * which contains an "i" at the end of the function
 */
const handleIBeaconButton = async () => {
    // If the dongle is not advertising, start advertising an Eddystone url
    if (!advertising) {
        startAdvertising()
    } else {
        stopAdvertising()
    }
}

const startAdvertising = async () => {
    // Disable the iBeaconButton until the advertising has completed
    toggleButton('Creating beacon', false)

    
    // Get information about the dongles status
    let dongleStatus = await my_dongle.at_gapstatus()
    sleep(150)

    // Stop the dongle from advertising if the dongle is advertising
    if (dongleStatus.includes('Advertising')) {
        await executeCommand(my_dongle.at_advstop())
    }
    
    // Sets the dongle in peripheral role which is required to be able to start advertising
    dongleStatus.forEach(async (response)  => {
        console.log(response)
        if (response.indexOf('Central') !== -1) {
            await executeCommand(my_dongle.at_peripheral())
        }
    });

    // Sets the data to advertise 
    // in this case an UUID is provided for demonstraion purposes
    await executeCommand(my_dongle.at_advdatai('5f2dd896-b886-4549-ae01-e41acd7a354a0203010400'))

    // Start advertising
    await executeCommand(my_dongle.at_advstart())

    // Get information again from the dongle to look for changes
    let dongleStatus = await my_dongle.at_gapstatus()
    sleep(150)

    // Check if the dongle is advertising
    if (dongleStatus.includes('Advertising')) {
        advertising = true

        output.textContent = 'iBeacon created'
        
        toggleButton('Stop iBeacon', true)
    } else {
        output.textContent = 'Something went wrong, please try again'

        toggleButton('Create an eddystone beacon', false)
    }

}

const stopAdvertising = async () => {
    // Stop the dongle from advertising if the dongle is advertising
    await executeCommand(my_dongle.at_advstop())

    advertising = false

    output.textContent = 'iBeacon stopped'

    toggleButton('Create an iBeacon', true)
}

/**
 * Sets the buttons text content and if the button should be enabled or disabled
 * @param {text} text Text content
 * @param {boolean} enabled Enabled or disabled
 */
const toggleButton = (text, enabled) => {
    iBeaconButton.textContent = text
    if (enabled) {
        iBeaconButton.classList.remove('disabled')
    } else {
        iBeaconButton.classList.add('disabled')
    }
}

/**
 * Execute the callback then stop the 
 * eventloop for 150 miliseconds
 * @param {function} command callback
 */
const executeCommand = async (command) => {
    console.log(command)
    return new Promise(resolve => setTimeout(resolve, 150));
}

/**
 * Stop the eventloop for * amount miliseconds
 */
const sleep = (miliseconds) => {
    return new Promise(resolve => setTimeout(resolve, miliseconds));
}