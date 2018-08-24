# Energy Web Client UI

To quickly get started just download the binary for your OS and install the software.

[Windows](https://github.com/energywebfoundation/energyweb-ui/releases/download/v0.4.0/parity-ui-setup-0.4.0.exe)

[Mac](https://github.com/energywebfoundation/energyweb-ui/releases/download/v0.4.0/parity-ui-0.4.0.pkg)

[Linux](https://github.com/energywebfoundation/energyweb-ui/releases/download/v0.4.0/latest-linux.yml) insertlink***

[Release history](https://github.com/energywebfoundation/energyweb-ui/releases)

[![GPLv3](https://img.shields.io/badge/license-GPL%20v3-green.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)

## About Energy Web Client UI

The Energy Web Client UI (EWF UI) is a User Interface desktop application for the [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) >=v1.10. It features a Wallet supporting Ether and ERC-20 Tokens, a contract development environment, and so much more. EWF UI will download and run [Parity Ethereum Client](https://github.com/paritytech/parity/blob/master/README.md) in the background if it is not found on the system. 
By default EWF UI will try connect to a Tobalaba using Websocket port 8546. 

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

### EWF Client usage
Visit our [EWF Wiki](https://energyweb.atlassian.net/wiki/spaces/EWF/pages/544374788/Setting+Up+a+Node) for high level, or Parity's [Wiki](https://wiki.parity.io/) for in depth information.

### Any issues with the client itself?
Client related issues are best filed in the [Parity Repo](https://github.com/paritytech/parity-ethereum). 

### How to get in touch?
[Get in touch](https://energyweb.org/contact-us/) with EWF.

Get in touch with Parity on Gitter:
[![Gitter: Parity](https://img.shields.io/badge/gitter-parity-4AB495.svg)](https://gitter.im/paritytech/parity)

Or join the Parity community on Matrix:
[![Riot: +Parity](https://img.shields.io/badge/riot-%2Bparity%3Amatrix.parity.io-orange.svg)](https://riot.im/app/#/group/+parity:matrix.parity.io)
