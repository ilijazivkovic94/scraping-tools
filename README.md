GiftList Scraper
=======================

## About
This is the web client for my Giftlist Scraper project. It is written in **Node.js** and uses the [**puppeteer**](https://github.com/puppeteer/puppeteer) module.

## Deployment
First, install modules.

``` bash
$ npm install
```

Then install pm2 module globally.

``` bash
$ npm install -g pm2
```

Then run the `pm2 start npm --name "app name" -- start` script.

``` bash
$ pm2 start npm --name "GiftList" -- start
```

The application will be listening for incoming connections on `http://localhost:7000`.

