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

const { app } = require('electron');
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
      parity.on('close', (exitCode) => {
        if (exitCode === 0) { return; }

        // If the exit code is not 0, then we print all the logs we had
        fsReadFile(logFile)
          .then(data => console.log(data.toString()))
          .catch(console.log)
          .then(() => app.quit());
      });
    });
};
