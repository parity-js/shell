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

const flatten = require('lodash/flatten');
const fs = require('fs');
const { spawn } = require('child_process');
const util = require('util');

const cli = require('../cli');
const handleError = require('./handleError');
const parityPath = require('../utils/parityPath');

const fsExists = util.promisify(fs.stat);
const fsReadFile = util.promisify(fs.readFile);
const fsUnlink = util.promisify(fs.unlink);

let parity = null; // Will hold the running parity instance

module.exports = {
  runParity (mainWindow) {
    const argv = cli()[0];
    const parityArgv = cli()[1];

    // Do not run parity with --no-run-parity
    if (!argv.runParity === false) {
      return;
    }

    // Create a logStream to save logs
    const logFile = `${parityPath()}.log`;

    fsExists(logFile)
      .then(() => fsUnlink(logFile))
      .catch(() => { })
      .then(() => {
        const logStream = fs.createWriteStream(logFile, { flags: 'a' });

        // Run an instance of parity if we receive the `run-parity` message
        parity = spawn(
          parityPath(),
          flatten(
            Object.keys(parityArgv).map(key => [`--${key}`, parityArgv[key]]) // Transform {arg: value} into [--arg, value]
          )
            .filter(value => value !== true) // --arg true is equivalent to --arg
        );

        parity.stdout.pipe(logStream);
        parity.stderr.pipe(logStream);
        parity.on('error', err => {
          handleError(new Error(err), 'An error occured while running parity.');
        });
        parity.on('close', (exitCode, signal) => {
          if (exitCode === 0) {
            return;
          }

          // If the exit code is not 0, then we show some error message
          if (Object.keys(parityArgv).length) {
            // If parity has been launched with some args, then most likely the
            // args are wrong, so we show the output of parity.
            return fsReadFile(logFile).then(data =>
              console.log(data.toString())
            );
          } else {
            handleError(new Error(`Exit code ${exitCode}, with signal ${signal}.`), 'An error occured while running parity.');
          }
        });
      })
      .then(() => {
        // Notify the renderers
        // mainWindow.webContents.send('parity-running', true);
        global.isParityRunning = true; // Send this variable to renderes via IPC
      })
      .catch(err => {
        handleError(err, 'An error occured while running parity.');
      });
  },
  killParity () {
    if (parity) {
      console.log('Stopping parity.');
      parity.kill();
      parity = null;
    }
  }
};
