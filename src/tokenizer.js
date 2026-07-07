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

    // Helper: save + return
    function found(lang, strategy) {
      try { localStorage.setItem('coderadar_lang', lang); } catch (_) {}
      console.log(`[CodeRadar] Language (${strategy}): ${lang}`);
      return lang;
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
      if (lang) return found(lang, `strategy 1 "${sel}"`);
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
      if (text.length > 0 && text.length <= 20) {
        const lang = textToLang(text);
        if (lang) return found(lang, `strategy 2 "${text}"`);
      }
    }

    // ── Strategy 3: URL hint ──────────────────────────────────────────
    const urlLang = textToLang(location.href);
    if (urlLang) return found(urlLang, 'strategy 3 URL');

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
      if (uri.includes('.py'))                         return found('python',     'strategy 4 URI');
      if (uri.includes('.js') || uri.includes('.ts'))  return found('javascript', 'strategy 4 URI');
      if (uri.includes('.java'))                       return found('java',       'strategy 4 URI');
      if (uri.includes('.cpp') || uri.includes('.cc')) return found('cpp',        'strategy 4 URI');
    }

    // ── Strategy 5: body text scan (last resort) ──────────────────────
    // Search visible text near the editor area for language mentions.
    const editorArea = document.querySelector('.monaco-editor')?.closest('section, div[class*="editor"], div[class*="code"]');
    if (editorArea) {
      const lang = textToLang(editorArea.textContent);
      if (lang) return found(lang, 'strategy 5 body');
    }

    // ── Fallback: use last remembered language ────────────────────────
    try {
      const saved = localStorage.getItem('coderadar_lang');
      if (saved) {
        console.log(`[CodeRadar] Language (localStorage fallback): ${saved}`);
        return saved;
      }
    } catch (_) {}

    // ── Cold default: cpp (most common on LeetCode competitive) ───────
    console.log('[CodeRadar] Language: detection failed, cold default → cpp');
    return 'cpp';
  },

  /**
   * Get keywords for the detected language.
   * @param {string} language
   * @returns {string[]}
   */
  getKeywords(language) {
    return this.KEYWORDS[language] || this.KEYWORDS.python;
  },

  // ── Dot Completion ────────────────────────────────────────────────────

  /**
   * Methods grouped by container/type per language.
   * Used for dot-completion (e.g. nums. → list methods).
   */
  METHOD_GROUPS: {
    python: {
      list:    ['append','extend','insert','remove','pop','index','count','sort',
                'reverse','copy','clear'],
      str:     ['split','join','strip','lstrip','rstrip','replace','find','rfind',
                'startswith','endswith','upper','lower','title','capitalize',
                'isdigit','isalpha','isalnum','isspace','isupper','islower',
                'zfill','center','ljust','rjust','format','encode','count','index'],
      dict:    ['get','keys','values','items','update','setdefault','pop',
                'clear','copy','fromkeys'],
      deque:   ['append','appendleft','pop','popleft','extend','extendleft',
                'rotate','clear','copy','count','index','insert','remove'],
      set:     ['add','remove','discard','pop','clear','copy',
                'union','intersection','difference','symmetric_difference',
                'issubset','issuperset','isdisjoint'],
      Counter: ['most_common','elements','subtract','update','total'],
      heap:    ['heappush','heappop','heapify','heapreplace','nlargest','nsmallest'],
      math:    ['ceil','floor','sqrt','log','log2','log10','pow','exp','fabs',
                'gcd','lcm','factorial','comb','perm','isnan','isinf','isfinite'],
      itertools:['product','permutations','combinations','combinations_with_replacement',
                 'chain','cycle','repeat','accumulate','groupby','islice'],
    },
    cpp: {
      vector:         ['push_back','pop_back','emplace_back','front','back',
                       'begin','end','rbegin','rend','size','empty','clear',
                       'insert','erase','find','reserve','resize','at','swap','data'],
      string:         ['length','size','substr','find','rfind','replace','append',
                       'insert','erase','c_str','empty','clear','at','front','back',
                       'begin','end','compare','push_back','pop_back'],
      map:            ['insert','erase','find','count','contains','begin','end',
                       'size','empty','clear','lower_bound','upper_bound','at'],
      unordered_map:  ['insert','erase','find','count','contains','begin','end',
                       'size','empty','clear','at','bucket_count'],
      set:            ['insert','erase','find','count','contains','begin','end',
                       'size','empty','clear','lower_bound','upper_bound'],
      unordered_set:  ['insert','erase','find','count','contains','begin','end',
                       'size','empty','clear'],
      queue:          ['push','pop','front','back','empty','size'],
      stack:          ['push','pop','top','empty','size'],
      priority_queue: ['push','pop','top','empty','size'],
      deque:          ['push_back','pop_back','push_front','pop_front',
                       'front','back','begin','end','size','empty','at','clear'],
      pair:           ['first','second','make_pair','swap'],
    },
    java: {
      ArrayList:     ['add','remove','get','set','size','isEmpty','contains',
                      'indexOf','lastIndexOf','clear','sort','toArray','iterator','subList'],
      LinkedList:    ['add','remove','get','set','size','isEmpty','contains',
                      'addFirst','addLast','removeFirst','removeLast',
                      'getFirst','getLast','peek','poll','offer','push','pop'],
      HashMap:       ['put','get','remove','containsKey','containsValue','size',
                      'isEmpty','clear','keySet','values','entrySet',
                      'getOrDefault','putIfAbsent','computeIfAbsent','merge','forEach'],
      HashSet:       ['add','remove','contains','size','isEmpty','clear','iterator'],
      TreeMap:       ['put','get','remove','containsKey','size','isEmpty','clear',
                      'firstKey','lastKey','lowerKey','higherKey','floorKey','ceilingKey'],
      TreeSet:       ['add','remove','contains','size','isEmpty','clear',
                      'first','last','lower','higher','floor','ceiling'],
      StringBuilder: ['append','insert','delete','deleteCharAt','replace',
                      'reverse','toString','length','charAt','indexOf','substring','setCharAt'],
      String:        ['length','charAt','substring','indexOf','lastIndexOf','split',
                      'trim','replace','replaceAll','toUpperCase','toLowerCase',
                      'startsWith','endsWith','contains','isEmpty','toCharArray',
                      'compareTo','compareToIgnoreCase','matches','format'],
      PriorityQueue: ['add','offer','poll','peek','remove','size','isEmpty','clear','contains'],
      Arrays:        ['sort','fill','copyOf','copyOfRange','asList','toString',
                      'equals','binarySearch'],
      Collections:   ['sort','reverse','shuffle','min','max','frequency',
                      'nCopies','unmodifiableList','singletonList'],
    },
    javascript: {
      Array:  ['push','pop','shift','unshift','splice','slice','concat',
               'join','reverse','sort','filter','map','reduce','reduceRight',
               'forEach','find','findIndex','findLast','includes','indexOf',
               'lastIndexOf','flat','flatMap','fill','every','some','at',
               'entries','keys','values','copyWithin','length'],
      String: ['split','slice','substring','indexOf','lastIndexOf','includes',
               'startsWith','endsWith','replace','replaceAll','trim','trimStart',
               'trimEnd','padStart','padEnd','repeat','toUpperCase','toLowerCase',
               'charAt','charCodeAt','match','matchAll','search','at','length'],
      Map:    ['set','get','has','delete','clear','size','keys','values','entries','forEach'],
      Set:    ['add','has','delete','clear','size','keys','values','entries','forEach'],
      Object: ['keys','values','entries','assign','create','freeze','seal',
               'fromEntries','getPrototypeOf','defineProperty','hasOwnProperty'],
      Math:   ['floor','ceil','round','abs','max','min','pow','sqrt','log',
               'log2','log10','random','sign','trunc','hypot'],
    },
  },

  /**
   * Variable name → type heuristics (regex patterns).
   * Checked when code-scan can't find a declaration.
   */
  VAR_TYPE_HINTS: {
    python: {
      list:    /^(nums|arr|result|res|ans|ret|output|items|elements|matrix|grid|board|row|col|path|temp|lst|vals|level|candidates|left|right)s?$/i,
      str:     /^(s|t|word|text|pattern|target|source|line|sentence|prefix|suffix|key|name|code)$/i,
      dict:    /^(d|mp|memo|cache|dp|count|freq|counter|idx|parent|rank|graph|adj|pos)$/i,
      deque:   /^(q|dq|deq|queue|bfs|buf)$/i,
      set:     /^(seen|visited|found|used|added|removed)$/i,
      Counter: /^(cnt|counter|freq|count)$/i,
    },
    cpp: {
      vector:         /^(nums|arr|result|res|ans|v|vec|path|temp|row|col|grid|board|matrix|adj|edges|indices|vals)$/i,
      string:         /^(s|t|str|word|text|pattern|line|key|name)$/i,
      map:            /^(mp|m|cnt|freq|idx|pos|parent|adj|graph)$/i,
      unordered_map:  /^(mp|m|cnt|freq|idx|um|umap)$/i,
      unordered_set:  /^(seen|visited|us|uset|found)$/i,
      set:            /^(st|seen|found)$/i,
      queue:          /^(q|queue|bfs)$/i,
      stack:          /^(st|stk|stack|dfs)$/i,
      priority_queue: /^(pq|heap|maxHeap|minHeap|h|pq)$/i,
      deque:          /^(dq|deq|d)$/i,
    },
    java: {
      ArrayList:     /^(list|nums|arr|result|res|ans|items|elements|path|temp)$/i,
      HashMap:       /^(map|mp|memo|cache|dp|count|freq|idx|parent|graph|adj)$/i,
      StringBuilder: /^(sb|builder|buf|buffer|result|res)$/i,
      PriorityQueue: /^(pq|heap|queue|q)$/i,
      HashSet:       /^(set|seen|visited|found)$/i,
    },
    javascript: {
      Array:  /^(nums|arr|result|res|ans|items|list|elements|path)$/i,
      Map:    /^(map|mp|memo|cache|dp|count|freq)$/i,
      Set:    /^(set|seen|visited|found)$/i,
      String: /^(s|t|str|word|text|pattern|line)$/i,
    },
  },

  /**
   * Markov Chain transitions (Probability Graph).
   * Maps a preceding token to a list of highly probable next tokens.
   */
  MARKOV_TRANSITIONS: {
    cpp: {
      'vector': ['int', 'long', 'long long', 'string', 'bool', 'pair', 'vector'],
      'queue': ['int', 'pair', 'TreeNode', 'ListNode', 'vector'],
      'stack': ['int', 'pair', 'TreeNode', 'ListNode', 'char'],
      'map': ['int', 'string', 'char', 'long', 'pair'],
      'unordered_map': ['int', 'string', 'char', 'long'],
      'set': ['int', 'string', 'long', 'pair'],
      'unordered_set': ['int', 'string', 'long'],
      'priority_queue': ['int', 'pair', 'vector', 'greater'],
      'pair': ['int', 'long', 'string', 'double'],
      'for': ['int', 'auto', 'long', 'size_t'],
      'while': ['true', 'false', 'q', 'pq', 'st', 'left', 'right'],
      'if': ['true', 'false', '!'],
      'return': ['true', 'false', '0', '1', 'ans', 'res', 'result', 'head', 'root'],
      'public': ['class', 'void', 'int', 'bool', 'string', 'vector', 'ListNode', 'TreeNode'],
      'class': ['Solution'],
      'new': ['ListNode', 'TreeNode', 'int'],
      '#include': ['<iostream>', '<vector>', '<string>', '<algorithm>', '<map>', '<set>', '<queue>', '<cmath>', '<numeric>']
    },
    python: {
      'def': ['__init__', 'solve', 'dfs', 'bfs'],
      'for': ['i', 'j', 'idx', 'num', 'char', 'node', 'key', 'val', 'row', 'col'],
      'in': ['range', 'nums', 'arr', 'word', 'keys', 'values', 'items', 'enumerate'],
      'while': ['True', 'False', 'q', 'stack', 'left', 'right', 'i'],
      'if': ['not', 'True', 'False', 'i', 'j'],
      'return': ['True', 'False', 'None', 'res', 'ans', '0', '1'],
      'import': ['sys', 'math', 'collections', 'heapq', 'bisect', 'itertools'],
      'from': ['collections', 'heapq', 'typing', 'bisect', 'math']
    },
    java: {
      'ArrayList': ['Integer', 'String', 'Long', 'Boolean', 'List'],
      'HashMap': ['Integer', 'String', 'Long', 'Character', 'Boolean'],
      'HashSet': ['Integer', 'String', 'Long', 'Character'],
      'Queue': ['Integer', 'TreeNode', 'ListNode', 'int[]'],
      'Stack': ['Integer', 'Character', 'TreeNode', 'ListNode'],
      'PriorityQueue': ['Integer', 'int[]', 'Map.Entry'],
      'Map': ['Integer', 'String'],
      'List': ['Integer', 'String', 'List'],
      'public': ['class', 'void', 'int', 'boolean', 'String', 'List', 'ListNode', 'TreeNode', 'static'],
      'private': ['int', 'boolean', 'String', 'void'],
      'return': ['true', 'false', '0', '1', 'ans', 'res', 'result', 'head', 'root', 'null'],
      'for': ['int', 'long', 'String'],
      'while': ['true', 'false', '!q', '!stack'],
      'new': ['ArrayList<>', 'HashMap<>', 'HashSet<>', 'LinkedList<>', 'PriorityQueue<>', 'TreeNode', 'ListNode']
    },
    javascript: {
      'const': ['res', 'ans', 'map', 'set', 'queue', 'stack', 'arr', 'nums'],
      'let': ['i', 'j', 'res', 'ans', 'left', 'right', 'count', 'sum'],
      'for': ['let', 'const'],
      'of': ['nums', 'arr', 'str', 'map', 'set'],
      'while': ['true', 'false', 'left', 'queue', 'i'],
      'return': ['true', 'false', 'null', 'undefined', 'res', 'ans', '0', '1'],
      'new': ['Map', 'Set', 'Array', 'Promise', 'Date']
    }
  },

  /**
   * Get Markov Chain score boosts for the next probable tokens.
   * @param {string} language
   * @param {string} lastWord
   * @returns {string[]}
   */
  getMarkovBoosts(language, lastWord) {
    if (!lastWord) return [];
    return (this.MARKOV_TRANSITIONS[language] || {})[lastWord] || [];
  },

  /**
   * Infer the type of `varName` by:
   *  1. Scanning `code` for a declaration (most accurate)
   *  2. Falling back to name heuristics
   *
   * @param {string} varName
   * @param {string} code
   * @param {string} language
   * @returns {string|null} type key (e.g. 'vector', 'list') or null
   */
  inferType(varName, code, language) {
    if (!varName) return null;

    // 1. Code-based inference
    const fromCode = this._inferFromCode(varName, code, language);
    if (fromCode) return fromCode;

    // 2. Name heuristic
    const hints = this.VAR_TYPE_HINTS[language] || {};
    for (const [type, re] of Object.entries(hints)) {
      if (re.test(varName)) return type;
    }
    return null;
  },

  _inferFromCode(varName, code, language) {
    if (!code || !varName) return null;
    const v = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special chars

    const patterns = {
      python: [
        { re: new RegExp(`${v}\\s*=\\s*\\[`),        type: 'list'    },
        { re: new RegExp(`${v}\\s*=\\s*\\{`),        type: 'dict'    },
        { re: new RegExp(`${v}\\s*=\\s*['""]`),      type: 'str'     },
        { re: new RegExp(`${v}\\s*=\\s*deque`),      type: 'deque'   },
        { re: new RegExp(`${v}\\s*=\\s*set\\(`),     type: 'set'     },
        { re: new RegExp(`${v}\\s*=\\s*Counter`),    type: 'Counter' },
        { re: new RegExp(`${v}\\s*:\\s*str`),         type: 'str'     },
        { re: new RegExp(`${v}\\s*:\\s*List`),        type: 'list'    },
        { re: new RegExp(`${v}\\s*:\\s*Dict`),        type: 'dict'    },
      ],
      cpp: [
        { re: new RegExp(`vector[^>]*>\\s*${v}`),           type: 'vector'        },
        { re: new RegExp(`string\\s+${v}`),                  type: 'string'        },
        { re: new RegExp(`unordered_map[^>]*>\\s*${v}`),    type: 'unordered_map' },
        { re: new RegExp(`unordered_set[^>]*>\\s*${v}`),    type: 'unordered_set' },
        { re: new RegExp(`\\bmap[^>]*>\\s*${v}`),           type: 'map'           },
        { re: new RegExp(`\\bset[^>]*>?\\s*${v}`),          type: 'set'           },
        { re: new RegExp(`priority_queue[^>]*>\\s*${v}`),   type: 'priority_queue'},
        { re: new RegExp(`\\bqueue[^>]*>?\\s*${v}`),        type: 'queue'         },
        { re: new RegExp(`\\bstack[^>]*>?\\s*${v}`),        type: 'stack'         },
        { re: new RegExp(`\\bdeque[^>]*>\\s*${v}`),         type: 'deque'         },
      ],
      java: [
        { re: new RegExp(`ArrayList[^>]*>\\s*${v}`),     type: 'ArrayList'     },
        { re: new RegExp(`LinkedList[^>]*>\\s*${v}`),    type: 'LinkedList'    },
        { re: new RegExp(`HashMap[^>]*>\\s*${v}`),       type: 'HashMap'       },
        { re: new RegExp(`HashSet[^>]*>\\s*${v}`),       type: 'HashSet'       },
        { re: new RegExp(`TreeMap[^>]*>\\s*${v}`),       type: 'TreeMap'       },
        { re: new RegExp(`TreeSet[^>]*>\\s*${v}`),       type: 'TreeSet'       },
        { re: new RegExp(`StringBuilder\\s+${v}`),        type: 'StringBuilder' },
        { re: new RegExp(`String\\s+${v}`),               type: 'String'        },
        { re: new RegExp(`PriorityQueue[^>]*>\\s*${v}`), type: 'PriorityQueue' },
      ],
      javascript: [
        { re: new RegExp(`${v}\\s*=\\s*\\[`),          type: 'Array'  },
        { re: new RegExp(`${v}\\s*=\\s*new\\s+Map`),   type: 'Map'    },
        { re: new RegExp(`${v}\\s*=\\s*new\\s+Set`),   type: 'Set'    },
        { re: new RegExp(`${v}\\s*=\\s*['""]`),        type: 'String' },
        { re: new RegExp(`${v}\\s*=\\s*new\\s+Array`), type: 'Array'  },
      ],
    };

    for (const { re, type } of (patterns[language] || [])) {
      if (re.test(code)) return type;
    }
    return null;
  },

  /**
   * Get method list for a given type+language combination.
   * @returns {string[]|null}
   */
  getMethodsForType(type, language) {
    return (this.METHOD_GROUPS[language] || {})[type] || null;
  },

  /**
   * Get ALL methods across every type for a language (fallback for dot completion
   * when type cannot be inferred).
   * @returns {string[]}
   */
  getAllMethods(language) {
    const groups = this.METHOD_GROUPS[language] || {};
    const all = new Set();
    for (const methods of Object.values(groups)) {
      for (const m of methods) all.add(m);
    }
    return [...all].sort();
  },
};

window.__codeRadar = window.__codeRadar || {};
window.__codeRadar.Tokenizer = Tokenizer;
