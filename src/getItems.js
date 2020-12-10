const Apify = require('apify');

const { log } = Apify.utils;

async function getItems(pageObj, resultsArr) {
    // Scrape all items that match the selector
    const itemsObj = await pageObj.$$eval('a-col-right .a-link-normal a h2', prods => prods.map(prod => prod.innerHTML));

    const pricesObj = await pageObj.$$eval('a-col-right .a-offscreen', prices => prices.map(el => el.innerHTML));

    const urlsObj = await pageObj.$$eval('div.a-col-left  a.a-link-normal', links => links.map(link => link.href));

    const imgsObj = await pageObj.$$eval('div.a-col-left > img', imgs => imgs.map(img => img.src));
    
    const asinsObj = await pageObj.$$eval('.a-col-right .a-spacing-mini > span', asins => asins.map(asin => asin.name));
    
    const reviewsObj = await pageObj.$$eval('.a-col-right . .a-icon-alt', reviews => reviews.map(el => el.innerHTML));
    
    const reviewscountObj= await pageObj.$$eval('.a-span-last a.a-text-normal', reviewscount => reviewscount.map(el => el.innerHTML));
    
    const releasedatesObj= await pageObj.$$eval('a-col-right span span span', releasedates => releasedates.map(el => el.innerHTML));

    // Get rid of duplicate URLs (couldn't avoid scraping them)
    const urlsArr = [];
    for (const link of urlsObj) {
        if (!urlsArr.includes(link)) {
            urlsArr.push(link);
        }
    }

    // Add scraped items to results array
    for (let i = 0; i < Object.keys(itemsObj).length; i++) {
        resultsArr.items.push({
            ID: resultsArr.items.length,
            name: itemsObj[i],
            price: pricesObj[i],
            url: urlsArr[i],
            thumbnail: imgsObj[i],
            asins: asinsObj[i],
            reviews: reviewsObj[i],
            reviewscount: reviewscountObj[i],
            releasedate: releasedatesObj[i],
        });
    }
}

async function scrapeDetailsPage(pageObj, resultsArr) {
    
    log.error(`Not scraping details pages`);
    
    return;
    // Scrape page 1
    await getItems(pageObj, resultsArr);
    // Go to page 2 and scrape
    let nextPage;
    try {
        nextPage = await pageObj.waitFor('li.a-last > a');
    } catch (e) {
        log.error(`Could not extract second page - only one page returned. ${e}`);
    }
    if (nextPage !== null) {
        await nextPage.click();
        await pageObj.waitForNavigation();
        await getItems(pageObj, resultsArr);
        await Apify.pushData(resultsArr);
        log.info(`Saving results from ${await pageObj.title()}`);
    }
}

module.exports = { scrapeDetailsPage };
