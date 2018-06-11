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

const { spawn } = require('child_process');

const parityPath = require('../utils/parityPath');

module.exports = event => {
  try {
    // Generate a new token
    const paritySigner = spawn(parityPath(), ['signer', 'new-token']);

    // Listen to the output of the previous command
    paritySigner.stdout.on('data', data => {
      // If the output line is xxxx-xxxx-xxxx-xxxx, then it's our token
      const match = data
        .toString()
        .match(
          /[a-zA-Z0-9]{4}(-)?[a-zA-Z0-9]{4}(-)?[a-zA-Z0-9]{4}(-)?[a-zA-Z0-9]{4}/
        );

      if (match) {
        const token = match[0];

        // Send back the token to the renderer process
        event.sender.send('asynchronous-reply', token);
        paritySigner.kill(); // We don't need the signer anymore
      }
    });
  } catch (err) {
    console.log("Can't run `parity signer new-token` command.");
  }
};
