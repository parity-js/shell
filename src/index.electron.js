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

const argv = require('yargs').argv;
const electron = require('electron');

const { app, BrowserWindow } = electron;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200
  });

  if (argv.dev === true) {
    // Load 127.0.0.1:3000 in --dev mode
    mainWindow.loadURL('http://127.0.0.1:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://${argv['ui-interface'] || '127.0.0.1'}:${argv['ui-port'] || '8180'}`);
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
