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
import { inject, observer } from 'mobx-react';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header';
import GradientBg from '@parity/ui/lib/GradientBg';
import { FormattedMessage } from 'react-intl';

import Signer from './plugin-signer-account/src/Request';
import styles from './Signer.css';

@inject('signerRequestsToConfirmStore')
@observer
class App extends Component {
  render() {
    const { requestsToConfirm } = this.props.signerRequestsToConfirmStore;

    console.log(requestsToConfirm);
    return requestsToConfirm.length ? (
      <div className={styles.container}>
        <GradientBg className={styles.header}>
          <Header as="h2">
            <FormattedMessage
              id="parityBar.title.signer"
              defaultMessage="Parity Signer: Pending"
            />
          </Header>
        </GradientBg>
        {requestsToConfirm.map(request => (
          <Signer key={request.id} request={request} />
        ))}
      </div>
    ) : null;
  }
}

export default App;
