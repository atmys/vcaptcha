# vCaptcha

[![Build Status](https://travis-ci.org/atmys/vcaptcha.svg?branch=master)](https://travis-ci.org/atmys/vcaptcha)
[![Coverage Status](https://coveralls.io/repos/github/atmys/vcaptcha/badge.svg?branch=master)](https://coveralls.io/github/atmys/vcaptcha?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/atmys/vcaptcha/badge.svg?targetFile=package.json)](https://snyk.io/test/github/atmys/vcaptcha?targetFile=package.json)
[![codebeat badge](https://codebeat.co/badges/3713e4c8-40cc-4a25-a5ac-aac25f6b39a9)](https://codebeat.co/projects/github-com-atmys-vcaptcha-master)


Simple but user-friendy Node.js captcha generator. It makes the user pick up 2 pictures (in sequence) among several (5 by default). Should be enough for low security forms.

------------------

![vCAPTCHA preview](https://github.com/atmys/vcaptcha/raw/master/preview.jpg)

------------------


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

### API
#### `require('vcaptcha')(options)`
- Initialize vCaptcha
- `options <Object>` 
  - `client` **Required:** Redis client
  - `fails` **Default:** 10 - max fails allowed per userId
  - `failsMemory` **Default:** 60 * 60 * 6 - Period of time before fails count resets
#### `create(options, callback)`
- `options <Object>` 
  - `userId` **Required:** unique client identifier
  - `expiresIn` **Default:** 60 * 2
  - `language` **Default:** 'en' - also supported: 'fr'
  - `length` **Default:** 5 - number of pictures to send to the client
- `callback <Function>` returns `(err, captcha, count)`
  - `captcha <Object>`
    - `unique` captcha ID
    - `data` base64 pictures array
    - `phrase` explanation to solve the captcha
    - `names` pictures to find to solve the captcha, to create your own phrase
  - `count` fail count
#### `solve(options, callback)`
- `options <Object>` 
  - `userId` **Required:** unique client identifier
  - `unique` **Required:** captcha ID to solve
  - `solution` **Required:** guessed solution provided by the client.
- `callback <Function>` returns `(valid)`
  - `valid <Boolean>` whether or not captcha is solved

### Example

Try it on [RunKit](https://runkit.com/atmys/vcaptcha).

```js
// INITIALIZE
const redis = require('redis');
const client = redis.createClient();
const vCaptcha = require('vcaptcha')({
  client,
  fails = 10,
  failsMemory = 60 * 60 * 6
});

// CREATE A NEW CAPTCHA
vCaptcha.create({
  userId: '192.168.1.30',
  expiresIn: 60 * 2,
  language: 'en',
  length: 5
}, (err, captcha, count) => {
  // captcha can be sent to your client form
});

// SOLVE CAPTCHA
vCaptcha.solve({
  userId: '192.168.1.30',
  unique: body.unique,
  solution: body.solution
}, valid => {
  if (valid) {
    // user completed the captcha
  }
});
```

### Client use

Example with Angular template.

```html
<div class="captcha">
  <h5 *ngIf="error">Too many fails, come back later.</h5>
  <div *ngIf="!error" class="captcha-box">
    <label><span>{{ captcha.phrase }}</span></label>
    <ul class="thumbnails selector">
      <li *ngFor="let src of captcha.data; let i = index">
        <div class="thumbnail" [class.selected]="isSelected(i)" (click)="toggleSelect(i)">
          <img class="image" [src]="'data:image/png;base64,'+ src">
        </div>
      </li>
    </ul>
  </div>
</div>
```

### Credit

Pictures are taken from deprecated [VisualCaptcha](https://github.com/desirepath41/visualCaptcha).