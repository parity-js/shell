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

const fs = window.require('fs');
const util = window.require('util');
const path = window.require('path');

import unzip from 'unzipper';

import { getHashFetchPath } from '../host';
import ExpoRetry from './expoRetry';
import Contracts from '@parity/shared/lib/contracts';
import { sha3 } from '@parity/api/lib/util/sha3';
import { bytesToHex } from '@parity/api/lib/util/format';
import { ensureDir as fsEnsureDir, emptyDir as fsEmptyDir } from 'fs-extra';
import { http, https } from 'follow-redirects';

const fsExists = util.promisify(fs.stat);
const fsStat = util.promisify(fs.stat);
const fsRename = util.promisify(fs.rename);
const fsReadFile = util.promisify(fs.readFile);
const fsUnlink = util.promisify(fs.unlink);
const fsReaddir = util.promisify(fs.readdir);
const fsRmdir = util.promisify(fs.rmdir);

const MAX_DOWNLOADED_FILE_SIZE_BYTES = 10485760; // 20MB

function registerFailedAttemptAndThrow (hash, url, e) {
  ExpoRetry.get().registerFailedAttempt(hash, url);
  throw e;
}

function checkHashMatch (hash, path) {
  return fsReadFile(path).then(content => {
    if (sha3(content) !== `0x${hash}`) { throw new Error(`Hashes don't match: expected 0x${hash}, got ${sha3(content)}`); }
  });
}

// List directory contents and tell if each item is a file or a directory
function ls (folderPath) {
  return fsReaddir(folderPath)
    .then(filenames =>
      Promise.all(filenames.map(filename => {
        const filePath = path.join(folderPath, filename);

        return fsStat(filePath).then(stat => ({ isDirectory: stat.isDirectory(), filePath, filename }));
      }))
    );
}

function rawUnzipTo (zipPath, extractPath) {
  return new Promise((resolve, reject) => {
    const unzipParser = unzip.Extract({ path: extractPath });

    fs.createReadStream(zipPath).pipe(unzipParser);

    unzipParser.on('error', reject);

    unzipParser.on('close', resolve);
  });
}

function unzipThroughTo (tempPath, extractPath, finalPath) {
  return rawUnzipTo(tempPath, extractPath)
    .then(() => fsUnlink(tempPath))
    .then(() => ls(extractPath))
    .then(files => {
      // Check if the zip file contained a root folder
      if (files.length === 1 && files[0].isDirectory) {
        // Rename the root folder (contaning the dapp) to finalPath
        const rootFolderPath = files[0].filePath;

        return fsRename(rootFolderPath, finalPath)
            .then(() => fsRmdir(extractPath));
      } else {
        // No root folder: extractPath contains the dapp
        return fsRename(extractPath, finalPath);
      }
    });
}

