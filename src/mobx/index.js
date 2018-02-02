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

import getStore from '@parity/mobx';

import ApiStore from './ApiStore';
import DappsStore from './DappsStore';
import DisplayAppsStore from './DisplayAppsStore';
import ExternalOverlayStore from './ExternalOverlayStore';
import MethodPermissionsStore from './MethodPermissionsStore';
import MiddlewareStore from './MiddlewareStore';
import RequestsStore from './RequestsStore';

const createRootStore = api => ({
  apiStore: ApiStore.get(api),
  dappsStore: DappsStore.get(api),
  displayAppsStore: DisplayAppsStore.get(api),
  externalOverlayStore: ExternalOverlayStore.get(api),
  methodPermissionsStore: MethodPermissionsStore.get(api),
  middlewareStore: MiddlewareStore.get(api),
  parityAllAccountsInfoStore: getStore('parity_allAccountsInfo')().get(api),
  parityNodeHealthStore: getStore('parity_nodeHealth')().get(api),
  requestsStore: RequestsStore.get(api),
  signerRequestsToConfirmStore: getStore('signer_requestsToConfirm')().get(api)
});

export default createRootStore;
