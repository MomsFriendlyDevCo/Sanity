#!/usr/bin/node

import chalk from 'chalk';
import {program} from 'commander';
import Sanity from '#lib/sanity';
import stripAnsi from 'strip-ansi';

program
	.name('sanity')
	.usage('[options] [test-id...]')
	.option('-e, --env [paths]', 'Override the default environment globpath')
	.option('-v, --verbose', 'Be verbose. Specify multiple times for increasing verbosity', function(i, v) { return v + 1 }, 0)
	.option('--no-color', 'Force disable color')
	.parse(process.argv);

// Extract all program arguments and dump into generic `args` object + `args.argv` values array
let args = {
	...program.opts(), // Read in regular commander options
	argvs: program.args, // Add remaining args (files in this case) as its own property
};

Promise.resolve()
	.then(()=> Sanity.loadEnv(program.env))
	.then(()=> Sanity.exec())
	.then(report => Object.values(report)
		.forEach(item => {
			let hasMultiline = item.text && Array.isArray(item.text) && item.text.length > 1;

			let linePrefix = [
				chalk.bgBlue(item.id),
				item.status == 'ok' ? chalk.green('OK')
				: item.status == 'timeout' ? chalk.red('TIMEOUT')
				: chalk.bgRed(item.status.toUpperCase()),
			];

			if (hasMultiline) {
				let prefixLength = linePrefix.map(stripAnsi).join(' ').length;
				item.text.forEach((line, lineIndex) =>
					Sanity.log(0, ...[
						...(lineIndex == 0
							? linePrefix
							: [' '.repeat(prefixLength)]
						),
						line,
					])
				);
			} else { // Single line output
				Sanity.log(0, ...[
					...linePrefix,
					...(item.text ? [item.text] : []),
				])
			}
		})
	)
	.then(()=> process.exit(0))
	.catch(e => {
		console.warn(e);
		process.exit(1);
	})
