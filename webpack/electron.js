
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

const path = require('path');

const rulesEs6 = require('./rules/es6');
const rulesParity = require('./rules/parity');
const Shared = require('./shared');

const DEST = process.env.BUILD_DEST || '.build';
const ENV = process.env.NODE_ENV || 'development';

const isProd = ENV === 'production';

module.exports = {
  cache: !isProd,
  devtool: '#source-map',
  context: path.join(__dirname, '../electron'),
  entry: './index.js',
  output: {
    path: path.join(__dirname, '../', DEST),
    filename: 'electron.js'
  },
  node: {
    __dirname: false
  },
  target: 'electron-main',

  module: {
    rules: [
      rulesParity,
      rulesEs6,
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'happypack/loader',
          options: {
            id: 'babel'
          }
        }]
      }
    ]
  },

  plugins: Shared.getPlugins(false) // UglifyJS bugs on electron-dl, so we don't use isProd
};
