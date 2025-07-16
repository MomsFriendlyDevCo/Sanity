run:
	@SANITY_MODULES="$PWD/docs/examples/*.js" ./ui/cli.js

vrun:
	# Run verbosely
	@SANITY_MODULES="$PWD/docs/examples/*.js" ./ui/cli.js -vvvvvvvvvvvvvvvv
