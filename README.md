# Parity Wallet

The Electron app of Parity Wallet user interface.

## Development

0. Install [Node](https://nodejs.org/) if not already available
0. Install the npm modules via `npm install`
0. Parity should be run with `parity --ui-no-validation [...options]` (where `options` can be `--chain testnet`)
0. Start the development environment via `npm start`
0. Connect to [http://localhost:3000](http://localhost:3000)

If you wish to develop directly inside the Electron app, you can run parallely

0. `npm run electron:dev`

This will launch an Electron app listening to localhost:3000.

Finally, to test the Electron app in an almost-production environment, run 

0. `npm run electron`

This will *not* listen to localhost:3000, but will instead bundle the whole app, and launch an Electron instance which launches the bundled app. If everything works using this command, there's a good chance that the final binary will work too.

## Create Electron binaries on Travis

Travis will do the dirty work of creating installers on all platforms. To do so, simply push your code to the `ci-package` branch.

For example, if you do your modifications on your personal branch `my-branch` and want to build binaries for this branch, run:

0. `git checkout ci-package`
0. `git reset --hard my-branch` (copy my-branch to ci-package)
0. `git push --force ci-package` (will overwrite the previous ci-package, but that's all right)

Travis will trigger the binaries build when on `ci-package` branch. The binaries will then be uploaded to https://github.com/Parity-JS/shell/releases as drafts.
