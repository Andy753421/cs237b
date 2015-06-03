/* Globals */
var constants = {pi: Math.PI, e: Math.E};
var grammar   = null;
var parser    = null;
var output    = "";

/* Init */
function init() {
	if (grammar && parser)
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
	parser = grammar.semantics().addOperation('run', {
		Exp_seq:   function(x)         { return [ 'seq',   x.run()            ] },
		Seq_seq:   function(x,_)       { return x.run()                         },
                                                                                      
		Lst_two:   function(h,t)       { return h.run().concat([t.run()])       },
		Lst_end:   function(h)         { return h.run()                         },
		Lst_one:   function(h)         { return [ h.run() ]                     },
		Lst_nul:   function()          { return [         ]                     },
		Elm_elm:   function(x,_)       { return x.run()                         },
                                                                                      
		Or_or:     function(x,_,y)     { return [ 'or',    x.run(), y.run()   ] },
		And_and:   function(x,_,y)     { return [ 'and',   x.run(), y.run()   ] },
                                                                                      
		Eq_eq:     function(x,op,y)    { return [ 'eq',    x.run(), y.run()   ] },
		Eq_ne:     function(x,op,y)    { return [ 'ne',    x.run(), y.run()   ] },
                                                                                      
		Cmp_gt:    function(x,op,y)    { return [ 'gt',    x.run(), y.run()   ] },
		Cmp_lt:    function(x,op,y)    { return [ 'lt',    x.run(), y.run()   ] },
		Cmp_ge:    function(x,op,y)    { return [ 'ge',    x.run(), y.run()   ] },
		Cmp_le:    function(x,op,y)    { return [ 'le',    x.run(), y.run()   ] },
                                                                                      
		Add_add:   function(x,op,y)    { return [ 'add',   x.run(), y.run()   ] },
		Add_sub:   function(x,op,y)    { return [ 'sub',   x.run(), y.run()   ] },
                                                                                      
		Mul_mul:   function(x,op,y)    { return [ 'mul',   x.run(), y.run()   ] },
		Mul_div:   function(x,op,y)    { return [ 'div',   x.run(), y.run()   ] },
		Mul_mod:   function(x,op,y)    { return [ 'mod',   x.run(), y.run()   ] },
                                                                                      
		Pow_pow:   function(x,op,y)    { return [ 'pow',   x.run(), y.run()   ] },
                                                                                      
		Un_pos:    function(op,e)      { return [ 'pos',   e.run()            ] },
		Un_neg:    function(op,e)      { return [ 'neg',   e.run()            ] },
		Un_not:    function(op,e)      { return [ 'not',   e.run()            ] },

		Type_args: function(t,a)       { return [ 'type',  t.run(), a.run()   ] }, 
		Call_args: function(f,a)       { return [ 'call',  f.run(), a.run()   ] },
                                                                                      
		Def_fun:   function(_,a,_,b)   { return [ 'fun',   a.run(), b.run()   ] },
		Def_set:   function(_,i,_,v)   { return [ 'set',   i.run(), v.run()   ] },
		Def_match: function(_,v,_,b)   { return [ 'match', v.run(), b.run()   ] },

		Case_case: function(_,k,_,v)   { return [ k.run(), v.run() ]            },
                                                                                      
		Pri_paren: function(_,e,_)     { return e.run()                         },
		Pri_brace: function(_,e,_)     { return e.run()                         },
		Pri_lst:   function(_,e,_)     { return [ 'lst',   e.run()            ] },
		Pri_type:  function(t)         { return [ 'type',  t.run(), []        ] }, 
		Pri_call:  function(f,_,_)     { return [ 'call',  f.run(), []        ] },
		Pri_var:   function(e)         { return [ 'var',   e.run()            ] },
		Pri_num:   function(e)         { return [ 'num',   e.run()            ] },
		Pri_str:   function(e)         { return [ 'str',   e.run()            ] },

		ident:     function(_,_)       { return this.interval.contents                },
		label:     function(_,_)       { return this.interval.contents                },
		number:    function(_)         { return parseFloat(this.interval.contents)    },
		string:    function(_,e,_)     { return e.interval.contents                   },

		_many:     ohm.actions.makeArray,
		_default:  ohm.actions.passThrough
	});
}

