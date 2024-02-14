export default {
	id: 'alwaysFail',
	title: 'A module which will always fail',
	frequency: '1m',
	handler() {
		throw new Error('This module will always error out');
	},
}
