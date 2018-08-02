# Energy Web Client UI

### [Download the latest release](https://tbd)

[![GPLv3](https://img.shields.io/badge/license-GPL%20v3-green.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)

## About Parity UI

Parity UI is a User Interface desktop application for [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) >=v1.10. It features a Wallet supporting Ether and ERC-20 Tokens, a Contract development environment, and so much more. Parity UI will download and run [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) in the background if it is not found on the system. 
By default Parity UI will try connect to a Parity Ethereum node using Websocket port 8546. You can use alternative ports, see [CLI Options](#cli-options) below.

You can download Parity UI [here](https://github.com/parity-js/shell/releases/latest) or follow the instructions below to build from source.

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

### Any client related issues? Join the Parity chat!

Get in touch with Parity on Gitter:
[![Gitter: Parity](https://img.shields.io/badge/gitter-parity-4AB495.svg)](https://gitter.im/paritytech/parity)

Or join our the Parity community on Matrix:
[![Riot: +Parity](https://img.shields.io/badge/riot-%2Bparity%3Amatrix.parity.io-orange.svg)](https://riot.im/app/#/group/+parity:matrix.parity.io)

Check out [our wiki](https://wiki.parity.io/Parity-Wallet) for more information.
