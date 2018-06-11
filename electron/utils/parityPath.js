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

const { app } = require('electron');

// TODO parityPath is now in the Application Data folder by default, it would
// be nice to first look if /usr/bin/parity exists (and return that as
// parityPath). For now we keep Application Data as parityPath.
// See https://github.com/parity-js/shell/issues/66

// We cannot use app.getPath('userData') outside of the exports because
// it would then be executed before app.setPath('userData') in index.js
module.exports = () => `${app.getPath('userData')}/parity${process.platform === 'win32' ? '.exe' : ''}`;
