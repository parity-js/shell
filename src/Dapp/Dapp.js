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

import styles from './Dapp.css';

// https://github.com/electron/electron/issues/2288
const IS_ELECTRON = window && window.process && window.process.type;

let remote;
if (IS_ELECTRON) {
  remote = window.require('electron').remote;
}

class Dapp extends Component {
  state = {
    isLoading: false
  };

  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {};

  componentWillMount() {
    if (!IS_ELECTRON) {
      window.addEventListener(
        'message',
        this.props.requestsStore.receiveMessage
      );
    }
  }

  handleIPCMessage = event =>
    this.props.requestsStore.receiveMessage({
      ...event.args[0],
      source: event.target
    });

  handleWebview = ref => {
    if (!ref) {
      return;
    }

    // Log console.logs from webview
    ref.addEventListener('console-message', e => {
      console.log('[DAPP]', e.message);
    });

    // Remove existing eventListeners when we change dapp in webview
    ref.addEventListener('did-start-loading', () => {
      this.setState({ isLoading: true });
      ref.removeEventListener('ipc-message', this.handleIPCMessage);
    });

    // Reput eventListeners when webview has finished loading dapp
    ref.addEventListener('did-finish-load', () => {
      this.setState({ isLoading: false });
      // Listen to IPC messages from this webview
      ref.addEventListener('ipc-message', this.handleIPCMessage);
      // Send ping message to tell dapp we're ready to listen to its ipc messages
      ref.send('ping');
    });
  };

  renderIframe = (src, hash) => (
    <iframe
      className={styles.frame}
      frameBorder={0}
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation"
      scrolling="auto"
      src={`${src}${hash}`}
      title="dappFrame"
    />
  );

  renderWebview = (src, hash) => (
    <webview
      className={styles.frame}
      nodeintegration="true"
      preload={`file://${path.join(
        remote.getGlobal('dirName'),
        '../node_modules/inject.js/lib/inject.js'
      )}`}
      ref={this.handleWebview}
      src={`${src}${hash}`}
    />
  );

  render() {
    const { dappsUrl } = this.context.api;
    const { match: { params } } = this.props;
    // const { isLoading } = this.state;
    const app = this.props.dappsStore.apps[params.appId];

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

    let src = null;

    switch (app.type) {
      case 'local':
        src = app.localUrl
          ? `${app.localUrl}?appId=${app.id}`
          : `${dappsUrl}/${app.id}/`;
        break;

      case 'network':
        src = `${dappsUrl}/${app.contentHash}/`;
        break;

      default:
        let dapphost = process.env.DAPPS_URL || `${dappsUrl}/ui`;

        if (dapphost === '/') {
          dapphost = '';
        }

        src =
          window.location.protocol === 'file:'
            ? `dapps/${app.id}/index.html`
            : `${dapphost}/dapps/${app.id}/index.html`;
        break;
    }

    let hash = '';

    if (params.details) {
      hash = `#/${params.details}`;
    }

    // TODO Render loader when loading?

    return IS_ELECTRON
      ? this.renderWebview(src, hash)
      : this.renderIframe(src, hash);
  }
}

export default inject('dappsStore', 'middlewareStore', 'requestsStore')(
  observer(Dapp)
);
