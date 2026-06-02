/**
 * Trie data structure for fast prefix-based autocomplete lookups.
 * Each node stores children and a flag indicating end-of-word.
 */

class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
    this.frequency = 0;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Insert a word into the trie.
   * @param {string} word
   */
  insert(word) {
    if (!word || word.length < 2) return;
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEnd = true;
    node.frequency++;
  }

  /**
   * Search for all words matching a given prefix.
   * Returns an array of { word, frequency } sorted by frequency desc.
   * Collection is bounded to avoid traversing huge sub-tries.
   * @param {string} prefix
   * @param {number} maxResults
   * @returns {Array<{word: string, frequency: number}>}
   */
  search(prefix, maxResults = 8) {
    if (!prefix || prefix.length < 1) return [];

    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }

    const results = [];
    // Collect with a cap to avoid traversing thousands of nodes
    this._collect(node, prefix, results, maxResults * 10);

    // Sort by frequency (descending), then alphabetically
    results.sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      return a.word.localeCompare(b.word);
    });

    return results.slice(0, maxResults);
  }

  /**
   * Bounded DFS to collect words from a given node.
   * Stops collecting once `limit` results are reached.
   * @param {TrieNode} node
   * @param {string} prefix
   * @param {Array} results
   * @param {number} limit
   * @returns {boolean} true if limit reached (caller should stop)
   */
  _collect(node, prefix, results, limit) {
    if (results.length >= limit) return true;

    if (node.isEnd) {
      results.push({ word: prefix, frequency: node.frequency });
      if (results.length >= limit) return true;
    }

    for (const char in node.children) {
      if (this._collect(node.children[char], prefix + char, results, limit)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear the trie completely.
   */
  clear() {
    this.root = new TrieNode();
  }

  /**
   * Bulk insert from an array of words.
   * @param {string[]} words
   */
  bulkInsert(words) {
    if (!words) return;
    for (const word of words) {
      this.insert(word);
    }
  }
}

window.__leetcodeIntellisense = window.__leetcodeIntellisense || {};
window.__leetcodeIntellisense.Trie = Trie;
