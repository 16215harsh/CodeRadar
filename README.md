<div align="center">
  <img src="icon.png" alt="CodeRadar Logo" width="120" />
  <h1>CodeRadar</h1>
  <p><strong>A blazing fast, VS Code-style IntelliSense engine for LeetCode</strong></p>
</div>

---

**CodeRadar** is a Chrome Extension that injects a high-performance autocomplete engine directly into LeetCode's Monaco Editor. Built entirely from scratch without relying on heavy external dependencies, it tracks your keystrokes, infers variable types, and provides sub-millisecond fuzzy search suggestions to dramatically speed up your competitive programming workflow.

## ✨ Features

- 🚀 **Lightning Fast Fuzzy Search:** Built on a custom Trie data structure and an `fzf`-inspired scoring algorithm, CodeRadar matches scattered subsequences instantly (e.g., typing `cnt` matches `count`).
- 🧠 **Context-Aware Dot Completion:** Type `nums.` and CodeRadar immediately suggests `push_back`, `size`, or `sort`. The engine infers variable types using regex heuristics and real-time DOM parsing.
- 🌍 **Multi-Language Support:** Seamlessly supports **C++, Python, Java, and JavaScript**. The extension dynamically detects your current language from the LeetCode UI and swaps keyword dictionaries on the fly.
- ⚡ **VS Code Keybindings:** Fully supports standard IDE shortcuts (`Ctrl/Cmd + Space` to force trigger, `Tab/Enter` to accept, `Up/Down` arrows to navigate).
- 🛡️ **Zero Page Injections:** Operates entirely within isolated browser extension environments, bypassing strict Content Security Policies (CSP) by utilizing synthetic `InputEvent` dispatching to interface with the hidden editor buffers.

## 📦 Installation

Since this extension is in active development, it can be installed manually by loading it unpacked into Chrome:

1. Download or clone this repository:
   ```bash
   git clone https://github.com/16215harsh/CodeRadar.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button and select the `CodeRadar` directory you just cloned.
5. Open [LeetCode](https://leetcode.com) and start typing!

## 🛠️ Under the Hood

Building an autocomplete engine for a complex, web-based IDE like Monaco comes with unique challenges. Here is how CodeRadar solves them:

- **The Engine (`trie.js`):** Basic array filtering is too slow for real-time keystroke tracking. CodeRadar pre-computes keywords into a Trie and uses a custom greedy forward-scan algorithm to calculate match scores based on consecutive characters, camelCase boundaries, and word starts.
- **State Management (`content.js`):** Tracks cursor movements, backspaces, and editor focus using a robust state machine (`wordBuffer`).
- **Editor Interfacing:** Modern Monaco instances ignore untrusted keyboard events. To perform complex insertions (like deleting mismatched casing before pasting a full word), CodeRadar dispatches precise `InputEvent('beforeinput', { inputType: 'deleteContentBackward' })` events to reliably manipulate the hidden text area.

## 💻 Tech Stack

- **Vanilla JavaScript:** Zero heavy frameworks for maximum performance.
- **HTML/CSS:** Custom popup UI styled to match LeetCode's dark mode aesthetics.
- **Chrome Extensions API:** Manifest V3 compliant.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Upcoming features on the roadmap:
- [ ] Code Snippets (e.g. typing `fori` generates a full loop).
- [ ] Parameter/Signature hints (e.g. tooltip for `substr(pos, len)`).
- [ ] Custom user settings page.

## 📜 License

Distributed under the MIT License.
