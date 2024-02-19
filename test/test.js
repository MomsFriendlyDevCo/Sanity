import {dirName} from '@momsfriendlydevco/es6';
import {expect} from 'chai';
import fsPath from 'node:path';
import Sanity from '#lib/sanity';

const __dirname = dirName('..');

describe('Sanity - Example tests', ()=> {

	before('Load environment', ()=> Sanity
		.set('logLevel', 10)
		.loadEnv({
			paths: fsPath.join(__dirname, 'docs/examples/*.js'),
		})
	);

	it('verify example tests are loaded', ()=> {
		expect(Object.keys(Sanity.modules).sort()).to.have.length.above(0);
	});

	it('loaded the "Hello World" module', ()=> {
		expect(Sanity.modules).to.have.property('helloWorld');

		const hw = Sanity.modules['helloWorld'];
		expect(hw).to.have.property('id', 'helloWorld');
		expect(hw).to.have.property('title', 'Hello World module');
		expect(hw).to.have.property('frequency', '1m');
		expect(hw).to.have.property('handler');
	});


	it('run one cycle of the "Hello World" module', async ()=> {
		let report = await Sanity.exec();
		expect(report).to.have.nested.property('modules.helloWorld');
		expect(report).to.have.nested.property('modules.helloWorld.id', 'helloWorld');
		expect(report).to.have.nested.property('modules.helloWorld.status', 'PASS');
		expect(report).to.have.nested.property('modules.helloWorld.text', 'Hello World!');
	})

});
