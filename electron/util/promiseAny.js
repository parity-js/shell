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

/**
 * Resolves when the 1st promise in an array of promises resolves
 * @see https://stackoverflow.com/questions/37234191/resolve-es6-promise-with-first-success
 * @param {Array} promises
 */
const promiseAny = (promises) => {
  return Promise.all(promises.map(p => {
    // If a request fails, count that as a resolution so it will keep
    // waiting for other possible successes. If a request succeeds,
    // treat it as a rejection so Promise.all immediately bails out.
    return p.then(
      val => Promise.reject(val),
      err => Promise.resolve(err)
    );
  }))
    .then(
      // If '.all' resolved, we've just got an array of errors.
      errors => Promise.reject(errors),
      // If '.all' rejected, we've got the result we wanted.
      val => Promise.resolve(val)
    );
};

module.exports = promiseAny;
