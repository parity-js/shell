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

/* eslint-disable no-unused-expressions */

import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import localStore from 'store';

import Contracts from '@parity/shared/lib/contracts';

import Store, { LS_KEY_DISPLAY } from './store';

const APPID_DAPPREG = '0x7bbc4f1a27628781b96213e781a1b8eec6982c1db8fac739af6e4c5a55862c03';
const APPID_DAPPDEVELOP = '0x89682fd2c0ffa4ff53a8dc2c5f6a65c6e31de8f659fa2935a07a678e711a58a3';
const APPID_DAPPWALLET = 'v1';
const APPID_DAPPVISIBLE = '0xa48bd8fd56c90c899135281967a6cf90865c221b46f27f9fbe2a236d74a64ea2';
const APPID_LOCALTX = '0xae74ad174b95cdbd01c88ac5b73a296d33e9088fc2a200e76bcedf3a94a7815d';
const APPID_TOKENDEPLOY = '0xf9f2d620c2e08f83e45555247146c62185e4ab7cf82a4b9002a265a0d020348f';

let globalContractsGet;

function stubGlobals () {
  globalContractsGet = Contracts.get;

  Contracts.get = () => {
    return {
      dappReg: {
        at: sinon.stub().resolves([[0, 1, 2, 3], 'appOwner']),
        count: sinon.stub().resolves(new BigNumber(1)),
        getContract: sinon.stub().resolves({}),
        getContent: sinon.stub().resolves([0, 1, 2, 3]),
        getImage: sinon.stub().resolves([0, 1, 2, 3]),
        getManifest: sinon.stub().resolves([0, 1, 2, 3])
      }
    };
  };
}

function restoreGlobals () {
  Contracts.get = globalContractsGet;
}

let api;
let store;

function create () {
  api = {
    parity: {
      dappsList: () => Promise.resolve([])
    }
  };
  store = new Store(api);

  return store;
}

describe('Dapps/DappStore', () => {
  beforeEach(() => {
    stubGlobals();
  });

  afterEach(() => {
    restoreGlobals();
  });

  describe('@action', () => {
    const defaultDapps = {
      [APPID_DAPPWALLET]: { visible: true, pinned: true },
      [APPID_DAPPVISIBLE]: { visible: true, pinned: true }
    };

    const initialDapps = {
      [APPID_TOKENDEPLOY]: { visible: false },
      [APPID_DAPPREG]: { visible: true }
    };

    describe('setDisplayApps', () => {
      beforeEach(() => {
        create();
        store.setDisplayApps(initialDapps);
      });

      it('sets from empty start', () => {
        expect(store.displayApps).to.deep.equal(Object.assign({}, defaultDapps, initialDapps));
      });

      it('overrides single keys, keeping existing', () => {
        store.setDisplayApps({ [APPID_TOKENDEPLOY]: { visible: true } });

        expect(store.displayApps).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps, { [APPID_TOKENDEPLOY]: { visible: true } })
        );
      });

      it('extends with new keys, keeping existing', () => {
        store.setDisplayApps({ 'test': { visible: true } });

        expect(store.displayApps).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps, { 'test': { visible: true } })
        );
      });
    });

    describe('hideApp/showApp', () => {
      beforeEach(() => {
        localStore.set(LS_KEY_DISPLAY, initialDapps);

        create();
      });

      afterEach(() => {
        localStore.set(LS_KEY_DISPLAY, {});
      });

      it('disables visibility', () => {
        store.hideApp(APPID_DAPPREG);

        expect(store.displayApps[APPID_DAPPREG].visible).to.be.false;
        expect(localStore.get(LS_KEY_DISPLAY)).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps, { [APPID_DAPPREG]: { visible: false, pinned: false } })
        );
      });

      it('enables visibility', () => {
        store.showApp(APPID_TOKENDEPLOY);

        expect(store.displayApps[APPID_TOKENDEPLOY].visible).to.be.true;
        expect(localStore.get(LS_KEY_DISPLAY)).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps, { [APPID_TOKENDEPLOY]: { visible: true } })
        );
      });

      it('keeps visibility state', () => {
        store.hideApp(APPID_TOKENDEPLOY);
        store.showApp(APPID_DAPPREG);

        expect(store.displayApps[APPID_TOKENDEPLOY].visible).to.be.false;
        expect(store.displayApps[APPID_DAPPREG].visible).to.be.true;
        expect(localStore.get(LS_KEY_DISPLAY)).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps, { [APPID_TOKENDEPLOY]: { visible: false, pinned: false } })
        );
      });
    });

    describe('readDisplayApps/writeDisplayApps', () => {
      beforeEach(() => {
        localStore.set(LS_KEY_DISPLAY, initialDapps);

        create();
      });

      afterEach(() => {
        localStore.set(LS_KEY_DISPLAY, {});
      });

      it('loads visibility from storage', () => {
        expect(store.displayApps).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps
        ));
      });

      it('saves visibility to storage', () => {
        store.setDisplayApps({ [APPID_TOKENDEPLOY]: { visible: true } });
        store.writeDisplayApps();

        expect(localStore.get(LS_KEY_DISPLAY)).to.deep.equal(
          Object.assign({}, defaultDapps, initialDapps, { [APPID_TOKENDEPLOY]: { visible: true } })
        );
      });
    });
  });

  describe('saved views', () => {
    beforeEach(() => {
      localStore.set(LS_KEY_DISPLAY, {
        [APPID_TOKENDEPLOY]: { visible: false },
        [APPID_DAPPREG]: { visible: true }
      });

      return create().loadAllApps();
    });

    afterEach(() => {
      localStore.set(LS_KEY_DISPLAY, {});
    });

    it('disables based on saved keys', () => {
      expect(store.displayApps[APPID_TOKENDEPLOY].visible).to.be.false;
    });

    it('enables based on saved keys', () => {
      expect(store.displayApps[APPID_DAPPREG].visible).to.be.true;
    });

    it('keeps non-specified enabled keys', () => {
      expect(store.displayApps[APPID_LOCALTX].visible).to.be.true;
    });
  });

  describe('built-in dapps', () => {
    beforeEach(() => {
      return create().loadAllApps();
    });

    it('are properly loaded', () => {
      expect(store.displayApps[APPID_DAPPDEVELOP].visible).to.be.true;
    });
  });
});
