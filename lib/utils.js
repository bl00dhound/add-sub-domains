const R = require('ramda');
const Promise = require('bluebird');
const jsonfile = require('jsonfile');
const path = require('path');

const promisedMap = (fn, concurrency = 1) => data => Promise.map(data, fn, { concurrency });

const readJSONs = project => Promise.all([
	jsonfile.readFile(path.resolve(__dirname, '../.data/', project, 'landing.json')),
	jsonfile.readFile(path.resolve(__dirname, '../.data/', project, 'transit.json'))
]);

const filterByZones = choosedZones => R.filter(zone => choosedZones.includes(zone.domain));

const unionGroup = val => {
	const landings = R.pathOr(R.pathOr([], ['1', 'landings'])(val), ['0', 'landings'])(val);
	const transits = R.pathOr(R.pathOr([], ['1', 'transits'])(val), ['0', 'transits'])(val);
	const domain = R.pathOr(R.path(['1', 'domain']), ['0', 'domain'])(val);
	const count = R.pathOr(0, ['0', 'count'])(val) + R.pathOr(0, ['1', 'count'])(val);
	return {
		domain, count, records: landings.concat(transits)
	};
};

const unionZonesByDomains = R.pipe(
	R.groupBy(R.prop('domain')),
	R.mapObjIndexed(unionGroup),
	R.toPairs,
	R.pluck('1')
);

const logger = message => data => {
	console.log('\x1b[36m%s\x1b[0m', message);
	return data;
};

module.exports = {
	promisedMap,
	readJSONs,
	filterByZones,
	unionZonesByDomains,
	logger
};
