import * as my_dongle from 'bleuio'
import { async } from 'regenerator-runtime'
import 'regenerator-runtime/runtime'

const output = document.querySelector("#output")
const connectButton = document.querySelector('#connectButton')
const scanButton = document.querySelector('#scanButton')
const numberOfResponsesField = document.querySelector('#numberOfResponsesField')
const targetAddressField = document.querySelector('#targetAddressField')

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

        // Enable the eddystone button which is disabled by default to avoid errors
        scanButton.addEventListener('click', handleScanButton)
        toggleScanButton('Scan BLE devices', true)

    } else {
        // Stop any ongoing process
        my_dongle.stop()

        // Give the dongle some time to finish the process
        await sleep(150)

        // Disconnects the dongle
        await executeCommand(my_dongle.at_disconnect())

        connected = false

        output.textContent = 'Dongle disconnected'

        // Disable the eddystone button to avoid errors
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
    // If the dongle is not advertising, start advertising an Eddystone url
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

    toggleScanButton('Stop scan', true)

    /**
     * Start scanning for a target and awaits a specified number responses
     * @param {int} responses number of responses until complete
     */
    scanResponse = await my_dongle.at_scantarget(targetAddressField.value, numberOfResponsesField.value)
    let responseCounter = 0
    const printLoop = setInterval(() => {
        console.log(responseCounter)
        console.log(numberOfResponsesField.value + 2)
        // +2 för första info rader
        if ((responseCounter < (numberOfResponsesField.value + 2)) &&
            (scanResponse.length > responseCounter)) {
            printResponse(scanResponse)
            responseCounter++
        } else if (responseCounter === numberOfResponsesField) {
            clearInterval(printLoop)
        }
    }, 200)

    scanning = false
}

const stopScanning = () => {
    console.log(scanResponse)
    // Stop scanning
    my_dongle.stop()

    scanning = false

    toggleScanButton('Scan BLE devices', true)

    // Print what the scanner had found before it was stopped
    scanResponse.then((response) => printResponse(response))
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
    output.textContent = ''

    // Some of the dongles functions returns the data in an Array
    if (Array.isArray(response)) {
        response.forEach(data => {
            // Adds the data in the response as a row of information in the DOM
            const outputLine = document.createElement("p")
            outputLine.setAttribute("style", "margin: 2px")
            outputLine.textContent = data

            output.appendChild(outputLine)
        })
    }
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





















let port,
    reader,
    inputDone,
    outputDone,
    inputStream,
    outputStream,
    arr = [];
async function connect() {
    (port = await navigator.serial.requestPort()), await port.open({ baudRate: 9600 });
    const t = new TextEncoderStream();
    (outputDone = t.readable.pipeTo(port.writable)), (outputStream = t.writable);
    let e = new TextDecoderStream();
    (inputDone = port.readable.pipeTo(e.writable)), (inputStream = e.readable.pipeThrough(new TransformStream(new LineBreakTransformer()))), (reader = inputStream.getReader());
}
async function disconnect() {
    return (
        reader && (await reader.cancel(), await inputDone.catch(() => { }), (reader = null), (inputDone = null)),
        outputStream && (await outputStream.getWriter().close(), await outputDone, (outputStream = null), (outputDone = null)),
        await port.close(),
        (port = null),
        "Dongle Disconnected!"
    );
}
function writeCmd(t) {
    const e = outputStream.getWriter();
    e.write(t), "" !== t && e.write("\r"), e.releaseLock();
}
(exports.at_connect = async function () {
    return await connect(), "device connected";
}),
    (exports.at_disconnect = async function () {
        return await disconnect(), "device disconnected";
    }),
    (exports.ati = () => (port ? (writeCmd("ATI"), readLoop("ati")) : "Device not connected.")),
    (exports.at_central = function () {
        return writeCmd("AT+CENTRAL"), readLoop("at_central");
    }),
    (exports.at_peripheral = function () {
        return writeCmd("AT+PERIPHERAL"), readLoop("at_peripheral");
    }),
    (exports.atr = function () {
        return writeCmd("ATR"), readLoop("atr");
    }),
    (exports.at_advstart = function () {
        return writeCmd("AT+ADVSTART"), readLoop("at_advstart");
    }),
    (exports.at_advstop = function () {
        return writeCmd("AT+ADVSTOP"), readLoop("at_advstop");
    }),
    (exports.at_advdata = (t) => (writeCmd(t ? "AT+ADVDATA=" + t : "AT+ADVDATA"), readLoop("at_advdata"))),
    (exports.at_advdatai = function (t) {
        return writeCmd("AT+ADVDATAI=" + t), readLoop("at_advdatai");
    }),
    (exports.at_advresp = function (t) {
        return writeCmd(t ? "AT+ADVRESP=" + t : "AT+ADVRESP"), readLoop("at_advresp");
    }),
    (exports.at_gapscan = function (t = 1) {
        return writeCmd("AT+GAPSCAN=" + t), readLoop("at_gapscan");
    }),
    (exports.at_gapconnect = function (t) {
        return writeCmd("AT+GAPCONNECT=" + t), readLoop("at_gapconnect");
    }),
    (exports.at_gapdisconnect = function () {
        return writeCmd("AT+GAPDISCONNECT"), readLoop("at_gapdisconnect");
    }),
    (exports.at_scantarget = function (t, e = 1) {
        return writeCmd("AT+SCANTARGET=" + t), readLoop("at_scantarget", e);
    }),
    (exports.at_spssend = function (t) {
        return writeCmd("AT+SPSSEND=" + t), readLoop("at_spssend");
    }),
    (exports.at_gapstatus = function () {
        return writeCmd("AT+GAPSTATUS"), readLoop("at_gapstatus");
    }),
    (exports.help = function () {
        return writeCmd("--H"), readLoop("help");
    }),
    (exports.stop = function () {
        return writeCmd(""), "Process Stopped";
    });
class LineBreakTransformer {
    constructor() {
        this.container = "";
    }
    transform(t, e) {
        this.container += t;
        const r = this.container.split("\r\n");
        (this.container = r.pop()), r.forEach((t) => e.enqueue(t));
    }
    flush(t) {
        t.enqueue(this.container);
    }
}
async function readLoop(t, e) {
    for (arr = []; ;) {
        const { done: r, value: a } = await reader.read();
        switch ((a && arr.push(a), t)) {
            case "ati":
                if (arr.includes("Not Advertising") || arr.includes("Advertising")) return arr;
                break;
            case "at_central":
                return "Central Mode";
            case "at_peripheral":
                return "Peripheral Mode";
            case "at_advstart":
                return "Advertising";
            case "at_advstop":
                return "Advertising Stopped";
            case "at_advdata":
            case "at_advdatai":
            case "at_advresp":
                if (2 == arr.length) return arr;
                break;
            case "atr":
                return "Trigger platform reset";
            case "at_gapscan":
                if (arr.includes("SCAN COMPLETE")) return arr;
                break;
            case "at_scantarget":
                if (arr.length == e) {
                    const t = outputStream.getWriter();
                    return t.write(""), t.releaseLock(), arr;
                }
                break;
            case "at_gapstatus":
                if (arr.includes("Not Advertising") || arr.includes("Advertising")) return arr;
                break;
            case "at_gapconnect":
                if (arr.includes("CONNECTED.") || arr.includes("DISCONNECTED.") || arr.includes("ERROR")) return arr;
                break;
            case "at_gapdisconnect":
                return "Disconnected.";
            case "at_spssend":
                return "Sent";
            case "help":
                if (arr.includes("[A] = Usable in All Roles")) return arr;
                break;
            default:
                return "Nothing!";
        }
    }
}
