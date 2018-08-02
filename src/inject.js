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
import qs from 'query-string';

function initProvider () {
  const queryParams = qs.parse(window.location.search);

  // Local dapps: file:///home/username/.config/parity-ui/dapps/mydapp/index.html?appId=LOCAL-dapp-name&token=0x...
  // Local dapps served in development mode on a dedicated port: http://localhost:3001/?appId=LOCAL-dapp-name&token=0x...
  // Built-in dapps: file://path-to-shell/.build/dapps/0x0587.../index.html?appId=dapp-name&token=0x...
  // Built-in dapps when running Electron in dev mode: http://127.0.0.1:3000/dapps/v1/index.html?appId=dapp-name&token=0x...
  // Network dapps: file:///home/username/.config/parity-ui/hashfetch/files/0x8075.../index.html?appId=dapp-name&token=0x...
  const appId = queryParams.shellAppId;
  const token = queryParams.shellToken;

  // The dapp will use the PostMessage provider, send postMessages to
  // preload.js, and preload.js will relay those messages to the shell.
  console.log(`Initializing provider with appId ${appId} and token ${token}`);
  const ethereum = new Api.Provider.PostMessage(appId);

  ethereum
    .setToken(token);

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

  // Disable eval() for dapps
  // https://electronjs.org/docs/tutorial/security#7-override-and-disable-eval
  //
  // TODO Currently Web3 Console dapp needs eval(), so we cannot blindly disable
  // it as per the recommendation. For now we simply allow eval() for all dapps.
  // One idea is to check here in inject.js if allowJsEval is set to true, but
  // this requires more work (future PR).
  //
  // window.eval = global.eval = function () { // eslint-disable-line
  //   throw new Error(`Sorry, this app does not support window.eval().`);
  // };
}
