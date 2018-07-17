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
const { cli } = require('./cli');
const doesParityExist = require('./operations/doesParityExist');
const fetchParity = require('./operations/fetchParity');
const handleError = require('./operations/handleError');
const messages = require('./messages');
const { killParity } = require('./operations/runParity');
const { getLocalDappsPath } = require('./utils/paths');
const { name: appName } = require('../package.json');

const { app, BrowserWindow, ipcMain, session } = electron;
const { URL } = url;

let mainWindow;

// Disable gpu acceleration on linux
// https://github.com/parity-js/shell/issues/157
if (!['darwin', 'win32'].includes(process.platform)) {
  app.disableHardwareAcceleration();
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

  doesParityExist()
    .catch(() => fetchParity(mainWindow)) // Install parity if not present
    .catch(handleError); // Errors should be handled before, this is really just in case

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

  // Listen to the creation of (dapp) webviews to attach event listeners to them
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    // Do not accept all kinds of web permissions (camera, location...)
    // https://electronjs.org/docs/tutorial/security#4-handle-session-permission-requests-from-remote-content
    webContents.session
      .setPermissionRequestHandler((webContents, permission, callback) => {
        // Deny all permissions for dapps
        return callback(false);
      });

    let baseUrl;
    let appId;

    // Derive the dapp baseUrl (.../my-dapp/) from the first URL of the webview
    // (.../my-dapp/index.html). The baseUrl defines what files the webview is
    // allowed to navigate to within the same frame.
    // For example, my-dapp/index.html can navigate to my-dapp/some/dir/hi.html
    // and then back to my-dapp/index.html
    webContents.once('did-navigate', (e, initialUrl) => {
      const initialURL = new URL(initialUrl);

      appId = initialURL.searchParams.get('appId');

      initialURL.hash = '';
      initialURL.search = '';
      baseUrl = initialURL.href.substr(0, initialURL.href.lastIndexOf('/') + 1);
    });

    // The event handler for will-navigate needs to be set in the main process
    // in order to be able to prevent the navigation: https://git.io/f4SNW
    webContents.on('will-navigate', (e, targetUrl) => {
      e.preventDefault();

      if (targetUrl.startsWith(baseUrl)) {
        // The target resource is located inside the dapp folder: allow in-frame
        // navigation but enforce appId query parameter for inject.js

        const newURL = new URL(targetUrl);

        newURL.searchParams.set('appId', appId);

        webContents.loadURL(newURL.href);
      } else {
        // Open all links to resources outside the dapp root in the browser
        // (or with the default desktop app for protocols other than http)

        electron.shell.openExternal(targetUrl);
      }
    });

    // Block in-page requests to resources outside the dapp folder
    webContents.session.webRequest.onBeforeRequest({ urls: ['file://*'] }, (details, callback) => {
      if (baseUrl &&
          !details.url.startsWith(baseUrl) &&
          // dapp-dapp-visible needs to be able to display the icons of other
          // dapps, so as a temporary fix we allow access to all images requests
          details.resourceType !== 'image') {
        const sanitizedUrl = details.url.replace(/'/, '');

        if (!webContents.isDestroyed()) {
          webContents.executeJavaScript(`console.warn('Parity UI blocked a request to access ${sanitizedUrl}')`);
        }

        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

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
