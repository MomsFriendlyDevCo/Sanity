export default class SanityModule {

	/**
	* Unique ID per sanity settings.rawule
	*
	* @type {String}
	*/
	id;


	/**
	* Whether the module should be considered for any action
	* @type {Boolean}
	*/
	enabled = true;


	/**
	* Parent Sanity module
	*
	* @type {Sanity}
	*/
	parent;


	/**
	* Prerequisite function to wait on before allowing the handler to execute
	* This will only be executed the first time
	*
	* @type {function}
	*/
	before() {
	}


	/**
	* Indicator that the before function has run at least once
	*
	* @type {Boolean}
	*/
	beforeHasRun = false;


	/**
	* Function run to perform Sanity checks
	* Accepted return values:
	*
	*     * Promise.resolve() / `true` - test passed
	*     * String - test passed a textual description context
	*     * Array<String> - multiline text context
	*     * Object - Object of sub-key / string context
	*
	* @type {function}
	*/
	handler() {
	}


	/**
	* Attempt to load a Sanity settings.rawule from a raw Object import
	*
	* @param {Sanity} sanity Sanity parent instance
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Object} [options.raw] Optional raw import
	* @param {String} [options.sourcePath] Optional context on where the settings.rawule is being loaded from
	*/
	constructor(Sanity, options) {
		let settings = {
			raw: null,
			sourcePath: null,
			...options,
		};

		this.parent = Sanity;

		// Import from raw if provided
		if (settings.raw) {
			try {
				if (typeof settings.raw != 'object' || !settings.raw.id) throw new Error('Loaded content does not resemble a SanityModule');
				if (!settings.raw.handler) throw new Error('No handler function specified');
				if (this.parent[settings.raw.id]) throw new Error(`SanityModule ID "${settings.raw.id}" is already loaded`);

				Object.assign(this, settings.raw);
			} catch (e) {
				if (settings.sourcePath) {
					throw new Error(`new SanityModule("${settings.sourcePath}") - ${e.toString()}`, {cause: e});
				} else {
					throw new Error(`new SanityModule(Object) - ${e.toString()}`, {cause: e});
				}
			}
		}
	}
}
