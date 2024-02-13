#!/usr/bin/node

import chalk from 'chalk';
import {program} from 'commander';
import Sanity from '#lib/sanity';

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
		.forEach(item => Sanity.log(0, ...[
			chalk.bgBlue(item.id),
			item.status == 'ok' ? chalk.green('OK')
			: item.status == 'timeout' ? chalk.red('TIMEOUT')
			: chalk.bgRed(item.status.toUpperCase()),
			...(item.text ? [item.text] : []),
		]))
	)
	.then(()=> process.exit(0))
	.catch(e => {
		console.warn(e);
		process.exit(1);
	})
