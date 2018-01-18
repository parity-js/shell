import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { FormattedMessage } from 'react-intl';

import BlockNumber from '@parity/ui/lib/BlockNumber';
import ClientVersion from '@parity/ui/lib/ClientVersion';
import GradientBg from '@parity/ui/lib/GradientBg';
import { HomeIcon } from '@parity/ui/lib/Icons';
import NetChain from '@parity/ui/lib/NetChain';
import NetPeers from '@parity/ui/lib/NetPeers';
import StatusIndicator from '@parity/ui/lib/StatusIndicator';

// import Consensus from './Consensus';
// import DefaultAccount from './DefaultAccount';
// import AccountStore from '../ParityBar/accountStore';
// import PluginStore from './pluginStore';
// import SignerPending from './SignerPending';
// import Upgrade from './Upgrade';

import styles from './StatusBar.css';

// const pluginStore = PluginStore.get();

function StatusBar({ className = '', upgradeStore }, { api }) {
  // const accountStore = AccountStore.get(api);

  return (
    <div className={`${styles.container} ${className}`}>
      <GradientBg className={styles.bar}>
        <div className={styles.status}>
          <a href="#/" className={styles.home}>
            <HomeIcon />
          </a>
          <ClientVersion className={styles.version} />
          <div className={styles.upgrade}>
            {/* <Consensus upgradeStore={upgradeStore} />
            <Upgrade upgradeStore={upgradeStore} /> */}
          </div>
          <div className={styles.plugins}>
            {/* {
              pluginStore.components.map((Component, index) => (
                <Component key={ index } />
              ))
            } */}
            <div className={styles.divider} />

            {/* <DefaultAccount accountStore={accountStore} /> */}
            <StatusIndicator
              className={styles.health}
              id="application.status.health"
            />
            {/* <SignerPending className={styles.pending} /> */}

            <div className={styles.divider} />
            <BlockNumber
              className={styles.blockNumber}
              message={
                <FormattedMessage
                  id="ui.blockStatus.bestBlock"
                  defaultMessage=" best block"
                />
              }
            />
            <NetPeers
              className={styles.peers}
              message={
                <FormattedMessage
                  id="ui.netPeers.peers"
                  defaultMessage=" peers"
                />
              }
            />
            <NetChain className={styles.chain} />
          </div>
        </div>
      </GradientBg>
    </div>
  );
}

StatusBar.contextTypes = {
  api: PropTypes.object.isRequired
};

StatusBar.propTypes = {};

export default observer(StatusBar);
