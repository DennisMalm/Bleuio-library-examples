import * as my_dongle from 'bleuio'
import { async } from 'regenerator-runtime'
import 'regenerator-runtime/runtime'

const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const scanButton = document.querySelector('#scanButton')
const scanTimeLimitField = document.querySelector('#scanTimeLimitField')

let connected = false
let scanning = false
let scanResponse = ''

const handleConnectButton = async () => {
    if (!connected) {

        // Connect to dongle 
        await my_dongle.at_connect()
        await sleep(150)

        connectButton.textContent = 'Disconnect'
        output.textContent = 'Connected to dongle'

        connected = true

        // Enable the scan button which is disabled by default to avoid errors
        scanButton.addEventListener('click', handleScanButton)
        toggleScanButton('Scan BLE devices', true)

    } else {
        // Stop any ongoing process
        my_dongle.stop()

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        output.textContent = 'Dongle disconnected'

        // Disable the scan button to avoid errors
        toggleScanButton('Scan BLE devices', false)
        scanButton.removeEventListener('click', handleScanButton)

        connectButton.textContent = 'Connect'
    }
}

connectButton.addEventListener('click', handleConnectButton)

/**
 * Calls the dongles scan function (at_gapscan())
 */
const handleScanButton = async () => {

    if (!scanning) {
        startScanning()
    } else {
        stopScanning()
    }
}

const startScanning = async () => {
    output.textContent = ''

    // Disable the scanButton until the advertising has completed
    toggleScanButton('Scanning', false)

    // Get information about the dongles status
    let dongleStatus = await my_dongle.at_gapstatus()
    await sleep(150)

    // Stop the dongle from advertising if the dongle is advertising
    if (dongleStatus.includes('Advertising')) {
        await executeCommand(my_dongle.at_advstop())
    }

    // Sets the dongle in central role which is required to be able to use scan function
    dongleStatus.forEach(async (response) => {
        if (response.indexOf('Peripheral') !== -1) {
            await executeCommand(my_dongle.at_central())
        }
    });

    scanning = true

    // Asynchronously call scan function to be able to stop it
    scanAndPrint()

    toggleScanButton('Stop scan', true)
}

// const scanAndPrint = async () => {
//     /**
//      * Start scanning which returns an Array containing devices found
//      * @param {int} seconds amount of time the scanning process is active
//      */
//     scanResponse = await my_dongle.at_gapscan(scanTimeLimitField.value)

//     // Print the result if the scan has not been stopped
//     if(scanning){
//         printResponse(scanResponse)

//         scanning = false

//         toggleScanButton('Scan BLE devices', true)
//     }
// }


/**
 * Starts the scanning process and
 * fetches a feed of responses from the dongle
 * and prints every new element in the feed(Array)
 */
const scanAndPrint = async () => {

    // Starts the scan
    my_dongle.at_gapscan(scanTimeLimitField.value);

    await sleep(100)

    // Initiates a timer that will end the printing process
    // when the time limit has been reached
    // it will stop the scan
    // 100ms added to give the loop time to finish
    sleep((scanTimeLimitField.value * 1000) + 100)
        .then(() => {
            scanning = false

            toggleScanButton('Scan BLE devices', true)
        })

    // Fetches the feed which will be updated from the dongle
    // when the dongle finds a device
    let feed = my_dongle.feed()

    // Local counter counting the amount of responses(elements) that has
    // been printed to the DOM
    let responseCounter = 0

    // Looping through the feed to and prints the response(element)
    // corresponding to the counter
    const printLoop = async () => {

        // If the feed(Array) is larger than the counter
        // it will print the latest response(element)
        if (feed.length > responseCounter) {

            // Printing the response(element)
            printResponse(feed[responseCounter])

            // Increments the counter to which will correspond
            // to the index of the response(element) printed
            responseCounter++
        }

        // Pauses the event loop to avoid overflowing the stack
        await sleep(50);

        // Callback the loop until the scan is complete
        if (scanning) {
            printLoop()
        }
    }

    printLoop()
}
const stopScanAfterTimeLimit = async () => {
    await sleep(scanTimeLimitField.value * 1000 + 100)
    stopScanning()
}
const stopScanning = () => {
    // Stop scanning
    my_dongle.stop()

    scanning = false

    toggleScanButton('Scan BLE devices', true)

    // Print what the scanner had found before it was stopped
    // printResponse(scanResponse) //TODO: ändrad
}

/**
 * Sets the buttons text content and if the button should be enabled or disabled
 * @param {text} text Text content
 * @param {boolean} enabled Enabled or disabled
 */
const toggleScanButton = (text, enabled) => {
    scanButton.textContent = text
    if (enabled) {
        scanButton.classList.remove('disabled')
    } else {
        scanButton.classList.add('disabled')
    }
}

/**
 * Prints a response to the DOM
 * @param {String} response the message to be printed to the DOM
 */
const printResponse = (response) => {
    // Clear output
    // output.textContent = '' //TODO: ändring

    // Some of the dongles functions returns the data in an Array
    if (Array.isArray(response)) {
        response.forEach(data => {

            // Adds the data in the response as a row of information in the DOM
            const outputLine = document.createElement("p")
            outputLine.setAttribute("style", "margin: 2px")
            outputLine.textContent = data

            output.appendChild(outputLine)
        })
    } else {
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
 * Stop the event loop for x amount milliseconds
 */
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}