const R = require('ramda');

const { logger, promisedMap } = require('./utils');
const {
	getARecord,
	checkProxi,
	createRecordChunks,
	addRecordChunk
} = require('./record');

const fetchZone = client => zone => client.zones.browse({ name: zone.domain })
	.then(logger(`getting data for ${zone.domain}`))
	.then(R.path(['result', '0', 'id']))
	.then(getARecord(client, zone.domain))
	.then(logger(`start adding records to zone '${zone.domain}' (${zone.count})`))
	.then(checkProxi(client))
	.then(createRecordChunks(zone))
	.then(R.splitEvery(8))
	.then(promisedMap(addRecordChunk(client)))
	.then(logger(`end adding records to zone '${zone.domain}'`))

	.catch(err => {
		console.error('\x1b[31m%s\x1b[0m', err.message);
	});

const fetchZones = client => promisedMap(fetchZone(client), 3);

module.exports = {
	fetchZones
};
