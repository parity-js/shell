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

import { action, computed, observable } from 'mobx';
import store from 'store';

import DappsStore from './DappsStore';

const LS_DISPLAY_APPS = 'displayApps';
// const LS_DISPLAY_APPS = '_parity::dapps::displayApps';

let instance = null;

export default class DisplayAppsStore {
  @observable displayApps = {};

  constructor(api) {
    this._api = api;

    this.dappsStore = DappsStore.get(api);
    this.loadDisplayApps();

    // Initialize store if needed
    this.initStore();
  }

  static get(api) {
    if (!instance) {
      instance = new DisplayAppsStore(api);
    }

    return instance;
  }

  initStore = () => {
    // FIXME
    // Right now we hardcode so that the wallet and the Browse Dapps dapp are
    // pinned by default when the user launches for the first time.
    // TODO Find a way to make this cleaner. -Amaury 12/12/2017
    const WALLET = 'v1';
    const DAPP_DAPP_VISIBLE =
      '0xa48bd8fd56c90c899135281967a6cf90865c221b46f27f9fbe2a236d74a64ea2';
    const DAPP_DAPP_METHODS =
      '0x889d3403834b4ef359448575dcd6d77334330edaecc66a77051483f3a498ab6e';
    const DAPP_STATUS =
      '0xcd423760c9650eb549b1615f6cf96d420e32aadcea2ff5fe11c26457244adcc1';

    const visible = [WALLET, DAPP_DAPP_VISIBLE, DAPP_DAPP_METHODS, DAPP_STATUS];
    const pinned = [WALLET, DAPP_DAPP_VISIBLE];

    visible.forEach(appId => {
      if (
        !this.displayApps[appId] ||
        this.displayApps[appId].visible === undefined
      ) {
        this.displayApps[appId] = { ...this.displayApps[appId], visible: true };
      }
    });

    pinned.forEach(appId => {
      if (
        !this.displayApps[appId] ||
        this.displayApps[appId].pinned === undefined
      ) {
        this.displayApps[appId] = { ...this.displayApps[appId], pinned: true };
      }
    });

    this.saveDisplayApps();
  };

  @action
  loadDisplayApps = () => {
    const displayApps = store.get(LS_DISPLAY_APPS) || {};

    this.displayApps = displayApps;
  };

  @computed
  get pinned() {
    return this.dappsStore.appsArray.filter(
      app => this.displayApps[app.id] && this.displayApps[app.id].pinned
    );
  }

  @action
  setDisplayApps = displayApps => {
    this.displayApps = { ...this.displayApps, ...displayApps };
    this.saveDisplayApps();
  };

  saveDisplayApps = () => {
    store.set(LS_DISPLAY_APPS, this.displayApps);
  };

  togglePinned = appId => {
    this.setDisplayApps({
      [appId]: this.displayApps[appId]
        ? {
            ...this.displayApps[appId],
            pinned: !this.displayApps[appId].pinned
          }
        : { pinned: true, visible: true } // Make pinned apps visible by default
    });
  };

  toggleVisible = appId => {
    this.setDisplayApps({
      [appId]: this.displayApps[appId]
        ? {
            ...this.displayApps[appId],
            visible: !this.displayApps[appId].visible
          }
        : { visible: true }
    });
  };

  @computed
  get visible() {
    return this.dappsStore.appsArray.filter(
      app => this.displayApps[app.id] && this.displayApps[app.id].visible
    );
  }

  @computed
  get visibleUnpinned() {
    return this.dappsStore.appsArray.filter(
      app =>
        this.displayApps[app.id] &&
        this.displayApps[app.id].visible &&
        !this.displayApps[app.id].pinned
    );
  }
}
