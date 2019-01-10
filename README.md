# vCAPTCHA

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

### Usage

```js
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
