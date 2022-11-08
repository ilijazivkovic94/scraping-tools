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

After pull changes from repo, You must restart current service.
``` bash
$ pm2 restart GiftList
```

### Development
For development, you can use this command.
``` bash
$ npm run dev
```

The application will be listening for incoming connections on `http://localhost:7000`.

### Test URL
```
http://localhost:7000/scrape?url=https://www.amazon.com/dp/B00AG44IYY/ref=cm_gf_acco_iaad_d_p0_e0_qd1_Is49XDly9AJua7hh4Q0r
```

