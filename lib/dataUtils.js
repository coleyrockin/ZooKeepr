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

function writeJsonFile(filePath, payload) {
  const writeOperation = () =>
    new Promise((resolve, reject) => {
      fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8', err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

  const previous = writeQueues.get(filePath) || Promise.resolve();
  const next = previous.then(writeOperation, writeOperation);
  writeQueues.set(filePath, next);
  return next;
}

module.exports = {
  sanitizeString,
  createNextId,
  writeJsonFile
};
