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
			print(">> Error: " + error);
		if (value)
			print(">> " + JSON.stringify(value));
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

	/* Setup the box */
	if (script.className == "split") {
		var table = document.createElement('table');
		var tr1   = document.createElement('tr');
		var bsrc  = document.createElement('td');
		var bmesg = document.createElement('td');
		//var tr2   = document.createElement('tr');
		//var btree = document.createElement('td');

		script.parentNode.appendChild(table);
		table.appendChild(tr1);
		tr1.appendChild(bsrc);
		tr1.appendChild(bmesg);
		//table.appendChild(tr2);
		//tr2.appendChild(btree);

		table.width="100%"
		bsrc.width="50%"
		bmesg.width="50%"
		//btree.colSpan=2;
	} else {
		var bsrc  = script.parentNode;
		var bmesg = script.parentNode;
		//var btree = script.parentNode;
	}

	/* Output */
	var box = {
		src:  addbox(bsrc,  'Source', out.src,  'inside', true),
		mesg: addbox(bmesg, 'Output', out.mesg),
		//tree: addbox(btree, 'Tree',   out.tree, 'javascript'),
	};
	box.src.on("change", function() {
		var text = box.src.getValue();
		var out  = run(text);
		box.mesg.setValue(out.mesg);
		//box.tree.setValue(out.tree);
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
