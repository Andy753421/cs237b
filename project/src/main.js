/* Globals */
var grammar = null;
var parser  = null;
var output  = '';

/* Print function */
function print(text) {
	output += text;
}

/* Start embedding a paste */
function run(text) {
	/* Clear global state */
	output = '';

	/* Run the script */
	try {
		var match = grammar.match(text);
		var tree  = parser(match).run();
		var value = interp(tree);
	} catch(e) {
		var error = e;
	}

	/* Figure out results */
	if (match.failed()) {
		print(match.message);
	} else {
		if (error)
			print("Error: " + error);
		if (value)
			print("Result: " + JSON.stringify(value));
	}

	/* Return output */
	return {
		src:  text,
		tree: pp(tree),
		mesg: output.replace(/\s*$/, ''),
	};
}

function embed() {
	/* Get current paste information */
	var scripts = document.getElementsByTagName('script');
	var script  = scripts[scripts.length-1];
	var source  = strip_spaces(script.textContent);

	/* Ignore empty code */
	if (!source.match(/\S/))
		return;

	/* Run the script */
	var out = run(source);

	/* Output */
	var box = {
		src:  addbox('Source', out.src,  'inside', true),
		tree: addbox('Tree',   out.tree, 'javascript'),
		mesg: addbox('Output', out.mesg),
	};
	box.src.on("change", function() {
		var text = box.src.getValue();
		var out  = run(text);
		box.tree.setValue(out.tree);
		box.mesg.setValue(out.mesg);
	});
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
