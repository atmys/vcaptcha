# vCAPTCHA

Simple but user-friendy Node.js captcha generator. It makes the user pick up 2 pictures (order matters) among several (5 by default). Should be enough for low security forms.

Pictures are taken from deprecated [VisualCaptcha](https://github.com/desirepath41/visualCaptcha).

## Getting Started

What it does :
- generate base64 pictures to display in the client;
- generate a phrase to help you pick up the right pictures;
- generate pictures names only if you want a custom phrase;
- generate a key, which is simply the hashed solution. This SHOULD NOT be passed to the client.
- generate a unique identifier for each captcha, to help you retrieve it.

What it does if you pass a Redis Client :
- store keys.
- count & limit fails based on unique user identifier you provide
- expire captchas.

### Install

```
npm i --save vcaptcha
```

### Usage

```
// INITIALIZE
const redis = require('redis');
const client = redis.createClient();
const vCaptcha = require('vcaptcha')({ client });

// CREATE A NEW CAPTCHA
vCaptcha.create({
  userId: '192.168.1.30',
  language: 'fr'
}, (err, captcha, count) => {
  // captcha can be sent to your client form
});

// SOLVE CAPTCHA
vCaptcha.solve({
  userId = '192.168.1.30',
  unique = form.unique,
  solution = form.solution
}, valid => {
  if (valid) {
    // user completed the captcha
  }
});


```

