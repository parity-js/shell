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

// eslint-disable-next-line
const dynamicRequire = typeof __non_webpack_require__ === 'undefined' ? require : __non_webpack_require__; // Dynamic require https://github.com/yargs/yargs/issues/781

const omit = require('lodash/omit');

const argv = dynamicRequire('yargs').argv;
const helpMessage = require('./helpMessage');
const { version } = require('../../package.json');

let parityArgv = null; // Args to pass to `parity` command

module.exports = () => {
  if (argv.help || argv.h) {
    console.log(helpMessage);
    return false;
  }

  if (argv.version || argv.v) {
    console.log(`Parity UI version ${version}.`);
    return false;
  }

  // Used cached value if it exists
  if (parityArgv) {
    return [argv, parityArgv];
  }

  // Args to pass to `parity` command
  parityArgv = omit(argv, '_', '$0', 'help', 'version');

  // Sanitize args to be easily used by parity
  Object.keys(parityArgv).forEach(key => {
    // Delete all keys starting with --ui* from parityArgv.
    // They will be handled directly by the UI.
    if (key.startsWith('ui')) {
      delete parityArgv[key];
    }

    // yargs create camelCase keys for each arg, e.g. "--ws-origins all" will
    // create { wsOrigins: 'all' }. For parity, we remove all those that have
    // a capital letter
    if (/[A-Z]/.test(key)) {
      delete parityArgv[key];
    }
  });

  return [argv, parityArgv];
};
