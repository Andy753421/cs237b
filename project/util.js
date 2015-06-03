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
	var out = [];
	for (var i in arr)
		out[i] = f(arr[i]);
	return out;
}

function map2(arr, f, arg) {
	var out = [];
	for (var i in arr)
		out[i] = f(arr[i], arg);
	return out;
}

function head(arr) {
	return arr[0];
}

function tail(arr) {
	return arr[arr.length-1];
}

function clone(obj) {
	var out = {};
	for (var i in obj)
		if (typeof obj[i] == "object")
			out[i] = clone(obj[i]);
		else
			out[i] = obj[i];
	return out;
}


function pp(node, prefix) {
	if (prefix == undefined)
		prefix = '';
	var pad = prefix+'    ';
	if (typeof node != "object")
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
	return '[' + node.map(function (n) {
			return pp(n,prefix);
		}).join(',') + ']';
}

function addbox(title, text, modeline) {
	if (!text)
		return;
	if (!modeline)
		modeline='';

	/* Get script tag */
	var scripts = document.getElementsByTagName('script');
	var script  = scripts[scripts.length-1];

	/* Create header */
	var head = document.createElement('h2');
	head.textContent = title;
	script.parentNode.appendChild(head);

	/* Create box */
	var box  = document.createElement('pre');
	box.textContent = text;
	script.parentNode.appendChild(box);

	/* Highlight */
	var name = 'vpaste_s' + scripts.length;
	box.className = script.className + ' vpaste ' + name;
	query_paste('POST', vpaste+'view?'+modeline, text, box, name);
}
