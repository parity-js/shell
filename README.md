# Parity UI
## This project is not actively maintained by Parity Technologies anymore. This is a community maintained project.

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
