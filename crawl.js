const env_variables = require('dotenv').config();

if (env_variables.error || !env_variables.parsed) {
	throw "Please create a .env file in the projects root directory with TARGET_DOMAIN={your domain}";
}
const config = env_variables.parsed;

const staticCrawler = require('./scripts/staticCrawler.js');

console.log('Crawling ', config.TARGET_DOMAIN);

let extended_domains = [];
if (config.EXTENDED_DOMAINS) {
	extended_domains = config.EXTENDED_DOMAINS.split(',');
}
extended_domains.push(config.TARGET_DOMAIN);

let auth = null;

if (env_variables.parsed.USERNAME) {
	auth = {
		username: env_variables.parsed.USERNAME,
		password: env_variables.parsed.PASSWORD,
	}
}

staticCrawler(config.TARGET_DOMAIN, config.MATCH_404, extended_domains, auth, env_variables.parsed.REPLACE_URL ? env_variables.parsed.REPLACE_URL.split(',') : undefined);