import Sanity from '#lib/sanity';

/**
* Return a Connect / ExpressJS compatible middleware which can handle web requests
*
* @param {Object} [options] Additional options to mutate behaviour
* @param {String|Array} [options.paths] Overriding module glob-path from the default process.env.SANITY_MODULES
* @param {Boolean} [options.header] Include a simple `SANITY:{PASS|FAIL}` header as the very first line
* @param {Object} [options.execOptions] Options to pass to each invocation of `Sanity.exec()`
*
* @returns {Promise<Function>} Eventual middleware function
*/
export default async function sanityMiddleware(options) {
	let settings = {
		paths: null,
		header: true,
		execOptions: {},
		...options,
	};

	await Sanity
		.set('colors', false)
		.loadEnv(settings.paths);

	return (req, res) => {
		Sanity.exec(settings.execOptions)
			.then(report => Object.values(report)
				.map(mod => [
					mod.status + ':',
					mod.id,
					Array.isArray(mod.text)
						? mod.text.join(' \\\\ ')
						: mod.text,
				].filter(Boolean).join(' '))
				.join('\n')
			)
			.then(output => res.type('text').send(output))
			.catch(e => {
				console.warn('Error invoking Sanity middleware', e);
				res.sendStatus(500);
			})
	};
}
