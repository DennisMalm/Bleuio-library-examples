import * as my_dongle from 'bleuio'
import { async } from 'regenerator-runtime'
import 'regenerator-runtime/runtime'

const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const connectToPeripheralButton = document.querySelector('#connectToPeripheralButton')
const messageButton = document.querySelector('#messageButton')
const targetAddressField = document.querySelector('#targetAddressField')
const messageField = document.querySelector('#messageField')

let connected = false
let connectedToPeripheral = false


const handleConnectButton = async () => {
if (!connected) {

        // Connect to dongle 
        await my_dongle.at_connect()
        await sleep(150)

        connectButton.textContent = 'Disconnect'

        connected = true

        // Enable the connect button which is disabled by default to avoid errors
        connectToPeripheralButton.addEventListener('click', handleConnectToPeripheral)
        messageButton.addEventListener('click', handleSendMessage)
        

        //TODO någon comment?
        toggleButton(messageButton, 'Send', false)
        toggleButton(connectToPeripheralButton, 'Connect to peripheral', true)

    } else {
        // Disconnect from target device
        await executeCommand(my_dongle.at_gapdisconnect())

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        printResponse('Dongle disconnected', false)

        // Disable buttons to avoid errors
        toggleButton(connectToPeripheralButton, 'Connect to peripheral', false)
        toggleButton(messageButton, 'Send', false)

        connectToPeripheralButton.removeEventListener('click', handleConnectToPeripheral)
        messageButton.removeEventListener('click', handleSendMessage)

        connectButton.textContent = 'Connect to dongle'
    }
}

connectButton.addEventListener('click', handleConnectButton)

/**
 * Sends a message to the peripheral device
 */
const handleSendMessage = async () => {
    const message = messageField.value

    await executeCommand(my_dongle.at_spssend(message))

    messageField.value = ''

    printResponse('Message sent: ' + message, true)
}
/**
 * Connects to a peripheral device
 */
const handleConnectToPeripheral = () => {
    // Connect to a peripheral or disconnect from it
    if (!connectedToPeripheral) {
        connectToPeripheral()
    } else {
        disconnectFromPeripheral()
    }
}


/**
 * Checks the information about the dongle and sets it up to connect to a peripheral device
 */
const connectToPeripheral = async () => {

    // Disable the scanButton until the advertising has completed
    toggleButton(connectToPeripheralButton, 'Connecting', false)

    // Get information about the dongles status
    let dongleStatus = await my_dongle.at_gapstatus()
    await sleep(150)

    // Stop the dongle from advertising if the dongle is advertising
    if (dongleStatus.includes('Advertising')) {
        await executeCommand(my_dongle.at_advstop())
    }

    // If the dongle is in peripheral role, set it to central role
    dongleStatus.forEach(async (response) => {
        if (response.indexOf('Peripheral') !== -1) {
            await executeCommand(my_dongle.at_central())
        }
    });

    // If the dongle is connected, disconnect first
    // Note the difference between at_gapdisconnect() and at_disconnect() (which disconnects the dongle)
    if (dongleStatus.includes('Connected')) {
        await executeCommand(my_dongle.at_gapdisconnect())
    }

    await executeCommand(my_dongle.at_gapconnect(targetAddressField.value))
    //TODO loop trying to connect
    await sleep(3000)
    console.log('5')

    ////////////////////////////////////////////////////
    dongleStatus = await my_dongle.at_gapstatus()
    await sleep(150)

    ////////////////////////////////////////////////////

    if (dongleStatus.includes('Connected')) {
        printResponse('Connected to peripheral', false)
        connectedToPeripheral = true

        toggleButton(connectToPeripheralButton, 'Disconnect from peripheral', true)
        toggleButton(messageButton, 'Send', true)


        console.log('6')
        const printLoop = async () => {
            if (connectedToPeripheral) {
                let dongleStatus = await my_dongle.ati()
                await sleep(600)
                dongleStatus.forEach(async (response, index) => {
                    if (response.indexOf('handle_evt_gattc_notification:') !== -1) {
                        console.log(response)
                        printResponse(dongleStatus[index + 1])
                    }
                });
                printLoop()
            }
        }

        printLoop()

    } else {
        printResponse('Something went wrong, please try again', false)
        toggleButton(connectToPeripheralButton, 'Connect to target', true)
        toggleButton(messageButton, 'Send', true)
    }

    console.log('7')
}

const disconnectFromPeripheral = async () => {

    // Disconnects from peripheral
    await executeCommand(my_dongle.at_gapdisconnect())

    connectedToPeripheral = false

    printResponse('Disconnected from peripheral', false)
    toggleButton(connectToPeripheralButton, 'Connect to peripheral', true)
}

/**
 * Sets the buttons text content and if the button should be enabled or disabled
 * @param {Element} button Button
 * @param {text} text Text content
 * @param {boolean} enabled Enabled or disabled
 */
const toggleButton = (button, text, enabled) => {
    button.textContent = text
    if (enabled) {
        button.classList.remove('disabled')
    } else {
        button.classList.add('disabled')
    }
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
 * Execute the callback then stop the 
 * event loop for 150 milliseconds
 * @param {function} command callback
 */
const executeCommand = async (command) => {
    command
    return new Promise(resolve => setTimeout(resolve, 150));
}

/**
 * Stop the event loop for * amount milliseconds
 */
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
