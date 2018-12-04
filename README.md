# Parity UI

## ⚠ Parity Technologies is looking for a new maintainer for this repo. If you are interested, please get in touch at admin@parity.io.

## ⚠ Parity UI is currently only compatible with Parity Ethereum <v2.0. Read about [possible alternatives here](#parity-ui-alternatives).

### [Download the latest release](https://github.com/parity-js/shell/releases/latest)

[![GPLv3](https://img.shields.io/badge/license-GPL%20v3-green.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)

### Join the chat!

Get in touch with us on Gitter:
[![Gitter: Parity](https://img.shields.io/badge/gitter-parity-4AB495.svg)](https://gitter.im/paritytech/parity)

Or join our community on Matrix:
[![Riot: +Parity](https://img.shields.io/badge/riot-%2Bparity%3Amatrix.parity.io-orange.svg)](https://riot.im/app/#/group/+parity:matrix.parity.io)

Be sure to check out [our wiki](https://wiki.parity.io/Parity-Wallet) for more information.

----
## About Parity UI

Parity UI is a User Interface desktop application for [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) >=v1.10. It features a Wallet supporting Ether and ERC-20 Tokens, a Contract development environment, and so much more. Parity UI will download and run [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) in the background if it is not found on the system. 
By default Parity UI will try connect to a Parity Ethereum node using Websocket port 8546. You can use alternative ports, see [CLI Options](#cli-options) below.

You can download Parity UI [here](https://github.com/parity-js/shell/releases/latest) or follow the instructions below to build from source.

## Parity UI alternatives

### View and send Ether and tokens

As Parity UI is not working properly with Parity Ethereum >2.0, you can use [MyCrypto Desktop app](https://download.mycrypto.com/) connected to a local full node to interact with your accounts. Follow [these steps](https://support.mycrypto.com/networks/run-your-own-node-with-mycrypto.html) to connect MyCrypto Desktop to a local Parity Ethereum node. Parity UI accounts' JSON keystore files can be found at the following location:
- Mac OS X: `~/Library/Application\ Support/io.parity.ethereum/keys/ethereum/`
- Linux: `$HOME/.local/share/io.parity.ethereum/keys`
- Windows 7/10: `%HOMEPATH%/AppData/Roaming/Parity/Ethereum/keys`

Import an account to MyCrypto by selecting the corresponding JSON keystore file. You will require your account's password to unlock it (originally setup with Parity UI).

### Smart contract development

You can use [Remix](https://remix.ethereum.org/) connected to a local Parity Ethereum full node as an alternative to Parity UI for smart contracts development and deployment. Make sure that Remix is allowed to connect to your node by setting up the right [JSON-RPC cors policy](https://ethereum.stackexchange.com/questions/54639/is-it-possible-to-connect-remix-and-parity?rq=1).

## Install from the snap store

In any of the [supported Linux distros](https://snapcraft.io/docs/core/install):

```bash
sudo snap install parity-ui
```

Or, if you want to contribute testing the upcoming release:

```bash
sudo snap install parity-ui --beta
```

And to test the latest code landed into the master branch:

```bash
sudo snap install parity-ui --edge
```

---

## Build from source

```bash
npm install
npm run electron
```

You should see the Electron app popping up.

### Build the binary (Optional)

One further, albeit optional step is to create an OS-specific binary. This is done with the following command:

```bash
npm run release
```

This command may take some time. Once finished, you will see binaries for your OS in the `dist/` folder.

## Developing

The best Developer Experience is achieved by running:

```bash
parity --ui-no-validation # Warning: INSECURE. Only use it when developing the UI.
npm start
```

A new browser tab will open on `http://localhost:3000` with the UI, and this tab will refresh on any code change. This DX allows fast iterations.

If you want to test the rendering in an Electron window, run the following command in parallel with the previous command:

```bash
npm run electron:dev
```

This will spawn an Electron window serving `http://localhost:3000`. Same thing, the Electron window will refresh on any code change.

## CLI Options
All other flags passed to Parity UI will be passed down to parity when trying to launch it.
```bash
Operating Options:
    --no-run-parity
        Parity UI will not attempt to run 
        the locally installed parity.

    --ui-dev
        Parity UI will load http://localhost:3000. 
        WARNING: Only use this is you plan on developing on Parity UI.

    --ws-interface=[IP]
        Specify the hostname portion of the WebSockets server 
        Parity UI will connect to. IP should be an 
        interface's IP address. (default: 127.0.0.1)

    --ws-port=[PORT]
        Specify the port portion of the WebSockets 
        server Parity UI will connect to. (default: 8546)
```
