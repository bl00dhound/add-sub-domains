const R = require('ramda');
const Promise = require('bluebird');

const { promisedMap, logger } = require('./utils');

const changeRecord = client => R.compose(
	record => client.dnsRecords.edit(record.zone_id, record.id, R.omit(['zone_id', 'id'])(record)).then(() => record),
	//! R.evolve({ proxied: R.T }), // uncomment before starting
	R.pick(['type', 'name', 'content', 'proxied', 'zone_id', 'id'])
);

const addRecord = client => record => client.dnsRecords.add(record.zone_id, R.omit(['zone_id'])(record))
	.then(R.path(['result', 'name']))
	.then(recordName => logger(`    Successfully added DNSrecord ${recordName}`)())
	.catch(err => {
		console.log('\x1b[31m%s\x1b[0m', `    Can't add record ${record.name}`);
	})

const checkProxi = client => R.ifElse(
	R.propEq('proxied', true), //! change to False
	changeRecord(client),
	Promise.resolve
);

const getARecord = (client, name) => zoneId => client.dnsRecords.browse(zoneId, { name, type: 'A' })
	.then(R.pathOr({}, ['result', '0']))
	.catch(err => {
		console.error(err);
	});

const createRecordChunks = ({ domain, records }) => aRecord => {
	if (!aRecord) throw Error(`Zone '${domain}' not found in Cloudflare.`);
	const recordObject = R.compose(R.evolve({ proxied: R.T }), R.pick(['type', 'content', 'proxied', 'zone_id']))(aRecord);
	return R.map(name => ({ name, ...recordObject }))(records);
}

const addRecordChunk = client => promisedMap(addRecord(client), 4);

module.exports = {
	checkProxi,
	getARecord,
	createRecordChunks,
	addRecordChunk
};
