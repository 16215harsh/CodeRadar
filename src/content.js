/**
 * LeetCode IntelliSense — Main Content Script (100% DOM-based)
 *
 * No page-context injection. No bridge. No CSP issues.
 *
 * Strategy:
 * 1. Read code from .view-line DOM elements (visible lines)
 * 2. Track keystrokes to know the current word being typed
 * 3. Get cursor screen position from the .cursor DOM element
 * 4. Insert completions via synthetic paste events on Monaco's input element
 */

(function () {
  'use strict';

  const { Trie } = window.__leetcodeIntellisense;
  const { Tokenizer } = window.__leetcodeIntellisense;
  const { AutocompletePopup } = window.__leetcodeIntellisense;

  // ── State ──────────────────────────────────────────────────────────
  const trie = new Trie();
  const popup = new AutocompletePopup();
  let wordBuffer = '';        // tracks the word the user is currently typing
  let debounceTimer = null;
  let lastCodeHash = '';      // avoid rebuilding trie if code hasn't changed
  let isInserting = false;    // prevents re-triggering during completion insertion
  let trieInterval = null;    // reference for cleanup
  let initialized = false;    // prevent double-init

  // ── DOM Helpers ────────────────────────────────────────────────────

  /**
   * Read code from all visible .view-line elements.
   * Monaco virtualizes rendering, so only visible lines are in DOM.
   * For typical LeetCode solutions this captures most/all code.
   */
  function getCodeFromDOM() {
    const viewLines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    if (!viewLines || viewLines.length === 0) return '';

    const lines = [];
    viewLines.forEach(line => {
      lines.push(line.textContent || '');
    });
    return lines.join('\n');
  }

  /**
   * Get the cursor element's screen position for popup placement.
   * Tries multiple selectors for different Monaco versions.
   */
  function getCursorScreenPosition() {
    const cursor =
      document.querySelector('.monaco-editor .cursor.monaco-mouse-cursor-text') ||
      document.querySelector('.monaco-editor .cursors-layer .cursor') ||
      document.querySelector('.monaco-editor .cursor');

    if (!cursor) return null;

    const rect = cursor.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) return null;

    return { x: rect.left, y: rect.top + rect.height };
  }

  /**
   * Find Monaco's ACTUAL input element.
   *
   * Modern Monaco DOM structure:
   *   .monaco-editor
   *     .overflow-guard
   *       div.inputarea[contenteditable="true"]   ← real input
   *         textarea.ime-text-area[readonly]       ← IME only, skip this
   *
   * Older Monaco:
   *   .monaco-editor
   *     textarea.inputarea                         ← direct textarea
   */
  function getMonacoInput() {
    // Priority 1: contenteditable div.inputarea (modern Monaco)
    const ceDiv = document.querySelector('.monaco-editor .inputarea[contenteditable="true"]') ||
                  document.querySelector('.monaco-editor [contenteditable="true"].inputarea');
    if (ceDiv) return ceDiv;

    // Priority 2: any contenteditable inside the editor
    const anyCE = document.querySelector('.monaco-editor [contenteditable="true"]');
    if (anyCE) return anyCE;

    // Priority 3: non-readonly textarea
    const editableTA = document.querySelector('.monaco-editor textarea:not([readonly])');
    if (editableTA) return editableTA;

    // Priority 4: active element if inside editor
    const active = document.activeElement;
    if (active && active.closest && active.closest('.monaco-editor')) {
      return active;
    }

    // Priority 5: any textarea (last resort)
    return document.querySelector('.monaco-editor textarea');
  }

  /**
   * Check if focus is currently inside a Monaco editor.
   */
  function isFocusInEditor() {
    const active = document.activeElement;
    if (!active) return false;
    // Walk up shadow DOM if needed
    if (active.closest) return !!active.closest('.monaco-editor');
    // Fallback for elements without .closest
    let el = active;
    while (el) {
      if (el.classList && el.classList.contains('monaco-editor')) return true;
      el = el.parentElement;
    }
    return false;
  }

  // ── Trie Management ────────────────────────────────────────────────

  function rebuildTrie() {
    const code = getCodeFromDOM();
    if (!code) return;

    const hash = code.length + ':' + code.slice(0, 200) + code.slice(-200);
    if (hash === lastCodeHash) return;
    lastCodeHash = hash;

    trie.clear();

    const identifiers = Tokenizer.extractIdentifiers(code);
    trie.bulkInsert(identifiers);

    const lang = Tokenizer.detectLanguage();
    const keywords = Tokenizer.getKeywords(lang);
    trie.bulkInsert(keywords);
  }

  // ── Text Insertion ─────────────────────────────────────────────────

  /**
   * Insert the remaining suffix of a completion into Monaco's editor.
   *
   * Uses a synthetic ClipboardEvent('paste') with DataTransfer data.
   * Monaco reads event.clipboardData.getData('text/plain') from paste
   * events without checking isTrusted.
   *
   * The event MUST be dispatched on the correct input element
   * (div.inputarea[contenteditable], NOT textarea.ime-text-area).
   */
  function insertCompletion(prefix, word) {
    const suffix = word.slice(prefix.length);
    if (!suffix) return;

    const inputEl = getMonacoInput();
    if (!inputEl) {
      console.warn('[LC-IntelliSense] Cannot find Monaco input element');
      return;
    }

    isInserting = true;

    // Focus the correct element (skip readonly textarea)
    if (!inputEl.hasAttribute('readonly')) {
      inputEl.focus();
    }

    // Create paste event with our text
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', suffix);
      dt.setData('text/html', suffix);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true
      });

      inputEl.dispatchEvent(pasteEvent);

      // If paste wasn't handled, try execCommand as fallback
      if (!pasteEvent.defaultPrevented) {
        document.execCommand('insertText', false, suffix);
      }
    } catch (err) {
      // Last resort fallback
      try { document.execCommand('insertText', false, suffix); } catch (_) {}
    }

    // Reset state after insertion settles
    setTimeout(() => {
      isInserting = false;
      wordBuffer = '';
    }, 120);
  }

  // ── Autocomplete Logic ─────────────────────────────────────────────

  function triggerAutocomplete() {
    if (isInserting) return;

    const prefix = wordBuffer;

    if (!prefix || prefix.length < 2) {
      popup.hide();
      return;
    }

    // Rebuild trie from current visible code
    rebuildTrie();

    // Search for suggestions (case-sensitive prefix match)
    let suggestions = trie.search(prefix, 8);

    // Filter out exact match (user already typed the full word)
    suggestions = suggestions.filter(s => s.word !== prefix);

    if (suggestions.length === 0) {
      popup.hide();
      return;
    }

    // Get cursor position for popup placement
    const cursorPos = getCursorScreenPosition();
    if (!cursorPos) {
      popup.hide();
      return;
    }

    popup.show(suggestions, cursorPos, prefix);
  }

  function scheduleAutocomplete() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerAutocomplete, 80);
  }

  function acceptSuggestion() {
    if (!popup.visible) return false;
    const selected = popup.getSelected();
    if (!selected) return false;

    const prefix = wordBuffer;
    popup.hide();
    insertCompletion(prefix, selected.word);
    return true;
  }

  // ── Keystroke Tracking ─────────────────────────────────────────────

  /**
   * Single keydown handler on document (capture phase).
   * Only fires once per keystroke. Checks if focus is in Monaco.
   */
  function onKeyDown(e) {
    if (!isFocusInEditor()) return;
    if (isInserting) return;

    // ── Popup navigation (intercept before Monaco) ───────────
    if (popup.visible) {
      switch (e.key) {
        case 'Tab':
        case 'Enter':
          if (acceptSuggestion()) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
          return;

        case 'ArrowUp':
          popup.moveUp();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;

        case 'ArrowDown':
          popup.moveDown();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;

        case 'Escape':
          popup.hide();
          wordBuffer = '';
          e.preventDefault();
          e.stopPropagation();
          return;
      }
    }

    // ── Word buffer tracking ─────────────────────────────────
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (/[a-zA-Z_]/.test(e.key)) {
        wordBuffer += e.key;
        scheduleAutocomplete();
      } else if (/[0-9]/.test(e.key) && wordBuffer.length > 0) {
        wordBuffer += e.key;
        scheduleAutocomplete();
      } else {
        wordBuffer = '';
        popup.hide();
      }
    } else if (e.key === 'Backspace') {
      if (wordBuffer.length > 0) {
        wordBuffer = wordBuffer.slice(0, -1);
        if (wordBuffer.length >= 2) {
          scheduleAutocomplete();
        } else {
          popup.hide();
        }
      }
    } else if (e.key === 'Delete') {
      wordBuffer = '';
      popup.hide();
    } else if ([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown'
    ].includes(e.key)) {
      wordBuffer = '';
      popup.hide();
    }
    // Modifier-only keys (Shift, Ctrl, etc.) are ignored automatically
  }

  // ── Setup ──────────────────────────────────────────────────────────

  function waitForEditor() {
    return new Promise((resolve) => {
      const check = () => {
        const editorEl = document.querySelector('.monaco-editor');
        if (editorEl) {
          resolve(editorEl);
          return true;
        }
        return false;
      };

      if (check()) return;

      const observer = new MutationObserver(() => {
        if (check()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        const el = document.querySelector('.monaco-editor');
        if (el) resolve(el);
      }, 20000);
    });
  }

  function cleanup() {
    if (trieInterval) {
      clearInterval(trieInterval);
      trieInterval = null;
    }
    clearTimeout(debounceTimer);
    wordBuffer = '';
    lastCodeHash = '';
    trie.clear();
    popup.hide();
    initialized = false;
  }

  function attachListeners(editorEl) {
    // Single keydown handler on document, capture phase
    document.addEventListener('keydown', onKeyDown, true);

    // Click resets word buffer (user repositioned cursor)
    document.addEventListener('mousedown', (e) => {
      if (popup.el && popup.el.contains(e.target)) return;
      wordBuffer = '';
      popup.hide();
    });

    // Scroll hides popup
    editorEl.addEventListener('scroll', () => popup.hide(), true);
    const scrollable = editorEl.querySelector('.monaco-scrollable-element');
    if (scrollable) {
      scrollable.addEventListener('scroll', () => popup.hide(), true);
    }

    // Popup mouse-click acceptance
    popup.onAccept = (word) => {
      insertCompletion(wordBuffer, word);
    };
  }

  // ── Init ───────────────────────────────────────────────────────────

  async function init() {
    if (initialized) return;

    const editorEl = await waitForEditor();
    if (!editorEl) return;

    // Let Monaco fully initialize its internal state
    await new Promise(r => setTimeout(r, 1500));

    initialized = true;

    attachListeners(editorEl);

    // Initial trie build
    rebuildTrie();

    // Periodic trie rebuild (picks up new identifiers as user edits/scrolls)
    trieInterval = setInterval(rebuildTrie, 3000);

    console.log('[LC-IntelliSense] ✨ Ready');
  }

  // ── SPA Navigation ─────────────────────────────────────────────────

  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (location.href.includes('/problems/')) {
        cleanup();
        setTimeout(init, 2000);
      }
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Start
  init();
})();
