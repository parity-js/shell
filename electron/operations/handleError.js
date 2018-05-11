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

const { app, dialog } = require('electron');

const {
  parity: { channel }
} = require('../../package.json');
const parityPath = require('../utils/parityPath');

module.exports = (err, message = 'An error occurred.') => {
  console.error(err);
  dialog.showMessageBox(
    {
      buttons: ['Quit', 'Cancel'],
      detail: `Please attach the following debugging info:
OS: ${process.platform}
Arch: ${process.arch}
Channel: ${channel}
Error: ${err.message}
Please also attach the contents of the following file:
${parityPath()}.log

Please quit the app and retry again. If the error message persists, please file an issue at https://github.com/parity-js/shell/issues.`,
      message: `${message}`,
      title: 'Parity Error',
      type: 'error'
    },
    (buttonIndex) => { if (buttonIndex === 0) { app.exit(1); } }
  );
};
