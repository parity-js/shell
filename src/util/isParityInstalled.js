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

const commandExists = require('command-exists');
const fs = require('fs');
const util = require('util');

const promiseAny = require('./promiseAny');

const fsExists = util.promisify(fs.stat);

// Locations to test if parity binary exists
// TODO This could be improved
const locations = {
  linux: ['/bin/parity', '/usr/bin/parity', '/usr/local/bin/parity'],
  darwin: ['/Applications/Parity Ethereum.app/Contents/MacOS/parity'],
  win32: ['C:\\Program Files\\Parity Technologies\\Parity\\parity.exe']
};

/**
 * This function checks if parity has been installed on the local machine:
 * - first check if the program is in $PATH, using `command-exists`
 * - then check the OS default installation dir if a parity folder exists
 * This function should run in node env.
 * Returns a string which is the command to run parity.
 */
const isParityInstalled = () => {
  return commandExists('parity') // First test is `parity` command exists
    .then(() => 'parity') // If yes, return `parity` as command
    .catch(() => promiseAny(locations[process.platform].map(
      location => fsExists(location).then(() => location) // Then test if OS-specific locations contain parity
    )));
};

module.exports = isParityInstalled;
