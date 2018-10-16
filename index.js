const inquirer = require('inquirer');
const R = require('ramda');
const Cloudflare = require('cloudflare');
const fuzzy = require('fuzzy');

const { listDomains, setDomains } = require('./lib/');
const config = require('./config/cloudflare');
const script = {};

const CFclient = new Cloudflare(config.auth);
inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));

const confirmChoosing = zones => {
	console.log('\x1b[33m%s\x1b[0m', 'Zones that was choosed:');
	console.log(zones);
	return inquirer
		.prompt([{
			type: 'expand',
			name: 'confirm',
			message: 'Are you sure?:',
			choices: [
				{
					key: 'y',
					name: 'Confirm',
					value: 'y'
				},
				{
					key: 'n',
					name: 'Exit',
					value: 'n'
				},
				new inquirer.Separator('/dfsafdsdf')
			]
		}])
		.then(R.prop('confirm'))
		.then(R.ifElse(R.equals('y'), () => zones, () => { throw Error('Canceled by user'); }));
};

const chooseZones = zoneNames => {
	const zoneChoises = R.concat(['all'], zoneNames);
	return inquirer
		.prompt([
			{
				type: 'checkbox-plus',
				name: 'zones',
				message: 'Choose the domain for checking',
				choices: zoneChoises,
				pageSize: 20,
				highlight: true,
				searchable: true,
				source: (answersSoFar, input = '') => {
					return new Promise(resolve => {
						const fuzzyResult = fuzzy.filter(input, zoneChoises);
						const data = fuzzyResult.map(R.prop('original'));
						resolve(data);
					});
				}
			}
		])
		.then(R.prop('zones'))
		.then(zones => {
			if (R.isEmpty(zones)) throw Error('No data was entered.');
			if (zones.includes('all')) return zoneChoises;
			return zones;
		});
};

const startScript = () => inquirer
	.prompt([
		{
			type: 'list',
			name: 'project',
			message: 'Choose the project:',
			choices: ['Everad', 'Rocket'],
			filter: val => val.toLowerCase()
		}
	])
	.then(R.prop('project'))
	.then(project => {
		script.project = project;
		return project;
	})
	.then(listDomains);

startScript()
	.then(chooseZones)
	.then(confirmChoosing)
	.then(zones => ({ zones, project: script.project }))
	.then(setDomains(CFclient))

	.catch(err => {
		console.log('\x1b[31m%s\x1b[0m', err.message);
		console.error(err);
	});
