export default {
	id: 'multiline-response',
	title: 'Module with a multiple line response',
	frequency: '1m',
	handler() {
		return [
			'Foo!',
			'Bar!',
			'Baz!',
		];
	},
}
