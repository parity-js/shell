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

import React, { Component } from 'react';
import { HashRouter, Link, Route } from 'react-router-dom';

import Connection from '../Connection';
import Dapp from '../Dapp';
import DappRequests from '../DappRequests';
import StatusBar from '../StatusBar';
import SyncWarning from '../SyncWarning';

import styles from './App.css';

class App extends Component {
  render() {
    return (
      <HashRouter>
        <div className={styles.app}>
          <StatusBar />
          <SyncWarning />
          <Connection />
          <DappRequests />
          <Route
            exact
            path="/"
            render={() => (
              <div>
                dapp-homepage goes here. Until it's built, you can go{' '}
                <Link to="/0xa48bd8fd56c90c899135281967a6cf90865c221b46f27f9fbe2a236d74a64ea2">
                  browse dapps
                </Link>
              </div>
            )}
          />
          <Route path="/:appId" component={Dapp} />
          <Route path="/:appId/:details" component={Dapp} />
        </div>
      </HashRouter>
    );
  }
}

export default App;
