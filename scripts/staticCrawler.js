const fetch = require('node-fetch');
const cheerio = require('cheerio')

const urls = {
	fetched: [],
	pending: [],
	errors: [],
	source: {},
}

const getDomain = (url) => {
	try {
		return url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i)[1];
	} catch (e) {
		return url;
	}
}
const convertToUrl = (url) => {
	if (url.match(/https/i) !== null) {
		return url;
	} else {
		return `https://${url}`;
	}
}
const convertToAbsolute = (sourceURL, targetURL) => {
	if (targetURL.match(/^https:\/\//)) {
		return targetURL.split('#')[0];
	}
	if (targetURL.match(/^\/\//)) {
		return "https:"+targetURL.split('#')[0];
	}
	if (targetURL.match(/^\//)) {
		return "https://"+getDomain(sourceURL)+targetURL.split('#')[0];
	}
	return targetURL.split('#')[0];
}

const crawl = (url, match_404, extended_domains) => {
	for (let index = 0; index < urls.pending.length; index++) {
		if (urls.pending[index] === url) {
			urls.pending.splice(index, 1);
		}
	}

	console.log('crawling', url);
	console.log(urls.pending.length, 'urls remaining');
	return new Promise((resolve, reject) => {
		fetch(convertToUrl(url))
			.then(response => {
				let found_404 = false;

				if (response.status === 404) {
					console.log('found response 404 at', url, '(status)');
					found_404 = true;
				}
				response.text().then((body) => {
					if ((match_404 !== undefined && body.includes(match_404))) {
						console.log('found content 404 at', url);
						found_404 = true;
					}

					if (found_404) urls.errors.push(url);

					const $ = cheerio.load(body);
					$('a').map(function (i, el) {
						try {
							if (el.attribs.href) {
								const link = convertToAbsolute(url, el.attribs.href);
								if (extended_domains.includes(getDomain(link))) {
									if (!urls.source[link]) urls.source[link] = [];
									if (!urls.source[link].includes(url)) urls.source[link].push(url);

									if (!urls.fetched.includes(link) && !urls.pending.includes(link)) {
										urls.pending.push(link);
									}
								}
							}
						} catch (e) {
							console.log(url, el, e)
						}
					});

					urls.fetched.push(url);
					if (urls.pending.length > 0) {
						crawl(urls.pending[0], match_404, extended_domains).then(resolve).catch(reject);
					} else {
						console.log(urls.fetched);
						console.log(urls.fetched.length, 'URLs fetched!')
						for (let index = 0; index < urls.errors.length; index++) {
							const element = urls.errors[index];
							console.log(element, urls.source[element]);
						}
					}
				})
			})
			.catch(error => {
				crawl(url, match_404, extended_domains);
				throw error;
			})
	})
}

module.exports = crawl;