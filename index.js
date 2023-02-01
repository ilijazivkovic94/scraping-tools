const express = require("express"); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require("puppeteer-extra"); // Adding Puppeteer
const cheerio = require("cheerio"); // Adding cheerio//require executablePath from puppeteer
const { executablePath, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');

// add zyte-smartproxy-plugin
// const SmartProxyPlugin = require('zyte-smartproxy-plugin');
// puppeteer.use(SmartProxyPlugin({
//   spm_apikey: '93be10091e0947c4914505bc9a147c2c',
//   static_bypass: false, //  enable to save bandwidth (but may break some websites)
// }));

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({
  blockTrackers: true,
  interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
}));


const Recaptcha = require('puppeteer-extra-plugin-recaptcha');
puppeteer.use(Recaptcha());

const browserInstance = async () => {
  let browser;
  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      args: ["--disable-setuid-sandbox", "--start-maximized"],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath: executablePath(),
    });
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
  }
  return browser;
}

app.use(function (req, res, next) {
  req.setTimeout(500000, function () {
    console.log('Timeout Error');
  });
  next();
});

let cluster = null;


(async () => {
  let browser = await browserInstance();

  async function scrapeProduct(url) {
    try {
      if (!browser) {
        browser = await browserInstance();
      }
      console.log("Opening URL: ", url.trim());
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
      await page.goto(url.trim(), {
        waitUntil: 'networkidle0',
        timeout: 480000,
      });
      console.log("Opened URL successfully");

      const content = await page.content();
      const $ = cheerio.load(content);

      let product = {};
      product.url = url;
      product.name = $("title").text().trim().replace(/\t/g, '').replace(/\s\s/g, '').split('–')[0].split(' - ')[0].replace('/"/g', '\\"').split('|')[0];
      if (url.indexOf('coachoutlet.com') > -1) {
        product.name = $("title").text().trim().split('|')[1];
      }
      if (url.indexOf('amazon.') > -1) {
        product.name = $("title").text().trim().split('|').length > 1 ? $("title").text().trim().split('|')[1] : $("title").text().trim().split('|')[0];
      }
      product.description = $('meta[name="description"]').attr("content") || '';
      let imageTags = await page.evaluate(() => {
        let images = document.getElementsByTagName('img');
        let limitHeight = 100;
        let limitWidth = 100;
        let removeQuery = false;
        let httpOnly = false;
        let useSrcset = false;
        let mainImageIndex = 0;
        let defaultMainIndex = -1;
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
        if (window.location.href.indexOf('dainese.com') > -1) {
          images = document.querySelectorAll(".tabs_content-wrapper img");
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
        if (window.location.href.indexOf('ao.com') > -1) {
          images = document.querySelectorAll(".product-gallery__slide img");
        }
        if (window.location.href.indexOf('harborfreight.com') > -1) {
          images = document.querySelectorAll("#product-wrap img");
        }
        if (window.location.href.indexOf('potterybarnkids.com') > -1) {
          images = document.querySelectorAll(".hooper-slide .image-magnifier-container img");
          mainImageIndex = 0;
          httpOnly = true;
          useSrcset = true;
        }
        if (window.location.href.indexOf('stanley1913.com') > -1) {
          images = document.querySelectorAll(".product__photos img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('jmpthelabel.com') > -1 || window.location.href.indexOf('charmit.com') > -1 || window.location.href.indexOf('peets.com') > -1 || window.location.href.indexOf('saberspro.com') > -1 || window.location.href.indexOf('goldhingeboutique.com') > -1 || window.location.href.indexOf('ourgeneration.co') > -1 || window.location.href.indexOf('aestheticroomcore.com') > -1 || window.location.href.indexOf('tinylandus.com') > -1 || window.location.href.indexOf('oompa.com') > -1) {
          images = document.querySelectorAll(".flickity-slider img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('ssense.com') > -1) {
          images = document.querySelectorAll(".pdp-images__desktop img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('boysmells.com') > -1) {
          images = document.querySelectorAll(".c-product-slider__track img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('fromourplace.com') > -1) {
          images = document.querySelectorAll(".product-carousel__slider img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('heydudeshoesusa.com') > -1) {
          images = document.querySelectorAll('.bg-image-bg img');
        }
        if (window.location.href.indexOf('thehalara.com') > -1) {
          images = document.querySelectorAll('.swiper-wrapper img');
        }
        if (window.location.href.indexOf('fahertybrand.com') > -1) {
          images = document.querySelectorAll('#swiper-wrapper img');
          useSrcset = true;
          mainImageIndex = 5;
        }
        if (window.location.href.indexOf('kiwico.com') > -1) {
          images = document.querySelectorAll('.product-image-thumbnail img');
        }
        if (window.location.href.indexOf('theordinary.com') > -1) {
          images = document.querySelectorAll(".product-images source");
          useSrcset = true;
        }
        if (window.location.href.indexOf('neuflora.com') > -1 || window.location.href.indexOf('littlewonderandco.com') > -1) {
          images = document.querySelectorAll(".Product__Slideshow img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('homeschoolartbox.com') > -1) {
          images = document.querySelectorAll(".product-single__media-group img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('youngla.com') > -1) {
          images = document.querySelectorAll(".Product__SlideItem--image img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('bkstr.com') > -1) {
          images = document.querySelectorAll(".product-option-control img");
        }
        if (window.location.href.indexOf('mewaii.com') > -1 || window.location.href.indexOf('alvjewels.com') > -1 || window.location.href.indexOf('mudpuppy.com') > -1 || window.location.href.indexOf('thewhitecompany.com') > -1 || window.location.href.indexOf('hosannarevival.com') > -1 || window.location.href.indexOf('thestyledcollection.com') > -1 || window.location.href.indexOf('dreamersnschemers.com') > -1) {
          images = document.querySelectorAll(".slick-track img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('hobbylobby.com') > -1) {
          images = document.querySelectorAll(".slick-track img");
        }
        if (window.location.href.indexOf('noblecollection.com') > -1) {
          images = document.querySelectorAll("#product-image img");
        }
        if (window.location.href.indexOf('radleylondon.com') > -1) {
          images = document.querySelectorAll(".thumbnailList__root img");
        }
        if (window.location.href.indexOf('glossier.com') > -1) {
          images = document.querySelectorAll(".product-gallery__slider img");
          mainImageIndex = 1;
        }
        if (window.location.href.indexOf('chloe.com') > -1) {
          images = document.querySelectorAll(".swiper-wrapper img");
          mainImageIndex = 2;
        }
        if (window.location.href.indexOf('lakepajamas.com') > -1) {
          images = document.querySelectorAll(".swiper-wrapper source");
          useSrcset = true;
        }
        if (window.location.href.indexOf('loft.com') > -1) {
          images = document.querySelectorAll(".swiper-container img");
          mainImageIndex = 1;
        }
        if (window.location.href.indexOf('fatbraintoys.com') > -1) {
          images = document.querySelectorAll("#owlMain .owl-lazy");
        }
        if (window.location.href.indexOf('hollisterco.com') > -1) {
          images = document.querySelectorAll(".slick-track img");
        }
        if (window.location.href.indexOf('miumiu.com') > -1) {
          images = document.querySelectorAll(".grid-product-details__gallery source");
          useSrcset = true;
        }
        if (window.location.href.indexOf('carhartt.com') > -1) {
          images = document.querySelectorAll(".static-main-image-wrapper img");
        }
        if (window.location.href.indexOf('baublebar.com') > -1) {
          images = document.querySelectorAll(".Product__Wrapper img");
          useSrcset = true;
        }
        if (window.location.href.indexOf('princesspolly.com') > -1) {
          images = document.querySelectorAll(".product__left img");
          mainImageIndex = 3;
        }
        if (window.location.href.indexOf('lonecone.com') > -1 || window.location.href.indexOf('unifclothing.com') > -1) {
          images = document.querySelectorAll("#ProductPhoto img");
          if (window.location.href.indexOf('unifclothing.com') < 0) {
            useSrcset = true;
          }
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
        if (window.location.href.indexOf('melissaanddoug.com') > -1) {
          images = document.querySelectorAll(".product-main__media img");
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
        if (window.location.href.indexOf('gandhi.com') > -1) {
          images = document.querySelectorAll(".kobo_img_container img");
        }
        if (window.location.href.indexOf('zsupplyclothing.com') > -1) {
          images = document.querySelectorAll(".product-media__container img");
        }
        if (window.location.href.indexOf('rangecookers.co') > -1) {
          images = document.querySelectorAll("#thumbnails img");
          removeQuery = true;
          limitHeight = 65;
          limitWidth = 65;
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
        if (window.location.href.indexOf('maisonette.com') > -1) {
          images = document.querySelectorAll("#maincontent img");
          httpOnly = true;
        }
        if (window.location.href.indexOf('charlottetilbury.com') > -1) {
          images = document.querySelectorAll(".PDPCarousel img");
        }
        if (window.location.href.indexOf('risewell.com') > -1) {
          images = document.querySelectorAll(".product-single__photo-wrapper img");
        }
        if (window.location.href.indexOf('kendrascott.com') > -1) {
          images = document.querySelectorAll(".primary-image-slider img");
        }
        if (window.location.href.indexOf('converse.com') > -1) {
          images = document.querySelectorAll("#main img");
          httpOnly = true;
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

        if (window.location.href.indexOf('gathre.com') > -1) {
          images = document.querySelectorAll(".main-images img");
        }

        if (window.location.href.indexOf('walmart.com') > -1) {
          defaultMainIndex = 2;
        }
        if (window.location.href.indexOf('mewaii.com') > -1) {
          defaultMainIndex = 3;
        }
        if (window.location.href.indexOf('alvjewels.com') > -1) {
          defaultMainIndex = 5;
        }
        if (window.location.href.indexOf('piccalio.com') > -1) {
          defaultMainIndex = 1;
        }

        if (window.location.href.indexOf('bedbathandbeyond.com') > -1 || window.location.href.indexOf('buybuybaby.com') > -1) {
          const shadowInside = document.querySelector("#wmHostPdp").shadowRoot;
          images = shadowInside.querySelectorAll('img');
        }

        let divs = document.querySelectorAll('div[style]');
        if (window.location.href.indexOf('etsy.com') > -1) {
          divs = document.querySelectorAll('div[class="wt-grid__item-xs-12"] div[style]');
        }
        if (window.location.href.indexOf('gathre.com') > -1) {
          divs = document.querySelectorAll('.main-images .feature-image');
        }
        if (window.location.href.indexOf('kitchenaid.com') > -1) {
          divs = document.querySelectorAll('.s7thumb');
          images = [];
        }
        if (window.location.href.indexOf('fatbraintoys.com') > -1) {
          divs = [];
        }

        let result = [];
        let mainImage = null;

        if (divs && divs.length) {
          for (let i = 0; i < divs.length; i++) {
            const divStyle = getComputedStyle(divs[i]);
            if (divs[i].style.backgroundImage || divStyle.backgroundImage) {
              let imageUrl = divs[i].style.backgroundImage;
              let url = imageUrl.slice(4, -1).replace(/"/g, "");
              const divBox = divs[i].getBoundingClientRect();

              if (divStyle && !imageUrl) {
                imageUrl = divStyle.backgroundImage;
                url = imageUrl.slice(4, -1).replace(/"/g, "");
              }
              if (url && url.indexOf('http') > -1 && url.indexOf('Loading') < 0 && url.indexOf('LOADING') < 0 && url.indexOf('background') < 0 && url.indexOf('prime_logo') < 0) {
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
          if (!useSrcset && imageElement.naturalHeight >= limitHeight && imageElement.naturalWidth >= limitWidth && imageElement.style.display != 'none' && bBox.y < 2000 && imageElement.src.indexOf('flag') === -1 && imageElement.src.indexOf('transparent') === -1 && imageElement.src.indexOf('chrome-extension') === -1 && imageElement.src.indexOf('giftlist.com') === -1 && imageElement.src.indexOf('Loading') < 0 && imageElement.src.indexOf('LOADING') < 0 && imageElement.src.indexOf('background') < 0 && imageElement.src.indexOf('prime_logo') < 0 && imageElement.src) {
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
              } else if (window.location.href.indexOf('potterybarnkids.com') > -1) {
                result = [...result, imageElement.srcset.split(",")[0].split(' ')[0]];
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

        if (defaultMainIndex > -1) {
          mainImage = result[defaultMainIndex];
        }

        if (!mainImage) {
          mainImage = result[0];
        }

        return { images: result, mainImage };
      });
      product.images = imageTags;
      const price = await page.evaluate(() => {
        let defaultFontSize = 13;
        let defaultHeight = 90;
        let checkFontSize = true;
        let limitHeight = 1300;

        if (window.location.href.indexOf('shoppersdrugmart.') > -1) {
          document.querySelector('h2[aria-label="Price Details"] span').remove();
        }
        elements = [...document.querySelectorAll(" body *")];
        if (window.location.href.indexOf('www.amazon') > -1) {
          elements = [...document.querySelector("#centerCol").querySelectorAll('*')];
        }
        if (window.location.href.indexOf('bedbathandbeyond.com') > -1 || window.location.href.indexOf('buybuybaby.com') > -1) {
          elements = [...document.querySelector("#wmHostPdp").shadowRoot.querySelectorAll('*')];
        }
        if (window.location.href.indexOf('homedepot.com') > -1) {
          elements = [...document.querySelector("div[name='zone-a']").querySelectorAll('*')];
        }
        if (window.location.href.indexOf('goat.com') > -1) {
          elements = [...document.querySelector('div[data-qa="buy_bar_desktop"] .swiper-slide-active').querySelectorAll('*')];
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
        if (window.location.href.indexOf('rh.com') > -1 || window.location.href.indexOf('zara.com') > -1) {
          defaultFontSize = 11;
        }
        if (window.location.href.indexOf('michaelkors.') > -1) {
          defaultFontSize = 12;
        }
        if (window.location.href.indexOf('ssense.com') > -1) {
          defaultFontSize = 11;
        }
        if (window.location.href.indexOf('zitsticka.com') > -1) {
          defaultHeight = 0;
          defaultFontSize = 12;
        }
        if (window.location.href.indexOf('patagonia.com') > -1) {
          limitHeight = 1800;
        }
        function createRecordFromElement(element) {
          const elementStyle = getComputedStyle(element);
          const text = element.textContent;
          if (!text) {
            return false;
          }
          var record = {};
          const bBox = element.getBoundingClientRect();
          if (checkFontSize && text.length <= 30 && !(bBox.x == 0 && bBox.y == 0)) {
            record["fontSize"] = parseInt(getComputedStyle(element)["fontSize"]);
          } else {
            record["fontSize"] = 16;
          }
          record["y"] = bBox.y;
          record["x"] = bBox.x;
          record["text"] = text.trim().replace(/\n        /g, '');
          if (record["text"].indexOf('Sale Price:') > -1 && record["text"].length > 11) {
            record["text"] = record["text"].replace('Sale Price:', '');
          }
          if (record["text"].indexOf('Sale :') > -1) {
            record["text"] = record["text"].replace('Sale :', '');
          }
          if (record["text"].indexOf('Standard Price:') > -1) {
            record["text"] = record["text"].replace('Standard Price:', '');
          }
          if (record["text"].indexOf('Price') > -1) {
            record["text"] = record["text"].replace('Price', '');
          }
          if (record["text"].indexOf('Limited Time Offer') > -1) {
            record["text"] = record["text"].replace('Limited Time Offer', '');
          }
          if (record["text"].indexOf('USD ') > -1) {
            record["text"] = record["text"].replace('USD ', '');
          }
          if (record["text"].indexOf('CAD ') > -1) {
            if (record["text"].indexOf('$') > -1) {
              record["text"] = record["text"].replace('CAD ', '');
            } else {
              record["text"] = record["text"].replace('CAD ', '$');
            }
          }
          if (record["text"].indexOf('Now') > -1) {
            record["text"] = record["text"].replace('Now ', '');
          }
          if (record["text"].indexOf('Save') > -1) {
            record["text"] = record["text"].replace('Save ', '');
          }
          if (record["text"].indexOf('CA$') > -1) {
            record["text"] = record["text"].replace('CA', '');
          }
          if (record["text"].indexOf('CAD$') > -1) {
            record["text"] = record["text"].replace('CAD$', '$');
          }
          if (record["text"].indexOf('AU$') > -1) {
            record["text"] = record["text"].replace('AU$', '$');
          }
          if (record["text"].indexOf('MRP : ') > -1) {
            record["text"] = record["text"].replace('MRP : ', '');
          }
          if (record["text"].includes('Sale \n\n') && record["text"].length > 10) {
            record["text"] = record["text"].replace('Sale \n\n', '');
          }
          if (record["text"].indexOf('off - ') > -1) {
            record["text"] = record["text"].split('off - ')[1];
          }
          if (record["text"].indexOf('-') > -1) {
            record["text"] = record["text"].split('-')[0].trim();
          }
          if (record["text"].indexOf('Add to your cart — ') > -1) {
            record["text"] = record["text"].replace('Add to your cart — ', '');
          }
          if (record["text"].indexOf('FREE delivery') > -1) {
            record["text"] = record["text"].replace('FREE delivery', '');
          }
          if (window.location.href.indexOf('harborfreight.com') > -1 || window.location.href.indexOf('academy.com') > -1 || window.location.href.indexOf('charmit.com') > -1) {
            var len = record["text"].length;
            var x = record["text"].substring(0, len - 2) + "." + record["text"].substring(len - 2);
            record["text"] = x;
          }
          if (window.location.href.indexOf('mercadolibre.com') > -1 && record["text"].indexOf('pesos') > -1) {
            record["text"] = record["text"].split('pesos')[1];
          }
          record["text"] = record["text"].replace("Now        ", '');
          record["text"] = record["text"].split("\n\n")[0];
          record["text"] = record["text"].replace(/\n        /g, '');
          record["text"] = record["text"].replace("Discounted price", '');
          record["text"] = record["text"].replace("Sale ", '');
          record["text"] = record["text"].replace("price", '');
          record["text"] = record["text"].replace("+", '');
          record["text"] = record["text"].replace("1 x ", '');
          record["text"] = record["text"].replace("now:", '');
          if (record["text"].indexOf('$ ') > -1) {
            record["text"] = record["text"].replace(/\s/g, '');
          }
          let scRe = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6RpCADUSD]/;
          if (scRe.test(record["text"]) && record["text"].indexOf(" ") > -1 && window.location.href.indexOf('loopearplugs.com') > -1) {
            record["text"] = record["text"].split(" ")[0];
          }
          if (scRe.test(record["text"]) && record["text"].indexOf('USD') > -1) {
            if (record['text'].indexOf('$') > -1) {
              record["text"] = record["text"].replace('USD', '');
            } else {
              record["text"] = '$' + record["text"].replace('USD', '');
            }
          }
          if (record["text"].indexOf(' CAD') > -1) {
            record["text"] = record["text"].replace(' CAD', '');
          }
          if (record["text"].indexOf(',') > -1) {
            const textArys = record["text"].split(',');
            if (textArys.length >= 2 && (parseInt(textArys[textArys.length - 1]) + "").length == 2) {
              record["text"] = record["text"].replace(/,([^,]*)$/, ".$1");
            }
          }
          record["text"] = record["text"].replace(/ *\([^)]*\) */g, "");
          if (elementStyle.textDecorationLine != 'none') {
            record['textDecoration'] = true;
          } else {
            record['textDecoration'] = false;
          }
          return record;
        }
        let records = elements.map(createRecordFromElement).filter(r => r !== false);
        function canBePrice(record) {
          if (!record) {
            return false;
          }
          if (!record['text']) {
            return false;
          }
          if (record["text"].indexOf('Sale :') > -1 && record["text"].length > 6) {
            record["text"] = record["text"].replace('Sale :', '');
          }
          if (record["text"].indexOf(' Standard Price') > -1 && record["text"].length > 15) {
            record["text"] = record["text"].replace(' Standard Price', '');
          }
          if (record["text"].indexOf('Standard ') > -1 && record["text"].length > 9) {
            record["text"] = record["text"].replace('Standard ', '');
          }
          if (record["text"].indexOf('Chewy') > -1 && record["text"].length > 5) {
            record["text"] = record["text"].replace('Chewy', '');
          }
          if (record["text"].indexOf('current price: ') > -1 && record["text"].length > 15) {
            record["text"] = record["text"].replace('current price: ', '');
          }
          if (record["text"].indexOf(' USD') > -1 && record["text"].length > 4) {
            if (record["text"].indexOf('$') > -1) {
              record["text"] = record["text"].replace(' USD', '');
            } else {
              record["text"] = '$' + record["text"].replace(' USD', '');
            }
          }
          if (record["text"].indexOf(' CAD') > -1 && record["text"].length > 4) {
            if (record["text"].indexOf('$') > -1) {
              record["text"] = record["text"].replace(' CAD', '');
            } else {
              record["text"] = '$' + record["text"].replace(' CAD', '');
            }
          }
          if (record["text"].indexOf('Sale \n\n') > -1) {
            record["text"] = record["text"].replace('Sale \n\n', '');
          }
          if (record["text"].indexOf('-') > -1 && record["text"].indexOf('$') > -1) {
            record["text"] = record["text"].split('-')[1].trim();
          }
          if (record["text"].indexOf('Now') > -1) {
            record["text"] = record["text"].replace('Now', '');
          }
          record["text"] = record['text'].trim();

          if (
            record["y"] > limitHeight ||
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
        if (window.location.href.indexOf('victoriassecret.com') > -1 || window.location.href.indexOf('jcrew.com') > -1 || window.location.href.indexOf('charlottetilbury.com') > -1) {
          return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
        }
        if (window.location.href.indexOf('sears.com') > -1 || window.location.href.indexOf('landsend.com') > -1 || window.location.href.indexOf('tommybahama.com') > -1) {
          return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[3] ? priceRecordsSortedByFontSize[3]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
        }
        if ((window.location.href.indexOf('unitedbyblue.com') > -1 || window.location.href.indexOf('zitsticka.com') > -1) && priceRecordsSortedByFontSize.length > 1) {
          return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
        }
        if (window.location.href.indexOf('aesop.com') > -1 || window.location.href.indexOf('bedbathandbeyond.com') > -1 || window.location.href.indexOf('prettylittlething.com') > -1 || window.location.href.indexOf('miumiu.com') > -1 || window.location.href.indexOf('princesspolly.com') > -1 || window.location.href.indexOf('heydudeshoesusa.com') > -1 || window.location.href.indexOf('stelladot.com') > -1 || window.location.href.indexOf('loft.com') > -1 || window.location.href.indexOf('michaelkors.com') > -1 || window.location.href.indexOf('coachoutlet.com') > -1 || window.location.href.indexOf('jwpei.com') > -1 || window.location.href.indexOf('underarmour.com') > -1 || window.location.href.indexOf('homebase.co') > -1 || window.location.href.indexOf('toofaced.com') > -1 || window.location.href.indexOf('dainese.com') > -1 || window.location.href.indexOf('kitchenaid.com') > -1 || window.location.href.indexOf('losangelesapparel.') > -1 || window.location.href.indexOf('cricut.com') > -1 || window.location.href.indexOf('lodgecastiron.com') > -1 || window.location.href.indexOf('aestheticroomcore.com') > -1 || window.location.href.indexOf('ecoroots.') > -1 || window.location.href.indexOf('cottonon.com') > -1 || window.location.href.indexOf('levi.com') > -1 || window.location.href.indexOf('mastermindtoys.com') > -1) {
          return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[priceRecordsSortedByFontSize.length - 1] ? priceRecordsSortedByFontSize[priceRecordsSortedByFontSize.length - 1]['text'] : '';
        }
        if ((window.location.href.indexOf('harrypottershop.com') > -1 || window.location.href.indexOf('microcenter.com') > -1 || window.location.href.indexOf('hosannarevival.com') > -1 || window.location.href.indexOf('homesalive.') > -1) && priceRecordsSortedByFontSize.length > 1) {
          return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[1] ? priceRecordsSortedByFontSize[1]['text'] : (priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '');
        }
        return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '';
      });

      product.offers = [
        {
          price: price && price.match(/-?[\d\.]+/g) ? price.match(/[+\-]?\d+(,\d+)?(\.\d+)?/)[0] : 0,
          currency: price && price.match(/-?[\d\.]+/g) ? price.replace(/[0-9]/g, "").replace(/\./g, "").replace(/,/g, '') : '$',
          availability: "InStock",
          regularPrice: price && price.match(/-?[\d\.]+/g) ? price.match(/[+\-]?\d+(,\d+)?(\.\d+)?/)[0] : 0,
          offer: "Product",
        },
      ];

      const response = {
        status: 200,
        data: [
          {
            query: {
              domain: new URL(url).domain,
              userQuery: {
                url: url,
                pageType: "product",
              },
            },
            product,
          },
        ],
      };
      console.log("Scrapped Product: ", url);
      await page.close();
      // fs.writeFileSync('/var/www/scraping-tools/1.html', content);
      return response;
    } catch (err) {
      console.log(err);
      return {
        message: err,
        status: 500,
      };
    }
  }

  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER, // use one browser per worker
    maxConcurrency: 10, // cluster with four workers
  });

  await cluster.task(async ({ page, data: { url, res } }) => {
    const result = await scrapeProduct(url);
    res.send(result);
  });

  app.get("/scrape", async function (req, res) {
    if (req.query.url) {
      console.log('exist cluster');
      if (cluster) {
        cluster.queue({ url: req.query.url, res })
      }
    } else {
      res.status(400).send({
        message: "Bad Request",
        status: 400,
      });
    }
  });

  // Making Express listen on port 7000
  app.listen(7000, async function () {
    console.log(`Running on port 7000.`);
  });
})();


