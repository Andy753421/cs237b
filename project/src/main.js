/* Globals */
var grammar = null;
var parser  = null;
var output  = '';

/* Print function */
function print(text) {
	output += text;
}

/* Start embedding a paste */
function embed() {
	/* Get current paste information */
	var scripts = document.getElementsByTagName('script');
	var script  = scripts[scripts.length-1];
	var source  = strip_spaces(script.textContent);
	var strip   = source.replace(/\s*#.*\n/g,'\n')
	                    .replace(/\s*#.*$/g, '');

	/* Ignore empty code */
	if (!strip.match(/\S/))
		return;

	/* Add source box */
	try {
		var match   = grammar.match(strip);
		var tree    = parser(match).run();
		var val     = interp(tree);
	} catch(e) {
		var error   = e;
	}

	/* Output */
	addbox('Source', source,   'inside', true)
	addbox('Tree',   pp(tree), 'javascript');
	if (match.failed()) {
		addbox('Error', match.message);
		return;
	}
	addbox('Output', output);
	addbox('Return', JSON.stringify(val));
	addbox('Error',  error);
}

/* Init */
if (!grammar) {
	var scripts = document.getElementsByTagName('script');
	for (var i=0; i<scripts.length; i++) {
		if (scripts[i].type != 'text/ohm-js')
			continue
		grammar = init_grammar(scripts[i]);
		break;
	}
}

if (!parser) {
	parser = init_parser(grammar);
}

/* Main */
embed();
