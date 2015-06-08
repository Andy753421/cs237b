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

function map(arr, f) {
	var args = Array.prototype.slice.call(arguments).slice(2);
	if (arr instanceof Array)
		var out = [];
	else
		var out = {};
	for (var i in arr)
		out[i] = f.apply(this, [arr[i]].concat(args));
	return out;
}

function head(arr) {
	return arr[0];
}

function tail(arr) {
	return arr[arr.length-1];
}

function clone(obj) {
	if (obj instanceof Array) {
		if (obj[0] == "closure")
			return [ "closure", obj[1], obj[2], clone(obj[3]), obj[4] ];
		var out = [];
		for (var i in obj)
			out[i] = clone(obj[i]);
		return out;
	}

	if (typeof obj == "object") {
		var out = {};
		for (var k in obj)
			out[k] = clone(obj[k]);
		return out;
	}

	return obj;
}

function pair(k, v) {
	var out = {}
	out[k] = v;
	return out;
}

function extend(a, b) {
	var out = clone(a);
	for (var k in b)
		out[k] = b[k]
	return out;
}

function smash(lst) {
	var out = {}
	for (var i in lst)
		for (var k in lst[i])
			out[k] = lst[i][k]
	return out;
}

function pp(node, prefix) {
	if (prefix == undefined)
		prefix = '';
	var pad = prefix+'    ';
	if (!(node instanceof Array))
		return JSON.stringify(node);
	if (node[0] == 'fun')
		return '['+pp(node[0])+','+pp(node[1])+',\n' +
			pad+pp(node[2],pad) + ']';
	if (node[0] == 'seq')
		return '['+pp(node[0])+',[\n' +
			node[1].map(function (n) {
				return pad+pp(n,pad);
			}).join(',\n') +
		']]';
	if (node[0] == 'match')
		return '['+pp(node[0])+','+pp(node[1])+',\n' +
			node[2].map(function (n) {
				return pad+pp(n,pad);
			}).join(',\n') +
		']]';
	return '[' + node.map(function (n) {
			return pp(n,prefix);
		}).join(',') + ']';
}

function addbox(title, text, lang, edit) {
	if (text === undefined) text = '';
	if (lang === undefined) lang = undefined;
	if (edit === undefined) edit = false;

	/* Get script tag */
	var scripts = document.getElementsByTagName('script');
	var script  = scripts[scripts.length-1];

	/* Create header */
	var head = document.createElement('h2');
	head.textContent = title;
	script.parentNode.appendChild(head);

	/* Create box */
	return CodeMirror(script.parentNode, {
		value:         text,
		mode:          lang,
		lineNumbers:   true,
		lineWrapping:  true,
		smartIndent:   true,
		electricChars: true,
		enterMode:     "flat",
		lineSpacing:   1.1,
		readOnly:      !edit,
	});
}
