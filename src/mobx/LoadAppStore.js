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

import { action, observable, transaction } from 'mobx';
import builtinDapps from '@parity/shared/lib/config/dappsBuiltin.json';
import viewsDapps from '@parity/shared/lib/config/dappsViews.json';
import HistoryStore from '@parity/shared/lib/mobx/historyStore';

let instance = null;
const internalDapps = [].concat(viewsDapps, builtinDapps);
const historyStore = HistoryStore.get('dapps');

const DAPP_HOMEPAGE =
  '0xa48bd8fd56c90c899135281967a6cf90865c221b46f27f9fbe2a236d74a64ea2'; // Browse Dapp. TODO put dapp-homepage as default

export default class LoadAppStore {
  @observable appId = DAPP_HOMEPAGE;
  @observable appParams = null;
  @observable isLoading = false;

  constructor(api) {
    this._api = api;
  }

  static get = api => {
    if (!instance) {
      instance = new LoadAppStore(api);
    }

    return instance;
  };

  @action
  loadApp = (appId, appParams = null) => {
    // Add dapp to HistoryStore
    if (!internalDapps[appId] || !internalDapps[appId].skipHistory) {
      historyStore.add(appId);
    }

    transaction(() => {
      this.appId = appId;
      this.appParams = appParams;
      this.isLoading = true;
    });
  };

  loadHomepage = () => this.loadApp(DAPP_HOMEPAGE);

  @action setIsLoading = isLoading => (this.isLoading = isLoading);
}
