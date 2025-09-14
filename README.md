# DictionaRead 📖

A Chrome extension for quick dictionary lookup without breaking your reading flow.

## Features

- **Quick Lookup**: Select any word or phrase and press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows)
- **Smart Positioning**: Popup appears above your selection without blocking text
- **Adaptive Theming**: Automatically adjusts to light/dark page themes
- **Fallback Support**: If no definition is found, provides a Google search link
- **Toggle Control**: Enable/disable the extension via the popup panel

## Installation

### Development Setup

1. **Clone or download** this repository to your local machine

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** by toggling the switch in the top-right corner

4. **Click "Load unpacked"** and select the DictionaRead folder

5. **Pin the extension** to your toolbar for easy access

### Usage

1. **Select text** on any webpage
2. **Press the keyboard shortcut**:
   - Mac: `Cmd+Shift+L`
   - Windows/Linux: `Ctrl+Shift+L`
3. **View the definition** in the popup that appears above your selection
4. **Dismiss the popup** by:
   - Clicking the × button
   - Pressing the ESC key
   - Clicking outside the popup

### Extension Controls

Click the DictionaRead icon in your toolbar to:
- Toggle the extension ON/OFF
- View usage instructions
- See the keyboard shortcut for your platform

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **API**: Uses [dictionaryapi.dev](https://dictionaryapi.dev/) for definitions
- **Timeout**: 5-second timeout for API requests
- **Permissions**: 
  - `activeTab` - Access to current tab for text selection
  - `scripting` - Inject scripts to get selected text
  - `storage` - Save extension preferences
  - `commands` - Register keyboard shortcuts

## File Structure

```
DictionaRead/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script for popup rendering
├── popup.html            # Extension control panel
├── popup.js              # Control panel logic
├── styles.css            # Popup styling with adaptive themes
├── icons/                # Extension icons (placeholder)
└── README.md             # This file
```

## Development

### Testing

1. **Load the extension** in Chrome (see Installation steps)
2. **Test on various websites**:
   - News sites (BBC, CNN, etc.)
   - Academic papers
   - Blogs and articles
3. **Test edge cases**:
   - Very short selections (single characters)
   - Long selections (50+ characters)
   - Special characters and HTML entities
   - Network failures (offline mode)

### Debugging

#### Quick Debugging Steps

1. **Reload the Extension**
   - Go to `chrome://extensions/`
   - Find DictionaRead and click the refresh/reload button

2. **Open Developer Tools**
   - **Background Script Console**: 
     - Go to `chrome://extensions/`
     - Find DictionaRead → Click "Inspect views: background page"
   - **Content Script Console**:
     - Go to any webpage → Press F12 → Go to "Console" tab

3. **Test the Keyboard Shortcut**
   - Select some text on a webpage
   - Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows)
   - Check both consoles for log messages

#### What to Look For

**In Background Console:**
- `Command received: lookup-word` - Confirms shortcut is working
- `Lookup command triggered!` - Confirms our handler is running
- `Extension enabled status: true` - Confirms extension is enabled
- `Active tab: [URL]` - Shows which tab is active
- `Selected text: [your text]` - Shows what text was selected

**In Content Console:**
- `DictionaRead content script loaded and ready` - Confirms script is loaded
- `Content script received message: [message]` - Confirms message received
- `Showing loading popup for: [text]` - Confirms popup should appear

#### Common Issues & Solutions

**No logs in Background Console:**
- **Problem**: Keyboard shortcut not registered
- **Solution**: Check if another extension is using the same shortcut

**"No text selected" log:**
- **Problem**: Text selection not working
- **Solution**: Make sure you actually select text before pressing shortcut

**"Extension enabled status: false":**
- **Problem**: Extension is disabled
- **Solution**: Click the extension icon and toggle it ON

**Content script not receiving messages:**
- **Problem**: Content script not loaded on the page
- **Solution**: Refresh the webpage and try again

#### Expected Flow

When working correctly, you should see this sequence:

1. **Background Console**: `Command received: lookup-word`
2. **Background Console**: `Lookup command triggered!`
3. **Background Console**: `Extension enabled status: true`
4. **Background Console**: `Active tab: [URL]`
5. **Background Console**: `Selected text: [your text]`
6. **Content Console**: `Content script received message: {action: "showLoading", ...}`
7. **Content Console**: `Showing loading popup for: [text]`
8. **Background Console**: Network request to dictionary API
9. **Content Console**: `Content script received message: {action: "showDefinition", ...}`
10. **Content Console**: `Showing definition popup for: [text]`
11. **Visual**: Popup appears on the webpage

If any step is missing, that's where the problem is!

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ❌ Firefox (requires Manifest V2 conversion)

## Future Enhancements

- PDF support via pdf.js integration
- Lookup history in control panel
- Synonyms and pronunciation audio
- Screen reader accessibility improvements
- Definition length limits with "read more"

## License

This project is open source. Feel free to contribute or modify as needed.

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Ensure the extension is enabled in the popup panel
3. Try refreshing the webpage and testing again
4. Verify you have an active internet connection for API calls
