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
import PropTypes from 'prop-types';

import Page from '@parity/ui/lib/Page';

import DappCard from './DappCard';
import ExternalOverlay from './ExternalOverlay';
import styles from './DappHomepage.css';

@inject('displayAppsStore')
@observer
class App extends Component {
  static propTypes = {
    availability: PropTypes.string.isRequired,
    displayAppsStore: PropTypes.object.isRequired
  };

  renderSection = apps =>
    apps &&
    apps.length > 0 && (
      <div className={styles.dapps}>
        {apps.map((app, index) => (
          <DappCard
            app={app}
            availability={this.props.availability}
            className={styles.dapp}
            key={`${index}_${app.id}`}
          />
        ))}
      </div>
    );

  render() {
    const { displayAppsStore } = this.props;

    return (
      <Page className={styles.layout}>
        {this.renderSection(displayAppsStore.pinned)}
        {this.renderSection(displayAppsStore.visibleUnpinned)}
        <ExternalOverlay />
      </Page>
    );
  }

  onClickAcceptExternal = () => {
    this.props.dappsStore.closeExternalOverlay();
  };
}

export default App;
