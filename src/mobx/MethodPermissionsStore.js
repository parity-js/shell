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

import { extendObservable, action } from 'mobx';
import store from 'store';

let instance = null;
const LS_PERMISSIONS = '_parity::dapps::methods';

export default class MethodPermissionsStore {
  constructor(api) {
    this._api = api;
    this.permissions = store.get(LS_PERMISSIONS) || {};

    // TODO Use @decorators
    extendObservable(this, {
      permissions: {} // Maps `${method}:${appId}` to true/false
    });
  }

  static get(api) {
    if (!instance) {
      instance = new MethodPermissionsStore(api);
    }
    return instance;
  }

  addAppPermission = (appId, method) =>
    this.setPermissions({ [this.getPermissionId(appId, method)]: true });

  getPermissionId = (appId, method) => `${appId}:${method}`; // Create an id to identify permissions based on method and appId

  hasAppPermission = (appId, method) =>
    !!this.permissions[this.getPermissionId(appId, method)];

  savePermissions = () => {
    store.set(LS_PERMISSIONS, this.permissions);
  };

  setPermissions = action(permissions => {
    this.permissions = {
      ...this.permissions,
      ...permissions
    };
    this.savePermissions();
  });
}
