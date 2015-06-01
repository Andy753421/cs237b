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
