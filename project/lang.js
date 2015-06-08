/* Globals */
var constants = {pi: Math.PI, e: Math.E};
var grammar   = null;
var parser    = null;
var output    = '';

/* Init */
function init() {
	if (grammar && parser)
		return

	/* Initialize grammar */
	var scripts = document.getElementsByTagName('script');
	for (var i=0; i<scripts.length; i++) {
		if (scripts[i].type != 'text/ohm-js')
			continue
		grammar = ohm.grammarFromScriptElement(scripts[i]);
		break;
	}

	/* Initialize interpreter */
	parser = grammar.semantics().addOperation('run', {
		Exp_seq:   function(x)         { return [ 'seq',   x.run()            ] },
		Seq_seq:   function(x,_)       { return x.run()                         },

		List_two:  function(h,t)       { return h.run().concat([t.run()])       },
		List_end:  function(h)         { return h.run()                         },
		List_one:  function(h)         { return [ h.run() ]                     },
		List_nul:  function()          { return [         ]                     },
		LElm_elm:  function(x,_)       { return x.run()                         },

		Hash_two:  function(h,t)       { return extend(smash(h.run()), t.run()) },
		Hash_end:  function(h)         { return smash(h.run())                  },
		Hash_one:  function(h)         { return h.run()                         },
		Hash_nul:  function()          { return {         }                     },
		HElm_elm:  function(x,_)       { return x.run()                         },
		HExp_exp:  function(k,_,v)     { return pair(k.run(), v.run())          },

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

		Index_idx: function(h,s)       { return [ 'index', h.run(), s.run()   ] },
		Sub_ident: function(_,k)       { return [ 'str',   k.run()            ] },
		Sub_index: function(_,i)       { return [ 'num',   i.run()            ] },
		Sub_expr:  function(_,i,_)     { return i.run()                         },

		Type_args: function(t,a)       { return [ 'type',  t.run(), a.run()   ] },
		Call_args: function(f,a)       { return [ 'call',  f.run(), a.run()   ] },

		Def_fun:   function(_,a,_,b)   { return [ 'fun',   a.run(), b.run()   ] },
		Def_set:   function(_,i,_,v)   { return [ 'set',   i.run(), v.run()   ] },
		Def_upd:   function(_,i,_,v)   { return [ 'upd',   i.run(), v.run()   ] },
		Def_as:    function(_,a,_,b)   { return [ 'fun',   a.run(), b.run()   ] },
		Def_def:   function(_,i,a,_,b) { return [ 'set',   i.run(), [
			                                  'fun',   a.run(), b.run() ] ] },
		Def_match: function(_,v,_,b)   { return [ 'match', v.run(), b.run()   ] },

		Case_case: function(_,k,_,v)   { return [ k.run(), v.run() ]            },

		Pri_paren: function(_,e,_)     { return e.run()                         },
		Pri_brace: function(_,e,_)     { return e.run()                         },
		Pri_list:  function(_,e,_)     { return [ 'list',  e.run()            ] },
		Pri_hash:  function(_,e,_)     { return [ 'hash',  e.run()            ] },
		Pri_type:  function(t)         { return [ 'type',  t.run(), []        ] },
		Pri_call:  function(f,_,_)     { return [ 'call',  f.run(), []        ] },
		Pri_var:   function(e)         { return [ 'var',   e.run()            ] },
		Pri_num:   function(e)         { return [ 'num',   e.run()            ] },
		Pri_str:   function(e)         { return [ 'str',   e.run()            ] },

		ident:     function(_,_)       { return this.interval.contents             },
		index:     function(_)         { return parseInt(this.interval.contents)   },
		label:     function(_,_)       { return this.interval.contents             },
		number:    function(_)         { return parseFloat(this.interval.contents) },
		string:    function(_,e,_)     { return e.interval.contents                },

		_many:     ohm.actions.makeArray,
		_default:  ohm.actions.passThrough
	});
}

function matches(value, pattern, binding)
{
	//console.log('matches: ' + pp(value) + ' ?= ' + pp(pattern));

	// Scalars
	if (!(pattern instanceof Array)) {
		if (value === pattern) {
			return binding;
		} else {
			return false;
		}
	}

	// Variables
	if (pattern[0] === 'var') {
		var name = pattern[1];
		if (binding.hasOwnProperty(name)) {
			if (binding[name] === value)
				return binding;
			else
				return false;
		} else {
			return extend(binding, pair(name, value));
		}
	}

	// Arrays
	if (pattern.length != value.length)
		return false;
	for (var i=0; i<pattern.length; i++) {
		var kids = matches(value[i], pattern[i], binding);
		if (typeof kids != 'object')
			return false;
		for (var k in kids)
			binding[k] = kids[k];
	}
	return binding;
}

