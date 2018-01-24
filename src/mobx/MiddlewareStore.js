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

const IPC_CHANNEL = 'PARITY_SHELL_IPC_CHANNEL';

let instance = null;

export default class MiddlewareStore {
  @observable middleware = [];

  constructor(api) {
    this._api = api;
  }

  static get(api) {
    if (!instance) {
      instance = new MiddlewareStore(api);
    }
    return instance;
  }

  @action
  addMiddleware = middleware => {
    if (!middleware || typeof middleware !== 'function') {
      throw new Error('Interceptor middleware does not implement a function');
    }

    this.middleware.push(middleware);

    return true;
  };

  executeMethodCall = ({ id, from, method, params, token }, source) => {
    try {
      const callback = this.methodCallbackPost(id, from, source, token);
      const isHandled = this.middleware.some(middleware => {
        try {
          return middleware(from, method, params, callback);
        } catch (error) {
          console.error(`Middleware error handling '${method}'`, error);
        }
        return false;
      });

      if (!isHandled) {
        this._api.provider.send(method, params, callback);
      }
    } catch (error) {
      console.error(`Execution error handling '${method}'`, error);
    }
  };

  executePubsubCall = ({ api, id, from, token, params }, source) => {
    const callback = this.methodCallbackPost(id, from, source, token);
    this._api.provider
      .subscribe(api, callback, params)
      .then((result, error) => {
        this.methodCallbackPost(id, from, source, token)(null, result);
      });
  };

  methodCallbackPost = (id, from, source, token) => {
    return (error, result) => {
      this.sendMessage(source, {
        error: error ? error.message : null,
        id,
        from: 'shell',
        to: from,
        result,
        token
      });
    };
  };

  rejectMessage = (source, { id, from, method, token }) => {
    if (!source) {
      return;
    }

    this.sendMessage(source, {
      error: `Method ${method} not allowed`,
      id,
      from: 'shell',
      result: null,
      to: from,
      token
    });
  };

  sendMessage = (source, ...args) => {
    if (source instanceof Element) {
      // If webview, use IPC
      return source.send(IPC_CHANNEL, ...args);
    } else {
      // If iframe, use postMessage
      return source.postMessage(...args, '*');
    }
  };
}
