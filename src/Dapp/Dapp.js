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
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';
import { FormattedMessage } from 'react-intl';
import path from 'path';

import builtinDapps from '@parity/shared/lib/config/dappsBuiltin.json';
import viewsDapps from '@parity/shared/lib/config/dappsViews.json';
import DappsStore from '@parity/shared/lib/mobx/dappsStore';
import HistoryStore from '@parity/shared/lib/mobx/historyStore';

import styles from './Dapp.css';

const { remote } = window.require('electron');

const internalDapps = [].concat(viewsDapps, builtinDapps);

class Dapp extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    params: PropTypes.object
  };

  state = {
    app: null,
    loading: true
  };

  store = DappsStore.get(this.context.api);
  historyStore = HistoryStore.get('dapps');

  componentWillMount() {
    const id =
      '0xa48bd8fd56c90c899135281967a6cf90865c221b46f27f9fbe2a236d74a64ea2'; // Browse Dapps
    // const id ='0xcd423760c9650eb549b1615f6cf96d420e32aadcea2ff5fe11c26457244adcc1'; // Node Status
    // const id = 'v1';

    if (!internalDapps[id] || !internalDapps[id].skipHistory) {
      this.historyStore.add(id);
    }

    this.loadApp(id);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.id !== this.props.params.id) {
      this.loadApp(nextProps.params.id);
    }
  }

  handleRef = ref => {
    if (!ref) return;
    ref.addEventListener('did-finish-load', () => {
      // Log console.logs from webview
      ref.addEventListener('console-message', e => {
        console.log('[DAPP]', e.message);
      });
      // Listen to IPC messages from this webview
      ref.addEventListener('ipc-message', event => {
        this.props.requestsStore.receiveMessage(...event.args);
      });
      // Set webview on MiddlewareStore to send IPC messages
      this.props.middlewareStore.setWebview(ref);
      // Send ping message to tell dapp everything's ready
      ref.send('ping');
    });
  };

  loadApp(id) {
    this.setState({ loading: true });

    this.store
      .loadApp(id)
      .then(app => {
        this.setState({ loading: false, app });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }

  render() {
    const { dappsUrl } = this.context.api;
    const { app, loading } = this.state;

    if (loading) {
      return null;
    }

    if (!app) {
      return (
        <div className={styles.full}>
          <div className={styles.text}>
            <FormattedMessage
              id="dapp.unavailable"
              defaultMessage="The dapp cannot be reached"
            />
          </div>
        </div>
      );
    }

    const src = `${dappsUrl}/ui/dapps/${app.id}/index.html`;
    // const src = `http://localhost:3001?appId=dapp-status`;
    const hash = '';

    return (
      <webview
        nodeintegration="true"
        preload={`file://${path.join(
          remote.getGlobal('dirName'),
          '../public/inject.js' // TODO Take from node_modules instead of public/
        )}`}
        ref={this.handleRef}
        src={`${src}${hash}`}
        style={{ height: '100%', width: '100%' }}
      />
    );
  }

  onDappLoad = () => {
    const frame = document.getElementById('dappFrame');

    frame.style.opacity = 1;
  };
}

export default inject('middlewareStore', 'requestsStore')(observer(Dapp));
