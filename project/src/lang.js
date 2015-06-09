/* Globals */
var builtin = {
	pi:    Math.PI,
	e:     Math.E,
	true:  true,
	false: false,
	null:  null,
	print: function(str) {
		var args = Array.prototype.slice.call(arguments);
		for (var i in args) {
			var str = args[i];
			if (typeof str != 'string')
				str = JSON.stringify(str);
			if (i == (args.length-1))
				str += '\n';
			else
				str += ' ';
			print(str);
		}
	},
	if:    function(cond, t, e) {
		return cond ? t : e;
	}
};

/* Init grammar */
function init_grammar(tag) {
	return ohm.grammarFromScriptElement(tag);
}

/* Init parser */
function init_parser(grammar) {
	return grammar.semantics().addOperation('run', {
		Exp_seq:   function(x)         { return [ 'Seq',   x.run()            ] },
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

		Or_or:     function(x,_,y)     { return [ 'Or',    x.run(), y.run()   ] },
		And_and:   function(x,_,y)     { return [ 'And',   x.run(), y.run()   ] },

		Eq_eq:     function(x,op,y)    { return [ 'Eq',    x.run(), y.run()   ] },
		Eq_ne:     function(x,op,y)    { return [ 'Ne',    x.run(), y.run()   ] },

		Cmp_gt:    function(x,op,y)    { return [ 'Gt',    x.run(), y.run()   ] },
		Cmp_lt:    function(x,op,y)    { return [ 'Lt',    x.run(), y.run()   ] },
		Cmp_ge:    function(x,op,y)    { return [ 'Ge',    x.run(), y.run()   ] },
		Cmp_le:    function(x,op,y)    { return [ 'Le',    x.run(), y.run()   ] },

		Add_add:   function(x,op,y)    { return [ 'Add',   x.run(), y.run()   ] },
		Add_sub:   function(x,op,y)    { return [ 'Sub',   x.run(), y.run()   ] },

		Mul_mul:   function(x,op,y)    { return [ 'Mul',   x.run(), y.run()   ] },
		Mul_div:   function(x,op,y)    { return [ 'Div',   x.run(), y.run()   ] },
		Mul_mod:   function(x,op,y)    { return [ 'Mod',   x.run(), y.run()   ] },

		Pow_pow:   function(x,op,y)    { return [ 'Pow',   x.run(), y.run()   ] },

		Un_pos:    function(op,e)      { return [ 'Pos',   e.run()            ] },
		Un_neg:    function(op,e)      { return [ 'Neg',   e.run()            ] },
		Un_not:    function(op,e)      { return [ 'Not',   e.run()            ] },

		Index_idx: function(h,s)       { return [ 'Index', h.run(), s.run()   ] },
		Sub_ident: function(_,k)       { return [ 'Str',   k.run()            ] },
		Sub_index: function(_,i)       { return [ 'Num',   i.run()            ] },
		Sub_expr:  function(_,i,_)     { return i.run()                         },

		Type_args: function(t,a)       { return [ 'Type',  t.run(), a.run()   ] },
		Call_args: function(f,a)       { return [ 'Call',  f.run(), a.run()   ] },

		Def_fun:   function(_,a,_,b)   { return [ 'Fun',   a.run(), b.run()   ] },
		Def_set:   function(_,i,_,v)   { return [ 'Set',   i.run(), v.run()   ] },
		Def_upd:   function(_,i,_,v)   { return [ 'Upd',   i.run(), v.run()   ] },
		Def_as:    function(_,a,_,b)   { return [ 'Fun',   a.run(), b.run()   ] },
		Def_def:   function(_,i,a,_,b) { return [ 'Set',   i.run(), [
			                                  'Fun',   a.run(), b.run() ] ] },
		Def_match: function(_,v,_,b)   { return [ 'Match', v.run(), b.run()   ] },

		Case_case: function(_,k,_,v)   { return [ k.run(), v.run() ]            },

		Pri_paren: function(_,e,_)     { return e.run()                         },
		Pri_brace: function(_,e,_)     { return e.run()                         },
		Pri_list:  function(_,e,_)     { return [ 'List',  e.run()            ] },
		Pri_hash:  function(_,e,_)     { return [ 'Hash',  e.run()            ] },
		Pri_type:  function(t)         { return [ 'Type',  t.run(), []        ] },
		Pri_call:  function(f,_,_)     { return [ 'Call',  f.run(), []        ] },
		Pri_var:   function(e)         { return [ 'Var',   e.run()            ] },
		Pri_num:   function(e)         { return [ 'Num',   e.run()            ] },
		Pri_str:   function(e)         { return [ 'Str',   e.run()            ] },

		ident:     function(_,_)       { return this.interval.contents             },
		index:     function(_)         { return parseInt(this.interval.contents)   },
		label:     function(_,_)       { return this.interval.contents             },
		number:    function(_)         { return parseFloat(this.interval.contents) },
		string:    function(_,e,_)     { return e.interval.contents                },

		_many:     ohm.actions.makeArray,
		_default:  ohm.actions.passThrough
	});
}

