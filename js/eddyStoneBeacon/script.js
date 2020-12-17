import * as my_dongle from 'bleuio'
import 'regenerator-runtime/runtime'

const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const eddystoneButton = document.querySelector('#eddystoneButton')
const urlInputField = document.querySelector('#urlInputField')

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
        eddystoneButton.addEventListener('click', handleEddystoneButton)
        toggleEddystoneButton('Create an Eddystone beacon', true)

    } else {
        // Stops advertising
        await executeCommand(my_dongle.at_advstop)

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        output.textContent = 'Dongle disconnected'

        // Disable the eddystone button to avoid errors
        toggleEddystoneButton('Create an Eddystone beacon', false)
        eddystoneButton.removeEventListener('click', handleEddystoneButton)

        connectButton.textContent = 'Connect'
    }
}

connectButton.addEventListener('click', handleConnectButton)

/**
 * Calls the dongles advertise function (at_advdata())
 * and provides an Eddystone url as the data
 */
const handleEddystoneButton = async () => {

    // If the dongle is not advertising, start advertising an Eddystone url
    if (!advertising) {
        startAdvertising()
    } else {
        stopAdvertising()
    }
}

const startAdvertising = async () => {
    // Disable the eddyStoneButton until the advertising has completed
    toggleEddystoneButton('Creating beacon', false)

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

    // Sets the data to advertise the provided url in the html will advertise "https://google.com"
    await executeCommand(my_dongle.at_advdata(urlInputField.value)) 

    // Start advertising
    await executeCommand(my_dongle.at_advstart())

    // Get information again from the dongle to look for changes
    let dongleStatus = await my_dongle.at_gapstatus()
    sleep(150)

    // Check if the dongle is advertising
    if (dongleStatus.includes('Advertising')) {
        advertising = true

        output.textContent = 'Eddystone beacon created'
        
        toggleEddystoneButton('Stop Eddystone beacon', true)
    } else {
        output.textContent = 'Something went wrong, please try again'

        toggleEddystoneButton('Create an Eddystone beacon', false)
    }
}

const stopAdvertising = async () => {
    // Stop the dongle from advertising if the dongle is advertising
    await executeCommand(my_dongle.at_advstop())

    // Give dongle time to complete the request
    advertising = false

    output.textContent = 'Eddystone beacon stopped'

    toggleEddystoneButton('Create an Eddystone beacon', true)
}

/**
 * Sets the buttons text content and if the button should be enabled or disabled
 * @param {text} text Text content
 * @param {boolean} enabled Enabled or disabled
 */
const toggleEddystoneButton = (text, enabled) => {
    eddystoneButton.textContent = text
    if (enabled) {
        eddystoneButton.classList.remove('disabled')
    } else {
        eddystoneButton.classList.add('disabled')
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