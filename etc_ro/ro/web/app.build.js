({
	appDir : "./",
	baseUrl : "js",
	dir : "../webapp-build",
	mainConfigFile : 'js/main.js',
	//Comment out the optimize line if you want
	//the code minified by UglifyJS
	optimize : "none",
	optimizeCss : "standard.keepLines",
	preserveLicenseComments : "false",
	removeCombined : true,
	modules : [{
			name : "main",
			exclude : ["jquery"],
			include : [
                'config/config',
                'config/menu',
                'jq_i18n',
                'jq_validate',
                'jq_additional',
                'jq_simplemodal',
                'jq_translate',
				'language',
				'logout',
				'status/statusBar',
				'router',
                'base64',
				'login']
		}, {
			name : "knockout",
			insertRequire : ['lib/knockout/knockout.simpleGrid']
		}
	]
})
