# DictionaRead Setup Instructions

## Quick Start

1. **Open Chrome** and go to `chrome://extensions/`

2. **Enable Developer Mode** (toggle in top-right corner)

3. **Click "Load unpacked"** and select the `DictionaRead` folder

4. **Pin the extension** to your toolbar (click the puzzle piece icon, then pin DictionaRead)

5. **Test the extension**:
   - Open `test-page.html` in a new tab
   - Select any word or phrase
   - Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows)

## File Structure

```
DictionaRead/
├── manifest.json          ✅ Extension configuration
├── background.js          ✅ Service worker (API calls, shortcuts)
├── content.js            ✅ Content script (popup rendering)
├── popup.html            ✅ Control panel UI
├── popup.js              ✅ Control panel logic
├── styles.css            ✅ Popup styling
├── test-page.html        ✅ Testing page
├── README.md             ✅ Documentation
├── setup-instructions.md ✅ This file
└── icons/                ⚠️  Placeholder icons
    ├── icon.svg          ✅ SVG template
    └── README.md         ✅ Icon instructions
```

## Testing Checklist

### ✅ Basic Functionality
- [ ] Extension loads without errors
- [ ] Popup control panel works (toggle ON/OFF)
- [ ] Keyboard shortcut triggers lookup
- [ ] Popup appears above selected text
- [ ] Definition displays correctly

### ✅ User Experience
- [ ] Loading state shows while fetching
- [ ] ESC key dismisses popup
- [ ] Cross (×) button dismisses popup
- [ ] Click outside dismisses popup
- [ ] Adaptive theming works (light/dark)

### ✅ Edge Cases
- [ ] Empty selection does nothing
- [ ] Single character shows fallback
- [ ] Long text (50+ chars) is truncated
- [ ] Special characters are sanitized
- [ ] Non-existent words show Google fallback
- [ ] API timeout shows fallback

### ✅ Error Handling
- [ ] Network failure shows fallback
- [ ] API errors are handled gracefully
- [ ] Extension works when disabled
- [ ] No console errors during normal use

## Troubleshooting

### Extension Won't Load
- Check that all files are in the correct directory
- Verify `manifest.json` syntax is valid
- Look for errors in `chrome://extensions/`

### Keyboard Shortcut Not Working
- Ensure extension is enabled in popup panel
- Check if another extension is using the same shortcut
- Try refreshing the page and testing again

### Popup Not Appearing
- Check browser console for JavaScript errors
- Verify you have text selected before pressing shortcut
- Test on different websites

### API Issues
- Check internet connection
- Verify `dictionaryapi.dev` is accessible
- Test with simple words first

## Development Notes

- **Icons**: Currently using placeholder icons. Replace with proper 16x16, 48x48, and 128x128 PNG files
- **API**: Using free dictionaryapi.dev (no API key required)
- **Permissions**: Minimal permissions for security
- **Manifest V3**: Latest Chrome extension standard

## Next Steps

1. Test thoroughly on various websites
2. Create proper icon files
3. Consider publishing to Chrome Web Store
4. Add features from "Future Enhancements" list

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify extension is enabled
3. Test with the provided test page
4. Check network connectivity for API calls
