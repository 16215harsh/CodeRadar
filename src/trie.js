/**
 * Trie with fzf-inspired fuzzy matching.
 *
 * Scoring constants and bonusFor() are exact ports from junegunn/fzf (MIT):
 * https://github.com/junegunn/fzf/blob/master/src/algo/algo.go
 *
 * Matching strategy: fzf-V1-style greedy forward scan with V2 scoring bonuses.
 * For identifiers (5–20 chars) this produces the same quality as full V2 DP
 * but without the complexity/bugs of a Smith-Waterman implementation.
 */

// ── Scoring constants (exact values from fzf) ───────────────────────────────
const SCORE_MATCH         =  16;
const SCORE_GAP_START     =  -3;
const SCORE_GAP_EXTENSION =  -1;

const BONUS_BOUNDARY           =   8;  // = SCORE_MATCH / 2
const BONUS_CAMEL_123          =   7;  // = BONUS_BOUNDARY + SCORE_GAP_EXTENSION
const BONUS_CONSECUTIVE        =   4;  // = -(SCORE_GAP_START + SCORE_GAP_EXTENSION)
const BONUS_BOUNDARY_WHITE     =  10;  // = BONUS_BOUNDARY + 2  (default scheme)
const BONUS_BOUNDARY_DELIMITER =   9;  // = BONUS_BOUNDARY + 1  (default scheme)
const BONUS_NON_WORD           =   8;
const BONUS_FIRST_CHAR_MUL     =   2;

// ── Character classes (iota order matches fzf exactly) ──────────────────────
const CHAR_WHITE     = 0;
const CHAR_NON_WORD  = 1;
const CHAR_DELIMITER = 2;
const CHAR_LOWER     = 3;
const CHAR_UPPER     = 4;
const CHAR_NUMBER    = 6;

function charClassOf(c) {
  const code = c.charCodeAt(0);
  if (code >= 97 && code <= 122) return CHAR_LOWER;
  if (code >= 65 && code <= 90)  return CHAR_UPPER;
  if (code >= 48 && code <= 57)  return CHAR_NUMBER;
  if (code === 32 || code === 9 || code === 10 || code === 13) return CHAR_WHITE;
  if ('/,:;|'.indexOf(c) >= 0) return CHAR_DELIMITER;
  return CHAR_NON_WORD;   // _ - . etc.
}

/**
 * Exact port of fzf's bonusFor(prevClass, curClass).
 * Returns the boundary bonus earned when a character of class `curCls`
 * follows a character of class `prevCls`.
 */
function bonusFor(prevCls, curCls) {
  // Word boundary: any non-white char following whitespace / delimiter / nonword
  if (curCls >= CHAR_NON_WORD) {
    if (prevCls === CHAR_WHITE)     return BONUS_BOUNDARY_WHITE;       // 10
    if (prevCls === CHAR_DELIMITER) return BONUS_BOUNDARY_DELIMITER;   //  9
    if (prevCls === CHAR_NON_WORD)  return BONUS_BOUNDARY;             //  8
  }
  // camelCase boundary: lower→upper, or non-number→number
  if ((prevCls === CHAR_LOWER && curCls === CHAR_UPPER) ||
      (prevCls !== CHAR_NUMBER && curCls === CHAR_NUMBER)) {
    return BONUS_CAMEL_123;   // 7
  }
  if (curCls === CHAR_NON_WORD || curCls === CHAR_DELIMITER) return BONUS_NON_WORD;
  if (curCls === CHAR_WHITE)                                  return BONUS_BOUNDARY_WHITE;
  return 0;
}

/**
 * Precompute the boundary bonus for every character position in `word`.
 * Position 0 is treated as following a whitespace character (matches fzf).
 */
function positionBonuses(word) {
  const n = word.length;
  const B = new Array(n);
  let prevCls = CHAR_WHITE;
  for (let i = 0; i < n; i++) {
    const cls = charClassOf(word[i]);
    B[i]      = bonusFor(prevCls, cls);
    prevCls   = cls;
  }
  return B;
}

// ── Trie ───────────────────────────────────────────────────────────────────

