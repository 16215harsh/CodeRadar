/**
 * Autocomplete Popup — renders the suggestion UI near the cursor.
 * Handles keyboard navigation, selection, and dismissal.
 *
 * Supports two highlight modes:
 *  - Exact prefix: highlights the leading prefix block
 *  - Fuzzy match:  highlights individual scattered matched characters
 */

class AutocompletePopup {
  constructor() {
    this.el = null;
    this.items = [];
    this.selectedIndex = 0;
    this.visible = false;
    this.onAccept = null;
    this._create();
  }

  _create() {
    const existing = document.getElementById('coderadar-popup');
    if (existing) {
      this.el = existing;
      return;
    }

    this.el = document.createElement('div');
    this.el.id = 'coderadar-popup';
    this.el.className = 'coderadar-popup';
    this.el.setAttribute('role', 'listbox');
    this.el.setAttribute('aria-label', 'Autocomplete suggestions');
    document.body.appendChild(this.el);
  }

  /**
   * Show the popup with suggestions at the given screen position.
   * @param {Array<{word, frequency, indices, isFuzzy}>} suggestions
   * @param {{x: number, y: number}} position
   * @param {string} prefix
   */
  show(suggestions, position, prefix) {
    if (!suggestions || suggestions.length === 0) {
      this.hide();
      return;
    }

    this.items = suggestions;
    this.selectedIndex = 0;
    this.visible = true;

    this.el.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'lc-popup-header';
    header.innerHTML = `
      <span class="lc-popup-icon">⚡</span>
      <span class="lc-popup-title">CodeRadar</span>
      <span class="lc-popup-hint">Tab ↹ to accept</span>
    `;
    this.el.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'lc-popup-list';
    list.setAttribute('role', 'listbox');

    suggestions.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'lc-popup-item' + (index === 0 ? ' lc-popup-item--selected' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      li.dataset.index = index;

      const icon = this._getIcon(item.word);

      // Use scattered highlight for fuzzy, prefix highlight for exact
      const highlighted = item.isFuzzy
        ? this._highlightFuzzy(item.word, item.indices)
        : this._highlightMatch(item.word, prefix);

      // Show a ~ badge for fuzzy matches so users know it's not an exact prefix
      const fuzzyBadge = item.isFuzzy
        ? '<span class="lc-fuzzy-badge" title="Fuzzy match">~</span>'
        : '';

      li.innerHTML = `
        <span class="lc-item-icon">${icon}</span>
        <span class="lc-item-text">${highlighted}</span>
        ${fuzzyBadge}
        ${item.frequency > 1 ? `<span class="lc-item-freq">${item.frequency}×</span>` : ''}
      `;

      li.addEventListener('mousemove', () => {
        if (this.selectedIndex !== index) {
          this._selectIndex(index);
        }
      });
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.accept();
      });

      list.appendChild(li);
    });

    this.el.appendChild(list);
    this._position(position);
    this.el.classList.add('lc-popup--visible');
  }

  _position(pos) {
    const padding = 4;
    let top = pos.y + padding;
    let left = pos.x;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    this.el.style.top = '0px';
    this.el.style.left = '0px';
    this.el.style.visibility = 'hidden';
    this.el.classList.add('lc-popup--visible');

    const rect = this.el.getBoundingClientRect();
    const popupW = rect.width || 320;
    const popupH = rect.height || Math.min(this.items.length * 32 + 40, 300);

    this.el.style.visibility = '';

    if (left + popupW > viewportW - 10) left = viewportW - popupW - 10;
    if (left < 10) left = 10;

    if (top + popupH > viewportH - 10) top = pos.y - popupH - padding - 20;
    if (top < 10) top = 10;

    this.el.style.top = `${top}px`;
    this.el.style.left = `${left}px`;
  }

  _getIcon(word) {
    if (!word || word.length === 0) return '<span class="lc-icon lc-icon--var">V</span>';
    const firstChar = word[0];
    if (/[A-Z]/.test(firstChar) && firstChar !== '_') {
      return '<span class="lc-icon lc-icon--class">C</span>';
    }
    if (word.includes('_') || (word.length > 1 && word === word.toUpperCase())) {
      return '<span class="lc-icon lc-icon--const">K</span>';
    }
    return '<span class="lc-icon lc-icon--var">V</span>';
  }

  /**
   * Highlight exact prefix match — bolds the leading prefix block.
   * e.g. prefix="cou", word="count" → <strong>cou</strong>nt
   */
  _highlightMatch(word, prefix) {
    if (!prefix) return this._escapeHtml(word);
    const escaped = this._escapeHtml(word);
    const escapedPrefix = this._escapeHtml(prefix);
    const idx = escaped.toLowerCase().indexOf(escapedPrefix.toLowerCase());
    if (idx === -1) return escaped;
    return (
      escaped.slice(0, idx) +
      '<strong class="lc-match">' +
      escaped.slice(idx, idx + escapedPrefix.length) +
      '</strong>' +
      escaped.slice(idx + escapedPrefix.length)
    );
  }

  /**
   * Highlight fuzzy match — wraps each matched character individually.
   * e.g. word="count", indices=[0,3,4] → <strong>c</strong>ou<strong>nt</strong>
   *
   * Consecutive matched indices are grouped into a single <strong> for cleaner output.
   */
  _highlightFuzzy(word, indices) {
    if (!indices || indices.length === 0) return this._escapeHtml(word);

    const indexSet = new Set(indices);
    let result = '';
    let inMatch = false;

    for (let i = 0; i < word.length; i++) {
      const ch = this._escapeHtml(word[i]);
      if (indexSet.has(i)) {
        if (!inMatch) {
          result += '<strong class="lc-match lc-match--fuzzy">';
          inMatch = true;
        }
        result += ch;
      } else {
        if (inMatch) {
          result += '</strong>';
          inMatch = false;
        }
        result += ch;
      }
    }

    if (inMatch) result += '</strong>';
    return result;
  }

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  hide() {
    this.visible = false;
    if (this.el) this.el.classList.remove('lc-popup--visible');
    this.items = [];
    this.selectedIndex = 0;
  }

  moveUp() {
    if (!this.visible || this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    this._updateSelection();
  }

  moveDown() {
    if (!this.visible || this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this._updateSelection();
  }

  accept() {
    if (!this.visible || this.items.length === 0) return null;
    const selected = this.items[this.selectedIndex];
    this.hide();
    if (this.onAccept && selected) {
      // Pass the full item so the caller can read isFuzzy and other metadata
      this.onAccept(selected);
    }
    return selected ? selected.word : null;
  }

  getSelected() {
    if (!this.visible || this.items.length === 0) return null;
    if (this.selectedIndex >= this.items.length) this.selectedIndex = 0;
    return this.items[this.selectedIndex];
  }

  _selectIndex(index) {
    if (index >= 0 && index < this.items.length) {
      this.selectedIndex = index;
      this._updateSelection();
    }
  }

  _updateSelection() {
    const items = this.el.querySelectorAll('.lc-popup-item');
    items.forEach((item, i) => {
      if (i === this.selectedIndex) {
        item.classList.add('lc-popup-item--selected');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('lc-popup-item--selected');
        item.setAttribute('aria-selected', 'false');
      }
    });
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
  }
}

window.__codeRadar = window.__codeRadar || {};
window.__codeRadar.AutocompletePopup = AutocompletePopup;
