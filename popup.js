/**
 * Popup control panel for DictionaRead extension
 * Handles the ON/OFF toggle switch and displays usage instructions
 */

// DOM elements
const toggleSwitch = document.getElementById('toggleSwitch');
const shortcutDisplay = document.getElementById('shortcutDisplay');

/**
 * Initialize the popup interface
 * Loads the current extension state and sets up event listeners
 */
async function initializePopup() {
  try {
    // Load current extension state
    const result = await chrome.storage.local.get(['extensionEnabled']);
    const isEnabled = result.extensionEnabled !== false; // Default to true
    
    // Update toggle switch state
    updateToggleSwitch(isEnabled);
    
    // Set up event listeners
    toggleSwitch.addEventListener('click', handleToggleClick);
    
    // Update shortcut display based on platform
    updateShortcutDisplay();
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    // Fallback to enabled state if there's an error
    updateToggleSwitch(true);
  }
}

/**
 * Updates the visual state of the toggle switch
 * @param {boolean} isEnabled - Whether the extension is currently enabled
 */
function updateToggleSwitch(isEnabled) {
  if (isEnabled) {
    toggleSwitch.classList.add('active');
  } else {
    toggleSwitch.classList.remove('active');
  }
}

/**
 * Handles toggle switch click events
 * Persists the new state to chrome.storage.local
 */
async function handleToggleClick() {
  try {
    const isCurrentlyEnabled = toggleSwitch.classList.contains('active');
    const newState = !isCurrentlyEnabled;
    
    // Update visual state immediately for better UX
    updateToggleSwitch(newState);
    
    // Persist the new state
    await chrome.storage.local.set({ extensionEnabled: newState });
    
    console.log(`Extension ${newState ? 'enabled' : 'disabled'}`);
    
  } catch (error) {
    console.error('Error toggling extension state:', error);
    // Revert visual state on error
    const result = await chrome.storage.local.get(['extensionEnabled']);
    const currentState = result.extensionEnabled !== false;
    updateToggleSwitch(currentState);
  }
}

/**
 * Updates the keyboard shortcut display based on the user's platform
 * Shows the appropriate shortcut for Mac vs Windows/Linux
 */
function updateShortcutDisplay() {
  // Detect if user is on Mac (Chrome on Mac reports 'MacIntel' or 'MacPPC')
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (isMac) {
    shortcutDisplay.textContent = 'Cmd+Shift+L';
  } else {
    shortcutDisplay.textContent = 'Ctrl+Shift+L';
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);
