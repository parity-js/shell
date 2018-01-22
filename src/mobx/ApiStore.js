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

import { action, extendObservable, transaction } from 'mobx';

let instance = null;

export default class ApiStore {
  constructor(api) {
    this._api = api;

    // TODO Use @decorators
    extendObservable(this, {
      isConnected: false,
      isConnecting: false,
      needsToken: false,
      secureToken: false
    });

    // Poll every 1s the api to get the status
    setInterval(() => this.updateConnection(), 1000);
  }

  static get = api => {
    if (!instance) {
      instance = new ApiStore(api);
    }

    return instance;
  };

  updateConnection = action(() => {
    transaction(() => {
      this.isConnected = this._api.isConnected;
      this.isConnecting = this._api.isConnecting;
      this.needsToken = this._api.needsToken;
      this.secureToken = this._api.secureToken;
    });
  });
}
