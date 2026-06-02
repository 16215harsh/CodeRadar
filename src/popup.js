/**
 * Autocomplete Popup — renders the suggestion UI near the cursor.
 * Handles keyboard navigation, selection, and dismissal.
 */

class AutocompletePopup {
  constructor() {
    this.el = null;
    this.items = [];
    this.selectedIndex = 0;
    this.visible = false;
    this.onAccept = null; // callback when a suggestion is accepted
    this._create();
  }

  /**
   * Create the popup DOM element.
   */
  _create() {
    // Guard against duplicate popups (SPA re-init)
    const existing = document.getElementById('lc-intellisense-popup');
    if (existing) {
      this.el = existing;
      return;
    }

    this.el = document.createElement('div');
    this.el.id = 'lc-intellisense-popup';
    this.el.className = 'lc-intellisense-popup';
    this.el.setAttribute('role', 'listbox');
    this.el.setAttribute('aria-label', 'Autocomplete suggestions');
    document.body.appendChild(this.el);
  }

  /**
   * Show the popup with suggestions at the given screen position.
   * @param {Array<{word: string, frequency: number}>} suggestions
   * @param {{x: number, y: number}} position - screen coordinates
   * @param {string} prefix - the typed prefix (for highlighting)
   */
  show(suggestions, position, prefix) {
    if (!suggestions || suggestions.length === 0) {
      this.hide();
      return;
    }

    this.items = suggestions;
    this.selectedIndex = 0;
    this.visible = true;

    // Build the list HTML
    this.el.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'lc-popup-header';
    header.innerHTML = `
      <span class="lc-popup-icon">⚡</span>
      <span class="lc-popup-title">IntelliSense</span>
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

      // Determine icon based on word characteristics
      const icon = this._getIcon(item.word);

      // Highlight the matching prefix
      const highlighted = this._highlightMatch(item.word, prefix);

      li.innerHTML = `
        <span class="lc-item-icon">${icon}</span>
        <span class="lc-item-text">${highlighted}</span>
        ${item.frequency > 1 ? `<span class="lc-item-freq">${item.frequency}×</span>` : ''}
      `;

      li.addEventListener('mouseenter', () => this._selectIndex(index));
      li.addEventListener('mousedown', (e) => {
        // Use mousedown instead of click to fire before the document
        // mousedown handler resets the word buffer
        e.preventDefault();
        e.stopPropagation();
        this.accept();
      });

      list.appendChild(li);
    });

    this.el.appendChild(list);

    // Position the popup
    this._position(position);
    this.el.classList.add('lc-popup--visible');
  }

  /**
   * Position the popup relative to the cursor, keeping it within viewport.
   * @param {{x: number, y: number}} pos
   */
  _position(pos) {
    const padding = 4;
    let top = pos.y + padding;
    let left = pos.x;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Use actual rendered dimensions when available, else estimate
    this.el.style.top = '0px';
    this.el.style.left = '0px';
    this.el.style.visibility = 'hidden';
    this.el.classList.add('lc-popup--visible');

    const rect = this.el.getBoundingClientRect();
    const popupW = rect.width || 320;
    const popupH = rect.height || Math.min(this.items.length * 32 + 40, 300);

    this.el.style.visibility = '';

    if (left + popupW > viewportW - 10) {
      left = viewportW - popupW - 10;
    }
    if (left < 10) left = 10;

    if (top + popupH > viewportH - 10) {
      // Show above the cursor instead
      top = pos.y - popupH - padding - 20;
    }
    if (top < 10) top = 10;

    this.el.style.top = `${top}px`;
    this.el.style.left = `${left}px`;
  }

  /**
   * Get an icon for the suggestion based on naming conventions.
   */
  _getIcon(word) {
    if (!word || word.length === 0) return '<span class="lc-icon lc-icon--var">V</span>';

    const firstChar = word[0];
    if (/[A-Z]/.test(firstChar) && firstChar !== '_') {
      // PascalCase → likely a class/type
      return '<span class="lc-icon lc-icon--class">C</span>';
    }
    if (word.includes('_') || (word.length > 1 && word === word.toUpperCase())) {
      // snake_case or SCREAMING_CASE → constant
      return '<span class="lc-icon lc-icon--const">K</span>';
    }
    // Default → variable/function
    return '<span class="lc-icon lc-icon--var">V</span>';
  }

  /**
   * Highlight the matching prefix in bold.
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

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Hide the popup.
   */
  hide() {
    this.visible = false;
    if (this.el) {
      this.el.classList.remove('lc-popup--visible');
    }
    this.items = [];
    this.selectedIndex = 0;
  }

  /**
   * Navigate selection up.
   */
  moveUp() {
    if (!this.visible || this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    this._updateSelection();
  }

  /**
   * Navigate selection down.
   */
  moveDown() {
    if (!this.visible || this.items.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this._updateSelection();
  }

  /**
   * Accept the currently selected suggestion.
   */
  accept() {
    if (!this.visible || this.items.length === 0) return null;
    const selected = this.items[this.selectedIndex];
    this.hide();
    if (this.onAccept && selected) {
      this.onAccept(selected.word);
    }
    return selected ? selected.word : null;
  }

  /**
   * Get the currently selected word (without accepting).
   */
  getSelected() {
    if (!this.visible || this.items.length === 0) return null;
    if (this.selectedIndex >= this.items.length) this.selectedIndex = 0;
    return this.items[this.selectedIndex];
  }

  /**
   * Select a specific index.
   */
  _selectIndex(index) {
    if (index >= 0 && index < this.items.length) {
      this.selectedIndex = index;
      this._updateSelection();
    }
  }

  /**
   * Update visual selection state.
   */
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

  /**
   * Destroy the popup element.
   */
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
  }
}

window.__leetcodeIntellisense = window.__leetcodeIntellisense || {};
window.__leetcodeIntellisense.AutocompletePopup = AutocompletePopup;
