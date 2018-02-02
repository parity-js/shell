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
import { methodGroupFromMethod } from '@parity/mobx/lib/methodGroups';
import { sha3 } from '@parity/api/lib/util/sha3';

import MethodPermissionsStore from './MethodPermissionsStore';
import MiddlewareStore from './MiddlewareStore';

let instance = null;

export default class RequestsStore {
  @observable requests = {};
  sources = {}; // Maps requestId to a postMessage source
  tokens = {}; // Maps token to appId

  constructor(api) {
    this._api = api;
    this.methodPermissionsStore = MethodPermissionsStore.get(api);
    this.middlewareStore = MiddlewareStore.get(api);
  }

  static get(api) {
    if (!instance) {
      instance = new RequestsStore(api);
    }
    return instance;
  }

  @computed
  get groupedRequests() {
    // Group by appId on top level, and by methodGroup on 2nd level
    return Object.keys(this.requests).reduce((accumulator, requestId) => {
      const { data } = this.requests[requestId];
      const appId = this.tokens[data.token];
      const method = this.getMethodFromRequest(requestId);
      const methodGroup = methodGroupFromMethod[method]; // Get the methodGroup the current request belongs to

      accumulator[appId] = accumulator[appId] || {};
      accumulator[appId][methodGroup] = accumulator[appId][methodGroup] || [];
      accumulator[appId][methodGroup].push({ data, requestId }); // Push request & append the requestId field in the request object

      return accumulator;
    }, {});
  }

  @computed
  get hasRequests() {
    return Object.keys(this.requests).length > 0;
  }

  @action
  queueRequest = (requestId, { data, source }) => {
    this.sources[requestId] = source;
    // Create a new this.requests object to update mobx store
    this.requests = {
      ...this.requests,
      [requestId]: { data }
    };
  };

  @action
  approveRequest = requestId => {
    const { data } = this.requests[requestId];
    const method = this.getMethodFromRequest(requestId);
    const appId = this.tokens[data.token];
    const source = this.sources[requestId];

    this.methodPermissionsStore.addAppPermission(appId, method);
    this.removeRequest(requestId);

    if (data.api) {
      this.middlewareStore.executePubsubCall(data, source);
    } else {
      this.middlewareStore.executeMethodCall(data, source);
    }
  };

  @action
  rejectRequest = requestId => {
    const { data } = this.requests[requestId];
    const source = this.sources[requestId];

    this.removeRequest(requestId);
    this.middlewareStore.rejectMessage(source, data);
  };

  @action
  removeRequest = requestId => {
    delete this.requests[requestId];
    delete this.sources[requestId];

    // Create a new object to update mobx store
    this.requests = { ...this.requests };
  };

  getMethodFromRequest = requestId => {
    const { data: { method, params } } = this.requests[requestId];

    return method || params[0];
  };

  createToken = appId => {
    const token = sha3(`${appId}:${Date.now()}`);

    this.tokens[token] = appId;
    return token;
  };

  hasValidToken = (method, appId, token) => {
    if (!token) {
      return method === 'shell_requestNewToken';
    }

    return this.tokens[token] === appId;
  };

  hasTokenPermission = (method, token) =>
    this.methodPermissionsStore.hasAppPermission(this.tokens[token], method);

  receiveMessage = ({ data, source }) => {
    try {
      if (!data) {
        return;
      }

      const { from, method, to, token, params, api, subId, id } = data;

      if (to !== 'shell' || !from || from === 'shell') {
        return;
      }

      if (!this.hasValidToken(method, from, token)) {
        this.middlewareStore.rejectMessage(source, data);
        return;
      }

      const _method = api ? params[0] : method;

      if (
        methodGroupFromMethod[_method] &&
        !this.hasTokenPermission(_method, token)
      ) {
        this.queueRequest(id, {
          // The requestId of a request is the id inside data
          data,
          source
        });
        return;
      }

      if (api) {
        this.middlewareStore.executePubsubCall(data, source);
      } else if (subId) {
        const unsubscribePromise =
          subId === '*'
            ? this._api.provider.unsubscribeAll()
            : this._api.provider.unsubscribe(subId);

        unsubscribePromise.then(v =>
          this.middlewareStore.methodCallbackPost(id, from, source, token)(
            null,
            v
          )
        );
      } else {
        this.middlewareStore.executeMethodCall(data, source);
      }
    } catch (error) {
      console.error('Exception handling data', data, error);
    }
  };
}
