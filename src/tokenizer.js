/**
 * Tokenizer — extracts identifiers from source code using regex.
 * Supports Python, JavaScript, Java, C++, and other common LeetCode languages.
 */

const Tokenizer = {
  /**
   * Language-specific keyword sets for richer autocomplete.
   */
  KEYWORDS: {
    python: [
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
      'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
      'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
      'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
      'while', 'with', 'yield', 'print', 'range', 'len', 'int', 'str',
      'float', 'list', 'dict', 'set', 'tuple', 'bool', 'enumerate',
      'zip', 'map', 'filter', 'sorted', 'reversed', 'sum', 'min', 'max',
      'abs', 'any', 'all', 'isinstance', 'type', 'super', 'self',
      'append', 'extend', 'insert', 'remove', 'pop', 'index', 'count',
      'sort', 'reverse', 'copy', 'clear', 'keys', 'values', 'items',
      'update', 'get', 'split', 'join', 'strip', 'replace', 'find',
      'startswith', 'endswith', 'upper', 'lower', 'isdigit', 'isalpha',
      'defaultdict', 'deque', 'Counter', 'OrderedDict', 'heapq',
      'heappush', 'heappop', 'heapify', 'bisect', 'bisect_left',
      'bisect_right', 'collections', 'itertools', 'functools',
      'math', 'inf', 'ceil', 'floor', 'sqrt', 'log', 'pow',
      'ListNode', 'TreeNode', 'Optional', 'List', 'Dict', 'Set', 'Tuple'
    ],
    javascript: [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for',
      'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this',
      'class', 'extends', 'super', 'import', 'export', 'default', 'from',
      'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
      'typeof', 'instanceof', 'null', 'undefined', 'true', 'false',
      'console', 'log', 'Math', 'Array', 'Object', 'String', 'Number',
      'Boolean', 'Map', 'Set', 'Promise', 'JSON', 'parseInt', 'parseFloat',
      'isNaN', 'isFinite', 'push', 'pop', 'shift', 'unshift', 'splice',
      'slice', 'concat', 'join', 'reverse', 'sort', 'filter', 'map',
      'reduce', 'forEach', 'find', 'findIndex', 'includes', 'indexOf',
      'keys', 'values', 'entries', 'length', 'toString', 'hasOwnProperty',
      'prototype', 'constructor',
      // TypeScript keywords
      'interface', 'type', 'readonly', 'enum', 'implements', 'abstract',
      'declare', 'namespace', 'module', 'keyof', 'infer', 'never', 'unknown'
    ],
    java: [
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
      'char', 'class', 'continue', 'default', 'do', 'double', 'else',
      'enum', 'extends', 'final', 'finally', 'float', 'for', 'if',
      'implements', 'import', 'instanceof', 'int', 'interface', 'long',
      'native', 'new', 'null', 'package', 'private', 'protected', 'public',
      'return', 'short', 'static', 'super', 'switch', 'synchronized',
      'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile',
      'while', 'true', 'false', 'String', 'Integer', 'Long', 'Double',
      'Float', 'Boolean', 'Character', 'Byte', 'Short', 'Object',
      'ArrayList', 'LinkedList', 'HashMap', 'HashSet', 'TreeMap', 'TreeSet',
      'Queue', 'Stack', 'Deque', 'PriorityQueue', 'Arrays', 'Collections',
      'List', 'Map', 'Set', 'Iterator', 'Comparable', 'Comparator',
      'StringBuilder', 'Math', 'System', 'ListNode', 'TreeNode',
      'length', 'size', 'add', 'remove', 'get', 'put', 'contains',
      'isEmpty', 'toArray', 'sort', 'reverse', 'toString', 'equals',
      'hashCode', 'valueOf', 'parseInt', 'compareTo', 'charAt', 'substring',
      'indexOf', 'split', 'trim', 'replace', 'toLowerCase', 'toUpperCase'
    ],
    cpp: [
      'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const',
      'continue', 'default', 'delete', 'do', 'double', 'else', 'enum',
      'explicit', 'extern', 'false', 'float', 'for', 'friend', 'goto',
      'if', 'inline', 'int', 'long', 'namespace', 'new', 'nullptr',
      'operator', 'private', 'protected', 'public', 'return', 'short',
      'signed', 'sizeof', 'static', 'struct', 'switch', 'template',
      'this', 'throw', 'true', 'try', 'typedef', 'typename', 'unsigned',
      'using', 'virtual', 'void', 'volatile', 'while',
      'vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set',
      'queue', 'stack', 'deque', 'priority_queue', 'pair', 'tuple',
      'array', 'list', 'forward_list', 'bitset',
      'push_back', 'pop_back', 'front', 'back', 'begin', 'end',
      'size', 'empty', 'clear', 'insert', 'erase', 'find', 'count',
      'sort', 'reverse', 'swap', 'min', 'max', 'abs', 'pow', 'sqrt',
      'ceil', 'floor', 'log', 'INT_MAX', 'INT_MIN', 'LLONG_MAX', 'LLONG_MIN',
      'make_pair', 'emplace_back', 'emplace', 'reserve', 'resize',
      'substr', 'length', 'append', 'compare', 'c_str', 'stoi', 'stol',
      'to_string', 'ListNode', 'TreeNode', 'next', 'val', 'left', 'right',
      'cout', 'cin', 'endl', 'printf', 'scanf', 'numeric_limits',
      'algorithm', 'iostream', 'cmath', 'climits', 'cstring'
    ]
  },

  /**
   * Extract all identifiers from code using regex.
   * Strips comments FIRST (before strings) to avoid comment content
   * with unmatched quotes breaking the string regex.
   * @param {string} code
   * @returns {string[]}
   */
  extractIdentifiers(code) {
    if (!code) return [];

    // 1. Remove comments FIRST (before strings, to avoid unmatched quotes in comments)
    const noComments = code
      .replace(/\/\/.*$/gm, '')           // Single-line comments ( // )
      .replace(/\/\*[\s\S]*?\*\//g, '')   // Multi-line comments ( /* */ )
      .replace(/#.*$/gm, '');             // Python comments ( # )

    // 2. Then remove string literals
    const cleaned = noComments
      .replace(/"""[\s\S]*?"""/g, '')     // Python triple-double quotes
      .replace(/'''[\s\S]*?'''/g, '')     // Python triple-single quotes
      .replace(/"(?:[^"\\]|\\.)*"/g, '')  // Double-quoted strings
      .replace(/'(?:[^'\\]|\\.)*'/g, '')  // Single-quoted strings
      .replace(/`(?:[^`\\]|\\.)*`/g, ''); // Template literals

    // Match identifiers: starts with letter or underscore, followed by word chars
    const regex = /\b[a-zA-Z_$]\w*\b/g;
    const matches = cleaned.match(regex) || [];

    // Deduplicate and filter short identifiers
    return [...new Set(matches)].filter(id => id.length >= 2);
  },

  /**
   * Detect the current language from LeetCode's UI.
   * @returns {string}
   */
  detectLanguage() {
    // LeetCode shows the language in a button/dropdown
    const langButton = document.querySelector(
      '[data-cy="lang-btn"],' +
      'button[id*="lang"],' +
      '.ant-select-selection-item,' +
      'div[class*="lang-select"] button,' +
      'button[class*="rounded"][class*="items-center"][class*="whitespace-nowrap"]'
    );

    if (langButton) {
      const text = langButton.textContent.trim().toLowerCase();
      if (text.includes('python')) return 'python';
      if (text.includes('javascript') || text.includes('typescript')) return 'javascript';
      if (text.includes('c++') || text.includes('cpp')) return 'cpp';
      // Check java AFTER javascript/cpp to avoid substring false positives
      if (text.includes('java')) return 'java';
    }

    return 'python';
  },

  /**
   * Get keywords for the detected language.
   * @param {string} language
   * @returns {string[]}
   */
  getKeywords(language) {
    return this.KEYWORDS[language] || this.KEYWORDS.python;
  }
};

window.__codeRadar = window.__codeRadar || {};
window.__codeRadar.Tokenizer = Tokenizer;