function download (url, destinationPath) {
  const file = fs.createWriteStream(destinationPath); // Will replace any existing file

  return new Promise((resolve, reject) => {
    const httpx = url.startsWith('https:') ? https : http;

    httpx.get(url, response => {
      var size = 0;

      response.on('data', (data) => {
        size += data.length;

        if (size > MAX_DOWNLOADED_FILE_SIZE_BYTES) {
          response.destroy();
          response.unpipe(file);
          fsUnlink(destinationPath);
          reject(`File download aborted: exceeded maximum size of ${MAX_DOWNLOADED_FILE_SIZE_BYTES} bytes`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
      });
    });
  });
}

function hashDownload (hash, url, zip = false) {
  const tempFilename = `${hash}.part`;
  const tempPath = path.join(getHashFetchPath(), 'partial', tempFilename);

  const finalPath = path.join(getHashFetchPath(), 'files', hash);

  return download(url, tempPath)
      // Don't register a failed attempt if the download failed; the user might be offline.
      .then(() => checkHashMatch(hash, tempPath).catch(e => registerFailedAttemptAndThrow(hash, url, e)))
      .then(() => { // Hashes match
        if (!zip) {
          return fsRename(tempPath, finalPath);
        } else {
          const extractPath = path.join(getHashFetchPath(), 'partial-extract', tempFilename);

          return unzipThroughTo(tempPath, extractPath, finalPath);
        }
      });
}

function queryRegistryAndDownload (api, hash, expected) {
  const { githubHint } = Contracts.get(api);

  return githubHint.getEntry(`0x${hash}`).then(([slug, commitBytes, author]) => {
    const commit = bytesToHex(commitBytes);

    if (!slug) {
      if (commit === '0x0000000000000000000000000000000000000000' && author === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No GitHub Hint entry found.`);
      } else {
        throw new Error(`GitHub Hint entry has empty slug.`);
      }
    }

    let url;
    let zip;

    if (commit === '0x0000000000000000000000000000000000000000') { // The slug is the URL to a file
      if (!slug.toLowerCase().startsWith('http')) { throw new Error(`GitHub Hint URL ${slug} isn't HTTP/HTTPS.`); }
      url = slug;
      zip = false;
    } else if (commit === '0x0000000000000000000000000000000000000001') { // The slug is the URL to a dapp zip file
      if (!slug.toLowerCase().startsWith('http')) { throw new Error(`GitHub Hint URL ${slug} isn't HTTP/HTTPS.`); }
      url = slug;
      zip = true;
    } else { // The slug is the `owner/repo` of a dapp stored in GitHub
      url = `https://codeload.github.com/${slug}/zip/${commit.substr(2)}`;
      zip = true;
    }

    if (ExpoRetry.get().canAttemptDownload(hash, url) === false) {
      throw new Error(`Previous attempt at downloading ${hash} from ${url} failed; retry delay time not yet elapsed.`);
    }

    return hashDownload(hash, url, zip);
  });
}

function checkExpectedMatch (hash, filePath, expected) {
  return fsStat(filePath).then(stat => {
    if (stat.isDirectory() && expected === 'file') {
      throw new Error(`Expected ${hash} to be a file; got a folder (dapp).`);
    } else if (!stat.isDirectory() && expected === 'dapp') {
      throw new Error(`Expected ${hash} to be a dapp; got a file.`);
    }
  });
}

// Download a file or download and extract a dapp zip archive, using GitHub Hint
// and the content hash of the file
export default class HashFetch {
  static instance = null;
  initialize = null; // Initialization promise
  promises = {}; // Unsettled or resolved HashFetch#fetch promises only

  static get () {
    if (!HashFetch.instance) {
      HashFetch.instance = new HashFetch();
    }

    return HashFetch.instance;
  }

  constructor () {
    this.initialize = this._initialize();
  }

  _initialize () {
    const hashFetchPath = getHashFetchPath();

    return fsEnsureDir(hashFetchPath)
      .then(() =>
        Promise.all([
          fsEnsureDir(path.join(hashFetchPath, 'files')),
          fsEmptyDir(path.join(hashFetchPath, 'partial')),
          fsEmptyDir(path.join(hashFetchPath, 'partial-extract')),
          ExpoRetry.get().load()
        ]))
      .catch(e => {
        throw new Error(`HashFetch initialization failed ${e}`);
      });
  }

  // Returns a Promise that resolves with the path to the file or directory.
  // `expected` is either 'file' or 'dapp'.
  fetch (api, hash, expected) {
    hash = hash.toLowerCase();

    if (!/^[0-9a-z]{64}$/.test(hash)) { return Promise.reject(`${hash} isn't a valid hash.`); }

    return this.initialize.then(() => {
      const filePath = path.join(getHashFetchPath(), 'files', hash);

      if (!(hash in this.promises)) { // There is no ongoing or resolved fetch for this hash
        this.promises[hash] = fsExists(filePath)
          .catch(() => queryRegistryAndDownload(api, hash, expected))
          .then(() => checkExpectedMatch(hash, filePath, expected))
          .then(() => filePath)
          .catch(e => { delete this.promises[hash]; throw e; }); // Don't prevent retries if the fetch failed
      }
      return this.promises[hash];
    });
  }
}
