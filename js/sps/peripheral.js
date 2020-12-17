import * as my_dongle from 'bleuio'
import { async } from 'regenerator-runtime'
import 'regenerator-runtime/runtime'

const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const messageButton = document.querySelector('#messageButton')
const advertisingButton = document.querySelector('#advertisingButton')
const messageField = document.querySelector('#messageField')

let connected = false
let advertising = false
let connectedToCentral = false
let dongleStatus

const handleConnectButton = async () => {
    if (!connected) {

        // Connect to dongle 
        await my_dongle.at_connect()
        await sleep(150)

        connectButton.textContent = 'Disconnect'

        connected = true

        printResponse('Connected')

        // Enable the connect button which is disabled by default to avoid errors
        messageButton.addEventListener('click', handleSendMessage)
        advertisingButton.addEventListener('click', handleAdvertising)

        //TODO någon comment?
        toggleButton(advertisingButton, 'Start advertising', true)

    } else {

        // Disconnect from target device //TODO funkar inte
        await executeCommand(my_dongle.at_gapdisconnect())

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        printResponse('Dongle disconnected', false)

        // Disable buttons to avoid errors
        toggleButton(advertisingButton, 'Start advertising', false)
        toggleButton(messageButton, 'Send', false)

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

const handleAdvertising = () => {
    if (!advertising) {
        startAdvertising()
        connectionListener()
        messageListener()
    } else {
        stopAdvertising()
    }
}



/**
 * Listens for messages from the central
 */
const messageListener = async () => {
    const messageListener = setInterval(async () => {
        await sleep(500)

        dongleStatus.forEach(async (response, index) => {
            if (response.indexOf('[Received]:') !== -1) {
                console.log("dongleStatus", dongleStatus)
                printResponse(response, true)
            }
        });

        if (!connected) {
            clearInterval(connectionListener)
        }
    }, 500);
}

/**
 * Listens for information about the connection to the central
 */
const connectionListener = async () => {
    const connectionListener = setInterval(async () => {
        dongleStatus = await my_dongle.at_gapstatus()
        await sleep(500) //TODO testa utan

        if (dongleStatus.includes('Connected') && !connectedToCentral) {
            console.log("dongleStatus", dongleStatus)
            printResponse('Connected to central')
            connectedToCentral = true
        } else if (dongleStatus.includes('Not Connected') && connectedToCentral) {
            console.log("dongleStatus", dongleStatus)
            printResponse('Disconnected from central')
            connectedToCentral = false
        }
        if (!connected) {
            clearInterval(connectionListener)
        }
    }, 500);
}


const startAdvertising = async () => {
    // Disable the scanButton until the advertising has completed
    toggleButton(advertisingButton, 'Starting', false)

    // Get information about the dongles status
    let status = await my_dongle.at_gapstatus()
    await sleep(150)

    console.log('1')
    console.log('2')

    // If the dongle is in peripheral role, set it to central role
    status.forEach(async (response) => {
        if (response.indexOf('Central') !== -1) {
            await executeCommand(my_dongle.at_peripheral())
        }
    });
    console.log('3')

    await executeCommand(my_dongle.at_advstart())

    printResponse('Advertising..')

    console.log(await my_dongle.ati());

    advertising = true

    toggleButton(advertisingButton, 'Stop advertising', true)
    toggleButton(messageButton, 'Send', true)
}

const stopAdvertising = async () => {
    await executeCommand(my_dongle.at_advstop())

    printResponse('Stopped advertising')

    console.log(await my_dongle.ati());

    advertising = false
    toggleButton(advertisingButton, 'Start advertising', true)
}


/**
 * Prints a response to the DOM
 * @param {String} response the message to be printed to the DOM
 * @param {boolean} append if 'true' the message will be added otherwise the output will be cleared before printed. False by default
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


const toggleButton = (button, text, enabled) => {
    button.textContent = text
    if (enabled) {
        button.classList.remove('disabled')
    } else {
        button.classList.add('disabled')
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
