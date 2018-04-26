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

const { app, dialog, webContents } = require('electron');
const axios = require('axios');
const { download } = require('electron-dl');
const fs = require('fs');
const util = require('util');

const { parity: { channel } } = require('../../package.json');
const parityPath = require('../util/parityPath');

const fsExists = util.promisify(fs.stat);
const fsChmod = util.promisify(fs.chmod);

const getArch = () => {
  switch (process.platform) {
    case 'darwin':
    case 'win32':
      return 'x86_64';
    default: {
      switch (process.arch) {
        case 'arm':
          return 'arm';
        case 'arm64':
          return 'aarch64';
        case 'x32':
          return 'i686';
        default:
          return 'x86_64';
      }
    }
  }
};

const getOs = () => {
  switch (process.platform) {
    case 'darwin':
      return 'darwin';
    case 'win32':
      return 'windows';
    default:
      return 'linux';
  }
};

module.exports = (mainWindow) => {
  // Download parity if not exist in userData
  // Fetching from https://vanity-service.parity.io/parity-binaries
  return fsExists(parityPath)
    .catch(() => axios.get(`https://vanity-service.parity.io/parity-binaries?version=${channel}&os=${getOs()}&architecture=${getArch()}`)
      .then((response) => response.data[0].files.find(({ name }) => name === 'parity'))
      .then(({ downloadUrl }) => download(
        mainWindow,
        downloadUrl,
        {
          directory: app.getPath('userData'),
          onProgress: (progress) => webContents.fromId(mainWindow.id).send('parity-download-progress', progress)
        }
      ))
    )
    .then(() => fsChmod(parityPath, '755'))
    .then(() => parityPath)
    .catch((err) => {
      console.error(err);
      dialog.showMessageBox({
        buttons: ['OK'],
        detail: `Please attach the following debugging info:
OS: ${process.platform}
Arch: ${process.arch}
Channel: ${channel}
Error: ${err.message}`,
        message: 'An error occured while downloading parity. Please file an issue at https://github.com/parity-js/shell/issues.',
        title: 'Parity Error',
        type: 'error'
      }, () => app.exit(1));
    });
};
