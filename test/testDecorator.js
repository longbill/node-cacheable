const { cacheable } = require('../');
const expect = require('chai').expect;
const wait = require('pwait');

getName = cacheable(3)(getName);
getName(1).then(console.log);
getName(1).then(console.log);

let executed = 0;
async function getName(id) {
	console.log('real getting name: ' + id);
	return 'name' + id;
}


describe('test decorator', function() {

	this.timeout(600000);

	it('should load', async () => {
		expect(await getName(1), 'name1');
		expect(executed, 1);
		expect(await getName(1), 'name1');
		expect(executed, 1);
		expect(await getName(2), 'name2');
		expect(executed, 2);
		await wait(3000);
		expect(await getName(1), 'name1');
		expect(executed, 3);
	});

});