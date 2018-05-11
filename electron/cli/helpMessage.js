module.exports = `
Parity UI.
Copyright 2015, 2016, 2017, 2018 Parity Technologies (UK) Ltd.

Operating Options:
    --no-run-parity
        Parity UI will not attempt to run the locally installed parity.

    --ui-dev
        Parity UI will load http://localhost:3000. WARNING: Only use this is you plan on developing on Parity UI.

    --ws-interface=[IP]
        Specify the hostname portion of the WebSockets server Parity UI will connect to. IP should be an interface's IP address. (default: 127.0.0.1)

    --ws-port=[PORT]
        Specify the port portion of the WebSockets server Parity UI will connect to. (default: 8546)

All other flags passed to Parity UI will be passed down to parity when trying to launch it.
`;
