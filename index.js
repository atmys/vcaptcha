const pics = require('./pics');
const phrases = require('./phrases');

module.exports = function (options = {}) {

    const client = options.client;
    const fails = options.fails || 10;
    const failMemory = options.failMemory || 60 * 60 * 6;
    const failKey = 'vcaptcha:user:';
    const captchaKey = 'vcaptcha:unique:';

    function unsecureCreate({
        language = 'en',
        length = 5
    } = {}) {
        const answer = [],
            data = [],
            indexes = [],
            names = [];
        /* istanbul ignore next */
        while (data.length < length) {
            const x = Math.floor(Math.random() * pics.length);
            if (indexes.indexOf(x) === -1) {
                indexes.push(x);
                data.push(pics[x].data);
            }
        }
        /* istanbul ignore next */
        while (answer.length < 2) {
            const y = Math.floor(Math.random() * length);
            const z = indexes[y];
            if (answer.indexOf(y) === -1) {
                answer.push(indexes.indexOf(z));
                names.push(pics[z][language]);
            }
        }

        const key = JSON.stringify(answer);
        const phrase = phrases(language, names);
        const unique = randomString(10);

        return ({ key, data, names, phrase, unique });
    }

    function unsecureSolve({
        key = throwIfMissing('key'),
        solution = throwIfMissing('solution'),
    } = {}) {
        const JSONSolution = isJSON(solution) ? solution : JSON.stringify(solution);
        return JSONSolution === key;
    }

    function solve({
        userId = throwIfMissing('userId'),
        unique = throwIfMissing('unique'),
        solution = throwIfMissing('solution'),
    }, callback) {
        const promise = new Promise((resolve, reject) => {
            throwIfNoClient(client);
            client.get(`${captchaKey}${unique}`, function (err, key) {
                /* istanbul ignore if */
                if (err) {
                    reject(new Error('Could not retrieve captcha'));
                }
                /* istanbul ignore if */
                if (!key) {
                    reject(new Error('Captcha does not exists'));
                }
                client.del(`${captchaKey}${unique}`);
                const valid = unsecureSolve({ solution, key });
                const userFailKey = `${failKey}${userId}`;
                if (!valid) {
                    client.setnx(userFailKey, 0, function (err) {
                        /* istanbul ignore if */
                        if (err) {
                            reject(new Error('Could not retrieve fail count'));
                        }
                        client.incr(userFailKey);
                        client.expire(userFailKey, failMemory);
                        resolve(valid);
                    });
                } else {
                    client.del(userFailKey);
                    resolve(valid);
                }
            });

        });

        if (callback && typeof callback === 'function') {
            promise.then(callback);
        }

        return promise;
    }

    function create({
        userId = throwIfMissing('userId'),
        expiresIn = 60 * 2,
        language,
        length
    }, callback = throwIfMissing('callback')) {
        throwIfNoClient(client);
        client.get(`${failKey}${userId}`, function (err, stringCount) {

            /* istanbul ignore if */
            if (err) {
                throw new Error('Could not retrieve fail count');
            }
            const count = parseInt(stringCount || 0);
            let error = null;
            let captcha = {};
            if (count < fails) {
                captcha = unsecureCreate({ language, length });
                client.set(`${captchaKey}${captcha.unique}`, captcha.key);
                client.expire(`${captchaKey}${captcha.unique}`, expiresIn);
                captcha.key = undefined;
            } else {
                error = `Too many fails.`
            }
            callback(error, captcha, count);
        });
    }

    return {
        unsecureCreate,
        unsecureSolve,
        create,
        solve
    };

}

function isJSON(param) {
    try {
        JSON.parse(param);
        return true;
    } catch (e) {
        return false;
    }
}

function randomString(n) {
    let r = '';
    while (n--) r += String.fromCharCode((r = Math.random() * 62 | 0, r += r > 9 ? (r < 36 ? 55 : 61) : 48));
    return r;
}

function throwIfMissing(param) {
    throw new Error(`Missing parameter : ${param}`);
}

function throwIfNoClient(client) {
    if (!client) {
        throw new Error('No Redis client defined');
    }
}