function match(value, body, env)
{
	var local = clone(env);
	for (var i=0; i<body.length; i++) {
		var pattern = interp(body[i][0], env, true);
		var binding = matches(value, pattern, {});
		if (binding === false)
			continue;
		//console.log('binding:');
		//for (var k in binding)
		//	console.log('  ' + k + ' -> ' + binding[k]);
		for (var k in binding)
			local[k] = binding[k];
		var out = interp(body[i][1], local, false);
		for (var k in env)
			env[k] = local[k];
		//console.log('out: ' + out);
		return out;
	}
	throw 'match failure'
}


function call(closure, args, env) {
	if (typeof(closure) == 'function')
		return closure.apply(this,
			map(args, interp, env));

	var params = closure[1];
	var fexpr  = closure[2];
	var fenv   = closure[3];
	var name   = closure[4];

	//console.log('call:   ['+params+']['+fexpr+']');
	//console.log('        ' +JSON.stringify(args));
	//console.log('        ' +JSON.stringify(fenv));

	if (args.length != params.length)
		throw 'wrong number of arguments: '
			+ args.length   + ': ' + JSON.stringify(args) + ' != '
			+ params.length + ': ' + JSON.stringify(params);

	fenv[name] = clone(closure);
	for (var i = 0; i < args.length; i++)
		fenv[params[i]] = clone(interp(args[i], env));
	var out1 = interp(fexpr, fenv);
	var out2 = clone(out1);
	//console.log(' --> ' + out1 + ':' + out2);
	return out2;
}

function set(name, value, env)
{
	if (typeof name == "string")
		return env[name] = interp(value, env, false, name);
	if (typeof name == "object" && name[0] == 'index') {
		var obj = interp(name[1], env);
		var idx = map(name[2], interp, env);
		var key = idx[idx.length-1];
		for (var i=0; i<(idx.length-1); i++)
			obj = obj[idx[i]];
		console.log("set: " + obj + '[' + key + ']=' + value);
		return obj[key] = interp(value, env);
	}
	throw "Invalid assignment"
}

function get(name, env, partial)
{
	if (partial)
		return ['var', name];
	if (!env.hasOwnProperty(name))
		throw 'Undefined variable: ' + name;
	return env[name];
}

function param(node, env, partial, types) {
	return function (n, name) {
		var val = interp(node[n], env, partial, name);
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

function index(obj, idx) {
	var out = obj;
	for (var i in idx) {
		if (!out.hasOwnProperty(idx[i]))
			throw 'No property: ' + idx[i];
		out = out[idx[i]];
	}
	//console.log("index: " + pp(obj) + pp(idx) + "=" + out); 
	return out;
}

function idents(code, obj) {
	if (code[0] == "var")
		obj[code[1]] = true;
	else
		for (var i in code)
			if (code[i] instanceof Array)
				idents(code[i], obj);
}

function closure(params, code, env, name) {
	// Attempt to figure out what variables are
	// referenced by the closure so that we
	// only have to copy the ones that are used
	var cenv = {};
	var vars = {};
	idents(code, vars);
	for (var k in env)
		if (vars.hasOwnProperty(k))
			cenv[k] = clone(env[k]);
	return ['closure', params, code, cenv, name];
}

function interp(node, env, partial, name) {
	if (env == undefined) {
		var env = {};
		env['true']  = true;
		env['false'] = false;
		env['null']  = null;
		env['print'] = function(str){
			if (typeof str != 'string')
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

	var e = param(node, env, partial);
	var n = param(node, env, partial, ['number']);
	var s = param(node, env, partial, ['string']);
	var b = param(node, env, partial, ['boolean']);
	var v = param(node, env, partial, ['number', 'boolean', 'string']);
	var f = param(node, env, partial, ['function', 'closure']);
	var a = function (n) { return map(node[n], interp, env, partial); };
	var h = function (n) { return map(node[n], interp, env, partial); };

	//console.log('interp: ' + node);
	//console.log('        ' + JSON.stringify(env));
	switch (node[0]) {
		case 'seq':   return tail(a(1));

		case 'or':    return b(1) || b(2)
		case 'and':   return b(1) && b(2)

		case 'eq':    return e(1) == e(2)
		case 'ne':    return e(1) != e(2)

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

		case 'index': return index(e(1), a(2))
		case 'type':  return [node[1]].concat(a(2))
		case 'call':  return call(f(1), node[2], env)

		case 'fun':   return closure(node[1], node[2], env, name);
		case 'set':   return set(node[1], node[2], env);
		case 'upd':   return set(node[1], node[2], env);
		case 'match': return match(e(1), node[2], env);

		case 'list':  return a(1);
		case 'hash':  return h(1);
		case 'var':   return get(node[1], env, partial);
		case 'num':   return node[1]
		case 'str':   return node[1]

		default:      throw  'Unknown node: ' + JSON.stringify(node[0])
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
	var src = addbox('Source', source,   'nu,ft=inside')
	//addbox('Tree',   pp(tree), 'nu,ft=javascript');
	if (match.failed()) {
		addbox('Error', match.message);
		return;
	}
	addbox('Output', output);
	addbox('Return', JSON.stringify(val));
	addbox('Error',  error);
}

init();
start_embed();
