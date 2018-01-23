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
import DappsStore from '@parity/shared/lib/mobx/dappsStore';

import styles from './Dapp.css';

const { remote } = window.require('electron');

class Dapp extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    loadAppStore: PropTypes.object.isRequired
  };

  dappsStore = DappsStore.get(this.context.api);
  handleRef = ref => {
    if (!ref) return this.setState({ isLoading: true });
    ref.addEventListener('did-finish-load', () => {
      this.props.loadAppStore.setIsLoading(false);
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

  render() {
    const { dappsUrl } = this.context.api;
    const { appId, isLoading } = this.props.loadAppStore;

    if (!appId) {
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

    const src = `${dappsUrl}/ui/dapps/${appId}/index.html`;
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
        style={{
          height: '100%',
          width: '100%',
          visibility: isLoading ? 'hidden' : 'visible'
        }}
      />
    );
  }
}

export default inject('loadAppStore', 'middlewareStore', 'requestsStore')(
  observer(Dapp)
);
