# Parity UI - User Interface Desktop Application for Parity Ethereum Client

## [» Download the latest release «](https://github.com/parity-js/shell/releases/latest)

[![GPLv3](https://img.shields.io/badge/license-GPL%20v3-green.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)

### Join the chat!

Get in touch with us on Gitter:
[![Gitter: Parity](https://img.shields.io/badge/gitter-parity-4AB495.svg)](https://gitter.im/paritytech/parity)

Or join our community on Matrix:
[![Riot: +Parity](https://img.shields.io/badge/riot-%2Bparity%3Amatrix.parity.io-orange.svg)](https://riot.im/app/#/group/+parity:matrix.parity.io)

Be sure to check out [our wiki](https://wiki.parity.io/Parity-Wallet) for more information.

----
## About Parity UI

Parity UI is a User Interface desktop application for [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) >=v1.10. In order to use Parity UI, you must have [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) >=v1.10 installed on your system. 
By default Parity UI will listen to any running Parity client on your system and connect to it. If none was found, a Parity Ethereum Client process will be launched in background and connect to Ethereum mainnet.

If you run into any User Interface related issue while using Parity UI, feel free to file one in this repository or hop on our Gitter or Riot chat room to ask a question. We are glad to help!

You can download Parity UI at https://github.com/parity-js/shell/releases/latest or follow the instructions below to build from source.

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

One further, albeit optional step is to create an OS-spefific binary. This is done with the following command:

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

If you want to test the rendering in an Electron window, run parallely with the previous command:

```bash
npm run electron:dev
```

This will spawn an Electron window serving `http://localhost:3000`. Same thing, the Electron window will refresh on any code change.

## Screenshot
![Parity UI home](https://wiki.parity.io/images/parity-UI-0.jpg)
