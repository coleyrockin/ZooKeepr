const { rateLimitWrites, requireWriteAuth } = require('../routes/apiRoutes/writeSecurity');

function buildReq(overrides = {}) {
  return {
    method: 'POST',
    ip: '127.0.0.1',
    get: () => undefined,
    ...overrides
  };
}

function buildRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('requires the write feature flag to be enabled', () => {
  process.env.ZOO_WRITES_ENABLED = 'false';

  const req = buildReq();
  const res = buildRes();
  const next = jest.fn();

  requireWriteAuth(req, res, next);

  expect(res.statusCode).toBe(403);
  expect(res.body.error).toMatch(/disabled/);
  expect(next).not.toHaveBeenCalled();
});

test('requires a configured token for write requests', () => {
  process.env.ZOO_WRITES_ENABLED = 'true';
  delete process.env.ZOO_WRITE_TOKEN;

  const req = buildReq();
  const res = buildRes();
  const next = jest.fn();

  requireWriteAuth(req, res, next);

  expect(res.statusCode).toBe(401);
  expect(res.body.error).toMatch(/token is not configured/i);
  expect(next).not.toHaveBeenCalled();
});

test('allows writes with a valid write token', () => {
  process.env.ZOO_WRITES_ENABLED = 'true';
  process.env.ZOO_WRITE_TOKEN = 'super-secret-token';

  const req = buildReq({
    get: headerName => {
      if (headerName === 'x-zoo-write-token') {
        return 'super-secret-token';
      }
      return undefined;
    }
  });
  const res = buildRes();
  const next = jest.fn();

  requireWriteAuth(req, res, next);

  expect(next).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toBe(200);
});

test('rate limits write requests by IP', () => {
  process.env.ZOO_WRITE_RATE_LIMIT = '1';
  const req = buildReq();
  const res = buildRes();
  const res2 = buildRes();
  const next = jest.fn();

  rateLimitWrites(req, res, next);
  rateLimitWrites(req, res2, next);

  expect(next).toHaveBeenCalledTimes(1);
  expect(res2.statusCode).toBe(429);
  expect(res2.body.error).toMatch(/too many write requests/i);
});
