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
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import MethodDecodingStore from '@parity/ui/lib/MethodDecoding/methodDecodingStore';
import { TOKEN_METHODS } from '@parity/ui/lib/MethodDecoding/constants';
import TokenValue from '@parity/ui/lib/MethodDecoding/tokenValue';
import IdentityIcon from '@parity/ui/lib/IdentityIcon';
import Image from 'semantic-ui-react/dist/commonjs/elements/Image';
import List from 'semantic-ui-react/dist/commonjs/elements/List';

import EtherValue from '../EtherValue';
import styles from './requestItem.css';

@observer
@connect(({ tokens }) => ({ tokens }))
class RequestItem extends Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    request: PropTypes.object.isRequired,
    tokens: PropTypes.array
  };

  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  state = {
    decoded: null // Decoded transaction
  };

  methodDecodingStore = MethodDecodingStore.get(this.context.api);

  componentWillMount () {
    const { payload } = this.props.request;
    const transaction = payload.sendTransaction || payload.signTransaction;

    if (!transaction) { return; }

    // Decode the transaction and put it into the state
    this.methodDecodingStore
      .lookup(transaction.from, transaction)
      .then(lookup => this.setState({
        decoded: lookup
      }));
  }

  /**
   * Get the author of a request
   * TODO Duplicate code of https://github.com/Parity-JS/ui/blob/master/src/Signer/Request/request.js#L54-L69
   */
  getRequestAuthor = () => {
    const { payload } = this.props.request;

    if (payload.sign) {
      return payload.sign.address;
    }
    if (payload.decrypt) {
      return payload.decrypt.address;
    }
    const transaction = payload.sendTransaction || payload.signTransaction;

    if (transaction) {
      return transaction.from;
    }
  };

  render () {
    const { onClick } = this.props;

    return (
      <List.Item onClick={ onClick }>
        <Image avatar size='mini' verticalAlign='middle'>
          <IdentityIcon
            className={ styles.fromAvatar }
            address={ this.getRequestAuthor() }
          />
        </Image>
        <List.Content>
          <List.Header>
            <FormattedMessage
              id='application.status.signerPendingSignerRequest'
              defaultMessage='Parity Signer Request'
            />
          </List.Header>
          {this.renderDescription()}
        </List.Content>
      </List.Item >
    );
  }

  /**
   * Render description when calling a contract method
   */
  renderContractMethod = (transaction) => (
    <List.Description className={ styles.listDescription }>
      <FormattedMessage
        id='application.status.signerPendingContractMethod'
        defaultMessage='Executing method on contract'
      />
      {this.renderRecipient(transaction.to)}
    </List.Description>
  );

  /**
   * Render description when decrypting a message with parity_decrypt
   */
  renderDecrypt = () => (
    <FormattedMessage
      id='application.status.signerPendingContractDecrypt'
      defaultMessage='Decrypting a message'
    />
  );

  /**
   * Render description when deploying a contract
   */
  renderDeploy = () => (
    <FormattedMessage
      id='application.status.signerPendingDeploy'
      defaultMessage='Deploying a contract'
    />
  );

  /**
   * Render the description of the request
   */
  renderDescription = () => {
    const { payload } = this.props.request;

    // Decide what to display in the description, depending
    // on what type of transaction we're dealing with
    if (payload.sign) {
      return this.renderSign();
    }
    if (payload.decrypt) {
      return this.renderDecrypt();
    }
    const transaction = payload.sendTransaction || payload.signTransaction;

    if (transaction) {
      const { tokens } = this.props;
      const token = Object.values(tokens).find(({ address }) => address === transaction.to);

      if (!this.state.decoded) { return null; }

      const {
        inputs,
        signature,
        contract,
        deploy
      } = this.state.decoded;

      if (deploy) {
        return this.renderDeploy(transaction);
      }

      if (contract && signature) {
        if (token && TOKEN_METHODS[signature] && inputs) {
          return this.renderTokenTransfer(transaction, token);
        }
        return this.renderContractMethod(transaction);
      }

      return this.renderValueTransfer(transaction);
    }
    return null;
  }

  /**
   * Render recipient (of token transfer or eth transfer)
   */
  renderRecipient = address => (
    <IdentityIcon
      tiny
      address={ address }
      className={ styles.toAvatar }
    />
  );

  /**
   * Render description when signing some data with eth_sign
   */
  renderSign = () => (
    <FormattedMessage
      id='application.status.signerPendingSign'
      defaultMessage='Signing a message'
    />
  );

  /**
   * Render description when transferring tokens
   */
  renderTokenTransfer = (transaction, token) => {
    const { inputs } = this.state.decoded;
    const valueInput = inputs.find(({ name }) => name === '_value');
    const toInput = inputs.find(({ name }) => name === '_to');

    return (
      <List.Description className={ styles.listDescription }>
        <FormattedMessage
          id='application.status.signerPendingTokenTransfer'
          defaultMessage='Sending {tokenValue} to'
          values={ {
            tokenValue: (
              <TokenValue value={ valueInput.value } id={ token.id } />
            )
          }
          }
        />
        {this.renderRecipient(toInput.value)}
      </List.Description>
    );
  };

  /**
   * Render description when transferring ETH
   */
  renderValueTransfer = (transaction) => (
    <List.Description className={ styles.listDescription }>
      <FormattedMessage
        id='application.status.signerPendingValueTransfer'
        defaultMessage='Sending {etherValue} to'
        values={ {
          etherValue: <EtherValue value={ transaction.value } />
        }
        }
      />
      {this.renderRecipient(transaction.to)}
    </List.Description>
  );
}

export default RequestItem;
