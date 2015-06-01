/* Globals */
var constants = {pi: Math.PI, e: Math.E};
var grammar   = null;
var output    = null;
var interp    = null;

/* Init */
function init() {
	if (grammar && interp)
		return

	/* Initialize grammar */
	var scripts = document.getElementsByTagName('script');
	for (var i=0; i<scripts.length; i++) {
		if (scripts[i].type != "text/ohm-js")
			continue
		grammar = ohm.grammarFromScriptElement(scripts[i]);
		break;
	}

	/* Initialize interpreter */
	output = grammar.semantics().addOperation('run', {
		Seq_seq:   function(x,_,y)     { return [ 'seq',   x.run(), y.run() ] },

		Or_or:     function(x,_,y)     { return [ 'or',    x.run(), y.run() ] },
		And_and:   function(x,_,y)     { return [ 'and',   x.run(), y.run() ] },

		Eq_eq:     function(x,op,y)    { return [ 'eq',    x.run(), y.run() ] },
		Eq_ne:     function(x,op,y)    { return [ 'ne',    x.run(), y.run() ] },

		Cmp_gt:    function(x,op,y)    { return [ 'gt',    x.run(), y.run() ] },
		Cmp_lt:    function(x,op,y)    { return [ 'lt',    x.run(), y.run() ] },
		Cmp_ge:    function(x,op,y)    { return [ 'ge',    x.run(), y.run() ] },
		Cmp_le:    function(x,op,y)    { return [ 'le',    x.run(), y.run() ] },

		Add_add:   function(x,op,y)    { return [ 'add',   x.run(), y.run() ] },
		Add_sub:   function(x,op,y)    { return [ 'sub',   x.run(), y.run() ] },

		Mul_mul:   function(x,op,y)    { return [ 'mul',   x.run(), y.run() ] },
		Mul_div:   function(x,op,y)    { return [ 'div',   x.run(), y.run() ] },

		Pow_pow:   function(x,op,y)    { return [ 'pow',   x.run(), y.run() ] },

		Un_pos:    function(op,e)      { return [ 'pos',   e.run()          ] },
		Un_neg:    function(op,e)      { return [ 'neg',   e.run()          ] },
		Un_not:    function(op,e)      { return [ 'not',   e.run()          ] },

		Call_args: function(f,a)       { return [ 'call',  f.run(), a.run() ] },
		Call_call: function(f,_,_)     { return [ 'call',  f.run(), []      ] },

		Stmt_fun:  function(_,a,_,b)   { return [ 'fun',   a.run(), b.run() ] },
		Stmt_let:  function(_,i,_,v)   { return [ 'let',   i.run(), v.run() ] },

		Pri_paren: function(_,e,_)     { return e.run()                       },
                                                                                      
		ident:     function(_,_)       { return this.interval.contents        },
		number:    function(_)         { return parseFloat(this.interval.contents) },

		_many:     ohm.actions.makeArray,
		_default:  ohm.actions.passThrough
	});
}

/* Strip whitespace from a paste */
function strip_spaces(text) {
	var prefix = null;
	var lines  = text.replace(/^\s*\n|\n\s*$/g,'').split('\n');
	for (i in lines) {
		if (lines[i].match(/^\s*$/))
			continue;
		var white = lines[i].replace(/\S.*/, '')
		if (prefix === null || white.length < prefix.length)
			prefix = white;
	}
	for (i in lines)
		lines[i] = lines[i].replace(prefix, '');
	return lines.join('\n');
}

/* Start embedding a paste */
function start_embed() {
	/* Get current paste information */
	var scripts = document.getElementsByTagName('script');
	var script  = scripts[scripts.length-1];
	var source  = strip_spaces(script.textContent);

	/* Add source box */
	var parsed  = grammar.match(source);
	var srcbox = document.createElement('pre');
	srcbox.textContent = source;
	script.parentNode.appendChild(srcbox);

	/* Add parse tree */
	var out    = output(parsed).run();
	var outbox = document.createElement('pre');
	outbox.textContent = JSON.stringify(out);
	script.parentNode.appendChild(outbox);

	/* Add output box */
	//var val    = interp(parsed).run();
	//var valbox = document.createElement('pre');
	//valbox.textContent = val;
	//script.parentNode.appendChild(valbox);
}

init();
start_embed();
