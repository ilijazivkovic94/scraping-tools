const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require('puppeteer'); // Adding Puppeteer
const cheerio = require('cheerio'); // Adding cheerio

app.get('/scrape', function(req, res) {
	if (req.query.url) {
		try {
			// Launching the Puppeteer controlled headless browser and navigate to the Digimon website
			puppeteer.launch({
				headless: true,
		        args: ["--disable-setuid-sandbox", "--start-maximized"],
		        ignoreHTTPSErrors: true,
		        defaultViewport: {
			        width:1920,
			        height:1080
		      	}
			}).then(async function(browser) {
				try {
					console.log('Opening URL: ', req.query.url);
				    const page = await browser.newPage();
				    await page.goto(req.query.url);
					console.log('Opened URL successfully');
				    const content = await page.content();
				    const $ = cheerio.load(content);

				    let product = {};
				    product.url = req.query.url;
				    product.name = $('title').text().trim();
				    product.description = $('meta[name="description"]').attr('content').trim();
			    	let images = await page.evaluate(() =>  {
			    		let imagesTags = document.querySelectorAll('img');
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

					  for (let i = 0; i < imagesTags.length; i++) {
					    const imageElement = imagesTags[i];
					    const bBox = imageElement.getBoundingClientRect();
					    if (imageElement.naturalHeight > 300 && imageElement.naturalWidth > 200 && imageElement.style.display != 'none' && bBox.y < 2500 && imageElement.src.indexOf('http') > -1) {
					      result.push(imageElement.src);

					      if (imageElement.naturalHeight > 400 && bBox.y < 600 && bBox.y > 80) {
					        mainImage = imageElement.src;
					      }
					    }
					  }
					  return { images: result, mainImage };
			    	});
				    product.images = images;

				    const price = await page.evaluate(() => {
					  elements = [...document.querySelectorAll(" body *")];
					  const createRecordFromElement = (element) => {
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
					    if(text.indexOf('USD') > -1) {
					      record["text"] = text.replace(' USD', '');
					    }
					    if(text.indexOf('CAD') > -1) {
					      record["text"] = text.replace(' CAD', '');
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
					    if (elementStyle.textDecorationLine != 'none') {
					      record['textDecoration'] = true;
					    } else {
					      record['textDecoration'] = false;
					    }
					    return record;
					  }
					  let records = elements.map(createRecordFromElement);
					  const canBePrice = (record) => {
					    if(record["text"].indexOf('Sale :') > -1 && record["text"].length > 6) {
					      record["text"] = record["text"] .replace('Sale :', '');
					    }
					    if(record["text"].indexOf(' Standard Price') > -1 && record["text"].length > 15) {
					      record["text"] = record["text"] .replace(' Standard Price', '');
					    }
					    if(record["text"].indexOf('Standard ') > -1 && record["text"].length > 9) {
					      record["text"] = record["text"] .replace('Standard ', '');
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
					      if (record["y"] > 90 && record['fontSize'] >= 13 && (scRe.test(record['text']))) return true;
					    }
					  }
					  let possiblePriceRecords = records.filter(canBePrice);
					  let priceRecordsSortedByFontSize = possiblePriceRecords.sort(function (a, b) {
					    if (a["fontSize"] == b["fontSize"]) return a["y"] > b["y"];
					    return a["fontSize"] < b["fontSize"];
					  });
					  return priceRecordsSortedByFontSize && priceRecordsSortedByFontSize[0] ? priceRecordsSortedByFontSize[0]['text'] : '';
				    });

				    product.offers = [{
				    	price: price.match(/-?[\d\.]+/g)[0],
	                    "currency": price.replace(/[0-9]/g, '').replace(/\./g, ''),
	                    "availability": "InStock",
	                    "regularPrice": price.match(/-?[\d\.]+/g)[0]
				    }];

				    const response = {
				    	status: 200,
				    	data: [{
				    		query: {
				                "domain": new URL(req.query.url).domain,
				                "userQuery": {
				                    "url": req.query.url,
				                    "pageType": "product"
				                }
				            },
				    		product,
				    	}]
				    }
					console.log('Scrapped Product: ', req.query.url);

				    res.send(response);
				} catch(err) {
					res.status(500).send({
						message: err,
						status: 500,
					});
				}
			}).catch(err => {
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
			message: 'Bad Request',
			status: 400,
		});
	}
});

// Making Express listen on port 7000
app.listen(7000, function () {
  console.log(`Running on port 7000.`);
});