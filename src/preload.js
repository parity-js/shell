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

import fs from 'fs';
import { ipcRenderer, remote, webFrame } from 'electron';
import path from 'path';

// The following two lines is just a proxy between the webview and the renderer process.
// If we receive an IPC message from the shell, we relay it to the webview as
// postMessage.
ipcRenderer.on('PARITY_SHELL_IPC_CHANNEL', (_, data) => window.postMessage(data, '*'));
// If we receive a postMessage from the webview, we transfer it to the renderer
// as an IPC message.
window.addEventListener('message', (event) => {
  ipcRenderer.sendToHost('PARITY_SHELL_IPC_CHANNEL', { data: event.data });
});

// Load inject.js as a string to inject it into the webview with executeJavaScript
const injectFile = fs.readFileSync(path.join(remote.getGlobal('dirName'), '..', '.build', 'inject.js'), 'utf8');

webFrame.executeJavaScript(injectFile);
