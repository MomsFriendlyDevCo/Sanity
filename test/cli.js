import {dirName} from '@momsfriendlydevco/es6';
import {execa} from 'execa';
import {expect} from 'chai';
import fsPath from 'node:path';
import Sanity from '#lib/sanity';

const __dirname = dirName('..');

describe('Sanity - CLI tests', ()=> {

	it('CLI cycle', ()=> {
		let {stdout} = await execa('./app.js', [
			'--env', fsPath.join(__dirname, 'docs/examples/*.js')
		]);

		expect(stdout).to.deep.equal([
		]);
	});

});
