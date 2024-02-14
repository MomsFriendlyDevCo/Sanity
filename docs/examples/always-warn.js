export default {
	id: 'alwaysWarn',
	title: 'A module which will always signal a warning',
	frequency: '1m',
	handler() {
		return new Promise(resolve =>
			setTimeout(()=> resolve('WARN: This test will always warn', 100))
		);
	},
}
