const { cacheable } = require('../');
const expect = require('chai').expect;
const wait = require('pwait');

getName = cacheable(3)(getName);

let executed = 0;
async function getName(id) {
	console.log('getting name for: ' + id);
	await wait(1000);
	return 'name' + id;
}


describe('test decorator', function() {

	this.timeout(600000);

	it('should load', async () => {
		expect(await getName(1), 'name1');
		expect(executed, 1);
		expect(await getName(), 'nameundefined');
		expect(executed, 2);
		expect(await getName(1), 'name1');
		expect(executed, 2);
		await wait(3000);
		expect(await getName(1), 'name1');
		expect(executed, 3);
	});

});