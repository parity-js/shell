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

const { app, webContents } = require('electron');
const { download } = require('electron-dl');
const fs = require('fs');
const util = require('util');

const parityPath = require('../util/parityPath');

const fsExists = util.promisify(fs.stat);
const fsChmod = util.promisify(fs.chmod);

module.exports = (mainWindow) => {
  // Download parity if not exist in userData
  return fsExists(parityPath)
    .catch(() => download(
      mainWindow,
      'http://d1h4xl4cr1h0mo.cloudfront.net/beta/x86_64-apple-darwin/parity',
      {
        directory: app.getPath('userData'),
        onProgress: (progress) => webContents.fromId(mainWindow.id).send('parity-download-progress', progress)
      }
    ))
    .then(() => fsChmod(parityPath, '755'))
    .then(() => parityPath);
};
