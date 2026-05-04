const fs = require('fs');

const writeQueues = new Map();

function sanitizeString(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (!Number.isInteger(maxLength) || maxLength <= 0) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength);
}

function createNextId(records = []) {
  const maxId = records.reduce((max, record) => {
    const parsed = Number.parseInt(record?.id, 10);
    if (!Number.isNaN(parsed)) {
      return Math.max(max, parsed);
    }
    return max;
  }, -1);

  return String(maxId + 1);
}

// Raw, un-queued JSON write. Always go through writeJsonFile or withFileLock
// from outside lib code; this is exported for use *inside* a withFileLock task.
function writeJsonFileRaw(filePath, payload) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8', err =>
      err ? reject(err) : resolve()
    );
  });
}

function chainOnQueue(filePath, task) {
  const previous = writeQueues.get(filePath) || Promise.resolve();
  const next = previous.then(task, task);
  // store a settled tail so a rejection here doesn't poison the next caller
  writeQueues.set(
    filePath,
    next.catch(() => undefined)
  );
  return next;
}

function writeJsonFile(filePath, payload) {
  return chainOnQueue(filePath, () => writeJsonFileRaw(filePath, payload));
}

// Run an arbitrary task serialized against `filePath`. Use this when a write
// needs to read-then-mutate-then-persist atomically (e.g. ID assignment).
function withFileLock(filePath, task) {
  return chainOnQueue(filePath, task);
}

module.exports = {
  sanitizeString,
  createNextId,
  writeJsonFile,
  writeJsonFileRaw,
  withFileLock
};
