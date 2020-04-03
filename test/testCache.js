const Cache = require('../cache');
const NodeCache = require('node-cache');
const expect = require('chai').expect;
const wait = require('pwait');

function log(v) {
	console.log(v);
	return v;
}

describe('test cache node-fetch', function() {

	const cacheInstance = new NodeCache({
		stdTTL: 1
	});

	let cache = new Cache(cacheInstance);

	it('clean', () => {
		return cache.del('foo').then(log);
	});

	it('clean', () => {
		return cache.del('foo').then(log);
	});

	it('test get foo', () => {
		return cache.get('foo').then(log).then(r => {
			expect(r).to.equal(null);
		});
	});

	it('test set foo', () => {
		return cache.set('foo', {bar: 'bar'}).then(log);
	});

	it('test get foo', () => {
		return cache.get('foo').then(log).then(r => {
			expect(r).to.be.an('object');
			expect(r.bar).to.equal('bar');
		});
	});

	it('test set foo with ttl=1', () => {
		return cache.set('foo', 'bar', 'EX', 1).then(log);
	});

	it('test get foo', () => {
		return cache.get('foo').then(log).then(r => {
			expect(r).to.equal('bar');
		});
	});

	it('should wait 1 second', () => wait(1100));

	it('should get foo == null', () => {
		return cache.get('foo').then(log).then(r => {
			expect(r).to.equal(null);
		});
	});

	it('should get and set for 1s', async function() {
		this.timeout(60000);
		let startTime = Date.now();
		let t = 0;
		while ( true ) {
			let now = Date.now();
			await cache.set('foo', now);
			let r = await cache.get('foo');
			expect(r).to.equal(now);
			t++;
			if (now - startTime >= 1000) break;
		}
		console.log(t);
		return Promise.resolve(1);
	});

	it('test NX', async function() {
		await cache.set('foo', 'bar', 'PX', 100);
		expect(await cache.get('foo')).to.equal('bar');
		expect(await cache.set('foo', 'bar2', 'PX', 100, 'NX')).to.equal(false);
		expect(await cache.get('foo')).to.equal('bar');
		expect(await cache.set('foo', 'bar2', 'PX', 100)).to.equal(true);
		expect(await cache.get('foo')).to.equal('bar2');
		await wait(105);
		expect(await cache.get('foo')).to.equal(null);
	});

	it('test XX', async function() {
		await cache.del('foo');
		expect(await cache.get('foo')).to.equal(null);
		expect(await cache.set('foo', 'bar', 'PX', 100, 'XX')).to.equal(false);
		await cache.set('foo', '1');
		expect(await cache.set('foo', 'bar2', 'PX', 100, 'XX')).to.equal(true);
		expect(await cache.get('foo')).to.equal('bar2');
		expect(await cache.set('foo', 'bar3', 'XX')).to.equal(true);
		expect(await cache.get('foo')).to.equal('bar3');
		await cache.del('foo');
		expect(await cache.set('foo', 'bar', 'NX')).to.equal(true);
	});

});