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

import Api from '@parity/api';
import isElectron from 'is-electron';
import qs from 'query-string';

console.log('This inject.js has been injected by the shell.');

function getAppId () {
  // Dapps built into the shell; URL: file://path-to-shell/.build/dapps/0x0587.../index.html
  // Dapps installed from the registry and served by Parity; URL: http://127.0.0.1:8545/ff19...
  const [hash] = window.location.pathname.match(/(0x)?[a-f0-9]{64}/i) || [];
  if (hash) return hash;

  // Dapps served in development mode on a dedicated port; URL: http://localhost:3001/?appId=dapp-name
  const fromQuery = qs.parse(window.location.search).appId;
  if (fromQuery) return fromQuery;

  // Dapps built locally and served by Parity; URL: http://127.0.0.1:8545/dapp-name
  const [, fromParity] = window.location.pathname.match(/^\/?([^/]+)\/?$/) || [];
  if (fromParity) return fromParity;
  
  console.error('Could not find appId');
}

function initProvider () {
  const appId = getAppId();

  const ethereum = isElectron()
    ? new Api.Provider.Ipc(appId)
    : new Api.Provider.PostMessage(appId);

  console.log(`Requesting API communications token for ${appId}`);

  ethereum
    .requestNewToken()
    .then((tokenId) => {
      console.log(`Received API communications token ${tokenId}`);
    })
    .catch((error) => {
      console.error('Unable to retrieve communications token', error);
    });

  window.ethereum = ethereum;
  window.isParity = true;

  return ethereum;
}

function initWeb3 (ethereum) {
  const currentProvider = new Api.Provider.SendAsync(ethereum);

  window.web3 = { currentProvider };
}

function initParity (ethereum) {
  const api = new Api(ethereum);

  window.parity = Object.assign({}, window.parity || {}, {
    Api,
    api
  });
}

if (typeof window !== 'undefined' && !window.isParity) {
  const ethereum = initProvider();

  initWeb3(ethereum);
  initParity(ethereum);

  console.warn('Deprecation: Dapps should only used the exposed EthereumProvider on `window.ethereum`, the use of `window.parity` and `window.web3` will be removed in future versions of this injector');
}
