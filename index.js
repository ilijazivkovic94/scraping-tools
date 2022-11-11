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
            product.name = $("title").text().trim().replace(/\t/g, '').replace(/\s\s/g, '').split('–')[0].replace('/"/g', '\\"');
            product.description = $('meta[name="description"]').attr("content") || '';
            let imageTags = await page.evaluate(() => {
              let images = document.getElementsByTagName('img');
              let limitHeight = 100;
              let limitWidth = 100;
              let removeQuery = false;
              let httpOnly = false;
              let useSrcset = false;
              let mainImageIndex = 0;
              if (window.location.href.indexOf('chewy.com') > -1 || window.location.href.indexOf('cvs.com') > -1) {
                images = document.querySelectorAll("main img");
              }
              if (window.location.href.indexOf('costco.com') > -1) {
                images = document.querySelectorAll("#product-page img");
              }
              if (window.location.href.indexOf('samsclub.com') > -1) {
                images = document.querySelectorAll(".sc-pc-large-desktop-layout-columns img");
              }
              if (window.location.href.indexOf('suitsupply.com') > -1) {
                images = document.querySelectorAll(".pdp-images img");
              }
              if (window.location.href.indexOf('lulus.com') > -1) {
                images = document.querySelectorAll(".c-prod img");
              }
              if (window.location.href.indexOf('12thtribe.com') > -1) {
                images = document.querySelectorAll(".product__main-photos img");
              }
              if (window.location.href.indexOf('tommybahama.com') > -1) {
                images = document.querySelectorAll("#product-details img");
                mainImageIndex = 1;
              }
              if (window.location.href.indexOf('josephjoseph.com') > -1) {
                images = document.querySelectorAll("#template-cart-items img");
              }
              if (window.location.href.indexOf('lonecone.com') > -1) {
                images = document.querySelectorAll("#ProductPhoto img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('somethingnavy.com') > -1) {
                images = document.querySelectorAll(".block-images source[type='image/jpg']");
                useSrcset = true;
              }
              if (window.location.href.indexOf('ghost-official.com') > -1) {
                images = document.querySelectorAll(".product-single source");
                useSrcset = true;
              }
              if (window.location.href.indexOf('louisvuitton.com') > -1) {
                images = document.querySelectorAll(".lv-product img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('williams-sonoma.com') > -1) {
                images = document.querySelectorAll(".sticky-left-river img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('bombas.com') > -1) {
                images = document.querySelectorAll("#react-product img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('rolex.com') > -1) {
                images = document.querySelectorAll("#page source[media='']");
                useSrcset = true;
                mainImageIndex = 1;
              }
              if (window.location.href.indexOf('noodleandboo.com') > -1 || window.location.href.indexOf('bellalunatoys.com') > -1 || window.location.href.indexOf('manhattantoy.com') > -1) {
                images = document.querySelectorAll(".product__photos img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('kytebaby.com') > -1) {
                images = document.querySelectorAll(".product img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('aesop.com') > -1) {
                images = document.querySelectorAll("div[data-component='PDPHeaderSection'] img");
              }
              if (window.location.href.indexOf('oliverbonas.com') > -1) {
                images = document.querySelectorAll(".product-media img");
                httpOnly = true;
              }
              if (window.location.href.indexOf('therealreal.com') > -1) {
                images = document.querySelectorAll(".pdp-desktop-images img");
                httpOnly = true;
              }
              if (window.location.href.indexOf('westelm.com') > -1) {
                images = document.querySelectorAll("#pip-hero-container-WE img");
                httpOnly = true;
              }
              if (window.location.href.indexOf('hillhousehome.com') > -1) {
                images = document.querySelectorAll(".pdpCarousel img");
                useSrcset = true;
              }
              if (window.location.href.indexOf('jcrew.com') > -1) {
                images = document.querySelectorAll("#c-product__photos img");
                limitHeight = 70;
                limitWidth = 70;
                removeQuery = true;
                httpOnly = true;
              }
            
              if (window.location.href.indexOf('shop.lululemon.com') > -1) {
                images = document.querySelectorAll(".pdp-carousel-images-offset img");
                limitHeight = 70;
                limitWidth = 70;
                removeQuery = true;
                httpOnly = true;
              }
            
              if (window.location.href.indexOf('staples.com') > -1) {
                images = document.querySelectorAll("#image_gallery_container img");
                limitHeight = 70;
                limitWidth = 70;
                removeQuery = true;
              }
              
              if (window.location.href.indexOf('bedbathandbeyond.com') > -1 || window.location.href.indexOf('buybuybaby.com') > -1) {
                const shadowInside = document.querySelector("#wmHostPdp").shadowRoot;
                images = shadowInside.querySelectorAll('img');
              }
            
              let divs = document.querySelectorAll('div[style]');
              if (window.location.href.indexOf('etsy.com') > -1) {
                divs = document.querySelectorAll('div[class="wt-grid__item-xs-12"] div[style]');
              }
            
              let result = [];
              let mainImage = null;
              
              if (divs && divs.length) {
                for (let i = 0; i < divs.length; i++) {
                  if (divs[i].style.backgroundImage) {
                    const imageUrl = divs[i].style.backgroundImage;
                    const url = imageUrl.slice(4, -1).replace(/"/g, "");
                    const divBox = divs[i].getBoundingClientRect();
                    if (url && url.indexOf('http') > -1) {
                      if (divBox.height > 300 && divBox.width > 300 && divs[i].style.display != 'none' && divBox.y < 2500) {
                        result.push(url);
                  
                        if (divBox.height > 300 && divBox.width > 300 && !mainImage && divBox.y < 600) {
                          mainImage = url;
                        }
                      }
                    }
                  }
                }
              }
              let mainIndex = 0;
              for (let i = 0; i < images.length; i++) {
                const imageElement = images[i];
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
                    if (mainIndex === mainImageIndex) {
                      if (removeQuery) {
                        mainImage = imageElement.src.split("?")[0];
                      } else {
                        mainImage = imageElement.src;
                      }
                    }
                    mainIndex++;
                  }
                }
              }
              
              if (!result.length || useSrcset) {
                for (let i = 0; i < images.length; i++) {
                  const imageElement = images[i];
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
                    mainImage = result[mainImageIndex || 0];
                  }
                }
              }
            
              if (result.length && !mainImage) {
                mainImage = result[mainImageIndex || 0];
              }
              
              return { images: result, mainImage };
            });
            product.images = imageTags;
            const price = await page.evaluate(() => {
              let defaultFontSize = 13;
              let defaultHeight = 90;
              let checkFontSize = true;
              elements = [...document.querySelectorAll(" body *")];
              if (window.location.href.indexOf('bedbathandbeyond.com') > -1 || window.location.href.indexOf('buybuybaby.com') > -1) {
                elements = [...document.querySelector("#wmHostPdp").shadowRoot.querySelectorAll('*')];
              }
              if (window.location.href.indexOf('homedepot.com') > -1) {
                elements = [...document.querySelector("div[name='zone-a']").querySelectorAll('*')];
              }
              if (window.location.href.indexOf('somethingnavy.com') > -1) {
                elements = [...document.querySelector(".price").querySelectorAll('*')];
              }
              if (window.location.href.indexOf('lulus.com') > -1) {
                elements = [...document.querySelector(".c-prod-price").querySelectorAll('*')];
              }
              if (window.location.href.indexOf('etsy.com') > -1) {
                elements = [...document.querySelectorAll('div[class="wt-grid__item-xs-12"]')[0].querySelectorAll('*')];
                checkFontSize = false;
              }
              if (window.location.href.indexOf('rh.com') > -1) {
                defaultFontSize = 11;
              }
              if (window.location.href.indexOf('zitsticka.com') > -1) {
                defaultHeight = 0;
                defaultFontSize = 12;
              }
              function createRecordFromElement(element) {
                const elementStyle = getComputedStyle(element);
                const text = element.textContent.trim();
                var record = {};
                const bBox = element.getBoundingClientRect();
                if (checkFontSize && text.length <= 30 && !(bBox.x == 0 && bBox.y == 0)) {
                  record["fontSize"] = parseInt(getComputedStyle(element)["fontSize"]);
                } else {
                  record["fontSize"] = 16;
                }
                record["y"] = bBox.y;
                record["x"] = bBox.x;
                record["text"] = text;
                if(record["text"].indexOf('Sale Price:') > -1 && record["text"].length > 11) {
                  record["text"] = record["text"].replace('Sale Price:', '');
                }
                if(record["text"].indexOf('Sale :') > -1) {
                  record["text"] = record["text"].replace('Sale :', '');
                }
                if(record["text"].indexOf('Standard Price:') > -1) {
                  record["text"] = record["text"].replace('Standard Price:', '');
                }
                if(record["text"].indexOf('Price') > -1) {
                  record["text"] = record["text"].replace('Price', '');
                }
                if(record["text"].indexOf('Limited Time Offer') > -1) {
                  record["text"] = record["text"].replace('Limited Time Offer', '');
                }
                if(record["text"].indexOf('USD ') > -1) {
                  record["text"] = record["text"].replace('USD ', '');
                }
                if(record["text"].indexOf('CAD ') > -1) {
                  record["text"] = record["text"].replace('CAD ', '');
                }
                if(record["text"].indexOf('Now') > -1) {
                  record["text"] = record["text"].replace('Now ', '');
                }
                if(record["text"].indexOf('Save') > -1) {
                  record["text"] = record["text"].replace('Save ', '');
                }
                if(record["text"].indexOf('CA$') > -1) {
                  record["text"] = record["text"].replace('CA', '');
                }
                if(record["text"].indexOf(',') > -1) {
                  const textArys = record["text"].split(',');
                  if (textArys.length > 2 && (parseInt(textArys[textArys.length - 1]) + "").length == 2) {
                    record["text"] = record["text"].replace(/,([^,]*)$/, ".$1");
                  }
                }
                if(record["text"].includes('Sale \n\n') && record["text"].length > 10) {
                  record["text"] = record["text"].replace('Sale \n\n', '');
                }
                if(record["text"].indexOf('off - ') > -1) {
                  record["text"] = record["text"].split('off - ')[1];
                }
                if(record["text"].indexOf('-') > -1) {
                  record["text"] = record["text"].split('-')[0].trim();
                }
                if(record["text"].indexOf('Add to your cart — ') > -1) {
                  record["text"] = record["text"].replace('Add to your cart — ', '');
                }
                if(record["text"].indexOf('FREE delivery') > -1) {
                  record["text"] = record["text"].replace('FREE delivery', '');
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
                if(record["text"].indexOf('-') > -1 && record["text"].indexOf('$') > -1) {
                  record["text"] = record["text"].split('-')[1].trim();
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
                  let scRe = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6RpCAD]/;
                  if (record["y"] > defaultHeight && record['fontSize'] >= defaultFontSize && (scRe.test(record['text']))) return true;
                }
              }
              let possiblePriceRecords = records.filter(canBePrice);
              let priceRecordsSortedByFontSize = possiblePriceRecords.sort(function (a, b) {
                if (a["fontSize"] == b["fontSize"]) return a["y"] > b["y"];
                return a["fontSize"] < b["fontSize"];
              });
              if (window.location.href.indexOf('homedepot.com') > -1) {
                return '$' + (parseFloat(priceRecordsSortedByFontSize[3]['text'].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)[0]) - parseFloat(priceRecordsSortedByFontSize[4]['text'].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)[0]));
              }
              if (window.location.href.indexOf('zitsticka.com') > -1 && priceRecordsSortedByFontSize.length > 1) {
                return '$' + (parseFloat(priceRecordsSortedByFontSize[1]['text'].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)[0]) - parseFloat(priceRecordsSortedByFontSize[0]['text'].match(/-?(?:\d+(?:\.\d*)?|\.\d+)/)[0]));
              }
              if (window.location.href.indexOf('victoriassecret.com') > -1 || window.location.href.indexOf('bedbathandbeyond.com') > -1 || window.location.href.indexOf('jcrew.com') > -1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
              }
              if (window.location.href.indexOf('sears.com') > -1 || window.location.href.indexOf('landsend.com') > -1 || window.location.href.indexOf('tommybahama.com') > -1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[3] ? priceRecordsSortedByFontSize[3]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
              }
              if ((window.location.href.indexOf('unitedbyblue.com') > -1 || window.location.href.indexOf('zitsticka.com') > -1) && priceRecordsSortedByFontSize.length > 1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
              }
              if (window.location.href.indexOf('aesop.com') > -1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[priceRecordsSortedByFontSize.length - 1] ? priceRecordsSortedByFontSize[priceRecordsSortedByFontSize.length - 1]['text'] : '';
              }
              if (window.location.href.indexOf('harrypottershop.com') > -1 && priceRecordsSortedByFontSize.length > 1) {
                return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
              }
              return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '';
            });

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
