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
import store from 'store';

let instance = null;

const LS_EXTERNAL_OVERLAY = '_parity::dapps::externalOverlay';

export default class ExternalOverlayStore {
  @observable externalOverlay = true;

  constructor(api) {
    this._api = api;

    this.loadExternalOverlay();
  }

  static get(api) {
    if (!instance) {
      instance = new ExternalOverlayStore(api);
    }
    return instance;
  }

  closeExternalOverlay = () => this.setExternalOverlay(false);

  loadExternalOverlay = () => {
    const externalOverlay = store.get(LS_EXTERNAL_OVERLAY);

    if (externalOverlay !== undefined) {
      return this.setExternalOverlay(externalOverlay);
    }
  };

  saveExternalOverlay = () => {
    store.set(LS_EXTERNAL_OVERLAY, this.externalOverlay);
  };

  @action
  setExternalOverlay = externalOverlay => {
    this.externalOverlay = externalOverlay;
    this.saveExternalOverlay();
  };
}
