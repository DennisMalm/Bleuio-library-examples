import * as my_dongle from 'bleuio'
import 'regenerator-runtime/runtime'



const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const iBeaconButton = document.querySelector('#iBeaconButton')
const gapscanButton = document.querySelector('#scanButton')
const eddystoneButton = document.querySelector('#eddystoneButton')

let connected = false
let advertising = false
let buttonsEnabled = false

const handleConnectButton = async () => {
    if (connected === false) {

        // Connect to dongle
        await my_dongle.at_connect()
        sleep(150)

        connectButton.textContent = 'Disconnect'
        printResponse('Connected to dongle')

        connected = true
        enableButtonsEvents()
        buttonsEnabled = true
    } else {

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        printResponse('Dongle disconnected')
        disableButtonsEvents()
        connectButton.textContent = 'Connect'
        buttonsEnabled = false
    }
}

connectButton.addEventListener('click', handleConnectButton)

/**
 * Removes the eventListeners from the buttons
 * and toggles visibility of the buttons
 */
const disableButtonsEvents = () => {
    iBeaconButton.removeEventListener('click', handleIBeaconButton)
    eddystoneButton.removeEventListener('click', handleEddystoneButton)
    gapscanButton.removeEventListener('click', handleGapscanButton)
    toggleButtons(false, iBeaconButton, eddystoneButton, gapscanButton)
}

/**
 * Removes the eventListeners from the buttons
 * and toggles visibility of the buttons
 */
const enableButtonsEvents = () => {
    iBeaconButton.addEventListener('click', handleIBeaconButton)
    eddystoneButton.addEventListener('click', handleEddystoneButton)
    gapscanButton.addEventListener('click', handleGapscanButton)
    toggleButtons(true, iBeaconButton, eddystoneButton, gapscanButton)
}

/**
 * Prints a response to the DOM
 * @param {String} response the message to be printed to the DOM
 * @param {boolean} append if 'true' the message will be added otherwise the output will be cleared before printed
 */
const printResponse = (response, append = false) => {
    if (!append) {
        output.textContent = ''
    }

    // Some of the dongles functions returns the data in an Array
    if (Array.isArray(response)) {
        response.forEach(data => {

            // Adds the data in the response as a row of information in the DOM
            const outputLine = document.createElement("p")
            outputLine.setAttribute("style", "margin: 2px")
            outputLine.textContent = data

            output.appendChild(outputLine)
        })

        // If the response only contains a String   
    } else {

        // Adds the data in the response as a row of information in the DOM
        const outputLine = document.createElement("p")
        outputLine.setAttribute("style", "margin: 2px")
        outputLine.textContent = response

        output.appendChild(outputLine)
    }
}

/**
 * Toggles 'disabled' class of the buttons
 * so that the user wont send multiple functions to the dongle
 * @param  {...any} buttons which buttons to toggle
 * @param  {boolean} enabled if the button should be enabled or disabled
 */

const toggleButtons = (enabled, ...buttons) => {
    if (enabled) {
        buttons.forEach((button) => {
            button.classList.remove('disabled')
        })
    } else {
        buttons.forEach((button) => {
            button.classList.add('disabled')
        })
    }
}

/**
 * Calls the dongles iBeacon function (at_advdatai())
 */
const handleIBeaconButton = async () => {

    let response = ''

    // If the dongle is not advertising, start advertising with a UUID of the beacon
    if (advertising === false) {
        iBeaconButton.textContent = 'Creating beacon'
        // Disables all buttons
        // so that the user wont send multiple functions to the dongle
        toggleButtons(false, iBeaconButton, eddystoneButton, gapscanButton)

        // stop any ongoing advertisment //TODO behövs denna?
        await executeCommand(my_dongle.at_advstop())

        // Sets the dongle in peripheral role which is required to be able to start an iBeacon
        await executeCommand(my_dongle.at_peripheral())

        // Sets the data to advertise 
        // in this case an UUID is provided for demonstraion purposes
        await executeCommand(my_dongle.at_advdatai('5f2dd896-b886-4549-ae01-e41acd7a354a0203010400'))

        // Start advertising
        await executeCommand(my_dongle.at_advstart())

        iBeaconButton.textContent = 'Stop iBeacon'

        printResponse('iBeacon created')
        advertising = true

        // Toggle the iBeacon button again when the advertisment started
        // so that it can be stopped
        toggleButtons(true, iBeaconButton)
    } else {

        // Stop the dongle from advertising if the dongle is advertising
        await executeCommand(my_dongle.at_advstop())

        advertising = false

        iBeaconButton.textContent = 'Create an iBeacon'

        // Toggles(enableing) the buttons again 
        toggleButtons(true, eddystoneButton, gapscanButton, iBeaconButton)
        printResponse('iBeacon stopped')
    }
}

