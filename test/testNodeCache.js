const NodeCache = require('node-cache');
const cache = new NodeCache();
const expect = require('chai').expect;
const wait = require('pwait');

describe('test node-cache', function() {
	this.timeout(60000);

	it('test miliseconds', async () => {

		expect(cache.set('foo', 'bar', 0.1)).to.equal(true);
		expect(cache.get('foo')).to.equal('bar');
		await wait(101);
		expect(cache.get('foo')).to.equal(undefined);

	});
})