export default {
	id: 'alwaysFail',
	title: 'A module which will always fail',
	frequency: '1m',
	handler() {
		return new Promise(resolve =>
			setTimeout(()=> resolve('FAIL:This module will always fail', 100))
		);
	},
}