function param(node, env, types) {
	return function (n) {
		var val = interp(node[n], env);
		if (!types)
			return val;
		if (types.indexOf(typeof val) >= 0)
			return val;
		if (typeof val == 'object' &&
		    types.indexOf(val[0]) >= 0)
			return val;
		throw 'not a '+types+': ['+typeof val+'] '+val
	}
}

function call(closure, args, env) {
	if (typeof(closure) == 'function')
		return closure.apply(this,
			map(args, interp, env));

	var params = closure[1];
	var fexpr  = closure[2];
	var fenv   = closure[3];
	console.log('call:   ['+params+']['+fexpr+']');
	console.log('        ' +JSON.stringify(args));
	console.log('        ' +JSON.stringify(fenv));
	if (args.length != params.length)
		throw 'wrong number of arguments: '
			+ JSON.stringify(args) + ' != '
			+ JSON.stringify(params);
	for (var i = 0; i < args.length; i++)
		fenv[params[i]] = interp(args[i], env);
	//for (var i in fenv)
	//	if (fenv[i] == i)
	//		fenv[i] = closure;
	return interp(fexpr, fenv)
}

function get(name, env, partial)
{
	if (partial)
		return ['var', name];
	if (!env.hasOwnProperty(name))
		throw "Undefined variable: " + name;
	return env[name];
}

function matches(value, pattern)
{
	console.log("matches: " + value + " ?= " + pattern);
	return [];
}

function match(value, body, env)
{
	for (var i=0; i<body.length; i++) {
		var pattern = interp(body[i][0], env, true);
		var binding = matches(value, pattern);
		if (typeof binding == "object")
			return interp(body[i][1], env, false);
	}
	return [];
}

function interp(node, env, partial) {
	if (env == undefined) {
		var env = {};
		env['print'] = function(str){
			if (typeof str != "string")
				str = JSON.stringify(str);
			output += str + '\n';
		};
		env['if'] = function(cond, t, e){
			if (cond)
				return t;
			else
				return e;
		};
	}

	var e = param(node, env);
	var n = param(node, env, ['number']);
	var s = param(node, env, ['string']);
	var b = param(node, env, ['boolean']);
	var v = param(node, env, ['number', 'boolean']);
	var f = param(node, env, ['function', 'closure']);
	var a = function (n) { return map(node[n], interp, env, partial); };

	console.log('interp: ' + node);
	console.log('        ' + JSON.stringify(env));
	switch (node[0]) {
		case 'seq':   return tail(a(1));

		case 'or':    return n(1) || n(2)
		case 'and':   return n(1) && n(2)

		case 'eq':    return v(1) == v(2)
		case 'ne':    return v(1) != v(2)

		case 'gt':    return n(1) >  n(2)
		case 'lt':    return n(1) <  n(2)
		case 'ge':    return n(1) >= n(2)
		case 'le':    return n(1) <= n(2)

		case 'add':   return e(1) +  e(2)
		case 'sub':   return n(1) -  n(2)

		case 'mul':   return n(1) *  n(2)
		case 'div':   return n(1) /  n(2)

		case 'pow':   return Math.exp(n(1), n(2))

		case 'pos':   return + n(1)
		case 'neg':   return - n(1)
		case 'not':   return ! b(1)

		case 'type':  return [ node[1], a(2) ]
		case 'call':  return call(f(1), node[2], env)

		case 'fun':   return ['closure', node[1], node[2], clone(env)]
		case 'set':   return env[node[1]] = e(2)
		case 'match': return match(e(1), node[2], env);

		case 'lst':   return a(1);
		case 'var':   return get(node[1], env, partial);
		case 'num':   return node[1]
		case 'str':   return node[1]

		default:      throw  "Unknown node: " + JSON.stringify(node[0])
	}
}

/* Start embedding a paste */
function start_embed() {
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
	var src = addbox("Source", source,   'nu,ft=inside')
	addbox("Tree",   pp(tree), 'nu,ft=javascript');
	if (match.failed()) {
		addbox("Error", match.message);
		return;
	}
	addbox("Output", output);
	addbox("Return", JSON.stringify(val));
	addbox("Error",  error);
}

init();
start_embed();
