const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function crawlPage(baseURL, currentURL, pages) {
  const currentURLObject = new URL(currentURL);
  const baseURLObject = new URL(baseURL);
  if (currentURLObject.host !== baseURLObject.host) {
    return pages;
  }

  const normalizedURL = normalizeURL(currentURL);
  if (pages[normalizedURL] > 0) {
    pages[normalizedURL]++;
    return pages;
  }
  pages[normalizedURL] = 1;

  // fetch and parse html of the current url
  console.log(`crawlPage: ${currentURL}`);
  let htmlBody = "";
  try {
    const response = await fetch(currentURL);
    if (response.status > 399) {
      console.log(`Error: ${response.status} ${response.statusText} Link: ${currentURL}`);
      return pages;
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.log(`Error: ${response.status} ${response.statusText} Link: ${currentURL}`);
      return pages;
    }
    htmlBody = await response.text();
  } catch (error) {
    console.log(`Error: ${error.message} Link: ${currentURL}`);
  }
  const nextURLs = getURLsFromHTML(htmlBody, baseURL);
  for (const nextURL of nextURLs) {
    pages = await crawlPage(baseURL, nextURL, pages);
  }
  return pages;
}

const normalizeURL = (url) => {
  const urlObj = new URL(url);
  let fullPath = `${urlObj.host}${urlObj.pathname}`;
  if (fullPath.length > 0 && fullPath.slice(-1) === "/") {
    fullPath = fullPath.slice(0, -1);
  }
  return fullPath;
};

const getURLsFromHTML = (htmlBody, baseURL) => {
  const urls = [];
  const dom = new JSDOM(htmlBody);
  const aElements = dom.window.document.querySelectorAll("a");
  for (const aElement of aElements) {
    if (aElement.href.slice(0, 1) === "/") {
      try {
        urls.push(new URL(aElement.href, baseURL).href);
      } catch (err) {
        console.log(`${err.message}: ${aElement.href}`);
      }
    } else {
      try {
        urls.push(new URL(aElement.href).href);
      } catch (err) {
        console.log(`${err.message}: ${aElement.href}`);
      }
    }
  }

  return urls;
};

module.exports = { normalizeURL, getURLsFromHTML, crawlPage };
