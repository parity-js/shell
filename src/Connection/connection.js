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
import { connect } from 'react-redux';
import { Circle } from 'react-progress-bar.js';
import { FormattedMessage } from 'react-intl';
import isElectron from 'is-electron';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import stores from '@parity/mobx';

import GradientBg from '@parity/ui/lib/GradientBg';
import Icon from 'semantic-ui-react/dist/commonjs/elements/Icon';
import Input from '@parity/ui/lib/Form/Input';
import { CompareIcon, ComputerIcon, DashboardIcon, KeyIcon } from '@parity/ui/lib/Icons';

import styles from './connection.css';

let electron;

if (isElectron()) {
  electron = require('electron');
}

@observer
class Connection extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  }

  static propTypes = {
    isConnected: PropTypes.bool,
    isConnecting: PropTypes.bool,
    needsToken: PropTypes.bool
  }

  state = {
    loading: false,
    parityInstalled: false,
    progress: 0,
    token: '',
    validToken: false
  }

  versionInfoStore = stores.parity.versionInfo().get(this.context.api)

  componentDidMount () {
    if (!isElectron()) { return; }
    const { ipcRenderer, remote } = electron;
    const parityInstalled = remote.getGlobal('isParityInstalled');

    this.setState({ parityInstalled });

    // Listen to messages from main process
    ipcRenderer.on('parity-download-progress', (_, progress) => {
      // Run parity once the installation is finished
      if (progress === 1 && this.state.progress < 1) {
        setTimeout(() => this.runParity(), 1000);
      }
      this.setState({ progress });
    });

    // Next step: if we're not connected, and parity is installed, then we
    // run parity.
    if (this.props.isConnected || !parityInstalled) {
      return;
    }

    // After 3s, check if ui is still isConnecting
    // If yes, then try to run `parity`
    // The reason why we do this after 3s, is that even when parity is
    // running, isConnecting is true on componentDidMount (lag to ping the
    // node). -Amaury 13.03.2018
    // TODO Find a more reliable way to know if parity is running or not
    setTimeout(() => {
      if (this.props.isConnected || !this.props.isConnecting) { return; }
      this.runParity();
    }, 3000);
  }

  componentWillReceiveProps ({ needsToken }) {
    if (!isElectron()) { return; }
    // needsToken is set to false by default at the beginning. If the UI needs
    // a token, then it will be set to true. At that point, we send an IPC
    // message to the main process to attempt to run `parity signer new-token`
    // automatically.
    if (!this.props.needsToken && needsToken) {
      const { ipcRenderer } = electron;

      ipcRenderer.send('asynchronous-message', 'signer-new-token');

      ipcRenderer.once('asynchronous-reply', (_, arg) => {
        if (!arg) { return; }
        // If `parity signer new-token` has successfully given us a token back,
        // then we submit it
        this.onChangeToken(null, arg);
      });
    }
  }

  /**
   * Electron UI requires parity version >=1.10.0
   */
  isVersionCorrect = () => {
    const { versionInfo } = this.versionInfoStore;

    if (!versionInfo) { return true; } // Simpler to return true when pinging for parity_versionInfo
    const { version: { major, minor } } = versionInfo;

    return major > 1 || (major === 1 && minor >= 10);
  }

  handleOpenWebsite = () => {
    const { shell } = electron;

    shell.openExternal('https://parity.io');
  }

  render () {
    const { isConnecting, isConnected } = this.props;

    if (!isConnecting && isConnected && this.isVersionCorrect()) {
      return null;
    }

    return (
      <div>
        <div className={ styles.overlay } />
        <div className={ styles.modal }>
          <GradientBg className={ styles.body }>
            <div className={ styles.icons }>
              <div className={ styles.icon }>
                <ComputerIcon className={ styles.svg } />
              </div>
              <div className={ styles.iconSmall }>
                <CompareIcon className={ `${styles.svg} ${styles.pulse}` } />
              </div>
              <div className={ styles.icon }>
                {this.renderIcon()}
              </div>
            </div>
            {this.renderText()}
          </GradientBg>
        </div>
      </div>
    );
  }

  renderIcon = () => {
    const { needsToken } = this.props;
    const { parityInstalled, progress } = this.state;

    if (needsToken) { return <KeyIcon className={ styles.svg } />; }
    if (!parityInstalled || progress) {
      return (
        <Circle
          containerStyle={ { height: '100px', marginTop: '-75px', width: '100px' } }
          initialAnimate
          options={ { color: 'rgb(208, 208, 208)', strokeWidth: 5 } }
          progress={ progress }
          text={ `${Math.round(progress * 100)}%` }
        />
      );
    }
    if (!this.isVersionCorrect()) { return <Icon className={ styles.svg } name='warning sign' />; }
    return <DashboardIcon className={ styles.svg } />;
  }

  renderText = () => {
    const { needsToken } = this.props;
    const { parityInstalled, progress } = this.state;

    if (needsToken) { return this.renderSigner(); }
    if (progress === 1) { return this.renderRunningParity(); }
    if (!parityInstalled) { return this.renderProgress(); }
    if (!this.isVersionCorrect()) { return this.renderIncorrectVersion(); }
    return this.renderPing();
  }

  renderSigner () {
    const { loading, token, validToken } = this.state;
    const { isConnecting, needsToken } = this.props;

    if (needsToken && !isConnecting) {
      return (
        <div className={ styles.info }>
          <div>
            <FormattedMessage
              id='connection.noConnection'
              defaultMessage='To proceed you need to generate a new security token by running the following command in your terminal {newToken} Then copy &amp; paste the newly generated token here'
              values={ {
                newToken: <div className={ styles.console }>$ parity signer new-token</div>
              } }
            />
          </div>
          <div className={ styles.form }>
            <Input
              className={ styles.formInput }
              autoFocus
              disabled={ loading }
              error={
                validToken || (!token || !token.length)
                  ? null
                  : (
                    <FormattedMessage
                      id='connection.invalidToken'
                      defaultMessage='invalid signer token'
                    />
                  )
              }
              hint={
                <FormattedMessage
                  id='connection.token.hint'
                  defaultMessage='xxXX-Xxxx-xXxx-XxXX'
                />
              }
              onChange={ this.onChangeToken }
              value={ token }
            />
          </div>
        </div>
      );
    }

    return (
      <div className={ styles.info }>
        <FormattedMessage
          id='connection.connectingAPI'
          defaultMessage='Connecting to the Parity Secure API.'
        />
      </div>
    );
  }

  renderProgress () {
    return (
      <div className={ styles.info }>
        <FormattedMessage
          id='connection.installingParity'
          defaultMessage='Please wait while we are fetching the latest version of Parity and installing it. This may take a few minutes.'
        />
      </div>
    );
  }

  renderPing () {
    return (
      <div className={ styles.info }>
        <FormattedMessage
          id='connection.connectingNode'
          defaultMessage='Connecting to the Parity Node. If this informational message persists, please ensure that your Parity node is running and reachable on the network.'
        />
      </div>
    );
  }

  renderIncorrectVersion () {
    const { versionInfo: { version: { major, minor, patch } } } = this.versionInfoStore;

    return (
      <div className={ styles.info }>
        <FormattedMessage
          id='connection.incorrectVersion'
          defaultMessage='We found parity version {version} running. Parity UI requires parity >=1.10 to run. Please visit {link} to install Parity 1.10 first.'
          values={ {
            link: <a href='#' onClick={ this.handleOpenWebsite }>https://parity.io</a>,
            version: `${major}.${minor}.${patch}`
          } }
        />
      </div>
    );
  }

  renderRunningParity () {
    return <div className={ styles.info }>
      <FormattedMessage
        id='connection.runningParity'
        defaultMessage='Running parity...'
      />
    </div>;
  }

  runParity = () => {
    const { ipcRenderer } = electron;

    console.log('Launching parity.');
    ipcRenderer.send('asynchronous-message', 'run-parity');
  }

  validateToken = (_token) => {
    const token = _token.trim();
    const validToken = /^[a-zA-Z0-9]{4}(-)?[a-zA-Z0-9]{4}(-)?[a-zA-Z0-9]{4}(-)?[a-zA-Z0-9]{4}$/.test(token);

    return {
      token,
      validToken
    };
  }

  onChangeToken = (event, _token) => {
    const { token, validToken } = this.validateToken(_token || event.target.value);

    this.setState({ token, validToken }, () => {
      validToken && this.setToken();
    });
  }

  setToken = () => {
    const { api } = this.context;
    const { token } = this.state;

    this.setState({ loading: true });

    return api
      .updateToken(token, 0)
      .then((isValid) => {
        this.setState({
          loading: isValid || false,
          validToken: isValid
        });
        // If invalid token, we clear the token field
        if (!isValid) {
          this.setState({ token: '' });
        }
      });
  }
}

function mapStateToProps (state) {
  const { isConnected, isConnecting, needsToken } = state.nodeStatus;

  return {
    isConnected,
    isConnecting,
    needsToken
  };
}

export default connect(
  mapStateToProps,
  null
)(Connection);
