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

import middlewares from './middleware';

const createExtendShell = ({ middlewareStore, signerStore }) => {
  const extendShell = options => {
    switch (options.type) {
      case 'interceptor':
        return middlewareStore.addMiddleware(options.middleware);

      case 'signer': {
        const isFallback = options.isHandler(null, null, null) || false;
        return signerStore.addSigner(
          options.component,
          options.isHandler,
          isFallback
        );
      }

      // case 'status':
      //   return injectStatusPlugin(options.component);

      default:
        throw new Error(
          `Unable to extend the shell with type '${options.type}'`
        );
    }
  };

  // Add default middlewares
  middlewares.forEach(middleware =>
    extendShell({
      type: 'interceptor',
      middleware
    })
  );

  // Add default signer plugins
  // Done in plugin-signer-* repo

  // Add default status plugins

  return extendShell;
};

export default createExtendShell;
