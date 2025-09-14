/**
 * Content script for DictionaRead extension
 * Handles popup rendering, positioning, and user interactions
 */

// Global variables for popup management
let currentPopup = null;
let currentSelection = null;
let isPopupVisible = false;

/**
 * Message listener for communication with background script
 * Handles different actions: showLoading, showDefinition, showError
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  try {
    switch (message.action) {
      case 'showLoading':
        console.log('Showing loading popup for:', message.selectedText);
        showLoadingPopup(message.selectedText);
        break;
      case 'showDefinition':
        console.log('Showing definition popup for:', message.selectedText);
        showDefinitionPopup(message.selectedText, message.definition);
        break;
      case 'showError':
        console.log('Showing error popup:', message.error);
        showErrorPopup(message.error);
        break;
      default:
        console.log('Unknown message action:', message.action);
    }
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error handling message in content script:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});

/**
 * Shows a loading popup while fetching the definition
 * @param {string} selectedText - The text being looked up
 */
function showLoadingPopup(selectedText) {
  // Remove any existing popup
  removeCurrentPopup();
  
  // Get current selection position
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  currentSelection = selection.getRangeAt(0);
  
  // Create loading popup
  currentPopup = createPopupElement();
  currentPopup.innerHTML = `
    <div class="dictionaread-popup-content">
      <div class="dictionaread-loading">
        <div class="dictionaread-spinner"></div>
        <span>Looking up "${selectedText}"...</span>
      </div>
      <button class="dictionaread-close" aria-label="Close">×</button>
    </div>
  `;
  
  // Position and show popup
  positionPopup(currentPopup, currentSelection);
  document.body.appendChild(currentPopup);
  isPopupVisible = true;
  
  // Add event listeners
  setupPopupEventListeners(currentPopup);
}

/**
 * Shows the definition popup with the fetched data
 * @param {string} selectedText - The original selected text
 * @param {Object} definition - The definition result from the API
 */
function showDefinitionPopup(selectedText, definition) {
  // Remove any existing popup
  removeCurrentPopup();
  
  if (!definition.success) {
    // Show error/fallback popup
    showErrorPopup(definition.error, selectedText);
    return;
  }
  
  // Get current selection position
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  currentSelection = selection.getRangeAt(0);
  
  // Create definition popup
  currentPopup = createPopupElement();
  currentPopup.innerHTML = `
    <div class="dictionaread-popup-content">
      <div class="dictionaread-definition">
        <h3 class="dictionaread-word">${definition.data.word}</h3>
        <div class="dictionaread-meaning">
          ${formatDefinition(definition.data)}
        </div>
      </div>
      <button class="dictionaread-close" aria-label="Close">×</button>
    </div>
  `;
  
  // Position and show popup
  positionPopup(currentPopup, currentSelection);
  document.body.appendChild(currentPopup);
  isPopupVisible = true;
  
  // Add event listeners
  setupPopupEventListeners(currentPopup);
}

/**
 * Shows an error popup with fallback to Google search
 * @param {string} error - The error message
 * @param {string} selectedText - The original selected text (optional)
 */
function showErrorPopup(error, selectedText = '') {
  // Remove any existing popup
  removeCurrentPopup();
  
  // Get current selection position
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  currentSelection = selection.getRangeAt(0);
  
  // Create error popup
  currentPopup = createPopupElement();
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
  
  currentPopup.innerHTML = `
    <div class="dictionaread-popup-content">
      <div class="dictionaread-error">
        <p>Sorry! We're unable to help with this, please review your selection or <a href="${googleSearchUrl}" target="_blank" rel="noopener noreferrer">click here</a>.</p>
      </div>
      <button class="dictionaread-close" aria-label="Close">×</button>
    </div>
  `;
  
  // Position and show popup
  positionPopup(currentPopup, currentSelection);
  document.body.appendChild(currentPopup);
  isPopupVisible = true;
  
  // Add event listeners
  setupPopupEventListeners(currentPopup);
}

/**
 * Creates the base popup element with proper styling
 * @returns {HTMLElement} The popup element
 */
function createPopupElement() {
  const popup = document.createElement('div');
  popup.className = 'dictionaread-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Dictionary definition');
  
  // Detect page theme for adaptive styling
  const isDarkTheme = detectDarkTheme();
  if (isDarkTheme) {
    popup.classList.add('dictionaread-dark');
  }
  
  return popup;
}

