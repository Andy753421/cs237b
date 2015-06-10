// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

var inIdent = false;

CodeMirror.defineMode('inside', function(_config, parserConfig) {
  var words = {
    'as':    'Statement',
    'def':   'Statement',
    'set':   'Statement',
    'fun':   'Statement',
    'match': 'Statement',
    'with':  'Statement',
    'if':    'Statement',
    'else':  'Statement',
    'while': 'Statement',
    'true':  'Constant',
    'false': 'Constant',
    'null':  'Constant',
  };

  function tokenBase(stream, state) {
    var ch = stream.next();

    if (ch == "#") {
      stream.skipToEnd();
      return "Comment";
    }
    if (ch === '"') {
      state.tokenize = tokenString;
      return state.tokenize(stream, state);
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\d]/);
      if (stream.eat('.')) {
        stream.eatWhile(/[\d]/);
      }
      return 'Number';
    }
    if (/[A-Z]/.test(ch)) {
      stream.eatWhile(/\w/);
      return 'Type';
    }
    if ( /[+\-*&%=<>!?|:;,()\[\]{}]/.test(ch)) {
      return 'Operator';
    }

    stream.eatWhile(/\w/);
    var cur = stream.current();
    stream.eatWhile(/\s/);
    var ch  = stream.peek();

    if (ch == ':' || inIdent)
    	    var type = 'Identifier';
    else if (words.hasOwnProperty(cur))
	    var type = words[cur]
    else
    	    var type = 'Variable'

    if (cur == "fun") inIdent = true;
    if (cur == "def") inIdent = true;
    if (cur == "set") inIdent = true;

    if (ch  == "-")   inIdent = false;
    if (ch  == ":")   inIdent = false;
    if (ch  == "=")   inIdent = false;

    return type;
  }

  function tokenString(stream, state) {
    var next, end = false, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };

  return {
    startState: function() {return {tokenize: tokenBase};},
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    },
    lineComment: "#"
  };
});

});
