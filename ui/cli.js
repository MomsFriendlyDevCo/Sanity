#!/usr/bin/node

import chalk from 'chalk';
import match from '@momsfriendlydevco/match';
import {program as Program} from 'commander';
import Sanity from '#lib/sanity';
import stripAnsi from 'strip-ansi';
import commanderExtras from 'commander-extras';


let program = commanderExtras(Program)
	.name('sanity')
	.usage('[options] [test-id...]')
	.description('Run Sanity modules')
	.option('-p, --path [paths]', 'Override the default environment globpath')
	.option('-r, --require [path]', 'Optional file to further configure sanity before running')
	.option('-v, --verbose', 'Be verbose. Specify multiple times for increasing verbosity', (i, v) => v + 1, 0)
	.option('--no-align', 'Do not align columns in output')
	.option('--no-color', 'Force disable color')
	.option('--no-modules', 'Skip individual module output')
	.option('--no-summary', 'Skip output of an overall summary')
	.option('--no-verdict', 'Skip output of an overall verdict')
	.env('SANITY_MODULES', 'Comma / Semi-colon seperated value list of all glob-paths to search for modules')
	.note('All IDs can be any valid @MomsFriendlyDevCo/Match expression such as "exact" "/regExp/" or "globs*"')
	.parse(process.argv);

// Extract all program arguments and dump into generic `args` object + `args.argv` values array
let args = {
	...program.opts(), // Read in regular commander options
	argv: program.args, // Add remaining args (files in this case) as its own property
};

Promise.resolve()
	.then(()=> Sanity
		.set('logLevel', args.verbose ?? 0)
		.loadEnv(program.path)
	)
	.then(()=> Sanity.exec({
		filter: args.argv.length > 0 // Compute a filter based on the incoming test-ids (argv) values
			? module => match.isMatch(args.argv, module.id)
			: ()=> true,
	}))
	.then(report => {
		// Module output
		let largestModPrefix = Object.values(report.modules)
			.map(mod => mod.status + mod.id)
			.reduce((t, v) => v.length > t ? v.length : t, 0);

		Object.values(report.modules)
			.forEach(item => {
				let linePrefix = [
					item.status == 'PASS' ? Sanity.colorize('statusPass', 'PASS')
					: item.status == 'WARN' ? Sanity.colorize('statusWarn', 'WARN')
					: Sanity.colorize('statusFail', item.status),
					Sanity.colorize('module', item.id),
				];
				let prefixLength = stripAnsi(linePrefix.join(' ')).length;
				if (args.align && prefixLength < largestModPrefix)
					linePrefix.push(' '.repeat(largestModPrefix - prefixLength));

				if (args.modules)
					Sanity.log(0, ...[
						...linePrefix,
						...(item.text ? [item.text] : []),
					])
			})

		// Summary output
		if (args.summary)
			Sanity
				.log(0, '')
				.log(0, Object.entries(report.summary)
					.map(([status, count]) =>
						Sanity.colorize('summaryLabel', status)
						+ ':'
						+ Sanity.colorize('summaryValue', count)
					)
					.join(', ')
				);

		// Verdict output
		if (args.verdict)
			Sanity
				.log(0, '')
				.log(0,
					Sanity.colorize('verdictLabel', 'Verdict:'),
					Sanity.colorize(report.verdict == 'PASS' ? 'statusPass' : 'statusFail', report.verdict)
				)
	})
	.then(()=> process.exit(0))
	.catch(e => {
		console.warn(e);
		process.exit(1);
	})
