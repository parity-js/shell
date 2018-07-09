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

const path = require('path');

import { readJson as fsReadJson, writeJson as fsWriteJson } from 'fs-extra';

import { getHashFetchPath } from '../host';

// Handle retries with exponential delay for failed download attempts
export default class ExpoRetry {
  static instance = null;

  // We store the URL to allow GH Hint URL updates for a given hash
  // to take effect immediately, and to disregard past failed attempts at
  // getting this file from other URLs.
  // {
  //   [`${hash}:${url}`]: {
  //     attempts: [
  //       {timestamp: 1529598899017},
  //       ...
  //     ]
  //   },
  //   ...
  // }
  failHistory = {};

  // If true, the failHistory var was updated and needs to be written to disk
  needWrite = false;
  writeQueue = Promise.resolve();

  static get () {
    if (!ExpoRetry.instance) {
      ExpoRetry.instance = new ExpoRetry();
    }

    return ExpoRetry.instance;
  }

  _getFilePath () {
    return path.join(getHashFetchPath(), 'fail_history.json');
  }

  _getKey (hash, url) {
    return `${hash}:${url}`;
  }

  load () {
    const filePath = this._getFilePath();

    return fsReadJson(filePath)
      .then(failHistory => {
        this.failHistory = failHistory;
      })
      .catch(() => fsWriteJson(filePath, this.failHistory));
  }

  canAttemptDownload (hash, url) {
    const key = this._getKey(hash, url);

    // Never tried downloading the file
    if (!(key in this.failHistory) || !this.failHistory[key].attempts.length) {
      return true;
    }

    // Already failed at downloading the file: check if we can retry now
    // Delay starts at 30 seconds, max delay is 23 days
    const retriesCount = this.failHistory[key].attempts.length - 1;
    const latestAttemptTimestamp = this.failHistory[key].attempts.slice(-1)[0].timestamp;
    const earliestNextAttemptTimestamp = latestAttemptTimestamp + Math.pow(2, Math.min(16, retriesCount)) * 30000;

    if (Date.now() > earliestNextAttemptTimestamp) {
      return true;
    }

    return false;
  }

  registerFailedAttempt (hash, url) {
    const key = this._getKey(hash, url);

    this.failHistory[key] = this.failHistory[key] || { attempts: [] };
    this.failHistory[key].attempts.push({ timestamp: Date.now() });

    // Once the ongoing write is finished, write anew with the updated contents
    this.needWrite = true;
    this.writeQueue = this.writeQueue.then(() => {
      if (this.needWrite) {
        // Skip subsequent promises, considering we are writing the latest value
        this.needWrite = false;

        return fsWriteJson(this._getFilePath(), this.failHistory);
      }
    }).catch(() => {
      console.error(`Couldn't write to ${this._getFilePath()}`);
    });
  }
}
