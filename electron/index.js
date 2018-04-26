// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

const electron = require('electron');
const path = require('path');
const url = require('url');

const addMenu = require('./menu');
const cli = require('./cli');
const fetchParity = require('./fetchParity');
const messages = require('./messages');

let parity; // Will hold the parity process (if spawned by node)

const { app, BrowserWindow, ipcMain, session } = electron;
let mainWindow;

// Get arguments from cli
const [argv] = cli();

// Will send these variables to renderers via IPC
global.dirName = __dirname;
global.wsInterface = argv['ws-interface'];
global.wsPort = argv['ws-port'];

function createWindow () {
  // If cli() returns false, then it means that the arguments are stopping the
  // app (e.g. --help or --version). We don't do anything more in this case.
  if (!argv) { return; }

  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200
  });

  // Fetch parity if not yet installed
  fetchParity(mainWindow)
    .then(() => { global.parityInstalled = true; });

  if (argv['ui-dev'] === true) {
    // Opens http://127.0.0.1:3000 in --ui-dev mode
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Opens file:///path/to/.build/index.html in prod mode
    // TODO Check if file exists?
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '..', 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // Listen to messages from renderer process
  ipcMain.on('asynchronous-message', messages);

  // Add application menu
  addMenu(mainWindow);

  // WS calls have Origin `file://` by default, which is not trusted.
  // We override Origin header on all WS connections with an authorized one.
  session.defaultSession.webRequest.onBeforeSendHeaders({
    urls: ['ws://*/*', 'wss://*/*']
  }, (details, callback) => {
    details.requestHeaders.Origin = `parity://${mainWindow.id}.ui.parity`;
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (parity) {
    parity.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
