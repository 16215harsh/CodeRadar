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
      // Control flow
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
      'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
      'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
      'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
      'while', 'with', 'yield',
      // Built-in functions
      'print', 'range', 'len', 'int', 'str', 'float', 'list', 'dict',
      'set', 'tuple', 'bool', 'bytes', 'bytearray', 'complex',
      'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed',
      'sum', 'min', 'max', 'abs', 'round', 'divmod', 'pow',
      'any', 'all', 'isinstance', 'issubclass', 'type', 'repr',
      'super', 'self', 'cls', 'chr', 'ord', 'bin', 'oct', 'hex',
      'hash', 'id', 'iter', 'next', 'open', 'input', 'print',
      'getattr', 'setattr', 'hasattr', 'delattr', 'callable',
      'vars', 'dir', 'help', 'eval', 'exec',
      // String methods
      'append', 'extend', 'insert', 'remove', 'pop', 'index', 'count',
      'sort', 'reverse', 'copy', 'clear',
      'split', 'join', 'strip', 'lstrip', 'rstrip', 'replace', 'find',
      'startswith', 'endswith', 'upper', 'lower', 'title', 'capitalize',
      'isdigit', 'isalpha', 'isalnum', 'isspace', 'isupper', 'islower',
      'zfill', 'center', 'ljust', 'rjust', 'format', 'encode', 'decode',
      // Dict methods
      'keys', 'values', 'items', 'update', 'get', 'setdefault', 'fromkeys',
      // Collections
      'defaultdict', 'deque', 'Counter', 'OrderedDict', 'ChainMap', 'namedtuple',
      'heapq', 'heappush', 'heappop', 'heapify', 'heapreplace', 'nlargest', 'nsmallest',
      'bisect', 'bisect_left', 'bisect_right', 'insort', 'insort_left', 'insort_right',
      'collections', 'itertools', 'functools',
      // itertools
      'product', 'permutations', 'combinations', 'combinations_with_replacement',
      'chain', 'cycle', 'repeat', 'accumulate', 'groupby', 'islice',
      'starmap', 'takewhile', 'dropwhile', 'filterfalse', 'compress',
      // functools
      'reduce', 'partial', 'lru_cache', 'cache', 'cached_property', 'wraps',
      // math
      'math', 'inf', 'ceil', 'floor', 'sqrt', 'log', 'log2', 'log10',
      'pow', 'exp', 'gcd', 'lcm', 'factorial', 'comb', 'perm',
      'fabs', 'fmod', 'modf', 'frexp', 'ldexp', 'isnan', 'isinf', 'isfinite',
      'pi', 'tau', 'e',
      // sys
      'sys', 'maxsize', 'stdin', 'stdout', 'setrecursionlimit',
      // Type hints
      'ListNode', 'TreeNode', 'Optional', 'List', 'Dict', 'Set', 'Tuple',
      'Union', 'Any', 'Callable', 'Generator', 'Iterator', 'Iterable',
      'TypeVar', 'Generic', 'Protocol', 'dataclass'
    ],

    javascript: [
      // Control flow
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for',
      'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this',
      'class', 'extends', 'super', 'import', 'export', 'default', 'from',
      'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
      'typeof', 'instanceof', 'null', 'undefined', 'true', 'false',
      'void', 'delete', 'in', 'of', 'debugger',
      // Global objects and methods
      'console', 'Math', 'Array', 'Object', 'String', 'Number',
      'Boolean', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise',
      'JSON', 'Symbol', 'BigInt', 'Proxy', 'Reflect', 'Date',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Infinity',
      'encodeURIComponent', 'decodeURIComponent',
      // Math methods
      'floor', 'ceil', 'round', 'abs', 'max', 'min', 'pow', 'sqrt',
      'log', 'log2', 'log10', 'random', 'sign', 'trunc', 'hypot',
      'MAX_SAFE_INTEGER', 'MIN_SAFE_INTEGER', 'POSITIVE_INFINITY', 'NEGATIVE_INFINITY',
      // Array methods
      'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat',
      'join', 'reverse', 'sort', 'filter', 'map', 'reduce', 'reduceRight',
      'forEach', 'find', 'findIndex', 'findLast', 'findLastIndex',
      'includes', 'indexOf', 'lastIndexOf', 'flat', 'flatMap',
      'fill', 'copyWithin', 'entries', 'keys', 'values', 'from', 'isArray',
      'every', 'some', 'at',
      // String methods
      'length', 'charAt', 'charCodeAt', 'codePointAt', 'fromCharCode',
      'toString', 'split', 'trim', 'trimStart', 'trimEnd',
      'startsWith', 'endsWith', 'repeat', 'replace', 'replaceAll',
      'padStart', 'padEnd', 'substring', 'toUpperCase', 'toLowerCase',
      'match', 'matchAll', 'search',
      // Object methods
      'hasOwnProperty', 'prototype', 'constructor', 'assign', 'create',
      'freeze', 'seal', 'keys', 'values', 'entries', 'fromEntries',
      'getPrototypeOf', 'defineProperty',
      // Number methods
      'toFixed', 'toPrecision', 'isInteger', 'isFinite', 'isSafeInteger',
      // TypeScript
      'interface', 'type', 'readonly', 'enum', 'implements', 'abstract',
      'declare', 'namespace', 'module', 'keyof', 'infer', 'never',
      'unknown', 'as', 'satisfies',
      // Common patterns
      'size', 'get', 'set', 'has', 'delete', 'clear', 'add',
      'next', 'done', 'value'
    ],

    java: [
      // Keywords
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
      'char', 'class', 'continue', 'default', 'do', 'double', 'else',
      'enum', 'extends', 'final', 'finally', 'float', 'for', 'if',
      'implements', 'import', 'instanceof', 'int', 'interface', 'long',
      'native', 'new', 'null', 'package', 'private', 'protected', 'public',
      'return', 'short', 'static', 'super', 'switch', 'synchronized',
      'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile',
      'while', 'true', 'false', 'record', 'sealed', 'permits', 'var',
      // Wrapper / primitive types
      'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean',
      'Character', 'Byte', 'Short', 'Object', 'Number',
      // Collections
      'ArrayList', 'LinkedList', 'HashMap', 'HashSet', 'TreeMap', 'TreeSet',
      'LinkedHashMap', 'LinkedHashSet', 'ArrayDeque',
      'Queue', 'Deque', 'Stack', 'PriorityQueue', 'Vector',
      'List', 'Map', 'Set', 'Collection', 'Iterable', 'Iterator',
      'Comparable', 'Comparator', 'Collections', 'Arrays',
      // String / StringBuilder
      'StringBuilder', 'StringBuffer', 'String',
      // Math & limits
      'Math', 'Integer.MAX_VALUE', 'Integer.MIN_VALUE',
      'Long.MAX_VALUE', 'Long.MIN_VALUE',
      'Double.MAX_VALUE', 'Double.MIN_VALUE',
      // Common methods
      'length', 'size', 'add', 'remove', 'get', 'put', 'contains',
      'containsKey', 'containsValue', 'isEmpty', 'clear', 'toArray',
      'sort', 'reverse', 'toString', 'equals', 'hashCode', 'compareTo',
      'charAt', 'substring', 'indexOf', 'lastIndexOf', 'split', 'trim',
      'replace', 'toLowerCase', 'toUpperCase', 'startsWith', 'endsWith',
      'valueOf', 'parseInt', 'parseLong', 'parseDouble', 'intValue',
      'append', 'insert', 'delete', 'deleteCharAt', 'reverse',
      'peek', 'poll', 'offer', 'push', 'pop',
      'keySet', 'values', 'entrySet', 'getOrDefault', 'putIfAbsent',
      'computeIfAbsent', 'merge', 'forEach',
      // Arrays util
      'fill', 'copyOf', 'copyOfRange', 'asList', 'stream',
      // Math methods
      'max', 'min', 'abs', 'pow', 'sqrt', 'ceil', 'floor', 'round',
      'log', 'log10', 'exp', 'random', 'signum',
      // Character methods
      'isDigit', 'isLetter', 'isLetterOrDigit', 'isWhitespace',
      'isUpperCase', 'isLowerCase', 'toUpperCase', 'toLowerCase',
      // LeetCode node types
      'ListNode', 'TreeNode', 'Node', 'Optional',
      // System
      'System', 'out', 'println', 'print', 'err',
      'Runtime', 'Thread', 'Exception', 'RuntimeException',
      // Streams (common)
      'stream', 'filter', 'map', 'collect', 'toList', 'count',
      'reduce', 'mapToInt', 'sum', 'average', 'distinct', 'sorted'
    ],

    cpp: [
      // Keywords
      'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const',
      'constexpr', 'continue', 'default', 'delete', 'do', 'double', 'else',
      'enum', 'explicit', 'extern', 'false', 'float', 'for', 'friend',
      'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
      'new', 'nullptr', 'operator', 'private', 'protected', 'public',
      'return', 'short', 'signed', 'sizeof', 'static', 'static_cast',
      'dynamic_cast', 'reinterpret_cast', 'const_cast',
      'struct', 'switch', 'template', 'this', 'throw', 'true', 'try',
      'typedef', 'typename', 'unsigned', 'using', 'virtual', 'void',
      'volatile', 'while', 'noexcept', 'override', 'final',
      // STL containers
      'vector', 'string', 'map', 'set', 'multimap', 'multiset',
      'unordered_map', 'unordered_set', 'unordered_multimap', 'unordered_multiset',
      'queue', 'stack', 'deque', 'priority_queue', 'list', 'forward_list',
      'pair', 'tuple', 'array', 'bitset', 'optional', 'variant',
      // STL container methods
      'push_back', 'pop_back', 'push_front', 'pop_front',
      'emplace_back', 'emplace_front', 'emplace',
      'front', 'back', 'top', 'begin', 'end', 'rbegin', 'rend',
      'cbegin', 'cend', 'size', 'empty', 'clear', 'reserve', 'resize',
      'capacity', 'shrink_to_fit',
      'insert', 'erase', 'find', 'count', 'contains',
      'push', 'pop', 'peek', 'enqueue', 'dequeue',
      'lower_bound', 'upper_bound', 'equal_range',
      'at', 'data', 'swap', 'merge', 'extract',
      'first', 'second', 'make_pair', 'make_tuple', 'get', 'tie',
      // Algorithms (<algorithm>)
      'sort', 'stable_sort', 'partial_sort', 'nth_element',
      'reverse', 'rotate', 'shuffle', 'random_shuffle',
      'unique', 'remove', 'remove_if', 'replace', 'replace_if',
      'fill', 'fill_n', 'generate', 'generate_n', 'transform',
      'copy', 'copy_if', 'copy_n', 'move',
      'find', 'find_if', 'find_if_not', 'search', 'search_n',
      'count', 'count_if', 'all_of', 'any_of', 'none_of',
      'min', 'max', 'min_element', 'max_element', 'minmax_element',
      'clamp', 'gcd', 'lcm',
      'accumulate', 'partial_sum', 'adjacent_difference', 'inner_product',
      'binary_search', 'includes', 'set_union', 'set_intersection',
      'set_difference', 'next_permutation', 'prev_permutation',
      // Numeric
      'abs', 'pow', 'sqrt', 'cbrt', 'ceil', 'floor', 'round', 'trunc',
      'log', 'log2', 'log10', 'exp', 'fabs', 'fmod', 'hypot',
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
      // <cctype> — character classification (commonly used in LeetCode)
      'isdigit', 'isalpha', 'isalnum', 'isspace', 'isupper', 'islower',
      'ispunct', 'isprint', 'iscntrl', 'isxdigit',
      'toupper', 'tolower',
      // <cstring> / <string>
      'strlen', 'strcmp', 'strcpy', 'strcat', 'substr',
      'length', 'append', 'compare', 'find', 'rfind', 'replace',
      'c_str', 'stoi', 'stol', 'stoll', 'stof', 'stod', 'stoul', 'stoull',
      'to_string', 'getline',
      // Limits
      'INT_MAX', 'INT_MIN', 'LONG_MAX', 'LONG_MIN',
      'LLONG_MAX', 'LLONG_MIN', 'DBL_MAX', 'FLT_MAX',
      'numeric_limits', 'infinity', 'max', 'min', 'lowest', 'digits',
      // Smart pointers
      'shared_ptr', 'unique_ptr', 'weak_ptr', 'make_shared', 'make_unique',
      // IO
      'cout', 'cin', 'cerr', 'endl', 'printf', 'scanf', 'sprintf',
      'stringstream', 'istringstream', 'ostringstream',
      // Headers (for reference in comments/includes)
      'algorithm', 'iostream', 'vector', 'string', 'map', 'set',
      'queue', 'stack', 'deque', 'numeric', 'cmath', 'climits',
      'cstring', 'sstream', 'functional', 'utility', 'memory',
      // LeetCode node types
      'ListNode', 'TreeNode', 'Node', 'val', 'next', 'left', 'right',
      // Lambda / functional
      'function', 'bind', 'ref', 'cref', 'greater', 'less',
      'plus', 'minus', 'multiplies', 'divides', 'modulus', 'negate'
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
   *
   * Uses 5 strategies in order of reliability:
   *  1. Stable data-cy / aria attributes
   *  2. Broad button/select text scan (catches dynamic class names)
   *  3. URL path hints (some contest pages encode lang in URL)
   *  4. Monaco model URI (monaco.editor model fileName)
   *  5. Full body text scan (last resort)
   *
   * @returns {'python'|'javascript'|'java'|'cpp'}
   */
  detectLanguage() {
    // ── Helper: map any text blob to a language key ──────────────────
    function textToLang(text) {
      if (!text) return null;
      const t = text.toLowerCase();
      if (t.includes('python'))                          return 'python';
      if (t.includes('typescript') || t.includes('ts')) return 'javascript';
      if (t.includes('javascript') || t.includes('js')) return 'javascript';
      if (t.includes('c++') || t.includes('cpp'))       return 'cpp';
      if (t.includes('java'))                            return 'java';   // after javascript
      if (t.includes('golang') || t.includes('go'))     return 'cpp';    // treat go as cpp-like
      return null;
    }

    // ── Strategy 1: stable data attributes & aria labels ─────────────
    const stableSelectors = [
      '[data-cy="lang-btn"]',
      '[aria-label*="language" i]',
      '[aria-label*="lang" i]',
      'button[id*="lang"]',
    ];
    for (const sel of stableSelectors) {
      const el = document.querySelector(sel);
      const lang = el && textToLang(el.textContent);
      if (lang) {
        console.log(`[CodeRadar] Language (strategy 1 "${sel}"): ${lang}`);
        return lang;
      }
    }

    // ── Strategy 2: scan ALL buttons and select elements for lang text ─
    // LeetCode sometimes puts lang in a <button> or <span> with dynamic classes.
    // We look for small elements whose FULL text is just a language name.
    const candidates = document.querySelectorAll(
      'button, [role="option"], [role="menuitem"], .ant-select-selection-item, ' +
      '[class*="select"] span, [class*="lang"] span, [class*="language"] span'
    );
    for (const el of candidates) {
      const text = el.textContent.trim();
      // Only consider short strings — a language name is ≤ 20 chars
      if (text.length > 0 && text.length <= 20) {
        const lang = textToLang(text);
        if (lang) {
          console.log(`[CodeRadar] Language (strategy 2, text="${text}"): ${lang}`);
          return lang;
        }
      }
    }

    // ── Strategy 3: URL hint ──────────────────────────────────────────
    const urlLang = textToLang(location.href);
    if (urlLang) {
      console.log(`[CodeRadar] Language (strategy 3, URL): ${urlLang}`);
      return urlLang;
    }

    // ── Strategy 4: Monaco model URI (file extension) ────────────────
    // Monaco stores the current buffer as a model with a URI like
    // "inmemory://model/solution.py" — readable from the DOM via
    // aria-label on the editor container.
    const editorLabel = document.querySelector(
      '.monaco-editor[data-uri], .monaco-editor [aria-label]'
    );
    if (editorLabel) {
      const uri = editorLabel.getAttribute('data-uri') ||
                  editorLabel.getAttribute('aria-label') || '';
      if (uri.includes('.py'))   { console.log('[CodeRadar] Language (strategy 4, URI): python');     return 'python'; }
      if (uri.includes('.js') || uri.includes('.ts'))
                                 { console.log('[CodeRadar] Language (strategy 4, URI): javascript'); return 'javascript'; }
      if (uri.includes('.java')) { console.log('[CodeRadar] Language (strategy 4, URI): java');       return 'java'; }
      if (uri.includes('.cpp') || uri.includes('.cc'))
                                 { console.log('[CodeRadar] Language (strategy 4, URI): cpp');        return 'cpp'; }
    }

    // ── Strategy 5: body text scan (last resort) ──────────────────────
    // Search visible text near the editor area for language mentions.
    const editorArea = document.querySelector('.monaco-editor')?.closest('section, div[class*="editor"], div[class*="code"]');
    if (editorArea) {
      const bodyText = editorArea.textContent;
      const lang = textToLang(bodyText);
      if (lang) {
        console.log(`[CodeRadar] Language (strategy 5, body): ${lang}`);
        return lang;
      }
    }

    // ── Default ───────────────────────────────────────────────────────
    console.log('[CodeRadar] Language: could not detect, defaulting to python');
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
