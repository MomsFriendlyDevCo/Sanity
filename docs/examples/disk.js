import {dirName} from '@momsfriendlydevco/es6';
import disk from '@momsfriendlydevco/sanity/utils/disk';

const __dirname = dirName();

export default {
	id: 'disk',
	title: 'Primary system disk checks',
	frequency: '10m',
	handler() {
		return disk(__dirname, {
			minFree: 10,
			writable: true,
		});
	},
}
