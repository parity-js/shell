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
import Contracts from '@parity/shared/lib/contracts';
import {
  fetchBuiltinApps,
  fetchLocalApps,
  fetchRegistryAppIds,
  fetchRegistryApp,
  subscribeToChanges
} from '@parity/shared/lib/util/dapps';

const BUILTIN_APPS_KEY = 'BUILTIN_APPS_KEY';

let instance = null;

export default class DappsStore {
  _subscriptions = {};
  _cachedApps = {};
  _manifests = {};
  _registryAppsIds = null;

  constructor(api) {
    this._api = api;

    // TODO use @decorators
    extendObservable(this, {
      apps: {},
      get appsArray() {
        return Object.values(this.apps);
      }
    });

    this.subscribeToChanges();
    this.loadAllApps();
  }

  static get(api) {
    if (!instance) {
      instance = new DappsStore(api);
    }

    return instance;
  }

  loadLocalApps() {
    return Promise.all([
      this.fetchBuiltinApps().then(this.addApps),
      this.fetchLocalApps().then(this.addApps)
    ]);
  }

  loadAllApps() {
    const { dappReg } = Contracts.get(this._api);

    return Promise.all([this.loadLocalApps(), this.fetchRegistryApps(dappReg)]);
  }

  subscribeToChanges() {
    const { dappReg } = Contracts.get(this._api);

    // Unsubscribe from previous subscriptions, if any
    if (this._subscriptions.block) {
      this._api.unsubscribe(this._subscriptions.block);
    }

    if (this._subscriptions.filter) {
      this._api.eth.uninstallFilter(this._subscriptions.filter);
    }

    // Subscribe to dapps reg changes
    subscribeToChanges(this._api, dappReg, appIds => {
      const updates = appIds.map(appId => {
        return this.fetchRegistryApp(dappReg, appId, true);
      });

      Promise.all(updates).then(apps => {
        this.addApps(apps);
      });
    }).then(subscriptions => {
      this._subscriptions = subscriptions;
    });
  }

  fetchBuiltinApps(force = false) {
    if (!force && this._cachedApps[BUILTIN_APPS_KEY] !== undefined) {
      return Promise.resolve(this._cachedApps[BUILTIN_APPS_KEY]);
    }

    this._cachedApps[BUILTIN_APPS_KEY] = fetchBuiltinApps(this._api).then(
      apps => {
        this._cachedApps[BUILTIN_APPS_KEY] = apps;
        return apps;
      }
    );

    return Promise.resolve(this._cachedApps[BUILTIN_APPS_KEY]);
  }

  fetchLocalApps() {
    return fetchLocalApps(this._api);
  }

  fetchRegistryAppIds(force = false) {
    if (!force && this._registryAppsIds) {
      return Promise.resolve(this._registryAppsIds);
    }

    this._registryAppsIds = fetchRegistryAppIds(this._api).then(appIds => {
      this._registryAppsIds = appIds;
      return this._registryAppsIds;
    });

    return Promise.resolve(this._registryAppsIds);
  }

  fetchRegistryApp(dappReg, appId, force = false) {
    if (!force && this._cachedApps[appId] !== undefined) {
      return Promise.resolve(this._cachedApps[appId]);
    }

    this._cachedApps[appId] = fetchRegistryApp(this._api, dappReg, appId).then(
      dapp => {
        this._cachedApps[appId] = dapp;
        return dapp;
      }
    );

    return Promise.resolve(this._cachedApps[appId]);
  }

  fetchRegistryApps(dappReg) {
    return this.fetchRegistryAppIds().then(appIds => {
      const promises = appIds.map(appId => {
        // Fetch the Dapp and display it ASAP
        return this.fetchRegistryApp(dappReg, appId).then(app => {
          if (app) {
            this.addApp(app);
          }

          return app;
        });
      });

      return Promise.all(promises);
    });
  }

  refreshDapps = action(() => {
    const self = this;

    self._api.parity
      .dappsRefresh()
      .then(res => {
        if (res === true) {
          self.loadAllApps();
        }
      })
      .catch(err => {
        console.log(err);
      });
  });

  addApp = action(app => {
    if (!app || !app.id) return;
    this.apps = {
      ...this.apps,
      [app.id]: app
    };
  });

  addApps = (apps = []) => {
    transaction(() => {
      apps.forEach(this.addApp);
    });
  };
}
