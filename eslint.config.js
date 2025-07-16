import RulesMFDC from '@momsfriendlydevco/eslint-config';

export default [
	{
		// Global ignore rules
		ignores: [
			'.*',
			'docs/',
			'node_modules/',
		],

		// Generic global objects
		languageOptions: {
			globals: {
				// Put custom globals here
			},
		},
	},
	...RulesMFDC,
]
