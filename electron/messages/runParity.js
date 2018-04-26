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
const flatten = require('lodash/flatten');
const fs = require('fs');
const { spawn } = require('child_process');
const util = require('util');

const cli = require('../cli');
const parityPath = require('../util/parityPath');

const [, parityArgv] = cli();
const fsExists = util.promisify(fs.stat);
const fsReadFile = util.promisify(fs.readFile);
const fsUnlink = util.promisify(fs.unlink);

const handleError = (err) => {
  console.error(err);
  dialog.showMessageBox({
    buttons: ['OK'],
    detail: `Please attach the following debugging info:
OS: ${process.platform}
Arch: ${process.arch}
Error: ${err.message}

Please also attach the contents of the following file:
${parityPath}.log`,
    message: 'An error occured while running parity. Please file an issue at https://github.com/parity-js/shell/issues.',
    title: 'Parity Error',
    type: 'error'
  }, () => app.exit(1));
};

module.exports = () => {
  // Create a logStream to save logs
  const logFile = `${parityPath}.log`;

  fsExists(logFile)
    .then(() => fsUnlink(logFile))
    .catch(() => { })
    .then(() => {
      var logStream = fs.createWriteStream(logFile, { flags: 'a' });

      // Run an instance of parity if we receive the `run-parity` message
      const parity = spawn(
        parityPath,
        ['--ws-origins', 'parity://*.ui.parity'] // Argument for retro-compatibility with <1.10 versions
          .concat(
            flatten(Object.keys(parityArgv).map(key => [`--${key}`, parityArgv[key]])) // Transform {arg: value} into [--arg, value]
              .filter(value => value !== true) // --arg true is equivalent to --arg
          )
      );

      parity.stdout.pipe(logStream);
      parity.stderr.pipe(logStream);
      parity.on('error', handleError);
      parity.on('close', (exitCode) => {
        if (exitCode === 0) { return; }

        // If the exit code is not 0, then we show some error message
        if (Object.keys(parityArgv).length) {
          // If parity has been launched with some args, then most likely the
          // args are wrong, so we show the output of parity.
          fsReadFile(logFile)
            .then(data => console.log(data.toString()))
            .catch(console.log)
            .then(() => app.quit());
        } else {
          handleError(new Error(`Exit code: ${exitCode}.`));
        }
      });
    });
};
