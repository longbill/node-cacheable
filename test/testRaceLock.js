const Cache = require('../cache');
const Lock = require('../lock');
const NodeCache = require('node-cache');
const pwait = require('pwait');
const waitRand = () => pwait(Math.ceil( Math.random() * 20 ));

let prefix = process.argv[3] || '';
let log = console.log.bind(console);

let i = 0;
let lastms = Date.now();
let running = false;
function getTime() {
	let now = Date.now();
	let re = now - lastms;
	lastms = now;
	return re + 'ms';
}

function createTask() {
	let name = `task${prefix} ${(++i)}`;
	return function(delayed) {
		console.log(name + ' start,', (delayed ? 'delayed' : ''), getTime());
		if (running) throw new Error('running is true');
		running = true;
		//results.push(name + ' start ' + getTime());
		return waitRand().then(() => {
			// if (Math.random() > 0.9) throw new Error('random error for ' + name);
			//results.push(name + ' end ' + getTime());
			console.log(name + ' done', getTime());
			running = false;
			return name + ' done';
		});
	};
}

const nodeCache = new NodeCache();
let cache = new Cache(nodeCache);
let lock = new Lock(cache, {
	defaultTimeout: 1000 
});


describe('test lock', function() {
	this.timeout(20000);

	it('should test lock', () => {
		return Promise.all([
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask(), true)).then(log),
			waitRand().then(() => lock.race('lock1', createTask(), true)).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
			waitRand().then(() => lock.race('lock1', createTask())).then(log),
		]).then(() => {
			return Promise.all([
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
				waitRand().then(() => lock.race('lock1', createTask())).then(log),
			]);
		});
	});
});


