const redis = require('redis');
const client = redis.createClient();
const vCaptcha = require('./index')({ client });
const noClientVCaptcha = require('./index')();
const phrases = require('./phrases');

const userId = 'userId';
const solvedCaptcha = {
  userId: userId,
  unique: 'unique',
  key: JSON.stringify([1, 0]),
  solution: [1, 0]
};

beforeAll(done => {
  client.del(`vcaptcha:user:${userId}`);
  done();
});

describe('when creating unsecure', () => {

  it('should return key, data & names', () => {
    const expectedLength = 5;
    const expectedLanguage = 'fr';
    const captcha = noClientVCaptcha.unsecureCreate({
      language: expectedLanguage,
      length: expectedLength
    });

    expect(captcha.key).toBeDefined();
    expect(captcha.data).toBeDefined();
    expect(captcha.data.length).toBe(expectedLength);
    expect(captcha.names).toBeDefined();
    expect(captcha.names.length).toBe(2);
    expect(captcha.phrase).toBe(phrases(expectedLanguage, captcha.names));

  });
});

describe('when solving unsecure', () => {

  it('should fail if missing params', () => {

    expect(function () {
      vCaptcha.unsecureSolve();
    }).toThrow();

    expect(function () {
      vCaptcha.unsecureSolve({});
    }).toThrow();

  });

  it('should fail if wrong params', () => {
    expect(vCaptcha.unsecureSolve({ key: solvedCaptcha.key, solution: {} })).toBe(false);
  });

  it('should fail if wrong solution', () => {
    expect(vCaptcha.unsecureSolve({ key: solvedCaptcha.key, solution: [0, 1] })).toBe(false);
  });

  it('should succeed if right answer', () => {
    expect(noClientVCaptcha.unsecureSolve(solvedCaptcha)).toBe(true);
  });
});

describe('when creating', () => {
  it('should fail if missing params', () => {

    expect(function () {
      vCaptcha.create();
    }).toThrow();

    expect(function () {
      vCaptcha.create({});
    }).toThrow();

    expect(function () {
      vCaptcha.create({ userId: userId });
    }).toThrow();

    expect(function () {
      noClientVCaptcha.create({ userId: userId }, function () { });
    }).toThrow();

  });

  it('should return key, data & names', done => {
    const expectedLength = 5;
    const expectedLanguage = 'fr';
    vCaptcha.create({
      userId: userId,
      language: expectedLanguage,
      length: expectedLength
    }, (err, captcha, count) => {
      expect(err).toBe(null);
      expect(count).toBe(null);
      expect(captcha.key).toBeUndefined();
      expect(captcha.data).toBeDefined();
      expect(captcha.data.length).toBe(expectedLength);
      expect(captcha.names).toBeDefined();
      expect(captcha.names.length).toBe(2);
      expect(captcha.phrase).toBe(phrases(expectedLanguage, captcha.names));
      client.get(`vcaptcha:unique:${captcha.unique}`, function (err, key) {
        expect(err).toBe(null);
        expect(key).toBeTruthy();
        done();
      });
    });
  });

});

describe('when solving', () => {
  it('should fail if missing params', () => {

    expect(function () {
      vCaptcha.solve();
    }).toThrow();

    expect(function () {
      vCaptcha.solve({});
    }).toThrow();

    expect(function () {
      vCaptcha.solve({ userId: 'userId' });
    }).toThrow();

    expect(function () {
      noClientVCaptcha.solve({ userId: 'userId' }, function () { });
    }).toThrow();

  });

  it('should succeed if right answer', done => {
    client.set(`vcaptcha:unique:${solvedCaptcha.unique}`, solvedCaptcha.key);
    vCaptcha.solve(solvedCaptcha, valid => {
      expect(valid).toBe(true);
      done();
    });
  });

  it('should fail if wrong answer', done => {
    client.set(`vcaptcha:unique:${solvedCaptcha.unique}`, solvedCaptcha.key);
    solvedCaptcha.solution = [0, 1];
    vCaptcha.solve(solvedCaptcha, valid => {
      expect(valid).toBe(false);
      done();
    });
  });

});