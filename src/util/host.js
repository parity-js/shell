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

import path from 'path';
import isElectron from 'is-electron';

export function createLocation (token, location = window.location) {
  const { hash, port, protocol } = location;
  let query = '';

  if (hash && hash.indexOf('?') !== -1) {
    // TODO: currently no app uses query-params visible in the shell, this may need adjustment if they do
    query = hash;
  } else {
    query = `${hash || '#/'}${token ? '?token=' : ''}${token || ''}`;
  }

  return `${protocol}//127.0.0.1:${port}/${query}`;
}

export function redirectLocalhost (token) {
  // we don't want localhost, rather we want 127.0.0.1
  if (window.location.hostname !== 'localhost') {
    return false;
  }

  window.location.assign(createLocation(token, window.location));

  return true;
}

export function getBuildPath () {
  // Condition necessary for store.spec.js
  const basePath = isElectron()
    ? require('electron').remote.getGlobal('dirName')
    : path.join(__dirname, '..');

  // Replace all backslashes by front-slashes (happens in Windows)
  // Note: `dirName` contains backslashes in Windows. One would assume that
  // path.join in Windows would handle everything for us, but after some time
  // I realized that even in Windows path.join here bahaves like POSIX (maybe
  // it's electron, maybe browser env?). Switching to '/'. -Amaury 12.03.2018
  const posixDirName = basePath.replace(/\\/g, '/');
  const buildPath = path.join(
    posixDirName,
    '..',
    '.build');

  return buildPath;
}

export function getHashFetchPath () {
  // Condition necessary for store.spec.js
  const userData = isElectron()
    ? require('electron').remote.app.getPath('userData')
    : path.join(__dirname, '../../test/tmp');

  return path.join(userData, 'hashfetch');
}

export function getLocalDappsPath () {
  // Condition necessary for store.spec.js
  const userData = isElectron()
    ? require('electron').remote.app.getPath('userData')
    : path.join(__dirname, '../../test/tmp');

  return path.join(userData, 'dapps');
}
