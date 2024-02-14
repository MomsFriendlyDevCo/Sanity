import chalk from 'chalk';
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
	* Accepted statuses for the SanityModuleReport
	*
	* @type {Set}
	*/
	statuses = new Set([
		'PASS', // Module handler passed
		'WARN', // Warning
		'FAIL', // Module handler reported a fail
		'TIME', // TIMEout
		'ERRO', // Errored during run
	]);


	/**
	* Style pallete to use for various highlighting
	*
	* @type {Boolean|Object} Either boolean false (to disable) or an object of style lookups
	*/
	styles = {
		module: 'bgBlue',
		statusPass: 'green',
		statusWarn: 'yellow',
		statusFail: 'bgRed',
	};


	/**
	* Function to use when colorizing or formatting text based on the values within `colors`
	*
	* @param {String} style The style to look up from `colors`
	* @param {String} text The text item to format
	*
	* @returns {String} The, optionally formatted, input text
	*/
	colorize(style, text) {
		return this.colors === false ? text // Colors are disabled anyway
			: this.styles[style] ? chalk[this.styles[style]](text) // Color exists
			: text;
	}


	/**
	* Quickly set one or more Sanity options for this module
	*
	* @param {String|Object} key Either the config to set or an object to merge
	* @param {*} [val] Value to set if key is a single string to set
	*
	* @returns {Sanity} This chainable module
	*/
	set(key, val) {
		if (typeof key == 'string') {
			this[key] = val;
		} else {
			Object.assign(this, val);
		}
		return this;
	}



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
			.split(/\s*[,;]+\s*/)
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
	*
	* @description A single entity from the `exec` function
	*
	* @property {Object<SanityModuleReport>} modules A lookup object for each modules report
	*/

	/**
	* @typedef SanityModuleReport
	*
	* @description An individual SanityModule report within a SanityReport
	* @property {String} modules.id The ID of the report that executed
	* @property {String} modules.status The status of the runner. ENUM: 'ok', 'error', 'timeout'
	* @property {String|Array|Null} modules.text Optional context returned by the handler
	*/

	/**
	* Execute all module and return a report
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Function} [options.filter] Function filter, applied per module to determine if the module gets applied to this exec() run
	*
	* @returns {Promise<Object<SanityReport>>} A promise which resolves to an object of reports
	*/
	exec(options) {
		let settings = {
			filter: ()=> true,
			...options,
		};

		let report = { // Eventual report object
			modules: {},
		};

		return Promise.resolve()
			// Sanity checks {{{
			.then(()=> {
				if (Object.keys(this.modules).length == 0) throw new Error('No sanity modules to run');
			})
			// }}}
			// Run all before() handlers {{{
			.then(()=> Promise.all(
				Object.values(this.modules)
					.filter(module =>
						module.enabled
						&& module.before
						&& !module.beforeHasRun
						&& settings.filter.call(this, module)
					)
					.map(module => module.before.call(this))
			))
			// }}}
			// Run all handlers (each time) {{{
			.then(()=> Promise.all(
				Object.values(this.modules)
					.filter(module => module.enabled
						&& settings.filter.call(this, module)
					)
					.map(module => {
						let domain = Domain.create();
						return domain.run(()=> Promise.resolve()
							.then(()=> module.handler.call(this))
							.then(result => {
								this.log(5, 'Got raw result', module.id, '=', result);
								this.spliceModuleReport(report, module.id, result);
							})
							.catch(e => {
								this.log(5, 'Got raw throw', module.id, '=', e);
								this.spliceModuleReport(report, module.id, e.toString(), {
									status: 'ERRO',
								});
							})
						);
					})
			))
			// }}}
			.then(()=> report);
	}


	/**
	* Internal function to splice an individual raw module report into the eventual SanityReport object
	* This function mutates the input `report`
	*
	* @param {SanityReport} report The overall sanity report to output
	* @param {String} moduleId The module that is providing the report
	* @param {Object} input The raw module report, this should resemble the format of a SanityModuleReport
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {String} [options.status] Optional status override for the response
	*/
	spliceModuleReport(report, moduleId, input, options) {
		let settings = {
			status: null,
			...options,
		};

		if (!report || !moduleId || !input) throw new Error('Unspecified report, moduleId or input');

		if (typeof input == 'object') { // Got a report made up of multiple sub-reports
			// Redirect sub-modules into this function with the moduleId suffixed with the sub-report ID
			Object.entries(input)
				.forEach(([sId, sReport]) => this.spliceModuleReport(report, `${moduleId}/${sId}`, sReport))
		} else if (typeof input == 'string') { // Simple string return
			let statusParser = new RegExp(
				'^(?<status>'
					+ Array.from(this.statuses).join('|')
				+ '):\\s*'
				+ '(?<text>.+)$'
			);

			let parsedStatus = statusParser.exec(input)?.groups;
			if (parsedStatus) { // String has prefix e.g. `PASS: All went well`
				report.modules[moduleId] = {
					id: moduleId,
					status: settings.status || parsedStatus.status,
					text: parsedStatus.text,
				};
			} else { // Single string SANS prefix
				report.modules[moduleId] = {
					id: moduleId,
					status: settings.status || 'PASS',
					text: input,
				};
			}
		} else {
			throw new Error('Unregonised response for "${moduleId}" module report - responses can be {Object<String>|String}');
		}
	}
}

export default new Sanity();
