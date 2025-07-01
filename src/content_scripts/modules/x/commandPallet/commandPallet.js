import { api, LightningElement, track } from 'lwc';
import MiniSearch from 'minisearch';

export default class CommandPallet extends LightningElement {
  static renderMode = 'light';

  searchTerm = '';
  /**
   * Fuzzy search engine instance
   */
  /**
   * Fuzzy search engine instance
   * @type {MiniSearch}
   */
  miniSearch; // Will be initialized in the commands setter
  @track filteredCommands = [];
  /**
   * Index of the currently highlighted command in filteredCommands
   */
  @track selectedIndex = 0;
  _didFocus = false;
  _lastSearchTerm = '';

  _commands = [];

  @api
  get commands() {
    return this._commands;
  }

  set commands(value) {
    this._commands = Array.isArray(value) ? value : [];

    // Initialize MiniSearch and add documents
    // Fields to index for full-text search: 'label' and 'description'
    // Fields to return with search results: all relevant fields to reconstruct the original command
    this.miniSearch = new MiniSearch({
      fields: ['label'],
      storeFields: ['id'],
    });
    this.miniSearch.addAll(this._commands);

    this.filteredCommands = [...this._commands];
    this.selectedIndex = 0;
  }

  /**
   * Computed array of objects for rendering, including highlight flag
   * @returns {{ cmd: any, idx: number, isSelected: boolean }[]}
   */
  get items() {
    return this.filteredCommands.map((cmd, idx) => ({
      cmd,
      idx,
      isSelected: idx === this.selectedIndex,
    }));
  }

  renderedCallback() {
    if (!this._didFocus) {
      const inp = this.refs.input;
      inp?.focus();
      this._didFocus = true;
    }
  }

  /**
   * Handle filtering of commands based on fuzzy search term.
   * Limits results to top 6 matches.
   * @param {InputEvent} event
   */
  handleInput(event) {
    const searchTerm = event.target.value;

    if (searchTerm) {
      // Perform search using MiniSearch
      const results = this.miniSearch.search(searchTerm, {
        prefix: true, // Enable prefix matching
        fuzzy: false, // Enable fuzzy matching with a tolerance (adjust as needed)
        tokenize: (text) => text.split(/( > )| /g),
      });

      // Map MiniSearch results back to the original command objects
      // Use the temporary __minisearch_id to find the original command from our _commands array.
      // Map MiniSearch results back to the original command objects
      // Use the temporary __miniSearchId to find the original command from our _commands array.
      const mappedResults = results.map((result) =>
        this._commands.find((cmd) => cmd.id === result.id)
      );
      this.filteredCommands = mappedResults.filter(Boolean); // Ensure no undefined results if a match isn\'t found
    } else {
      // If search term is empty, display all commands
      this.filteredCommands = [...this.commands];
    }
    this.selectedIndex = 0;
    this._lastSearchTerm = searchTerm; // Retain for potential future use or context
  }

  /**
   * Handle key navigation (arrows, enter) on the input field.
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveSelection(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveSelection(-1);
        break;
      case 'Enter':
        event.preventDefault();
        this.executeSelection(event.shiftKey, event.ctrlKey || event.metaKey);
        break;
      default:
        break;
    }
  }

  /**
   * Move the highlighted index by delta and scroll into view.
   * @param {number} delta
   */
  moveSelection(delta) {
    const len = this.filteredCommands.length;
    if (len === 0) {
      return;
    }
    let idx = this.selectedIndex + delta;
    idx = Math.max(0, Math.min(idx, len - 1));
    this.selectedIndex = idx;
    this._scrollIntoView(idx);
  }

  /**
   * Scroll the list item at index into view.
   * @param {number} idx
   */
  _scrollIntoView(idx) {
    const items = this.querySelectorAll('li[data-index]');
    const el = items[idx];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Execute the currently highlighted command.
   * @param {boolean} shiftKey
   * @param {boolean} ctrlKey
   */
  executeSelection(shiftKey, ctrlKey) {
    const openInNewTab = shiftKey || ctrlKey;
    const itemEl = this.querySelector(
      'x-command-item[data-highlighted="true"]'
    );
    if (itemEl && typeof itemEl.select === 'function') {
      itemEl.select(openInNewTab);
    }
  }

  /**
   * Handle mouse hover to update highlighted index.
   * @param {MouseEvent} event
   */
  handleMouseOver(event) {
    const idx = Number(event.currentTarget.dataset.index);
    if (!isNaN(idx)) {
      this.selectedIndex = idx;
    }
  }
}
