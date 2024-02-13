import Domain from 'node:domain';
import {globby} from 'globby';
import SanityModule from '#lib/sanityModule';

export class Sanity {
	/**
	* Lookup object of loaded modules
	*
	* @type {Object}
	*/
	modules = {};


	/**
	* Current log level
	* The `log()` function will only output content based on this filter
	*
	* @type {Number}
	*/
	logLevel = 0;


	/**
	* Load all modules listed in process.env.SANITY_MODULES if they are not already present
	*
	* @param {String} [globPath] Override path to load from if not using the SANITY_MODULES environment variable
	* @returns {Promise} A promise which resolves when the operation has completed
	*/
	loadEnv(globPath) {
		this.log(5, 'Loading from module list', process.env.SANITY_MODULES);

		let globs =
			globPath
			|| process.env.SANITY_MODULES
			|| (()=> { throw new Error('Unable to determine SANITY_MODULES globpath') })();

		return globby(globs
			.split(/\s*,\s*/)
			.filter(Boolean)
		)
			.then(paths => Promise.all(paths.map(path =>
				this.load(path)
			)))
	}


	/**
	* Load a single module, either by a string path or a raw object defintion
	*
	* @param {String|Object} module The module to load, either as a path or raw object definition
	*
	* @returns {Promise} A promise which resolves when the operation has completed
	*/
	load(module) {
		return Promise.resolve()
			.then(()=> typeof module == 'string'
				? import(module)
				: module
			)
			.then(({default: raw}) => {
				if (typeof module == 'string')
					this.log(2, 'Loading module from path', module);

				return new SanityModule(this, {
					raw,
					sourcePath: typeof module == 'string' ? module : null,
				})
			})
			.then(mod => {
				this.log(1, 'Loaded module', mod.id);
				this.modules[mod.id] = mod;
			})
	}


	/**
	* Output debugging information with an optional prefixed level
	*
	* @param {Number} [level=0] Verbosity level, the higher the level the more verbose filtering is applied
	* @param {*} {...msg] Message content to output
	*/
	log(level, ...msg) {
		// Argument mangling {{{
		if (typeof level != 'number')
			msg.unshift(level);
		// }}}

		if (this.logLevel >= level) console.log(...msg);
	}


	/**
	* @typedef SanityReport
	* @description A single entity from the `exec` function
	* @property {String} id The ID of the report that executed
	* @property {String} status The status of the runner. ENUM: 'ok', 'error', 'timeout'
	* @property {String|Null} text Optional context returned by the handler
	*/

	/**
	* Execute all module and return a report
	*
	* @returns {Promise<Object<SanityReport>>} A promise which resolves to an object of reports
	*/
	exec() {
		let report = {}; // Eventual report object

		return Promise.all(
			Object.values(this.modules)
				.map(module => {
					let domain = Domain.create();
					return domain.run(()=> Promise.resolve()
						.then(()=> module.handler())
						.then(result => {
							this.log(5, 'Got raw result', module.id, '=', result);
							report[module.id] = {
								id: module.id,
								status: 'ok',
								text: result ?? null,
							};
						})
						.catch(e => {
							this.log(5, 'Got raw throw', module.id, '=', e);
							report[module.id] = {
								id: module.id,
								status: 'error',
								text: e.toString(),
							};
						})
					);
				})
		).then(()=> report);
	}

}

export default new Sanity();
