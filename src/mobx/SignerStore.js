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
import { action, observable } from 'mobx';
import stores from '@parity/mobx';

let instance = null;

export default class SignerStore {
  @observable signers = [];

  constructor(api) {
    this._api = api;
    this.allAccountsInfoStore = stores.parity.allAccountsInfo().get(api);
  }

  static get(api) {
    if (!instance) {
      instance = new SignerStore(api);
    }
    return instance;
  }

  @action
  addSigner = (component, isHandler, isFallback) => {
    if (!component || typeof isHandler !== 'function') {
      throw new Error(
        `Unable to attach Signer plugin, 'React Component' or 'isHandler' function is not defined`
      );
    }

    this.signers.push({
      component,
      isHandler,
      isFallback
    });
  };

  /**
   * Get account from request
   */
  getAccount = ({ payload }) => {
    const allAccountsInfo = this.allAccountsInfoStore.allAccountsInfo;

    if (payload.decrypt) {
      return allAccountsInfo[payload.condecrypt.address];
    } else if (payload.sign) {
      return allAccountsInfo[payload.sign.address];
    } else if (payload.sendTransaction) {
      return allAccountsInfo[payload.sendTransaction.from];
    } else if (payload.signTransaction) {
      return allAccountsInfo[payload.signTransaction.from];
    }

    return null;
  };

  /**
   * Find the appropriate signer for a request
   */
  getSignerComponent = request => {
    const account = this.getAccount(request);
    const signer = this.signers.find(s =>
      s.isHandler(request.payload, account)
    );

    // TODO Add ConfirmViaKey as fallback signer
    return signer ? signer.component : null;
  };
}
