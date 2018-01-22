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
import methodGroups from '@parity/mobx/lib/methodGroups';

import RequestGroups from './RequestGroups';
import styles from './DappRequests.css';

class DappRequests extends Component {
  // When we approve a requestGroup, when approve all the requests, and add permissions
  // to all the other methods in the same methodGroup
  handleApproveRequestGroup = (requests, groupId, appId) => {
    requests
      .map(({ requestId }) => requestId)
      .forEach(this.props.requestsStore.approveRequest);
    methodGroups[groupId].methods.forEach(method =>
      this.props.methodPermissionsStore.addAppPermission(appId, method)
    );
  };

  // When we reject a requestGroup, we reject the requests in that group
  handleRejectRequestGroup = requests => {
    requests
      .map(({ requestId }) => requestId)
      .forEach(this.props.requestsStore.rejectRequest);
  };

  render() {
    if (!this.props.requestsStore || !this.props.requestsStore.hasRequests) {
      return null;
    }

    return (
      <div className={styles.requests}>
        {Object.keys(this.props.requestsStore.groupedRequests).map(appId => (
          <RequestGroups
            key={appId}
            appId={appId}
            onApproveRequestGroup={this.handleApproveRequestGroup}
            onRejectRequestGroup={this.handleRejectRequestGroup}
            requestGroups={this.props.requestsStore.groupedRequests[appId]}
          />
        ))}
      </div>
    );
  }
}

export default inject('methodPermissionsStore', 'requestsStore')(
  observer(DappRequests)
);
