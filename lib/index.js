const R = require('ramda');

const {
	readJSONs,
	filterByZones,
	unionZonesByDomains,
	logger,
	promisedMap
} = require('./utils');
const { fetchZones } = require('./zone');

const listDomains = project => readJSONs(project)
	.then(R.reduce(R.concat, []))
	.then(R.pluck('domain'))
	.then(R.sort(R.comparator((a, b) => a < b)))
	.then(R.uniq);

const setDomains = client => ({ zones, project }) => readJSONs(project)
	.then(R.reduce(R.concat, []))
	.then(filterByZones(zones))
	.then(unionZonesByDomains)
	.then(logger('Getting zone ids from Cloudflare...'))
	.then(R.splitEvery(10))
	.then(promisedMap(fetchZones(client)))
	.then(logger('END'));

module.exports = {
	listDomains,
	setDomains
};
