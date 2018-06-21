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
const { ensureDir: fsEnsureDir } = require('fs-extra');

const addMenu = require('./menu');
const { cli } = require('./cli');
const doesParityExist = require('./operations/doesParityExist');
const fetchParity = require('./operations/fetchParity');
const handleError = require('./operations/handleError');
const messages = require('./messages');
const { killParity } = require('./operations/runParity');
const { getLocalDappsPath } = require('./utils/paths');
const { name: appName } = require('../package.json');

const { app, BrowserWindow, ipcMain, session } = electron;

let mainWindow;

function runApp () {
  doesParityExist()
    .catch(() => fetchParity(mainWindow)) // Install parity if not present
    .catch(handleError); // Errors should be handled before, this is really just in case

  return fsEnsureDir(getLocalDappsPath()).then(createWindow);
}

function createWindow () {
  // Will send these variables to renderers via IPC
  global.dirName = __dirname;
  global.wsInterface = cli.wsInterface;
  global.wsPort = cli.wsPort;

  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: { nodeIntegrationInWorker: true }
  });

  if (cli.uiDev === true) {
    // Opens http://127.0.0.1:3000 in --ui-dev mode
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Opens file:///path/to/.build/index.html in prod mode
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '..', '.build', 'index.html'),
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

  // Do not accept all kind of web permissions (camera, location...)
  // https://electronjs.org/docs/tutorial/security#4-handle-session-permission-requests-from-remote-content
  session.defaultSession
    .setPermissionRequestHandler((webContents, permission, callback) => {
      if (!webContents.getURL().startsWith('file:')) {
        // Denies the permissions request for all non-file://. Currently all
        // network dapps are loaded on http://127.0.0.1:8545, so they won't
        // have any permissions.
        return callback(false);
      }

      // All others loaded on file:// (shell, builtin, local) can have those
      // permissions.
      return callback(true);
    });

  // Verify WebView Options Before Creation
  // https://electronjs.org/docs/tutorial/security#12-verify-webview-options-before-creation
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away inline preload scripts, ours is at preloadURL
    delete webPreferences.preload;

    // TODO Verify that the location of webPreferences.preloadURL is:
    // `file://path/to/app.asar/.build/preload.js`

    // Disable Node.js integration
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', runApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    killParity();
    app.quit();
  }
});

// Make sure parity stops when UI stops
app.on('before-quit', killParity);
app.on('will-quit', killParity);
app.on('quit', killParity);

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// userData value is derived from the Electron app name by default. However,
// Electron doesn't know the app name defined in package.json because we
// execute Electron directly on a file. Running Electron on a folder (either
// .build/ or electron/) doesn't solve the issue because the package.json
// is located in the parent directory.
app.setPath('userData', path.join(app.getPath('appData'), appName));
