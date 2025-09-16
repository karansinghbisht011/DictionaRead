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
  
  // Detect page theme and apply dynamic contrast colors
  const themeInfo = detectThemeAndContrast();
  applyDynamicStyling(popup, themeInfo);
  
  return popup;
}

/**
 * Applies dynamic styling based on page contrast
 * @param {HTMLElement} popup - The popup element
 * @param {Object} themeInfo - Theme information and colors
 */
function applyDynamicStyling(popup, themeInfo) {
  const colors = themeInfo.colors;
  
  // Apply dynamic colors via inline styles with !important for maximum compatibility
  popup.style.setProperty('background-color', colors.background, 'important');
  popup.style.setProperty('color', colors.text, 'important');
  popup.style.setProperty('border-color', colors.border, 'important');
  popup.style.setProperty('box-shadow', `0 4px 12px ${colors.shadow}`, 'important');
  
  // Add theme class for CSS-based styling
  if (themeInfo.isDark) {
    popup.classList.add('dictionaread-dark');
  } else {
    popup.classList.add('dictionaread-light');
  }
  
  // Store theme info for potential use by child elements
  popup._themeInfo = themeInfo;
  
  // Ensure all child elements inherit the text color
  setTimeout(() => {
    const allTextElements = popup.querySelectorAll('*');
    allTextElements.forEach(element => {
      if (!element.style.color || element.style.color === '') {
        element.style.setProperty('color', 'inherit', 'important');
      }
    });
  }, 0);
}

/**
 * Detects if the current page has a dark theme and calculates optimal contrast colors
 * @returns {Object} Object containing theme info and optimal colors
 */
function detectThemeAndContrast() {
  const bodyStyle = window.getComputedStyle(document.body);
  const backgroundColor = bodyStyle.backgroundColor;
  
  // Parse RGB values
  const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  let brightness = 255; // Default to light
  
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // Calculate brightness (0-255)
    brightness = (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  // Check for common dark theme indicators
  const isDarkTheme = brightness < 128 || 
                      document.body.classList.contains('dark') || 
                      document.documentElement.classList.contains('dark') ||
                      backgroundColor.includes('rgb(0, 0, 0)') ||
                      backgroundColor.includes('rgb(20, 20, 20)');
  
  // Calculate optimal contrast colors
  const contrastColors = calculateContrastColors(brightness, isDarkTheme);
  
  return {
    isDark: isDarkTheme,
    brightness: brightness,
    colors: contrastColors
  };
}

/**
 * Calculates optimal contrast colors based on page brightness
 * @param {number} brightness - Page brightness (0-255)
 * @param {boolean} isDark - Whether page is dark themed
 * @returns {Object} Object containing optimal colors
 */
function calculateContrastColors(brightness, isDark) {
  // For very light backgrounds (brightness > 200)
  if (brightness > 200) {
    return {
      background: '#2c3e50', // Dark blue-gray
      text: '#ffffff',       // White text
      border: '#34495e',     // Slightly lighter border
      shadow: 'rgba(0, 0, 0, 0.3)'
    };
  }
  
  // For medium-light backgrounds (brightness 128-200)
  if (brightness > 128) {
    return {
      background: '#34495e', // Medium dark
      text: '#ecf0f1',       // Light gray text
      border: '#2c3e50',     // Darker border
      shadow: 'rgba(0, 0, 0, 0.25)'
    };
  }
  
  // For dark backgrounds (brightness < 128)
  return {
    background: '#ffffff',   // White background
    text: '#2c3e50',         // Dark text
    border: '#e9ecef',       // Light border
    shadow: 'rgba(0, 0, 0, 0.15)'
  };
}

/**
 * Positions the popup above or below the selected text to avoid covering it
 * @param {HTMLElement} popup - The popup element
 * @param {Range} selection - The text selection range
 */
function positionPopup(popup, selection) {
  const rect = selection.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // First, position the popup temporarily to calculate its dimensions
  popup.style.visibility = 'hidden';
  popup.style.top = '0px';
  popup.style.left = '0px';
  document.body.appendChild(popup);
  
  // Get popup dimensions after it's rendered
  const popupRect = popup.getBoundingClientRect();
  const popupHeight = popupRect.height;
  const popupWidth = popupRect.width;
  
  // Calculate available space above and below the selection
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const margin = 5; // Reduced margin for tighter positioning
  
  // Determine best position: above or below
  let positionAbove = true;
  let finalTop, finalLeft;
  
  if (spaceAbove >= popupHeight + margin) {
    // Enough space above - position above the selection
    positionAbove = true;
    finalTop = rect.top + scrollTop - popupHeight - margin;
  } else if (spaceBelow >= popupHeight + margin) {
    // Not enough space above, but enough below - position below
    positionAbove = false;
    finalTop = rect.bottom + scrollTop + margin;
  } else {
    // Not enough space in either direction - choose the side with more space
    if (spaceAbove > spaceBelow) {
      positionAbove = true;
      finalTop = Math.max(10, rect.top + scrollTop - popupHeight - margin);
    } else {
      positionAbove = false;
      finalTop = Math.min(
        window.innerHeight + scrollTop - popupHeight - 10,
        rect.bottom + scrollTop + margin
      );
    }
  }
  
  // Calculate horizontal position (center on selection, but keep within viewport)
  finalLeft = rect.left + scrollLeft + (rect.width / 2) - (popupWidth / 2);
  
  // Ensure popup stays within viewport horizontally
  const viewportWidth = window.innerWidth;
  const minLeft = 10;
  const maxLeft = viewportWidth - popupWidth - 10;
  
  if (finalLeft < minLeft) {
    finalLeft = minLeft;
  } else if (finalLeft > maxLeft) {
    finalLeft = maxLeft;
  }
  
  // Apply final positioning
  popup.style.top = `${finalTop}px`;
  popup.style.left = `${finalLeft}px`;
  popup.style.visibility = 'visible';
  
  // Add a class to indicate positioning for potential styling adjustments
  if (positionAbove) {
    popup.classList.add('dictionaread-positioned-above');
    popup.classList.remove('dictionaread-positioned-below');
  } else {
    popup.classList.add('dictionaread-positioned-below');
    popup.classList.remove('dictionaread-positioned-above');
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
