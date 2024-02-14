#!/usr/bin/node

import chalk from 'chalk';
import match from '@momsfriendlydevco/match';
import {program} from 'commander';
import Sanity from '#lib/sanity';
import stripAnsi from 'strip-ansi';
import 'commander-extras';

program
	.name('sanity')
	.usage('[options] [test-id...]')
	.option('-p, --path [paths]', 'Override the default environment globpath')
	.option('-v, --verbose', 'Be verbose. Specify multiple times for increasing verbosity', function(i, v) { return v + 1 }, 0)
	.option('--no-color', 'Force disable color')
	.env('SANITY_MODULES', 'Comma / Semi-colon seperated value list of all glob-paths to search for modules')
	.note('All IDs can be any valid @MomsFriendlyDevCo/Match expression such as "exact" "/regExp/" or "globs*"')
	.parse(process.argv);

// Extract all program arguments and dump into generic `args` object + `args.argv` values array
let args = {
	...program.opts(), // Read in regular commander options
	argv: program.args, // Add remaining args (files in this case) as its own property
};

Promise.resolve()
	.then(()=> Sanity.loadEnv(program.path))
	.then(()=> Sanity.exec({
		filter: args.argv.length > 0 // Compute a filter based on the incoming test-ids (argv) values
			? module => match.isMatch(args.argv, module.id)
			: ()=> true,
	}))
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
