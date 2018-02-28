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

import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';

import AccountsStore from '../../ParityBar/accountStore';
import PendingItem from '../PendingItem';
import PendingStore from '../pendingStore';

import styles from './pendingList.css';

@observer
class PendingList extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    className: PropTypes.string
  };

  accountsStore = AccountsStore.get(this.context.api);
  pendingStore = PendingStore.get(this.context.api);

  render () {
    const { className } = this.props;
    const { allAccounts } = this.accountsStore; // An array of accounts
    const allAccountsInfo = allAccounts.reduce((acc, value) => { // We create a addr->account map
      acc[value.address] = value;
      return acc;
    }, {});
    const { pending } = this.pendingStore;

    if (!pending.length) {
      return (
        <div className={ `${styles.none} ${className}` }>
          <FormattedMessage
            id='signer.embedded.noPending'
            defaultMessage='There are currently no pending requests awaiting your confirmation'
          />
        </div>
      );
    }

    return (
      <div className={ `${styles.list} ${className}` }>
        {
          pending
            .sort((a, b) => new BigNumber(a.id).cmp(b.id))
            .map((data, index) => (
              <PendingItem
                accounts={ allAccountsInfo }
                data={ data }
                isFocused={ index === 0 }
                key={ data.id }
              />
            ))
        }
      </div>
    );
  }
}

export default PendingList;
