export default {
	id: 'alwaysFail',
	title: 'A module which will always fail',
	frequency: '1m',
	handler() {
		return new Promise((resolve, reject) =>
			setTimeout(()=> reject('This test will always fail', 100))
		);
	},
}
