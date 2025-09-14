# DictionaRead – PRD & Implementation Plan

## 📖 Problem Statement
Long-form readers (Economist, Aeon, Asterisk Magazine, eBooks) often face interruptions when encountering unfamiliar words or phrases.  
The current workflow — switching tabs to Google or dictionary sites — breaks reading flow, causes context loss, and wastes time.

---

## 🎯 Solution Overview
We will build a **Chrome Extension** called **DictionaRead**.  

### Core Functionality
- User selects any text on a webpage.  
- Presses `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows).  
- A **popup bubble** appears above the selection, showing the word/phrase meaning.  
- Meanings are fetched from [dictionaryapi.dev](https://dictionaryapi.dev/).  
- If no result is found, the bubble displays:  
  > "Sorry! We're unable to help with this, please review your selection or [click here](https://www.google.com/search?q=<selected_text>)."  

---

## 🔧 Technical Architecture

### 1. **Technologies & Languages**
- **Manifest V3 Chrome Extension**
- **JavaScript (ES6)** – core scripting
- **HTML + CSS** – for popup and bubble styling
- **dictionaryapi.dev** – dictionary API
- **Cursor + Node.js** – for local development tooling/testing

### 2. **Extension Components**
1. **manifest.json**  
   - Declares permissions, commands, content/background scripts.  
   - Registers keyboard shortcut `Cmd+Shift+L` / `Ctrl+Shift+L`.

2. **background.js**  
   - Listens for the shortcut event (`chrome.commands.onCommand`).  
   - Injects script into active tab to grab selected text.  
   - Fetches meaning from API with 5-second timeout mechanism.
   - Sends result to content script.

3. **content.js**  
   - Runs on all webpages.  
   - Receives dictionary result from background.  
   - Renders/removes popup bubble above selected text.  
   - Handles error fallback (Google search link).
   - Parses JSON response to display in elegant dictionary format.

4. **popup.html / popup.js**  
   - Minimal control panel when clicking extension icon.  
   - Contains:
     - Toggle **ON/OFF switch** (controls whether extension is active).
     - Display text: "Cmd+Shift+L (Mac) / Ctrl+Shift+L (Win)".

5. **styles.css**  
   - Bubble popup styling with adaptive contrast:  
     - Default: light gray background, black text (for white backgrounds).  
     - Alternate: white/very light background with dark text (for dark mode sites).  
   - Rounded corners, subtle shadow.
   - Cross icon (×) in top-right corner for dismissal.

---

## ⚙️ Implementation Steps

1. **Setup Project**
   - Create `manifest.json` with permissions:
     - `activeTab`
     - `scripting`
     - `storage`
     - `commands`
   - Register shortcut (`Cmd+Shift+L` / `Ctrl+Shift+L`).

2. **Popup Control Panel**
   - `popup.html`: toggle switch + instructions.  
   - `popup.js`: persists ON/OFF state in `chrome.storage.local`.

3. **Background Script**
   - Listens for command trigger.  
   - On trigger:
     - Check if extension is ON.
     - Inject script to capture selected text.  
     - Fetch meaning from `dictionaryapi.dev` with 5-second timeout.
     - Send result to content script.

4. **Content Script**
   - Creates/removes popup bubble near selection range.  
   - Displays meaning or fallback Google link.  
   - Handles positioning (above selected text).  
   - Auto-dismiss on outside click, ESC key, or cross icon click.
   - Shows loading state while fetching definition.

5. **Styling**
   - Contrast-sensitive popup:  
     - Detect background brightness of page (`getComputedStyle(document.body).backgroundColor`).  
     - Choose light or dark theme accordingly.  
   - Cross icon for manual dismissal.

6. **Edge Case Handling**
   - Empty selection → do nothing.  
   - Very short selections (single character) → show "no result" with Google fallback.
   - API timeout/no result → show fallback message + Google link.  
   - Multiple rapid triggers → remove old popup before creating new one.
   - Long selections (50+ characters) → limit to prevent API abuse.
   - Special characters/HTML entities → sanitize before API call.

---

## ✅ Test Plan

### 1. Functional Tests
- **Selection + Shortcut → Popup**  
  - Select a word, press shortcut → definition appears above selection.  
- **Toggle OFF**  
  - When extension is toggled off, shortcut should do nothing.  
- **No result case**  
  - Select a gibberish word → popup shows fallback message with clickable Google link.  
- **Cross-browser check**  
  - Works in Chrome, Edge, Brave.  
- **Network failure scenarios**
  - Test with offline mode or slow connections.
  - Verify timeout mechanism works correctly.

### 2. UI/UX Tests
- **Positioning**  
  - Popup appears above selection, not blocking text.  
- **Contrast**  
  - On light-themed site (Aeon) → gray popup with black text.  
  - On dark-themed site → white/light popup with dark text.  
- **Dismissal methods**
  - ESC key dismisses popup.
  - Cross icon dismisses popup.
  - Outside click dismisses popup.
- **Loading state**
  - Shows spinner or "Looking up..." text while fetching.

### 3. Performance Tests
- **Speed**: Dictionary response + popup render under 500ms on average network.  
- **Memory**: No lingering DOM elements after popup closes.  
- **API efficiency**: Debounced calls prevent rapid successive lookups.

### 4. Content Type Tests
- **Different sites**: Test on various content types (news, blogs, academic papers).
- **Cross-frame support**: Ensure extension works in iframe contexts.
- **Browser compatibility**: Test on different Chrome versions.

### 5. Edge Case Tests
- **Very short selections**: Single character selections show fallback.
- **Long selections**: 50+ character selections are handled appropriately.
- **Special characters**: HTML entities and special characters are sanitized.
- **Rapid successive lookups**: Debouncing prevents API spam.

---

## 🚀 Future Enhancements (not in v1)
- Support for PDFs (via `chrome-extension://` + pdf.js integration).  
- History of looked-up words (in control panel).  
- Synonyms + pronunciation audio.  
- Screen reader support (ARIA labels).
- Definition length limits with "read more" functionality.
