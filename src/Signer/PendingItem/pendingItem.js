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
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';

import SignerLayout from '@parity/ui/lib/Signer/Layout';

import PluginStore from '../pluginStore';
import styles from './pendingItem.css';

const pluginStore = PluginStore.get();

const DEFAULT_ORIGIN = {
  type: 'unknown',
  details: ''
};

function PendingItem ({ accounts, className, data, isFocused }) {
  const { payload } = data;
  const Handler = pluginStore.findHandler(payload, accounts);

  if (!Handler) {
    console.error('No transaction handler found for', payload);

    return (
      <SignerLayout className={ `${styles.error} ${className}` }>
        <FormattedMessage
          id='shell.signer.error.noHandler'
          defaultMessage='Unable to find a Signer handler for the specific transaction, no fallback available.'
        />
      </SignerLayout>
    );
  }

  return (
    <Handler isFocused={ isFocused } request={ { ...data, origin: data.origin || DEFAULT_ORIGIN } } />
  );
}

PendingItem.propTypes = {
  accounts: PropTypes.object.isRequired,
  className: PropTypes.string,
  data: PropTypes.object.isRequired,
  isFocused: PropTypes.bool
};

export default observer(PendingItem);
