const Cacheable = require('../');
const wait = require('pwait');
const expect = require('chai').expect;

const loader = new Cacheable(async (brand_id, extra) => {
	console.log(` -------------loading--------- `, extra);
	await wait(1000);
	return { brand_id: 133581, brand_name: 'foo'};
});


describe('test loader', function() {

	this.timeout(600000);

	it('1', (done) => {
		let t = setInterval(() => {
			loader.load(133581, {a:'b'}).then(r => {
				expect(r).to.be.an('object');
				expect(r.brand_id).to.equal(133581);
			}).catch(err => {
				console.error('err', err);
			});
		}, 20);
		setTimeout(() => {
			clearInterval(t);
			done();
		}, 500000);
	});

});
