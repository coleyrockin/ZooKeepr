const router = require('express').Router();
const { listZookeepers, findZookeeper, createZookeeper } = require('../../lib/zookeepers');
const { rateLimitWrites, requireWriteAuth } = require('./writeSecurity');

router.get('/zookeepers', (req, res) => {
  res.json(listZookeepers(req.query || {}));
});

router.get('/zookeepers/:id', (req, res) => {
  const result = findZookeeper(req.params.id);
  if (!result) {
    return res.status(404).json({ error: `Zookeeper with id '${req.params.id}' not found.` });
  }
  return res.json(result);
});

router.post('/zookeepers', rateLimitWrites, requireWriteAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    const zookeeper = await createZookeeper(req.body);
    res.status(201).json(zookeeper);
  } catch (err) {
    if (err.message.includes('Invalid zookeeper payload')) {
      return res.status(400).json({ error: 'The zookeeper is not properly formatted.' });
    }
    console.error(`Could not create zookeeper: ${err.message}`);
    return res.status(500).json({ error: 'Unable to save zookeeper data.' });
  }
});

module.exports = router;
