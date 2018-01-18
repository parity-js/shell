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

import { extendObservable, action, computed, observable } from 'mobx';
import store from 'store';
import { methodGroupFromMethod } from '@parity/mobx/lib/methodGroups';
import { sha3 } from '@parity/api/lib/util/sha3';

const LS_PERMISSIONS = '_parity::dapps::methods';

export default class Store {
  // @observable requests = {}; // Maps requestId to request

  middleware = [];
  permissions = {}; // Maps `${method}:${appId}` to true/false
  sources = {}; // Maps requestId to a postMessage source
  tokens = {}; // Maps token to appId

  constructor(provider) {
    this.provider = provider;
    this.permissions = store.get(LS_PERMISSIONS) || {};

    // TODO Use @decorators
    extendObservable(this, {
      requests: {},
      get hasRequests() {
        return Object.keys(this.requests).length !== 0;
      },
      get groupedRequests() {
        // Group by appId on top level, and by methodGroup on 2nd level
        return Object.keys(this.requests).reduce((accumulator, requestId) => {
          const { data } = this.requests[requestId];
          const appId = this.tokens[data.token];
          const method = this.getMethodFromRequest(requestId);
          const methodGroup = methodGroupFromMethod[method]; // Get the methodGroup the current request belongs to

          accumulator[appId] = accumulator[appId] || {};
          accumulator[appId][methodGroup] =
            accumulator[appId][methodGroup] || [];
          accumulator[appId][methodGroup].push({ data, requestId }); // Push request & append the requestId field in the request object

          return accumulator;
        }, {});
      }
    });

    // With IPC we don't need the following line
    // window.addEventListener('message', this.receiveMessage, false);
  }

  // @action
  queueRequest = action((requestId, { data, source }) => {
    this.sources[requestId] = source;
    // Create a new this.requests object to update mobx store
    this.requests = {
      ...this.requests,
      [requestId]: { data }
    };
  });

  // @action
  approveRequest = action(requestId => {
    const { data } = this.requests[requestId];
    const method = this.getMethodFromRequest(requestId);
    const appId = this.tokens[data.token];
    const source = this.sources[requestId];

    this.addAppPermission(method, appId);
    this.removeRequest(requestId);

    if (data.api) {
      this.executePubsubCall(data, source);
    } else {
      this.executeMethodCall(data, source);
    }
  });

  // @action
  rejectRequest = action(requestId => {
    const { data } = this.requests[requestId];
    const source = this.sources[requestId];

    this.removeRequest(requestId);
    this.rejectMessage(source, data);
  });

  // @action
  removeRequest = action(requestId => {
    delete this.requests[requestId];
    delete this.sources[requestId];

    // Create a new object to update mobx store
    this.requests = { ...this.requests };
  });

  getPermissionId = (method, appId) => `${method}:${appId}`; // Create an id to identify permissions based on method and appId

  getMethodFromRequest = requestId => {
    const { data: { method, params } } = this.requests[requestId];

    return method || params[0];
  };

  rejectMessage = (source, { id, from, method, token }) => {
    if (!source) {
      return;
    }

    this.webview.send(
      'PARITY_IPC_CHANNEL',
      {
        error: `Method ${method} not allowed`,
        id,
        from: 'shell',
        result: null,
        to: from,
        token
      },
      '*'
    );
  };

  addAppPermission = (method, appId) => {
    this.permissions[this.getPermissionId(method, appId)] = true;
    this.savePermissions();
  };

  setPermissions = _permissions => {
    this.permissions = {
      ...this.permissions,
      ..._permissions
    };
    this.savePermissions();

    return true;
  };

  addMiddleware(middleware) {
    if (!middleware || typeof middleware !== 'function') {
      throw new Error('Interceptor middleware does not implement a function');
    }

    this.middleware.push(middleware);

    return true;
  }

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

  hasTokenPermission = (method, token) => {
    return this.hasAppPermission(method, this.tokens[token]);
  };

  hasAppPermission = (method, appId) => {
    return !!this.permissions[this.getPermissionId(method, appId)];
  };

  savePermissions = () => {
    store.set(LS_PERMISSIONS, this.permissions);
  };

  _methodCallbackPost = (id, from, source, token) => {
    return (error, result) => {
      this.webview.send('PARITY_IPC_CHANNEL', {
        error: error ? error.message : null,
        id,
        from: 'shell',
        to: from,
        result,
        token
      });
    };
  };

  setIpcListener = webview => {
    this.webview = webview;
    // Listen to IPC messages from webview
    webview.addEventListener('ipc-message', event => {
      this.receiveMessage(...event.args);
    });
  };

  executePubsubCall = ({ api, id, from, token, params }, source) => {
    const callback = this._methodCallbackPost(id, from, source, token);

    this.provider.subscribe(api, callback, params).then((result, error) => {
      this._methodCallbackPost(id, from, source, token)(null, result);
    });
  };

  executeMethodCall = ({ id, from, method, params, token }, source) => {
    try {
      const callback = this._methodCallbackPost(id, from, source, token);
      const isHandled = this.middleware.some(middleware => {
        try {
          return middleware(from, method, params, callback);
        } catch (error) {
          console.error(`Middleware error handling '${method}'`, error);
        }
        return false;
      });

      if (!isHandled) {
        this.webview.send('PARITY_IPC_CHANNEL', method, params, callback);
      }
    } catch (error) {
      console.error(`Execution error handling '${method}'`, error);
    }
  };

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
        this.rejectMessage(source, data);
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
        this.executePubsubCall(data, source);
      } else if (subId) {
        const unsubscribePromise =
          subId === '*'
            ? this.provider.unsubscribeAll()
            : this.provider.unsubscribe(subId);

        unsubscribePromise.then(v =>
          this._methodCallbackPost(id, from, source, token)(null, v)
        );
      } else {
        this.executeMethodCall(data, source);
      }
    } catch (error) {
      console.error('Exception handling data', data, error);
    }
  };

  static instance = null;

  static create(provider) {
    if (!Store.instance) {
      Store.instance = new Store(provider);
    }

    return Store.instance;
  }

  static get() {
    return Store.instance;
  }
}