/* Interpreter */
function interp(node, env, partial, name) {
	if (env == undefined)
		var env = clone(builtin);

	var e = param(node, env, partial);
	var n = param(node, env, partial, ['number']);
	var s = param(node, env, partial, ['string']);
	var b = param(node, env, partial, ['boolean']);
	var v = param(node, env, partial, ['number', 'boolean', 'string']);
	var f = param(node, env, partial, ['function', 'Closure']);
	var a = function (n) { return map(node[n], interp, env, partial); };
	var h = function (n) { return map(node[n], interp, env, partial); };

	//console.log('interp: ' + node);
	//console.log('        ' + JSON.stringify(env));
	switch (node[0]) {
		case 'Seq':   return tail(a(1));

		case 'Or':    return b(1) || b(2)
		case 'And':   return b(1) && b(2)

		case 'Eq':    return e(1) == e(2)
		case 'Ne':    return e(1) != e(2)

		case 'Gt':    return n(1) >  n(2)
		case 'Lt':    return n(1) <  n(2)
		case 'Ge':    return n(1) >= n(2)
		case 'Le':    return n(1) <= n(2)

		case 'Add':   return e(1) +  e(2)
		case 'Sub':   return n(1) -  n(2)

		case 'Mul':   return n(1) *  n(2)
		case 'Div':   return n(1) /  n(2)

		case 'Pow':   return Math.pow(n(1), n(2))

		case 'Pos':   return + n(1)
		case 'Neg':   return - n(1)
		case 'Not':   return ! b(1)

		case 'Index': return index(e(1), a(2))
		case 'Type':  return [node[1]].concat(a(2))
		case 'Call':  return call(f(1), node[2], env)

		case 'Fun':   return closure(node[1], node[2], env, name);
		case 'Set':   return set(node[1], node[2], env);
		case 'Upd':   return set(node[1], node[2], env);
		case 'Match': return match(e(1), node[2], env);

		case 'List':  return a(1);
		case 'Hash':  return h(1);
		case 'Var':   return get(node[1], env, partial);
		case 'Num':   return node[1]
		case 'Str':   return node[1]

		default:      throw  'Unknown node: ' + JSON.stringify(node[0])
	}
}

/* Helper Functions */
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
	if (pattern[0] === 'Var') {
		var name = pattern[1];
		if (builtin.hasOwnProperty(name)) {
			if (builtin[name] === value)
				return binding;
			else
				return false;
		} else if (binding.hasOwnProperty(name)) {
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
	if (typeof name == "object" && name[0] == 'Index') {
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
		return ['Var', name];
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
	if (code[0] == "Var")
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
	return ['Closure', params, code, cenv, name];
}
