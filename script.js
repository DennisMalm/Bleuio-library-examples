import * as my_dongle from 'bleuio';
import { async } from 'regenerator-runtime';
import 'regenerator-runtime/runtime';

let isBeaconAdv = false;
let isEddystonesAdv = false;
let isScanning = false;
let connected = false;

const ibeaconString = '5f2dd896-b886-4549-ae01-e41acd7a354a0203010400';
const log = document.getElementById('log');
const butIbeacon = document.getElementById('butIbeacon');
const butEddystone = document.getElementById('butEddystone');
const butScan = document.getElementById('butScan');
const butConnect = document.getElementById('butConnect');

document.addEventListener('DOMContentLoaded', () => {
  butIbeacon.addEventListener('click', clickIbeacon);
  butEddystone.addEventListener('click', clickEddystone);
  butScan.addEventListener('click', clickScan);
  butConnect.addEventListener('click', clickConnect);
});

const clickConnect = () => {
  log.textContent = '';
  if (connected) {
    if (isScanning) my_dongle.at_advstop();
    connected = false;
    Disconnect();
  } else {
    connected = true;
    Connect();
  }
};
const Connect = () => {
  my_dongle.at_connect().then((res) => {
    updateLog(res);
  });
  toggleUIConnected(true);
};

const Disconnect = () => {
  my_dongle.at_disconnect().then((res) => {
    updateLog(res);
  });
  toggleUIConnected(false);
};

const clickIbeacon = () => {
  console.log('iBeacon activated.');
  if (isBeaconAdv) {
    my_dongle.at_advstop().then((res) => {
      updateLog(res);
    });
    butEddystone;
    butIbeacon.textContent = 'Make iBeacon';
    butEddystone.removeAttribute('disabled');
    butScan.removeAttribute('disabled');
    log.classList.toggle('d-none', false);
    butEddystone.classList.toggle('disabled', false);
    butScan.classList.toggle('disabled', false);
    isBeaconAdv = false;
    return;
  }
  my_dongle.at_advdatai(ibeaconString).then((res) => {
    updateLog(res);
  });
  setTimeout(() => {
    my_dongle.at_advstart('0;200;3000;0').then((res) => {
      updateLog(res);
    });
  }, 500);
  butIbeacon.textContent = 'Stop Beacon';
  butEddystone.setAttribute('disabled', 'true');
  butScan.setAttribute('disabled', 'true');
  log.classList.toggle('d-none', false);
  butEddystone.classList.toggle('disabled', true);
  butScan.classList.toggle('disabled', true);
  isBeaconAdv = true;
};

const updateLog = (res) => {
  let li = document.createElement('li');
  log.prepend(li);
  li.textContent = res;
};

const clickEddystone = () => {
  console.log('Eddystone beacon activated.');
  if (isEddystonesAdv) {
    my_dongle.at_advstop().then((res) => {
      updateLog(res);
    });
    butEddystone.textContent = 'Make Eddystone beacon';
    butIbeacon.removeAttribute('disabled');
    butScan.removeAttribute('disabled');

    isEddystonesAdv = false;
    return;
  }
  my_dongle.at_advdata('04:09:43:41:54').then((res) => {
    updateLog(res);
  });
  setTimeout(() => {
    my_dongle.at_advstart('0;200;3000;0').then((res) => {
      updateLog(res);
    });
  }, 500);

  butIbeacon.setAttribute('disabled', 'true');
  butScan.setAttribute('disabled', 'true');
  log.classList.toggle('d-none', false);
  butEddystone.textContent = 'Stop Beacon';
  isEddystonesAdv = true;
};

const clickScan = () => {
  console.log('Scanning.');
  if (isScanning) {
    my_dongle.stop();
    updateLog('Stopped scanning.');
    setTimeout(() => {
      my_dongle.at_peripheral();
    }, 500);
    isScanning = false;
    butScan.textContent = 'Scan BLE Devices';
    butIbeacon.removeAttribute('disabled');
    butEddystone.removeAttribute('disabled');
    return;
  }
  my_dongle.at_central().then((res) => {
    updateLog(res);
  });
  setTimeout(() => {
    my_dongle.at_gapscan().then((res) => {
      updateLog(res);
    });
  }, 500);
  butScan.textContent = 'Stop Scanning...';
  butIbeacon.setAttribute('disabled', 'true');
  butEddystone.setAttribute('disabled', 'true');
  log.classList.toggle('d-none', false);
  isScanning = true;
};

const toggleUIConnected = (connected) => {
  let lbl = 'Connect';
  if (connected) {
    lbl = 'Disconnect';
    butIbeacon.removeAttribute('disabled');
    butEddystone.removeAttribute('disabled');
    butScan.removeAttribute('disabled');
  }
  butIbeacon.classList.toggle('disabled', !connected);
  butEddystone.classList.toggle('disabled', !connected);
  butScan.classList.toggle('disabled', !connected);

  butConnect.textContent = lbl;
};
