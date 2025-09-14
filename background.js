/**
 * Background service worker for DictionaRead extension
 * Handles keyboard shortcuts, text selection, and dictionary API calls
 */

// Dictionary API configuration
const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const API_TIMEOUT = 5000; // 5 seconds timeout

/**
 * Main command handler for the keyboard shortcut
 * Listens for the Cmd+Shift+L / Ctrl+Shift+L command
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  
  if (command === 'lookup-word') {
    console.log('Lookup command triggered!');
    
    try {
      // Check if extension is enabled
      const result = await chrome.storage.local.get(['extensionEnabled']);
      const isEnabled = result.extensionEnabled !== false; // Default to true
      
      console.log('Extension enabled status:', isEnabled);
      
      if (!isEnabled) {
        console.log('DictionaRead is disabled');
        return;
      }
      
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      console.log('Active tab:', tab?.url);
      
      if (!tab) {
        console.error('No active tab found');
        return;
      }
      
      // Inject script to get selected text
      const selectedText = await getSelectedText(tab.id);
      
      console.log('Selected text:', selectedText);
      
      if (!selectedText || selectedText.trim().length === 0) {
        console.log('No text selected');
        return;
      }
      
      // Validate selection length (prevent API abuse)
      if (selectedText.length > 50) {
        console.log('Selection too long, limiting to 50 characters');
        selectedText = selectedText.substring(0, 50);
      }
      
      // Sanitize the text (remove HTML entities and special characters)
      const sanitizedText = sanitizeText(selectedText);
      
      if (sanitizedText.length < 1) {
        console.log('No valid text after sanitization');
        return;
      }
      
      // Show loading state in content script
      await sendMessageToContentScript(tab.id, {
        action: 'showLoading',
        selectedText: sanitizedText
      });
      
      // Fetch dictionary definition
      const definition = await fetchDictionaryDefinition(sanitizedText);
      
      // Send result to content script
      await sendMessageToContentScript(tab.id, {
        action: 'showDefinition',
        selectedText: sanitizedText,
        definition: definition
      });
      
    } catch (error) {
      console.error('Error in command handler:', error);
      
      // Try to send error to content script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          await sendMessageToContentScript(tab.id, {
            action: 'showError',
            error: 'Failed to fetch definition. Please try again.'
          });
        }
      } catch (sendError) {
        console.error('Error sending error message to content script:', sendError);
      }
    }
  }
});

/**
 * Safely sends a message to a content script with proper error handling
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @returns {Promise<boolean>} True if message was sent successfully
 */
async function sendMessageToContentScript(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch (error) {
    // If content script is not ready, inject it first
    if (error.message.includes('Could not establish connection') || 
        error.message.includes('Receiving end does not exist')) {
      
      try {
        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        
        // Wait a moment for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try sending the message again
        await chrome.tabs.sendMessage(tabId, message);
        return true;
      } catch (retryError) {
        console.error('Failed to inject content script or send message:', retryError);
        return false;
      }
    }
    
    console.error('Error sending message to content script:', error);
    return false;
  }
}

/**
 * Injects a script into the active tab to get the currently selected text
 * @param {number} tabId - The ID of the tab to inject the script into
 * @returns {Promise<string>} The selected text
 */
async function getSelectedText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Get the current selection
        const selection = window.getSelection();
        return selection.toString().trim();
      }
    });
    
    return results[0]?.result || '';
  } catch (error) {
    console.error('Error getting selected text:', error);
    return '';
  }
}

/**
 * Sanitizes text by removing HTML entities and special characters
 * @param {string} text - The text to sanitize
 * @returns {string} The sanitized text
 */
function sanitizeText(text) {
  return text
    .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
    .replace(/[^\w\s'-]/g, '') // Keep only word characters, spaces, hyphens, and apostrophes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Fetches dictionary definition from the API with timeout handling
 * @param {string} word - The word or phrase to look up
 * @returns {Promise<Object>} The definition result or error object
 */
async function fetchDictionaryDefinition(word) {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API timeout')), API_TIMEOUT);
    });
    
    // Create the API request promise
    const apiPromise = fetch(`${DICTIONARY_API_BASE}${encodeURIComponent(word)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
    
    // Race between API call and timeout
    const result = await Promise.race([apiPromise, timeoutPromise]);
    
    // Process the API response
    if (Array.isArray(result) && result.length > 0) {
      return {
        success: true,
        data: result[0], // Take the first result
        word: word
      };
    } else {
      return {
        success: false,
        error: 'No definition found',
        word: word
      };
    }
    
  } catch (error) {
    console.error('Error fetching dictionary definition:', error);
    
    return {
      success: false,
      error: error.message === 'API timeout' ? 'Request timed out' : 'Failed to fetch definition',
      word: word
    };
  }
}

/**
 * Handles extension installation/update
 * Sets default extension state to enabled
 */
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Set default extension state
    await chrome.storage.local.set({ extensionEnabled: true });
    console.log('DictionaRead extension installed/updated');
  } catch (error) {
    console.error('Error setting default extension state:', error);
  }
});
