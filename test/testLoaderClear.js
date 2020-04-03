const Cacheable = require('../');
const wait = require('pwait');

const loader = new Cacheable(async (brand_id) => {
	console.log('getting brand', brand_id);
	await wait(100);
	return { brand_id };
});

describe('test loader', function() {

	this.timeout(600000);

	it('should load', () => {
		return loader.load(123);
	});

	it('should load', () => {
		return loader.load(123);
	});

	it('should clear 123', () => {
		return loader.clear(123).then(r => {
			console.log('cleared', typeof r, r);
		});
	});

	it('should load', () => {
		return loader.load(123);
	});

});
