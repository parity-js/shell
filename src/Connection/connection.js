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
  electron = window.require('electron');
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
    parityInstallLocation: true,
    token: '',
    validToken: false
  }

  versionInfoStore = stores.parity.versionInfo().get(this.context.api)

  componentDidMount () {
    if (isElectron()) {
      const { ipcRenderer, remote } = electron;
      const parityInstallLocation = remote.getGlobal('parityInstallLocation');

      this.setState({ parityInstallLocation });

      // Run parity if parityInstallLocation !== null and not connected yet
      if (!parityInstallLocation) { return; }

      // After 3s, check if ui is still isConnecting
      // If yes, then try to run `parity`
      // The reason why we do this after 3s, is that even when parity is
      // running, isConnecting is true on componentWillMount (lag to ping the
      // node). -Amaury 13.03.2018
      // TODO Find a more reliable way to know if parity is running or not
      setTimeout(() => {
        if (!this.props.isConnecting) { return; }
        console.log('Launching parity.');
        ipcRenderer.send('asynchronous-message', 'run-parity');
      }, 3000);
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
    const { parityInstallLocation } = this.state;

    if (needsToken) { return <KeyIcon className={ styles.svg } />; }
    if (!parityInstallLocation || !this.isVersionCorrect()) { return <Icon className={ styles.svg } name='warning sign' />; }
    return <DashboardIcon className={ styles.svg } />;
  }

  renderText = () => {
    const { needsToken } = this.props;
    const { parityInstallLocation } = this.state;

    if (needsToken) { return this.renderSigner(); }
    if (!parityInstallLocation) { return this.renderParityNotInstalled(); }
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

  renderParityNotInstalled () {
    return (
      <div className={ styles.info }>
        <FormattedMessage
          id='connection.noParity'
          defaultMessage="We couldn't find any Parity installation on this computer. If you have it installed, please run it now. If not, please follow the instructions on {link} to install Parity first."
          values={ { link: <a href='#' onClick={ this.handleOpenWebsite }>https://parity.io</a> } }
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