/**
 * Detects if the current page has a dark theme
 * @returns {boolean} True if the page appears to have a dark theme
 */
function detectDarkTheme() {
  const bodyStyle = window.getComputedStyle(document.body);
  const backgroundColor = bodyStyle.backgroundColor;
  
  // Parse RGB values
  const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // Calculate brightness (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // Dark if brightness < 128
  }
  
  // Fallback: check for common dark theme indicators
  return document.body.classList.contains('dark') || 
         document.documentElement.classList.contains('dark') ||
         backgroundColor.includes('rgb(0, 0, 0)') ||
         backgroundColor.includes('rgb(20, 20, 20)');
}

/**
 * Positions the popup above the selected text
 * @param {HTMLElement} popup - The popup element
 * @param {Range} selection - The text selection range
 */
function positionPopup(popup, selection) {
  const rect = selection.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Position above the selection
  const top = rect.top + scrollTop - 10; // 10px margin above
  const left = rect.left + scrollLeft;
  
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  
  // Ensure popup stays within viewport
  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust horizontal position if needed
  if (left + popupRect.width > viewportWidth) {
    popup.style.left = `${viewportWidth - popupRect.width - 10}px`;
  }
  
  // Adjust vertical position if popup would go above viewport
  if (top < 10) {
    popup.style.top = `${rect.bottom + scrollTop + 10}px`; // Show below instead
  }
}

/**
 * Formats the dictionary API response into readable HTML
 * @param {Object} data - The dictionary data from the API
 * @returns {string} Formatted HTML
 */
function formatDefinition(data) {
  if (!data.meanings || data.meanings.length === 0) {
    return '<p>No definition available</p>';
  }
  
  let html = '';
  
  data.meanings.forEach((meaning, index) => {
    if (index > 0) html += '<hr class="dictionaread-separator">';
    
    html += `<div class="dictionaread-meaning-item">`;
    
    // Part of speech
    if (meaning.partOfSpeech) {
      html += `<div class="dictionaread-part-of-speech">${meaning.partOfSpeech}</div>`;
    }
    
    // Definitions
    if (meaning.definitions && meaning.definitions.length > 0) {
      html += '<div class="dictionaread-definitions">';
      meaning.definitions.slice(0, 3).forEach((def, defIndex) => { // Limit to 3 definitions
        html += `<div class="dictionaread-definition-item">`;
        html += `<span class="dictionaread-definition-number">${defIndex + 1}.</span>`;
        html += `<span class="dictionaread-definition-text">${def.definition}</span>`;
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
  });
  
  return html;
}

/**
 * Sets up event listeners for the popup
 * @param {HTMLElement} popup - The popup element
 */
function setupPopupEventListeners(popup) {
  // Close button
  const closeButton = popup.querySelector('.dictionaread-close');
  if (closeButton) {
    closeButton.addEventListener('click', removeCurrentPopup);
  }
  
  // ESC key listener
  const escHandler = (event) => {
    if (event.key === 'Escape' && isPopupVisible) {
      removeCurrentPopup();
    }
  };
  
  document.addEventListener('keydown', escHandler);
  
  // Store the handler for cleanup
  popup._escHandler = escHandler;
  
  // Click outside to close
  const clickHandler = (event) => {
    if (isPopupVisible && !popup.contains(event.target)) {
      removeCurrentPopup();
    }
  };
  
  document.addEventListener('click', clickHandler);
  popup._clickHandler = clickHandler;
}

/**
 * Removes the current popup and cleans up event listeners
 */
function removeCurrentPopup() {
  if (currentPopup) {
    // Remove event listeners
    if (currentPopup._escHandler) {
      document.removeEventListener('keydown', currentPopup._escHandler);
    }
    if (currentPopup._clickHandler) {
      document.removeEventListener('click', currentPopup._clickHandler);
    }
    
    // Remove from DOM
    if (currentPopup.parentNode) {
      currentPopup.parentNode.removeChild(currentPopup);
    }
    
    currentPopup = null;
    currentSelection = null;
    isPopupVisible = false;
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', removeCurrentPopup);

// Signal that content script is ready
console.log('DictionaRead content script loaded and ready');
