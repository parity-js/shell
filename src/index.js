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

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as MobxProvider } from 'mobx-react';
import 'semantic-ui-css/semantic.min.css';

import App from './App';
import ContextProvider from '@parity/ui/lib/ContextProvider';
import createExtendShell from './extendShell';
import createRootStore from './mobx';
import registerServiceWorker from './registerServiceWorker';
import { retrieveToken } from './utils';
import SecureApi from './secureApi';

const api = new SecureApi(window.location.host, retrieveToken());
const rootStore = createRootStore(api);
const extendShell = createExtendShell(rootStore);

window.parity = Object.assign({}, window.parity, {
  extendShell
});

ReactDOM.render(
  <ContextProvider api={api}>
    <MobxProvider {...rootStore}>
      <App />
    </MobxProvider>
  </ContextProvider>,
  document.getElementById('root')
);
registerServiceWorker();