/**
 * Calls the dongles advertise function (at_advdata())
 * and provides an Eddystone url as the data
 * Notice that the iBeacon uses a different function, at_advdatai() 
 * which contains an "i" at the end of the function
 */
const handleEddystoneButton = async () => {

    // If the dongle is not advertising, start advertising an Eddystone url
    if (advertising === false) {
        eddystoneButton.textContent = 'Creating beacon'
        // Disables all buttons
        // so that the user wont send multiple functions to the dongle
        toggleButtons(false, iBeaconButton, gapscanButton, eddystoneButton)

        // Stop the dongle from advertising if the dongle is advertising
        await executeCommand(my_dongle.at_advstop())

        // Sets the dongle in peripheral role which is required to be able to start advertising
        await executeCommand(my_dongle.at_peripheral())

        // Sets the data to advertise 
        // in this case an Eddystone url(https://google.com) 
        // is provided for demonstraion purposes
        await executeCommand(my_dongle.at_advdata('0d:16:aa:fe:10:00:03:67:6f:6f:67:6c:65:07'))

        // Start advertising
        await executeCommand(my_dongle.at_advstart())

        printResponse('Eddystone beacon created')
        eddystoneButton.textContent = 'Stop Eddystone beacon'
        advertising = true//FIXME kontrollera

        // Toggle the iBeacon button again when the advertising has started
        // so that it can be stopped
        toggleButtons(true, eddystoneButton)
    } else {

        // Stop the dongle from advertising if the dongle is advertising
        await executeCommand(my_dongle.at_advstop())

        // Give dongle time to complete the request
        advertising = false

        printResponse('Eddystone beacon stopped') //FIXME kontollera advstop

        eddystoneButton.textContent = 'Create an Eddystone beacon'

        // Toggles(enableing) the buttons again
        toggleButtons(true, eddystoneButton, gapscanButton, iBeaconButton)
    }
}

/**
 * Calls the dongles scan function (at_gapscan())
 */
const handleGapscanButton = async () => {

        //TODO stop knapp
        gapscanButton.textContent = 'Scanning'

        // Disables all buttons
        // so that the user wont send multiple functions to the dongle
        toggleButtons(false, gapscanButton, iBeaconButton, eddystoneButton)

        // Stop the dongle from advertising if the dongle is advertising
        await executeCommand(my_dongle.at_advstop())

        // Sets the dongle in central role which is required to be able to use scan function
        await executeCommand(my_dongle.at_central())

        /**
         * Start scanning which returns an Array containing devices found
         * @param {int} seconds amount of time the scanning process is active
         */
        let response = await my_dongle.at_gapscan(3)

        // Allow the dongle time to execute the command
        await sleep(150)

        printResponse(response)
        gapscanButton.textContent = 'Scan BLE devices'

        // Toggles(enableing) the buttons again
        toggleButtons(true, gapscanButton, iBeaconButton, eddystoneButton)
}



/**
 * Execute the callback then stop the 
 * eventloop for 150 miliseconds
 * @param {function} command callback
 */
const executeCommand = async (command) => {
    command
    return new Promise(resolve => setTimeout(resolve, 150));
}

/**
 * Stop the eventloop for * amount miliseconds
 */
const sleep = (miliseconds) => {
    return new Promise(resolve => setTimeout(resolve, miliseconds));
}