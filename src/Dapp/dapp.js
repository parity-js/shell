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
import { FormattedMessage } from 'react-intl';
import isElectron from 'is-electron';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import path from 'path';
import { getBuildPath } from '../util/host';
import url from 'url';

import builtinDapps from '../Dapps/dappsBuiltin.json';
import DappsStore from '../Dapps/store';
import HistoryStore from '@parity/shared/lib/mobx/historyStore';
import RequestsStore from '../DappRequests/store';

import styles from './dapp.css';

@observer
export default class Dapp extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    params: PropTypes.object
  };

  state = {
    app: null,
    loading: true,
    token: null
  };

  store = DappsStore.get(this.context.api);
  historyStore = HistoryStore.get('dapps');
  requestsStore = RequestsStore.get(this.context.api)

  componentWillMount () {
    const { id } = this.props.params;

    if (!builtinDapps[id] || !builtinDapps[id].skipHistory) {
      this.historyStore.add(id);
    }

    this.loadApp(id);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.params.id !== this.props.params.id) {
      this.loadApp(nextProps.params.id);
    }
  }

  handleIframe = () => {
    window.addEventListener('message', this.requestsStore.receiveMessage, false);
  }

  handleWebview = webview => {
    if (!webview) {
      return;
    }

    // Log console.logs from webview
    webview.addEventListener('console-message', e => {
      console.log('[DAPP]', e.message);
    });

    // Open all <a target="_blank"> in browser
    webview.addEventListener('new-window', (e) => {
      const protocol = url.parse(e.url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        const { shell } = window.require('electron');

        shell.openExternal(e.url);
      }
    });

    // Reput eventListeners when webview has finished loading dapp
    webview.addEventListener('did-finish-load', () => {
      this.setState({ loading: false });
    });

    // Listen to IPC messages from this webview. More particularly, to IPC
    // messages coming from the preload.js injected in this webview.
    webview.addEventListener('ipc-message', event => {
      this.requestsStore.receiveMessage({
        ...event.args[0],
        source: event.target
      });
    });
  };

  loadApp (id) {
    this.setState({ loading: true });

    this.store
      .loadApp(id)
      .then((app) => {
        this.setState({ loading: false, app, token: this.requestsStore.createToken(app.id) });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }

  renderIframe = (src, hash) => (
    <iframe
      className={ styles.frame }
      frameBorder={ 0 }
      id='dappFrame'
      name={ name }
      ref={ this.handleIframe }
      sandbox='allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation'
      scrolling='auto'
      src={ `${src}${hash}` }
    />
  )

  renderWebview = (src, hash) => {
    const preload = `file://${path.join(
      getBuildPath(),
      'preload.js'
    )}`;

    // https://electronjs.org/docs/tutorial/security#3-enable-context-isolation-for-remote-content
    return <webview
      className={ styles.frame }
      id='dappFrame'
      preload={ preload }
      ref={ this.handleWebview }
      src={ `${src}${hash}` }
      partition={ `persist:${this.state.app.id}` }
      webpreferences='contextIsolation'
           />;
  }

  render () {
    const { params } = this.props;
    const { app, loading, token } = this.state;

    if (loading) {
      return (
        <div className={ styles.full }>
          <p className={ styles.loading }>
            <FormattedMessage
              id='dapp.loading'
              defaultMessage='Loading...'
            />
          </p>
        </div>
      );
    }

    if (!app) {
      return (
        <div className={ styles.full }>
          <p>
            <FormattedMessage
              id='dapp.unavailable'
              defaultMessage='The dapp cannot be reached'
            />
          </p>
        </div>
      );
    }

    let src = `${app.localUrl}?shellAppId=${app.id}&shellToken=${token}`;

    let hash = '';

    if (params.details) {
      hash = `#/${params.details}`;
    }

    return isElectron()
      ? this.renderWebview(src, hash)
      : this.renderIframe(src, hash);
  }
}
