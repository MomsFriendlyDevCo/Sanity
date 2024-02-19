import Sanity from '#lib/sanity';

/**
* Return a Connect / ExpressJS compatible middleware which can handle web requests
*
* @param {Object} [options] Additional options to mutate behaviour
* @param {String|Array} [options.paths] Overriding module glob-path from the default process.env.SANITY_MODULES
* @param {String} [options.require] JS file to import (once) before the cycle runs. Expected to export an async default function which will be called as `(Sanity)`
* @param {Boolean} [options.verdictHeader=true] Include a simple `SANITY:{PASS|FAIL}` header as the very first line
* @param {Boolean} [options.summary=true] Output a summary count of modules
* @param {Object} [options.execOptions] Options to pass to each invocation of `Sanity.exec()`
*
* @returns {Promise<Function>} Eventual middleware function
*/
export default async function sanityMiddleware(options) {
	let settings = {
		paths: null,
		require: null,
		verdictHeader: true,
		summary: true,
		execOptions: {},
		consoleSummary: true,
		...options,
	};

	await Sanity
		.set('colors', false)
		.loadEnv({
			paths: settings.paths,
			configure: settings.configure,
		});

	return (req, res) => {
		Sanity.exec(settings.execOptions)
			.then(report => {
				if (settings.consoleSummary)
					console.log(
						'Sanity checks completed -',
						Object.entries(report.summary)
							.map(([status, count]) => `${status}:${count}`)
							.join(', ')
					);

				let largestModPrefix = Object.values(report.modules)
					.map(mod => mod.id)
					.reduce((t, v) => v.length > t ? v.length : t, 0);

				return [
					...(settings.verdictHeader ? [`SANITY:${report.verdict}`, ''] : []),
					...report.modules
						.map(mod => [
							mod.status + ':',
							mod.id.padEnd(largestModPrefix),
							Array.isArray(mod.text)
								? mod.text.join(' \\\\ ')
								: mod.text,
						].join(' ')),
					...(settings.summary ? [
							'',
							Object.entries(report.summary)
								.map(([status, count]) => `${status}:${count}`)
								.join(', ')
						]
						: []
					),
				].join('\n');
			})
			.then(output => res.type('text').send(output))
			.catch(e => {
				console.warn('Error invoking Sanity middleware', e);
				res.sendStatus(500);
			})
	};
}