class TrieNode {
  constructor() {
    this.children  = {};
    this.isEnd     = false;
    this.frequency = 0;
  }
}

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {
    if (!word || word.length < 2) return;
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
    node.frequency++;
  }

  /**
   * Exact prefix search — returns words starting with `prefix`.
   * Results sorted by frequency desc, then alphabetically.
   */
  search(prefix, maxResults = 8) {
    if (!prefix || prefix.length < 1) return [];
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    const raw = [];
    this._collect(node, prefix, raw, maxResults * 10);
    raw.sort((a, b) =>
      b.frequency !== a.frequency
        ? b.frequency - a.frequency
        : a.word.localeCompare(b.word)
    );
    return raw.slice(0, maxResults).map(item => ({
      ...item,
      indices: Array.from({ length: prefix.length }, (_, i) => i),
      score:   2000 + item.frequency * 8,
      isFuzzy: false
    }));
  }

  /**
   * Fuzzy search — finds words where every character of `pattern`
   * appears in order inside the word (subsequence matching).
   *
   * Uses greedy forward scan + fzf boundary bonuses for scoring.
   * Returns up to maxResults results sorted by score descending.
   */
  fuzzySearch(pattern, maxResults = 8) {
    if (!pattern || pattern.length < 2) return [];

    const allWords = this.getAllWords(600);
    const lowerPat = pattern.toLowerCase();
    const results  = [];

    for (const { word, frequency } of allWords) {
      const match = fuzzyScore(word, lowerPat, frequency);
      if (match.matched) {
        results.push({
          word,
          frequency,
          score:   match.score,
          indices: match.indices,
          isFuzzy: !word.toLowerCase().startsWith(lowerPat)
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  getAllWords(limit = 600) {
    const results = [];
    this._collect(this.root, '', results, limit);
    return results;
  }

  _collect(node, prefix, results, limit) {
    if (results.length >= limit) return true;
    if (node.isEnd) {
      results.push({ word: prefix, frequency: node.frequency });
      if (results.length >= limit) return true;
    }
    for (const ch in node.children) {
      if (this._collect(node.children[ch], prefix + ch, results, limit)) return true;
    }
    return false;
  }

  clear()           { this.root = new TrieNode(); }
  bulkInsert(words) { if (!words) return; for (const w of words) this.insert(w); }
}

// ── Fuzzy scorer ────────────────────────────────────────────────────────────

/**
 * Score `word` against `lowerPattern` using a greedy forward scan
 * with fzf's exact boundary bonus / gap penalty system.
 *
 * Scoring per matched character:
 *   + SCORE_MATCH (16)                       — base score for each matched char
 *   + boundaryBonus(pos) * 2 if first char   — first-char-at-boundary multiplier
 *   + boundaryBonus(pos) otherwise           — boundary / camelCase bonus
 *   + max(BONUS_CONSECUTIVE, posBonus)        — bonus for consecutive matched chars
 *   - SCORE_GAP_START + gaps * SCORE_GAP_EXTENSION — gap penalty between matches
 *
 * @param  {string}  word
 * @param  {string}  lowerPattern   already lowercased
 * @param  {number}  frequency
 * @returns {{ matched: boolean, score: number, indices: number[] }}
 */
function fuzzyScore(word, lowerPattern, frequency) {
  const n = word.length;
  const m = lowerPattern.length;

  if (m === 0 || n < m) return { matched: false };

  const lowerWord = word.toLowerCase();

  // Precompute boundary bonuses
  const B = positionBonuses(word);

  // ── Greedy forward scan ────────────────────────────────────────────
  const indices = [];
  let pi = 0;
  for (let i = 0; i < n && pi < m; i++) {
    if (lowerWord[i] === lowerPattern[pi]) {
      indices.push(i);
      pi++;
    }
  }
  if (pi < m) return { matched: false };   // not a subsequence

  // ── Score the match ────────────────────────────────────────────────
  let score = 0;

  for (let k = 0; k < indices.length; k++) {
    const idx  = indices[k];
    const bns  = B[idx];

    // Base match score
    score += SCORE_MATCH;

    // Position bonus (word-boundary / camelCase)
    if (k === 0) {
      // First pattern char: double bonus when at a word boundary
      score += bns * BONUS_FIRST_CHAR_MUL;
    } else {
      const prevIdx = indices[k - 1];

      // Gap penalty for characters skipped since last match
      const gap = idx - prevIdx - 1;
      if (gap > 0) {
        score += SCORE_GAP_START + (gap - 1) * SCORE_GAP_EXTENSION;
      } else {
        // Consecutive chars: bonus is max of BONUS_CONSECUTIVE and position bonus
        score += Math.max(BONUS_CONSECUTIVE, bns);
      }

      // Non-consecutive position bonus (camelCase / boundary mid-word)
      if (gap > 0) score += bns;
    }
  }

  // ── Final adjustments ──────────────────────────────────────────────
  const prefixBonus = lowerWord.startsWith(lowerPattern) ? 1000 : 0;
  const totalScore  =
    score
    + frequency * 8    // reward frequently-used identifiers
    + prefixBonus      // exact prefix always outranks fuzzy results
    - word.length;     // prefer shorter words as tiebreaker

  return { matched: true, score: totalScore, indices };
}

// ── Export ─────────────────────────────────────────────────────────────────
window.__codeRadar = window.__codeRadar || {};
window.__codeRadar.Trie = Trie;
