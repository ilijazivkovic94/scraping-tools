const express = require("express"); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require("puppeteer-extra"); // Adding Puppeteer
const cheerio = require("cheerio"); // Adding cheerio//require executablePath from puppeteer
const { executablePath } = require('puppeteer')

// add zyte-smartproxy-plugin
// const SmartProxyPlugin = require('zyte-smartproxy-plugin');
// puppeteer.use(SmartProxyPlugin({
//   spm_apikey: '93be10091e0947c4914505bc9a147c2c',
//   static_bypass: false, //  enable to save bandwidth (but may break some websites)
// }));

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

app.get("/scrape", function (req, res) {
  if (req.query.url) {
    try {
      // Launching the Puppeteer controlled headless browser and navigate to the Digimon website
      puppeteer
        .launch({
          headless: true,
          executablePath: executablePath(),
          ignoreHTTPSErrors: true,
          args: ["--disable-setuid-sandbox", "--start-maximized"],
          defaultViewport: {
            width: 1920,
            height: 1080,
          },
        })
        .then(async function (browser) {
          try {
            console.log("Opening URL: ", req.query.url);
            const page = await browser.newPage();
            await page.goto(req.query.url, {
              waitUntil: 'networkidle0',
              timeout: 180000,
            });
            console.log("Opened URL successfully");

            const content = await page.content();
            const $ = cheerio.load(content);

            let product = {};
            product.url = req.query.url;
            product.name = $("title").text().trim().replace(/\t/g, '').replace(/\s\s/g, '').split('–')[0];
            product.description = $('meta[name="description"]').attr("content") || '';
            let images = await page.evaluate(() => {
              let imageTags = document.getElementsByTagName('img');
              let limitHeight = 100;
              let limitWidth = 100;
              let removeQuery = false;
              let httpOnly = false;
              let useSrcset = false;
              if (window.location.href.indexOf('chewy.com') > -1 || window.location.href.indexOf('cvs.com') > -1) {
                imageTags = document.querySelectorAll("main img");
              }
              if (window.location.href.indexOf('costco.com') > -1) {
                imageTags = document.querySelectorAll("#product-page img");
              }
              if (window.location.href.indexOf('samsclub.com') > -1) {
                imageTags = document.querySelectorAll(".sc-pc-large-desktop-layout-columns img");
              }
              if (window.location.href.indexOf('suitsupply.com') > -1) {
                imageTags = document.querySelectorAll(".pdp-images img");
              }
              if (window.location.href.indexOf('therealreal.com') > -1) {
                imageTags = document.querySelectorAll(".pdp-desktop-images img");
                httpOnly = true;
              }
              if (window.location.href.indexOf('westelm.com') > -1) {
                imageTags = document.querySelectorAll("#pip-hero-container-WE img");
                httpOnly = true;
              }
              if (window.location.href.indexOf('hillhousehome.com') > -1) {
                imageTags = document.querySelectorAll(".pdpCarousel img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('jcrew.com') > -1) {
                imageTags = document.querySelectorAll("#c-product__photos img");
                limitHeight = 70;
                limitWidth = 70;
                removeQuery = true;
                httpOnly = true;
              }

              if (window.location.href.indexOf('shop.lululemon.com') > -1) {
                imageTags = document.querySelectorAll(".pdp-carousel-images-offset img");
                limitHeight = 70;
                limitWidth = 70;
                removeQuery = true;
                httpOnly = true;
              }

              if (window.location.href.indexOf('staples.com') > -1) {
                imageTags = document.querySelectorAll("#image_gallery_container img");
                limitHeight = 70;
                limitWidth = 70;
                removeQuery = true;
              }
              
              if (window.location.href.indexOf('bedbathandbeyond.com') > -1) {
                const shadowInside = document.querySelector("#wmHostPdp").shadowRoot;
                imageTags = shadowInside.querySelectorAll('img');
              }

              const divs = document.querySelectorAll('div[style]');

              let result = [];
              let mainImage = null;
              
              if (divs && divs.length) {
                for (let i = 0; i < divs.length; i++) {
                  if (divs[i].style.backgroundImage) {
                    const imageUrl = divs[i].style.backgroundImage;
                    const url = imageUrl.slice(4, -1).replace(/"/g, "");
                    const divBox = divs[i].getBoundingClientRect();
                    if (url & url.indexOf('http') > -1) {
                      if (divBox.height > 300 && divBox.width > 300 && divs[i].style.display != 'none' && divBox.y < 2500) {
                        result.push(url);
                  
                        if (divBox.height > 400 && divBox.width > 400 && !mainImage && divBox.y < 600) {
                          mainImage = url;
                        }
                      }
                    }
                  }
                }
              }

              for (let i = 0; i < imageTags.length; i++) {
                const imageElement = imageTags[i];
                const bBox = imageElement.getBoundingClientRect();
                if (!useSrcset && imageElement.naturalHeight >= limitHeight && imageElement.naturalWidth >= limitWidth && imageElement.style.display != 'none' && bBox.y < 2000 && imageElement.src.indexOf('/flags/') === -1 && imageElement.src) {
                  if (httpOnly) {
                    if (imageElement.src.indexOf('http') > -1 && imageElement.src.indexOf('http') != 0) {
                      continue;
                    } else {
                      if (imageElement.src.indexOf('http') < 0) {
                        continue;
                      }
                    }
                  }
                  if (removeQuery) {
                    result.push(imageElement.src.split("?")[0]);
                  } else {
                    result.push(imageElement.src);
                  }

                  if (imageElement.naturalHeight > 400 && bBox.y < 600 && bBox.y > 80 && !mainImage && imageElement.src.indexOf('null') < 0) {
                    if (removeQuery) {
                      mainImage = imageElement.src.split("?")[0];
                    } else {
                      mainImage = imageElement.src;
                    }
                  }
                }
              }
              
              if (!result.length || useSrcset) {
                for (let i = 0; i < imageTags.length; i++) {
                  const imageElement = imageTags[i];
                  if (imageElement.srcset) {
                    if (window.location.href.indexOf('shop.lululemon.com') > -1) {
                      result = [...result, imageElement.srcset.split(",\n")[0]];
                    } else {
                      result = [...result, imageElement.srcset.split(", ")[0]];
                    }
                    result = result.map(item => {
                      if (removeQuery) {
                        return item.trim().split("?")[0];
                      } else {
                        return item.trim();
                      }
                    })
                    mainImage = result[0];
                  }
                }
              }

              if (result.length && !mainImage) {
                mainImage = result[0];
              }
              
              return { images: result, mainImage };
            });
            product.images = images;
            const price = await page.evaluate(() => {
              let defaultFontSize = 13;
              elements = [...document.querySelectorAll(" body *")];
              if (document.location.href.indexOf('bedbathandbeyond.com') > -1) {
                elements = [...document.querySelector("#wmHostPdp").shadowRoot.querySelectorAll('*')];
              }
              if (document.location.href.indexOf('homedepot.com') > -1) {
                elements = [...document.querySelectorAll('body *')];
              }
              if (document.location.href.indexOf('rh.com') > -1) {
                defaultFontSize = 11;
              }
              function createRecordFromElement(element) {
                const elementStyle = getComputedStyle(element);
                const text = element.textContent.trim();
                var record = {};
                const bBox = element.getBoundingClientRect();
                if (text.length <= 30 && !(bBox.x == 0 && bBox.y == 0)) {
                  record["fontSize"] = parseInt(getComputedStyle(element)["fontSize"]);
                }
                record["y"] = bBox.y;
                record["x"] = bBox.x;
                record["text"] = text;
                if(text.indexOf('Sale Price:') > -1 && text.length > 11) {
                  record["text"] = text.replace('Sale Price:', '');
                }
                if(text.indexOf('Sale :') > -1) {
                  record["text"] = text.replace('Sale :', '');
                }
                if(text.indexOf('Standard Price:') > -1) {
                  record["text"] = text.replace('Standard Price:', '');
                }
                if(text.indexOf('Price') > -1) {
                  record["text"] = text.replace('Price', '');
                }
                if(text.indexOf('Limited Time Offer') > -1) {
                  record["text"] = text.replace('Limited Time Offer', '');
                }
                if(text.indexOf('USD') > -1) {
                  record["text"] = text.replace('USD', '');
                }
                if(text.indexOf('CAD') > -1) {
                  record["text"] = text.replace('CAD', '');
                }
                if(text.indexOf('Now') > -1) {
                  record["text"] = text.replace('Now ', '');
                }
                if(text.indexOf(',') > -1) {
                  const textArys = text.split(',');
                  if ((parseInt(textArys[textArys.length - 1]) + "").length == 2) {
                    record["text"] = text.replace(/,([^,]*)$/, ".$1");
                  }
                }
                if(text.includes('Sale \n\n') && text.length > 10) {
                  record["text"] = text.replace('Sale \n\n', '');
                }
                if(text.indexOf('off - ') > -1) {
                  record["text"] = text.split('off - ')[1];
                }
                if (elementStyle.textDecorationLine != 'none') {
                  record['textDecoration'] = true;
                } else {
                  record['textDecoration'] = false;
                }
                return record;
              }
              let records = elements.map(createRecordFromElement);
              function canBePrice(record) {
                if(record["text"].indexOf('Sale :') > -1 && record["text"].length > 6) {
                  record["text"] = record["text"].replace('Sale :', '');
                }
                if(record["text"].indexOf(' Standard Price') > -1 && record["text"].length > 15) {
                  record["text"] = record["text"].replace(' Standard Price', '');
                }
                if(record["text"].indexOf('Standard ') > -1 && record["text"].length > 9) {
                  record["text"] = record["text"].replace('Standard ', '');
                }
                if(record["text"].indexOf('Chewy') > -1 && record["text"].length > 5) {
                  record["text"] = record["text"].replace('Chewy', '');
                }
                if(record["text"].indexOf('current price: ') > -1 && record["text"].length > 15) {
                  record["text"] = record["text"].replace('current price: ', '');
                }
                if(record["text"].indexOf(' USD') > -1 && record["text"].length > 4) {
                  record["text"] = record["text"].replace(' USD', '');
                }
                if(record["text"].indexOf('Sale \n\n') > -1) {
                  record["text"] = record["text"].replace('Sale \n\n', '');
                }
                record["text"] = record['text'].trim();

                if (
                  record["y"] > 1300 ||
                  record["fontSize"] == undefined ||
                  !record["text"].match(
                    /(^(US ){0,1}(rs\.|Rs\.|RS\.|\$|€|£|₹|INR|RP|Rp|USD|US\$|CAD|C\$){0,1}(\s){0,1}[\d,]+(\.\d+){0,1}(\s){0,1}(AED){0,1}(€){0,1}(£){0,1}(Rp){0,1}$)/
                  ) ||
                  record["textDecoration"]
                ) {
                  return false;
                } else {
                  let scRe = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6Rp]/;
                  if (record["y"] > 90 && record['fontSize'] >= defaultFontSize && (scRe.test(record['text']))) return true;
                }
              }
              let possiblePriceRecords = records.filter(canBePrice);
              let priceRecordsSortedByFontSize = possiblePriceRecords.sort(function (a, b) {
                if (a["fontSize"] == b["fontSize"]) return a["y"] > b["y"];
                return a["fontSize"] < b["fontSize"];
              });
              if (document.location.href.indexOf('homedepot.com') > -1) {
                return '$' + (parseFloat(priceRecordsSortedByFontSize[priceRecordsSortedByFontSize.length - 4]['text'].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)[0]) - parseFloat(priceRecordsSortedByFontSize[priceRecordsSortedByFontSize.length - 3]['text'].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)[0]));
              }
              if (document.location.href.indexOf('victoriassecret.com') > -1 || document.location.href.indexOf('bedbathandbeyond.com') > -1 || document.location.href.indexOf('jcrew.com') > -1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
              }
              if (document.location.href.indexOf('sears.com') > -1 || document.location.href.indexOf('landsend.com') > -1 || document.location.href.indexOf('tommybahama.com') > -1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[3] ? priceRecordsSortedByFontSize[3]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
              }
              return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '';
            });

            console.log(price);
            product.offers = [
              {
                price: price.match(/-?[\d\.]+/g)[0],
                currency: price.replace(/[0-9]/g, "").replace(/\./g, ""),
                availability: "InStock",
                regularPrice: price.match(/-?[\d\.]+/g)[0],
              },
            ];

            const response = {
              status: 200,
              data: [
                {
                  query: {
                    domain: new URL(req.query.url).domain,
                    userQuery: {
                      url: req.query.url,
                      pageType: "product",
                    },
                  },
                  product,
                },
              ],
            };
            console.log("Scrapped Product: ", req.query.url);

            res.send(response);
          } catch (err) {
            res.status(500).send({
              message: err,
              status: 500,
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send({
            message: err,
            status: 500,
          });
        });
    } catch (err) {
      res.status(500).send({
        message: err,
        status: 500,
      });
    }
  } else {
    res.status(400).send({
      message: "Bad Request",
      status: 400,
    });
  }
});

// Making Express listen on port 7000
app.listen(7000, function () {
  console.log(`Running on port 7000.`);
});
