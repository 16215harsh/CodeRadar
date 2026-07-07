

(function () {
  'use strict';

  const { Trie }              = window.__codeRadar;
  const { Tokenizer }         = window.__codeRadar;
  const { AutocompletePopup } = window.__codeRadar;

  const trie  = new Trie();
  const popup = new AutocompletePopup();

  let wordBuffer   = '';     
  let dotMode      = false;  
  let dotContext   = '';     
  let debounceTimer = null;
  let lastCodeHash  = '';
  let isInserting   = false;
  let trieInterval  = null;
  let initialized   = false;
  let cachedLang    = null;  
  let lastWord      = '';

  let _onKeyDown   = null;
  let _onMouseDown = null;

  function getCodeFromDOM() {
    const lines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    if (!lines.length) return '';
    return Array.from(lines).map(l => l.textContent || '').join('\n');
  }

  function getCursorScreenPosition() {
    const cursor =
      document.querySelector('.monaco-editor .cursor.monaco-mouse-cursor-text') ||
      document.querySelector('.monaco-editor .cursors-layer .cursor') ||
      document.querySelector('.monaco-editor .cursor');
    if (!cursor) return null;
    const rect = cursor.getBoundingClientRect();
    if (rect.height === 0 && rect.width === 0) return null;
    return { x: rect.left, y: rect.top + rect.height };
  }

  function getMonacoInput() {
    return (
      document.querySelector('.monaco-editor .inputarea[contenteditable="true"]') ||
      document.querySelector('.monaco-editor [contenteditable="true"].inputarea') ||
      document.querySelector('.monaco-editor [contenteditable="true"]') ||
      document.querySelector('.monaco-editor textarea:not([readonly])') ||
      (() => {
        const a = document.activeElement;
        return (a && a.closest && a.closest('.monaco-editor')) ? a : null;
      })() ||
      document.querySelector('.monaco-editor textarea')
    );
  }

  function isFocusInEditor() {
    const active = document.activeElement;
    if (!active) return false;
    if (active.closest) return !!active.closest('.monaco-editor');
    let el = active;
    while (el) {
      if (el.classList && el.classList.contains('monaco-editor')) return true;
      el = el.parentElement;
    }
    return false;
  }

  function getLanguage() {
    if (!cachedLang) cachedLang = Tokenizer.detectLanguage();
    return cachedLang;
  }

  function rebuildTrie() {
    if (document.hidden) return;   

    const code = getCodeFromDOM();
    if (!code) return;

    const hash = code.length + ':' + code.slice(0, 150) + code.slice(-150);
    if (hash === lastCodeHash) return;
    lastCodeHash = hash;

    trie.clear();
    cachedLang = null;  

    trie.bulkInsert(Tokenizer.extractIdentifiers(code));
    trie.bulkInsert(Tokenizer.getKeywords(getLanguage()));
  }

  function _doPaste(inputEl, text) {
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      dt.setData('text/html', text);
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      inputEl.dispatchEvent(ev);
      if (!ev.defaultPrevented) document.execCommand('insertText', false, text);
    } catch (_) {
      try { document.execCommand('insertText', false, text); } catch (__) {}
    }
  }

  function insertCompletion(prefix, word, isFuzzy = false) {
    const inputEl = getMonacoInput();
    if (!inputEl) { console.warn('[CodeRadar] Monaco input not found'); return; }

    isInserting = true;
    if (!inputEl.hasAttribute('readonly')) inputEl.focus();

    const needsFullReplace = prefix.length > 0 && (isFuzzy || !word.startsWith(prefix));

    if (needsFullReplace) {
      for (let i = 0; i < prefix.length; i++) {
        
        const kd = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8, bubbles: true, cancelable: true });
        kd._codeRadar = true;
        inputEl.dispatchEvent(kd);

        inputEl.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }));
        inputEl.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
        
        const ku = new KeyboardEvent('keyup', { key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8, bubbles: true, cancelable: true });
        ku._codeRadar = true;
        inputEl.dispatchEvent(ku);
      }
      const delay = Math.max(60, prefix.length * 18);
      setTimeout(() => {
        _doPaste(inputEl, word);
        setTimeout(() => { isInserting = false; resetBuffer(); }, 120);
      }, delay);
    } else {
      const suffix = word.slice(prefix.length);
      if (!suffix) { isInserting = false; return; }
      _doPaste(inputEl, suffix);
      setTimeout(() => { isInserting = false; resetBuffer(); }, 120);
    }
  }

  function resetBuffer(explicitLastWord) {
    if (typeof explicitLastWord === 'string') {
      lastWord = explicitLastWord;
    } else if (wordBuffer && /^[a-zA-Z_]\w*$/.test(wordBuffer)) {
      lastWord = wordBuffer;
    }
    wordBuffer  = '';
    dotMode     = false;
    dotContext  = '';
  }

  function filterMethods(methods, typed) {
    if (!methods || methods.length === 0) return [];

    const lower = (typed || '').toLowerCase();

    if (!lower) {
      
      return methods.slice(0, 10).map(m => ({
        word: m, frequency: 1, indices: [], isFuzzy: false, score: 0
      }));
    }

    const exact   = [];
    const fuzzy   = [];

    for (const m of methods) {
      const lm = m.toLowerCase();

      if (lm.startsWith(lower)) {
        exact.push({
          word: m, frequency: 1, isFuzzy: false, score: 1000 - m.length,
          indices: Array.from({ length: lower.length }, (_, i) => i)
        });
        continue;
      }

      const indices = [];
      let pi = 0;
      for (let i = 0; i < lm.length && pi < lower.length; i++) {
        if (lm[i] === lower[pi]) { indices.push(i); pi++; }
      }
      if (pi === lower.length) {
        fuzzy.push({ word: m, frequency: 1, isFuzzy: true, score: 500 - m.length, indices });
      }
    }

    exact.sort((a, b) => b.score - a.score);
    fuzzy.sort((a, b) => b.score - a.score);
    return [...exact, ...fuzzy].slice(0, 8);
  }

  function triggerDotCompletion() {
    const lang    = getLanguage();
    const code    = getCodeFromDOM();
    const type    = Tokenizer.inferType(dotContext, code, lang);
    const methods = type
      ? Tokenizer.getMethodsForType(type, lang)
      : Tokenizer.getAllMethods(lang);

    const suggestions = filterMethods(methods, wordBuffer);
    if (suggestions.length === 0) { popup.hide(); return; }

    const pos = getCursorScreenPosition();
    if (!pos) { popup.hide(); return; }

    popup.show(suggestions, pos, wordBuffer);
  }

  function triggerAutocomplete() {
    if (isInserting) return;

    if (dotMode) {
      triggerDotCompletion();
      return;
    }

    const prefix = wordBuffer;
    if (!prefix || prefix.length < 2) { popup.hide(); return; }

    rebuildTrie();

    let exactResults = trie.search(prefix, 8);
    let fuzzyResults = trie.fuzzySearch(prefix, 8);

    const lang = getLanguage();
    const boosts = Tokenizer.getMarkovBoosts(lang, lastWord);
    
    if (boosts.length > 0) {
      exactResults = exactResults.map(r => boosts.includes(r.word) ? { ...r, score: r.score + 500 } : r);
      fuzzyResults = fuzzyResults.map(r => boosts.includes(r.word) ? { ...r, score: r.score + 500 } : r);
      exactResults.sort((a, b) => b.score - a.score);
      fuzzyResults.sort((a, b) => b.score - a.score);
    }

    const seen      = new Set(exactResults.map(r => r.word));
    const fuzzyOnly = fuzzyResults.filter(r => !seen.has(r.word));
    let suggestions = [...exactResults, ...fuzzyOnly]
      .slice(0, 8)
      .filter(s => s.word !== prefix);

    if (suggestions.length === 0) { popup.hide(); return; }

    const pos = getCursorScreenPosition();
    if (!pos) { popup.hide(); return; }

    popup.show(suggestions, pos, prefix);
  }

  function forceAutocomplete() {
    if (isInserting) return;

    if (dotMode) { triggerDotCompletion(); return; }

    const prefix = wordBuffer;

    if (!prefix || prefix.length < 1) { popup.hide(); return; }

    rebuildTrie();

    let exactResults = trie.search(prefix, 8);
    let fuzzyResults = trie.fuzzySearch(prefix, 8);

    const lang = getLanguage();
    const boosts = Tokenizer.getMarkovBoosts(lang, lastWord);
    
    if (boosts.length > 0) {
      exactResults = exactResults.map(r => boosts.includes(r.word) ? { ...r, score: r.score + 500 } : r);
      fuzzyResults = fuzzyResults.map(r => boosts.includes(r.word) ? { ...r, score: r.score + 500 } : r);
      exactResults.sort((a, b) => b.score - a.score);
      fuzzyResults.sort((a, b) => b.score - a.score);
    }

    const seen      = new Set(exactResults.map(r => r.word));
    const fuzzyOnly = fuzzyResults.filter(r => !seen.has(r.word));
    let suggestions = [...exactResults, ...fuzzyOnly]
      .slice(0, 8)
      .filter(s => s.word !== prefix);

    if (suggestions.length === 0) { popup.hide(); return; }

    const pos = getCursorScreenPosition();
    if (!pos) { popup.hide(); return; }

    popup.show(suggestions, pos, prefix);
  }

  function scheduleAutocomplete(delay = 80) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerAutocomplete, delay);
  }

  function acceptSuggestion() {
    if (!popup.visible) return false;
    const selected = popup.getSelected();
    if (!selected) return false;

    const prefix = wordBuffer;  
    popup.hide();
    
    // Set lastWord to the accepted suggestion synchronously and clear wordBuffer 
    // so delayed resetBuffer doesn't overwrite it.
    lastWord = selected.word;
    wordBuffer = '';
    
    insertCompletion(prefix, selected.word, selected.isFuzzy === true);
    return true;
  }

  function onKeyDown(e) {
    
    if (e._codeRadar) return;
    if (!isFocusInEditor()) return;
    if (isInserting) return;

    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      forceAutocomplete();
      return;
    }

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
          resetBuffer();
          e.preventDefault();
          e.stopPropagation();
          return;
      }
    }

    if (e.key === '.' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      
      if (wordBuffer.length >= 1) {
        dotContext = wordBuffer;
        dotMode    = true;
        wordBuffer = '';
        
        scheduleAutocomplete(120);
      } else {
        
        resetBuffer();
        popup.hide();
      }
      return;  
    }

    if (dotMode && e.key.length === 1) {
      if (/[\s,;(){}[\]<>=+\-*/&|^!%]/.test(e.key)) {
        resetBuffer();
        popup.hide();
        return;
      }
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (/[a-zA-Z_]/.test(e.key)) {
        wordBuffer += e.key;
        scheduleAutocomplete();
      } else if (/[0-9]/.test(e.key) && wordBuffer.length > 0) {
        wordBuffer += e.key;
        scheduleAutocomplete();
      } else {
        
        resetBuffer();
        popup.hide();
      }
      return;
    }

    if (e.key === 'Backspace') {
      if (wordBuffer.length > 0) {
        wordBuffer = wordBuffer.slice(0, -1);
        if (dotMode) {
          
          scheduleAutocomplete(40);
        } else if (wordBuffer.length >= 2) {
          scheduleAutocomplete();
        } else {
          popup.hide();
        }
      } else if (dotMode) {
        
        wordBuffer = dotContext;
        dotMode = false;
        dotContext = '';
        popup.hide();
        if (wordBuffer.length >= 2) scheduleAutocomplete();
      }
      return;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
         'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
      resetBuffer();
      popup.hide();
    }
  }

  function waitForEditor() {
    return new Promise(resolve => {
      const check = () => {
        const el = document.querySelector('.monaco-editor');
        if (el) { resolve(el); return true; }
        return false;
      };
      if (check()) return;
      const obs = new MutationObserver(() => { if (check()) obs.disconnect(); });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        obs.disconnect();
        const el = document.querySelector('.monaco-editor');
        if (el) resolve(el);
      }, 20000);
    });
  }

  function cleanup() {
    
    if (_onKeyDown)   { document.removeEventListener('keydown',   _onKeyDown,   true); _onKeyDown   = null; }
    if (_onMouseDown) { document.removeEventListener('mousedown', _onMouseDown, false); _onMouseDown = null; }

    if (trieInterval) { clearInterval(trieInterval); trieInterval = null; }
    clearTimeout(debounceTimer);

    resetBuffer();
    lastCodeHash = '';
    cachedLang   = null;
    trie.clear();
    popup.hide();
    initialized = false;
  }

  function attachListeners(editorEl) {
    
    if (_onKeyDown)   document.removeEventListener('keydown',   _onKeyDown,   true);
    if (_onMouseDown) document.removeEventListener('mousedown', _onMouseDown, false);

    _onKeyDown   = onKeyDown;
    _onMouseDown = (e) => {
      if (popup.el && popup.el.contains(e.target)) return;
      resetBuffer();
      popup.hide();
    };

    document.addEventListener('keydown',   _onKeyDown,   true);
    document.addEventListener('mousedown', _onMouseDown, false);

    const hideOnScroll = () => popup.hide();
    editorEl.addEventListener('scroll', hideOnScroll, true);
    const scrollable = editorEl.querySelector('.monaco-scrollable-element');
    if (scrollable) scrollable.addEventListener('scroll', hideOnScroll, true);

    popup.onAccept = (item) => {
      const prefix = wordBuffer;
      insertCompletion(prefix, item.word, item.isFuzzy === true);
    };

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && initialized) rebuildTrie();
    });
  }

  async function init() {
    if (initialized) return;

    const editorEl = await waitForEditor();
    if (!editorEl) return;

    await new Promise(r => setTimeout(r, 1200));

    initialized = true;
    attachListeners(editorEl);
    rebuildTrie();
    trieInterval = setInterval(rebuildTrie, 3000);

    console.log('[CodeRadar] ✨ Ready — Ctrl+Space to force suggestions, type "." for method hints');
  }

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (location.href.includes('/problems/')) {
        cleanup();
        setTimeout(init, 2000);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  init();
})();
