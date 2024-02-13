export default {
	id: 'helloWorld',
	title: 'Hello World module',
	frequency: '1m',
	handler() {
		return new Promise(resolve =>
			setTimeout(()=> resolve('Hello World!', 100))
		);
	},
}
