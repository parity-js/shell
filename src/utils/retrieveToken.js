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

import qs from 'querystring';
import store from 'store';

const TOKEN_QS = 'token=';

const parseTokenQuery = query => {
  try {
    return qs.parse(query).token;
  } catch (error) {
    return null;
  }
};

const retrieveToken = (location = window.location) => {
  const hashIndex = location.hash ? location.hash.indexOf(TOKEN_QS) : -1;
  const searchIndex = location.search ? location.search.indexOf(TOKEN_QS) : -1;

  if (hashIndex !== -1) {
    // extract from hash (e.g. http://127.0.0.1:8180/#/auth?token=...)
    return parseTokenQuery(location.hash.substr(hashIndex));
  } else if (searchIndex !== -1) {
    // extract from query (e.g. http://127.0.0.1:3000/?token=...)
    return parseTokenQuery(location.search);
  }

  // we don't have a token, attempt from localStorage
  return store.get('sysuiToken');
};

export default retrieveToken;
