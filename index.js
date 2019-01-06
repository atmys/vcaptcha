const bcrypt = require('bcrypt-nodejs');

const pics = require('./pics');
const phrases = require('./phrases');

module.exports = function (options = {}) {

    const client = options.client;
    const fails = options.fails || 10;
    const expire = options.expire || 60 * 60 * 6;
    const failKey = 'vcaptcha:user:';
    const captchaKey = 'vcaptcha:unique:';

    function unsecureCreate({
        language = 'en',
        length = 5
    }) {
        const answer = [],
            data = [],
            indexes = [],
            names = [];
        while (data.length < length) {
            const x = Math.floor(Math.random() * pics.length);
            if (indexes.indexOf(x) === -1) {
                indexes.push(x);
                data.push(pics[x].data);
            }
        }
        while (answer.length < 2) {
            const y = Math.floor(Math.random() * length);
            const z = indexes[y];
            if (answer.indexOf(y) === -1) {
                answer.push(indexes.indexOf(z));
                names.push(pics[z][language]);
            }
        }

        const key = bcrypt.hashSync(JSON.stringify(answer), bcrypt.genSaltSync(8), null);
        const phrase = phrases(language, names);
        const unique = randomString(10);

        return ({ key, data, names, phrase, unique });
    }

    function unsecureSolve({
        key = throwIfMissing('key'),
        solution = throwIfMissing('solution'),
    }) {
        const JSONSolution = isJSON(solution) ? solution : JSON.stringify(solution);
        return bcrypt.compareSync(JSONSolution, key);
    }

    function solve({
        userId = throwIfMissing('userId'),
        unique = throwIfMissing('unique'),
        solution = throwIfMissing('solution'),
    }, callback = throwIfMissing('callback')) {
        throwIfNoClient(client);
        const JSONSolution = isJSON(solution) ? solution : JSON.stringify(solution);
        client.get(`${captchaKey}${unique}`, function (err, key) {
            client.del(`${captchaKey}${unique}`);
            const valid = bcrypt.compareSync(JSONSolution, key);
            if (!valid) {
                client.setnx(`${failKey}${userId}`, 0, function (err) {
                    if (err) {
                        throw new Error('Could not retrieve fail count');
                    }
                    client.incr(`${failKey}${userId}`);
                    client.expire(`${failKey}${userId}`, expire);
                    callback(valid);
                });
            } else {
                callback(valid);
            }
        });
    }

    function create({
        userId = throwIfMissing('userId'),
        expire = 60 * 2,
        language,
        length
    }, callback = throwIfMissing('callback')) {
        throwIfNoClient(client);
        client.get(`${failKey}${userId}`, function (err, count) {
            if (err) {
                throw new Error('Could not retrieve fail count');
            }
            let error = null;
            let captcha = {};
            if (count < fails) {
                captcha = unsecureCreate({ language, length });
                client.set(`${captchaKey}${captcha.unique}`, captcha.key);
                client.expire(`${captchaKey}${captcha.unique}`, expire);
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