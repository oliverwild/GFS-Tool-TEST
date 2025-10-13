// Settings and Theme Management
function initializeSettings(toolModal) {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const themeSelect = document.getElementById('theme-select');
    const resetSettingsBtn = document.getElementById('reset-settings');
    
    // Load saved settings
    loadSettings();
    
    // Settings modal toggle - completely separate approach
    if (settingsToggle) {
        settingsToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close any open tool modals first
            if (toolModal) {
                toolModal.style.display = 'none';
            }
            
            // Create a simple settings modal dynamically
            showSimpleSettingsModal();
        });
    }
    
    // Close settings modal
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    } else {
        console.error('Close settings button not found!');
    }
    
    // Theme selection
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            saveSettings();
        });
    } else {
        console.error('Theme select not found!');
    }
    
    // Reset settings
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            resetSettings();
        });
    } else {
        console.error('Reset settings button not found!');
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.style.display === 'block') {
            settingsModal.style.display = 'none';
        }
    });
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
    
    // Load theme
    const theme = settings.theme || 'dark';
    applyTheme(theme);
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = theme;
    } else {
        console.error('Theme select element not found!');
    }
    
    // Load tool order and visibility
    const toolOrder = settings.toolOrder || ['range-splitting', 'label-preview', 'range-jumping', 'route-mapping'];
    const toolVisibility = settings.toolVisibility || {
        'range-splitting': true,
        'label-preview': true,
        'range-jumping': true,
        'route-mapping': true
    };
    
    applyToolOrder(toolOrder);
    applyToolVisibility(toolVisibility);
}

function saveSettings() {
    const settings = {
        theme: document.getElementById('theme-select').value,
        toolOrder: getCurrentToolOrder(),
        toolVisibility: getCurrentToolVisibility()
    };
    localStorage.setItem('gfs-settings', JSON.stringify(settings));
}

function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'auto') {
        // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        body.setAttribute('data-theme', theme);
    }
}

function resetSettings() {
    localStorage.removeItem('gfs-settings');
    location.reload(); // Reload to apply defaults
}

// Tool Management Functions
function populateToolOrderList() {
    const toolOrderList = document.getElementById('tool-order-list');
    const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
    const toolOrder = settings.toolOrder || ['range-splitting', 'label-preview', 'range-jumping', 'route-mapping'];
    const toolVisibility = settings.toolVisibility || {
        'range-splitting': true,
        'label-preview': true,
        'range-jumping': true,
        'route-mapping': true
    };
    
    const toolData = {
        'range-splitting': { name: 'Range Splitting', description: 'Split ranges into smaller segments', icon: 'fas fa-cut' },
        'label-preview': { name: 'Label Preview', description: 'Preview and generate shipping labels', icon: 'fas fa-tag' },
        'range-jumping': { name: 'Range Jumping', description: 'Generate UPDATE scripts for range numbers', icon: 'fas fa-arrow-right' },
        'route-mapping': { name: 'Route Mapping', description: 'Generate SQL INSERT statements for carrier routes', icon: 'fas fa-route' }
    };
    
    toolOrderList.innerHTML = '';
    
    toolOrder.forEach(toolId => {
        const tool = toolData[toolId];
        if (tool) {
            const item = document.createElement('div');
            item.className = 'tool-order-item';
            item.draggable = true;
            item.dataset.toolId = toolId;
            
            item.innerHTML = `
                <div class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="tool-info">
                    <div class="tool-icon">
                        <i class="${tool.icon}"></i>
                    </div>
                    <div class="tool-details">
                        <h4>${tool.name}</h4>
                        <p>${tool.description}</p>
                    </div>
                </div>
                <div class="tool-toggle">
                    <div class="toggle-switch ${toolVisibility[toolId] ? 'active' : ''}" data-tool-id="${toolId}"></div>
                </div>
            `;
            
            toolOrderList.appendChild(item);
        }
    });
    
    // Add drag and drop functionality
    initializeDragAndDrop();
    
    // Add toggle functionality
    initializeToolToggles();
}

function initializeDragAndDrop() {
    const toolOrderList = document.getElementById('tool-order-list');
    let draggedElement = null;
    
    toolOrderList.addEventListener('dragstart', (e) => {
        draggedElement = e.target.closest('.tool-order-item');
        draggedElement.classList.add('dragging');
    });
    
    toolOrderList.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        }
    });
    
    toolOrderList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(toolOrderList, e.clientY);
        if (draggedElement) {
            if (afterElement == null) {
                toolOrderList.appendChild(draggedElement);
        } else {
                toolOrderList.insertBefore(draggedElement, afterElement);
            }
        }
    });
    
    toolOrderList.addEventListener('drop', () => {
        saveSettings();
        applyToolOrder(getCurrentToolOrder());
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.tool-order-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function initializeToolToggles() {
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            saveSettings();
            applyToolVisibility(getCurrentToolVisibility());
        });
    });
}

function getCurrentToolOrder() {
    const toolOrderList = document.getElementById('tool-order-list');
    return Array.from(toolOrderList.children).map(item => item.dataset.toolId);
}

function getCurrentToolVisibility() {
    const visibility = {};
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        visibility[toggle.dataset.toolId] = toggle.classList.contains('active');
    });
    return visibility;
}

function applyToolOrder(toolOrder) {
    const toolsContainer = document.querySelector('.tools-grid');
    const toolCards = Array.from(toolsContainer.children);
    
    // Reorder tool cards based on settings
    toolOrder.forEach(toolId => {
        const toolCard = toolCards.find(card => card.querySelector(`[data-tool="${toolId}"]`));
        if (toolCard) {
            toolsContainer.appendChild(toolCard);
        }
    });
}

function applyToolVisibility(toolVisibility) {
    Object.entries(toolVisibility).forEach(([toolId, isVisible]) => {
        const toolCard = document.querySelector(`[data-tool="${toolId}"]`).closest('.tool-card');
        if (toolCard) {
            toolCard.style.display = isVisible ? 'block' : 'none';
        }
    });
}

// Simple settings modal - completely separate approach
function showSimpleSettingsModal() {
    // Remove any existing simple modal
    const existingModal = document.getElementById('simple-settings-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'simple-settings-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Add theme class to modal
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    modal.setAttribute('data-theme', currentTheme);
    
    // Create modal content with theme-aware styling
    const content = document.createElement('div');
    content.style.cssText = `
        background: var(--bg-primary, #2a2a2a);
        color: var(--text-primary, #ffffff);
        padding: 2rem;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid var(--border-color, #444);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;
    
    // Add content with theme-aware styling
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="margin: 0; color: var(--text-primary, #ffffff);">Settings</h2>
            <button id="close-simple-settings" style="background: var(--bg-secondary, #444); border: 1px solid var(--border-color, #666); color: var(--text-primary, #fff); padding: 0.5rem; border-radius: 6px; cursor: pointer;">✕</button>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--text-primary, #ffffff); margin-bottom: 1rem;">Theme</h3>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: var(--text-secondary, #ccc); font-size: 0.9rem;">Light</span>
                <div id="theme-toggle-slider" style="
                    width: 60px;
                    height: 30px;
                    background: var(--bg-secondary, #333);
                    border-radius: 15px;
                    cursor: pointer;
                    position: relative;
                    transition: background 0.3s ease;
                    border: 1px solid var(--border-color, #666);
                ">
                    <div style="
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        width: 24px;
                        height: 24px;
                        background: var(--text-primary, white);
                        border-radius: 50%;
                        transition: transform 0.3s ease;
                    "></div>
                </div>
                <span style="color: var(--text-secondary, #ccc); font-size: 0.9rem;">Dark</span>
            </div>
        </div>
        
        <div style="height: 1px; background: var(--border-color, #666); margin: 1.5rem 0;"></div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--text-primary, #ffffff); margin-bottom: 1rem;">Tool Management</h3>
            <p style="color: var(--text-secondary, #ccc); margin-bottom: 1rem;">Drag tools to reorder them, or toggle to show/hide tools you don't use.</p>
            <div id="simple-tool-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <!-- Tools will be populated here -->
            </div>
        </div>
        
        <div style="height: 1px; background: var(--border-color, #666); margin: 1.5rem 0;"></div>
        
        <div style="text-align: center;">
            <button id="reset-simple-settings" style="background: var(--bg-secondary, #666); border: 1px solid var(--border-color, #888); color: var(--text-primary, #fff); padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">Reset to Defaults</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('close-simple-settings').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('reset-simple-settings').addEventListener('click', () => {
        localStorage.removeItem('gfs-settings');
        location.reload();
    });
    
    // Theme toggle slider functionality
    const themeSlider = document.getElementById('theme-toggle-slider');
    const themeSliderHandle = themeSlider.querySelector('div');
    
    // Set initial state based on current theme
    if (currentTheme === 'dark') {
        themeSlider.style.background = '#4CAF50';
        themeSliderHandle.style.transform = 'translateX(30px)';
    } else {
        themeSlider.style.background = '#333';
        themeSliderHandle.style.transform = 'translateX(0px)';
    }
    
    themeSlider.addEventListener('click', () => {
        const isDark = themeSlider.style.background === 'rgb(76, 175, 80)';
        
        if (isDark) {
            // Switch to light mode
            themeSlider.style.background = '#333';
            themeSliderHandle.style.transform = 'translateX(0px)';
            applyTheme('light');
            // Update modal theme
            modal.setAttribute('data-theme', 'light');
        } else {
            // Switch to dark mode
            themeSlider.style.background = '#4CAF50';
            themeSliderHandle.style.transform = 'translateX(30px)';
            applyTheme('dark');
            // Update modal theme
            modal.setAttribute('data-theme', 'dark');
        }
        
        saveSettings();
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    // Populate tool list
    populateSimpleToolList();
    
    // Theme is already set via the toggle slider initialization above
}

function populateSimpleToolList() {
    const toolList = document.getElementById('simple-tool-list');
    console.log('Populating tool list, element found:', !!toolList);
    
    const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
    console.log('Raw settings from localStorage:', settings);
    
    const toolOrder = (settings.toolOrder && settings.toolOrder.length > 0) ? settings.toolOrder : ['range-splitting', 'label-preview', 'range-jumping', 'route-mapping'];
    const toolVisibility = (settings.toolVisibility && Object.keys(settings.toolVisibility).length > 0) ? settings.toolVisibility : {
        'range-splitting': true,
        'label-preview': true,
        'range-jumping': true,
        'route-mapping': true
    };
    
    console.log('Tool order:', toolOrder);
    console.log('Tool visibility:', toolVisibility);
    console.log('Tool order length:', toolOrder.length);
    
    const toolData = {
        'range-splitting': { name: 'Range Splitting', description: 'Split ranges into smaller segments' },
        'label-preview': { name: 'Label Preview', description: 'Preview and generate shipping labels' },
        'range-jumping': { name: 'Range Jumping', description: 'Generate UPDATE scripts for range numbers' },
        'route-mapping': { name: 'Route Mapping', description: 'Generate SQL INSERT statements for carrier routes' }
    };
    
    toolList.innerHTML = '';
    console.log('Cleared tool list, creating items...');
    
    toolOrder.forEach(toolId => {
        const tool = toolData[toolId];
        console.log('Processing tool:', toolId, tool);
        if (tool) {
            const item = document.createElement('div');
            item.className = 'simple-tool-item';
            item.draggable = true;
            item.dataset.toolId = toolId;
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: var(--bg-secondary, #333);
                border: 1px solid var(--border-color, #555);
                border-radius: 8px;
                cursor: move;
                transition: all 0.2s ease;
            `;
            
            item.innerHTML = `
                <div style="color: var(--text-secondary, #888); cursor: grab; padding: 0.25rem;">
                    ⋮⋮
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0; color: var(--text-primary, #ffffff);">${tool.name}</h4>
                    <p style="margin: 0; color: var(--text-secondary, #ccc); font-size: 0.9rem;">${tool.description}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--text-secondary, #ccc); font-size: 0.9rem;">Show</span>
                    <div class="simple-toggle" data-tool-id="${toolId}" style="
                        width: 44px;
                        height: 24px;
                        background: ${toolVisibility[toolId] ? '#4CAF50' : 'var(--bg-secondary, #666)'};
                        border-radius: 12px;
                        cursor: pointer;
                        position: relative;
                        transition: background 0.3s ease;
                    ">
                        <div style="
                            position: absolute;
                            top: 2px;
                            left: 2px;
                            width: 20px;
                            height: 20px;
                            background: var(--text-primary, white);
                            border-radius: 50%;
                            transition: transform 0.3s ease;
                            transform: translateX(${toolVisibility[toolId] ? '20px' : '0px'});
                        "></div>
                    </div>
                </div>
            `;
            
            toolList.appendChild(item);
        }
    });
    
    // Add drag and drop functionality
    initializeSimpleDragAndDrop();
    
    // Add toggle functionality
    document.querySelectorAll('.simple-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const toolId = toggle.dataset.toolId;
            const isActive = toggle.style.background === 'rgb(76, 175, 80)';
            
            toggle.style.background = isActive ? '#666' : '#4CAF50';
            toggle.querySelector('div').style.transform = isActive ? 'translateX(0px)' : 'translateX(20px)';
            
            // Update settings
            const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
            if (!settings.toolVisibility) settings.toolVisibility = {};
            settings.toolVisibility[toolId] = !isActive;
            localStorage.setItem('gfs-settings', JSON.stringify(settings));
            
            // Apply visibility
            const toolCard = document.querySelector(`[data-tool="${toolId}"]`).closest('.tool-card');
            if (toolCard) {
                toolCard.style.display = !isActive ? 'block' : 'none';
            }
        });
    });
}

function initializeSimpleDragAndDrop() {
    const toolList = document.getElementById('simple-tool-list');
    let draggedElement = null;
    
    toolList.addEventListener('dragstart', (e) => {
        draggedElement = e.target.closest('.simple-tool-item');
        draggedElement.style.opacity = '0.5';
        draggedElement.style.transform = 'rotate(5deg)';
    });
    
    toolList.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.style.opacity = '1';
            draggedElement.style.transform = 'rotate(0deg)';
            draggedElement = null;
        }
    });
    
    toolList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getSimpleDragAfterElement(toolList, e.clientY);
        if (draggedElement) {
            if (afterElement == null) {
                toolList.appendChild(draggedElement);
            } else {
                toolList.insertBefore(draggedElement, afterElement);
            }
        }
    });
    
    toolList.addEventListener('drop', () => {
        // Save new order
        const newOrder = Array.from(toolList.children).map(item => item.dataset.toolId);
        const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
        settings.toolOrder = newOrder;
        localStorage.setItem('gfs-settings', JSON.stringify(settings));
        
        // Apply new order to main page
        applyToolOrder(newOrder);
    });
}

function getSimpleDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.simple-tool-item:not([style*="opacity: 0.5"])')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


// Modal functionality for GFS Tools
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const toolModal = document.getElementById('tool-modal');
    const modalTitle = document.getElementById('modal-title');
    
    // Initialize settings after toolModal is defined
    initializeSettings(toolModal);

    // Get close buttons
    const closeButtons = document.querySelectorAll('.close-modal-btn');


    // Open tool modal
    document.querySelectorAll('.open-tool').forEach(button => {
        console.log('Adding event listener to tool button:', button);
        button.addEventListener('click', function() {
            console.log('Tool button clicked!');
            // Close any open settings modal first
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
            
            const toolType = this.getAttribute('data-tool');
            const toolName = this.closest('.tool-card').querySelector('h3').textContent;
            
            modalTitle.textContent = toolName;
            toolModal.style.display = 'block';
            
            // Show appropriate tool content
            showToolContent(toolType);
        
        // Add click animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
    });

    // Show tool content based on tool type
    function showToolContent(toolType) {
        // Hide all tool content and show default WIP
        document.querySelectorAll('.tool-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('default-wip').style.display = 'block';

        // Show specific tool content if available
        if (toolType === 'range-splitting') {
            document.getElementById('default-wip').style.display = 'none';
            document.getElementById('range-splitting-content').style.display = 'block';
            initializeRangeSplitter();
        } else if (toolType === 'label-preview') {
            document.getElementById('default-wip').style.display = 'none';
            document.getElementById('label-preview-content').style.display = 'block';
            initializeLabelPreview();
        } else if (toolType === 'range-jumping') {
            document.getElementById('default-wip').style.display = 'none';
            document.getElementById('range-jumping-content').style.display = 'block';
            initializeRangeJumping();
        } else if (toolType === 'route-mapping') {
            document.getElementById('default-wip').style.display = 'none';
            document.getElementById('route-mapping-content').style.display = 'block';
            initializeRouteMapping();
        }
    }

    // Initialize Range Splitter functionality
    function initializeRangeSplitter() {
        const startInput = document.getElementById('start-range');
        const endInput = document.getElementById('end-range');
        const percentageSlider = document.getElementById('split-percentage');
        const percentageDisplay = document.getElementById('percentage-display');
        const calculateBtn = document.getElementById('calculate-split');
        const copyBtn = document.getElementById('copy-results');
        const clearBtn = document.getElementById('clear-inputs');

        // Update percentage display when slider changes
        percentageSlider.addEventListener('input', function() {
            percentageDisplay.textContent = this.value + '%';
            if (startInput.value && endInput.value) {
                calculateSplit();
            }
        });

        // Calculate split when inputs change
        startInput.addEventListener('input', calculateSplit);
        endInput.addEventListener('input', calculateSplit);

        // Calculate button click
        calculateBtn.addEventListener('click', calculateSplit);

        // Copy results button
        copyBtn.addEventListener('click', copyResults);

        // Clear inputs button
        clearBtn.addEventListener('click', clearInputs);

        function calculateSplit() {
            const start = parseInt(startInput.value) || 0;
            const end = parseInt(endInput.value) || 0;
            const percentage = parseInt(percentageSlider.value) || 50;

            if (start >= end) {
                updateRangeInfo('Invalid range', 'Start must be less than end');
                clearResults();
                return;
            }

            const totalRange = end - start;
            const firstRangeCount = Math.floor(totalRange * (percentage / 100));
            const secondRangeCount = totalRange - firstRangeCount;

            const firstRangeEnd = start + firstRangeCount - 1;
            const secondRangeStart = firstRangeEnd + 1;

            // Update range info
            updateRangeInfo(`${start} to ${end}`, totalRange);

            // Update results
            updateResults(
                `${start} to ${firstRangeEnd}`,
                firstRangeCount,
                `${secondRangeStart} to ${end}`,
                secondRangeCount
            );
        }

        function updateRangeInfo(range, count) {
            document.getElementById('total-range').textContent = range;
            document.getElementById('available-numbers').textContent = count;
        }

        function updateResults(firstRange, firstCount, secondRange, secondCount) {
            // Parse the ranges to get start and end numbers
            const firstParts = firstRange.split(' to ');
            const secondParts = secondRange.split(' to ');
            
            // Create clickable copy boxes for first range with individual number copying
            const firstRangeElement = document.getElementById('first-range');
            firstRangeElement.innerHTML = `
                <div class="range-copy-box">
                    <span class="range-text">
                        <span class="clickable-number" onclick="copyToClipboard('${firstParts[0]}')" title="Click to copy ${firstParts[0]}">${firstParts[0]}</span>
                        <span class="range-separator"> to </span>
                        <span class="clickable-number" onclick="copyToClipboard('${firstParts[1]}')" title="Click to copy ${firstParts[1]}">${firstParts[1]}</span>
                    </span>
                </div>
            `;
            document.getElementById('first-count').textContent = `${firstCount} numbers`;
            
            // Create clickable copy boxes for second range with individual number copying
            const secondRangeElement = document.getElementById('second-range');
            secondRangeElement.innerHTML = `
                <div class="range-copy-box">
                    <span class="range-text">
                        <span class="clickable-number" onclick="copyToClipboard('${secondParts[0]}')" title="Click to copy ${secondParts[0]}">${secondParts[0]}</span>
                        <span class="range-separator"> to </span>
                        <span class="clickable-number" onclick="copyToClipboard('${secondParts[1]}')" title="Click to copy ${secondParts[1]}">${secondParts[1]}</span>
                    </span>
                </div>
            `;
            document.getElementById('second-count').textContent = `${secondCount} numbers`;
        }

        function clearResults() {
            document.getElementById('first-range').textContent = '-';
            document.getElementById('first-count').textContent = '-';
            document.getElementById('second-range').textContent = '-';
            document.getElementById('second-count').textContent = '-';
        }

        function copyResults() {
            const firstRange = document.getElementById('first-range').textContent;
            const secondRange = document.getElementById('second-range').textContent;
            
            if (firstRange !== '-' && secondRange !== '-') {
                const results = `Range Split Results:\nFirst Range: ${firstRange}\nSecond Range: ${secondRange}`;
                navigator.clipboard.writeText(results).then(() => {
                    // Show success feedback
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy Results';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        }



        function clearInputs() {
            startInput.value = '';
            endInput.value = '';
            percentageSlider.value = 50;
            percentageDisplay.textContent = '50%';
            updateRangeInfo('-', '-');
            clearResults();
        }
    }

    // Initialize Label Preview functionality
    function initializeLabelPreview() {
        const base64Input = document.getElementById('base64-input');
        const dataLengthSpan = document.getElementById('data-length');
        const processBtn = document.getElementById('process-label');
        const clearBtn = document.getElementById('clear-label');
        const processStatus = document.getElementById('process-status');
        const labelResults = document.getElementById('label-results');
        const labelError = document.getElementById('label-error');
        // Update data length as user types
        base64Input.addEventListener('input', function() {
            const length = this.value.length;
            dataLengthSpan.textContent = `${length.toLocaleString()} characters`;
        });

        // Process button click
        processBtn.addEventListener('click', processLabel);

        // Clear button click
        clearBtn.addEventListener('click', clearLabelInputs);

        function processLabel() {
            const base64Data = base64Input.value.trim();
            if (!base64Data) {
                showError('Please paste your Base64 encoded label data.');
                return;
            }

            // Reset UI
            hideError();
            hideResults();
            showProcessStatus();
            resetProcessSteps();

            try {
                // Step 1: Clean and decode Base64
                updateProcessStep('step-decode', 'completed');
                const decodedData = cleanAndDecodeBase64(base64Data);
                
                // Step 2: Identify data type
                updateProcessStep('step-convert', 'completed');
                const dataType = identifyDataType(decodedData);
                
                // Step 3: Generate preview
                updateProcessStep('step-preview', 'completed');
                generateLabelPreview(decodedData, dataType);
                
                hideProcessStatus();
                showResults();
                
            } catch (error) {
                console.error('Processing error:', error);
                showError(`Processing failed: ${error.message}`);
                hideProcessStatus();
            }
        }

        function cleanAndDecodeBase64(base64String) {
            try {
                // More comprehensive Base64 cleaning
                let cleaned = base64String;
                
                // Remove all whitespace, newlines, carriage returns
                cleaned = cleaned.replace(/[\s\r\n\t]/g, '');
                
                // Remove specific corruption patterns like </Image/
                cleaned = cleaned.replace(/<\/?Image\/?/g, '');
                
                // Remove any non-Base64 characters (keep only A-Z, a-z, 0-9, +, /, =)
                cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
                
                // Fix URL-safe Base64 if present
                cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
                
                // Ensure proper padding
                while (cleaned.length % 4 !== 0) {
                    cleaned += '=';
                }
                
                // Remove excessive padding
                cleaned = cleaned.replace(/=+$/, '');
                while (cleaned.length % 4 !== 0) {
                    cleaned += '=';
                }
                
                console.log('Cleaned Base64 length:', cleaned.length);
                console.log('Cleaned Base64 preview:', cleaned.substring(0, 50) + '...');
                console.log('Final Base64 ends with:', cleaned.substring(Math.max(0, cleaned.length - 20)));
                
                // Try to decode
                const decoded = atob(cleaned);
                
                // Convert to Uint8Array for further processing
                const bytes = new Uint8Array(decoded.length);
                for (let i = 0; i < decoded.length; i++) {
                    bytes[i] = decoded.charCodeAt(i);
                }
                
                return bytes;
            } catch (error) {
                console.error('Base64 cleaning/decoding error:', error);
                throw new Error(`Base64 processing failed: ${error.message}. Please check your input format.`);
            }
        }

        function identifyDataType(data) {
            console.log('Identifying data type for:', data.length, 'bytes');
            console.log('First 20 bytes as hex:', Array.from(data.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
            console.log('First 20 bytes as text:', String.fromCharCode(...data.slice(0, 20)));
            
            // Check if it's a PDF (PDF files start with %PDF)
            if (data.length >= 4) {
                const header = String.fromCharCode(...data.slice(0, 4));
                console.log('Header check:', header);
                
                // More flexible PDF detection - check for %PDF anywhere in first 10 bytes
                if (header === '%PDF' || header.startsWith('%PDF')) {
                    console.log('Identified as PDF (exact header)');
                    return 'PDF';
                }
                
                // Check first 10 bytes for PDF signature in case of encoding issues
                const firstBytes = data.slice(0, 10);
                const firstBytesText = String.fromCharCode(...firstBytes);
                console.log('First 10 bytes as text:', firstBytesText);
                
                if (firstBytesText.includes('%PDF')) {
                    console.log('Identified as PDF (found in first 10 bytes)');
                    return 'PDF';
                }
            }
            
            // Check if it's an image (common image headers)
            if (data.length >= 8) {
                const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                const jpgHeader = [0xFF, 0xD8, 0xFF];
                
                if (pngHeader.every((byte, i) => data[i] === byte)) {
                    console.log('Identified as PNG Image');
                    return 'PNG Image';
                }
                if (jpgHeader.every((byte, i) => data[i] === byte)) {
                    console.log('Identified as JPEG Image');
                    return 'JPEG Image';
                }
            }
            
            // Check if it's ZPL or other text content
            // Only convert to text if we haven't already identified it as PDF or image
            const text = String.fromCharCode(...data);
            
            // Check for ZPL commands (^XA, ^FO, ^FD, etc.)
            if (text.includes('^XA') || text.includes('^FO') || text.includes('^FD') || text.includes('^FS')) {
                console.log('Identified as ZPL Text');
                return 'ZPL Text';
            }
            
            // Only log text preview for non-binary data to avoid PDF content in console
            if (text.match(/^[\x20-\x7E\t\n\r]*$/)) {
                console.log('Text content preview:', text.substring(0, 100));
            }
            
            // Ultra-strict text detection - only allow printable ASCII and basic punctuation
            // Exclude extended ASCII characters that often indicate binary data
            if (text.match(/^[\x20-\x7E\t\n\r]*$/)) {
                // Additional check: ensure it's mostly readable text, not binary
                const readableChars = text.replace(/[\x00-\x1F\x7F]/g, '').length;
                const totalChars = text.length;
                const readabilityRatio = readableChars / totalChars;
                
                // Also check for common binary patterns
                const binaryPatterns = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0-\xFF]/g;
                const binaryCharCount = (text.match(binaryPatterns) || []).length;
                const binaryRatio = binaryCharCount / totalChars;
                
                console.log('Text analysis:', { 
                    readableChars, 
                    totalChars, 
                    readabilityRatio: readabilityRatio.toFixed(3),
                    binaryCharCount,
                    binaryRatio: binaryRatio.toFixed(3)
                });
                
                // Must be 90% readable AND have less than 5% binary characters
                if (readabilityRatio > 0.9 && binaryRatio < 0.05) {
                    console.log('Identified as Text (high quality)');
                    return 'Text';
                } else if (readabilityRatio > 0.8 && binaryRatio < 0.1) {
                    console.log('Identified as Text (acceptable quality)');
                    return 'Text';
                } else {
                    console.log('Rejected as text - poor quality (readable:', readabilityRatio.toFixed(3) + ', binary:', binaryRatio.toFixed(3) + ')');
                    return 'Binary Data';
                }
            }
            
            console.log('Identified as Binary Data');
            return 'Binary Data';
        }

        function generateLabelPreview(data, dataType) {
            const previewContainer = document.getElementById('preview-container');
            const dataTypeSpan = document.getElementById('data-type');
            const processedStatus = document.getElementById('processed-status');
            
            // Update info
            dataTypeSpan.textContent = dataType;
            
            console.log('Processing data type:', dataType);
            
            // Handle PDFs - show embedded preview
            if (dataType === 'PDF') {
                console.log('Processing as PDF');
                processedStatus.textContent = 'Creating PDF preview...';
                
                // Convert the decoded data back to Base64 for PDF creation
                const pdfBase64 = btoa(String.fromCharCode(...data));
                const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
                
                // Clear the preview area and keep only preview-info
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                // Create embedded PDF viewer
                const pdfEmbed = document.createElement('embed');
                pdfEmbed.src = pdfDataUrl;
                pdfEmbed.type = 'application/pdf';
                pdfEmbed.width = '100%';
                pdfEmbed.height = '500';
                pdfEmbed.style.cssText = 'border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                
                // Add PDF preview
                previewContainer.appendChild(pdfEmbed);
                
                processedStatus.textContent = 'PDF preview created successfully';
                console.log('PDF preview created and displayed');
                return;
            }
            
            // Handle PNG Images - show directly
            if (dataType === 'PNG Image') {
                console.log('Processing as PNG Image');
                processedStatus.textContent = 'Creating PNG preview...';
                
                // Convert the decoded data back to Base64 for PNG creation
                const pngBase64 = btoa(String.fromCharCode(...data));
                const pngDataUrl = `data:image/png;base64,${pngBase64}`;
                
                // Clear the preview area and keep only preview-info
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                // Create image element for PNG preview
                const pngImg = document.createElement('img');
                pngImg.src = pngDataUrl;
                pngImg.alt = 'PNG Preview';
                pngImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                
                // Add PNG preview
                previewContainer.appendChild(pngImg);
                
                processedStatus.textContent = 'PNG preview created successfully';
                console.log('PNG preview created and displayed');
                return;
            }
            
            // Handle JPEG Images - show directly
            if (dataType === 'JPEG Image') {
                console.log('Processing as JPEG Image');
                processedStatus.textContent = 'Creating JPEG preview...';
                
                // Convert the decoded data back to Base64 for JPEG creation
                const jpegBase64 = btoa(String.fromCharCode(...data));
                const jpegDataUrl = `data:image/jpeg;base64,${jpegBase64}`;
                
                // Clear the preview area and keep only preview-info
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                // Create image element for JPEG preview
                const jpegImg = document.createElement('img');
                jpegImg.src = jpegDataUrl;
                jpegImg.alt = 'JPEG Preview';
                jpegImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                
                // Add JPEG preview
                previewContainer.appendChild(jpegImg);
                
                processedStatus.textContent = 'JPEG preview created successfully';
                console.log('JPEG preview created and displayed');
                return;
            }
            
            // Handle ZPL Text - use Labelary API
            if (dataType === 'ZPL Text') {
                console.log('Processing as ZPL Text');
                processedStatus.textContent = 'Processing ZPL with Labelary API...';
                
                // Clear the preview area and keep only preview-info
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                // Create a new img element for the preview
                const previewImg = document.createElement('img');
                previewImg.id = 'label-preview-img';
                previewImg.alt = 'Label Preview';
                previewImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                previewContainer.appendChild(previewImg);
                
                // Call Labelary API for ZPL preview
                callLabelaryAPI(data, dataType).then(labelImageUrl => {
                    console.log('Setting ZPL preview image:', labelImageUrl);
                    previewImg.src = labelImageUrl;
                    processedStatus.textContent = 'ZPL label preview generated successfully';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                    console.log('ZPL preview displayed successfully');
                }).catch(error => {
                    console.error('Labelary API error for ZPL:', error);
                    createPlaceholderImage(previewImg, 'ZPL Text - API Failed', '#f59e0b');
                    processedStatus.textContent = 'ZPL processing failed, showing placeholder';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                });
                return;
            }
            
            // Handle regular Text - use Labelary API
            if (dataType === 'Text') {
                console.log('Processing as Text');
                processedStatus.textContent = 'Converting text to label with Labelary API...';
                
                // Clear the preview area and keep only preview-info
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                // Create a new img element for the preview
                const previewImg = document.createElement('img');
                previewImg.id = 'label-preview-img';
                previewImg.alt = 'Label Preview';
                previewImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                previewContainer.appendChild(previewImg);
                
                // Call Labelary API for text label
                callLabelaryAPI(data, dataType).then(labelImageUrl => {
                    console.log('Setting text label image:', labelImageUrl);
                    previewImg.src = labelImageUrl;
                    processedStatus.textContent = 'Text label generated successfully';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                    console.log('Text label displayed successfully');
                }).catch(error => {
                    console.error('Labelary API error for text:', error);
                    createPlaceholderImage(previewImg, 'Text Label - API Failed', '#f59e0b');
                    processedStatus.textContent = 'Text processing failed, showing placeholder';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                });
                return;
            }
            
            // Handle other data types with fallback
            console.log('Processing as other data type:', dataType);
            processedStatus.textContent = 'Processing with Labelary API...';
            
            // Clear the preview area and keep only preview-info
            const previewInfo = previewContainer.querySelector('.preview-info');
            previewContainer.innerHTML = '';
            if (previewInfo) {
                previewContainer.appendChild(previewInfo);
            }
            
            // Create a new img element for the preview
            const previewImg = document.createElement('img');
            previewImg.id = 'label-preview-img';
            previewImg.alt = 'Label Preview';
            previewImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
            previewContainer.appendChild(previewImg);
            
            callLabelaryAPI(data, dataType).then(labelImageUrl => {
                console.log('Setting fallback image:', labelImageUrl);
                previewImg.src = labelImageUrl;
                processedStatus.textContent = 'Label generated successfully';
                previewImg.style.display = 'block';
                previewImg.style.visibility = 'visible';
                console.log('Fallback label displayed successfully');
            }).catch(error => {
                console.error('Labelary API error:', error);
                
                if (dataType === 'Binary Data') {
                    createPlaceholderImage(previewImg, 'Binary Data - Cannot Preview', '#dc2626');
                    processedStatus.textContent = 'Binary data cannot be converted to label preview';
                } else {
                    createPlaceholderImage(previewImg, `${dataType} Data`, '#f59e0b');
                    processedStatus.textContent = 'Processing failed, showing placeholder';
                }
                
                previewImg.style.display = 'block';
                previewImg.style.visibility = 'visible';
                console.log('Fallback placeholder created');
            });
        }

        function callLabelaryAPI(data, dataType) {
            return new Promise((resolve, reject) => {
                console.log('Calling Labelary API for data type:', dataType);
                
                // Convert data to ZPL (Zebra Programming Language) format
                let zplData = '';
                
                if (dataType === 'Text') {
                    // Convert text to ZPL format
                    const text = String.fromCharCode(...data);
                    zplData = `^XA^FO50,50^A0N,50,50^FD${text}^FS^XZ`;
                } else if (dataType === 'ZPL Text') {
                    // Use the ZPL content directly since it's already in ZPL format
                    zplData = String.fromCharCode(...data);
                } else if (dataType === 'Binary Data') {
                    // For binary data, create a generic label indicating the data type
                    zplData = `^XA^FO50,50^A0N,50,50^FDBinary Data^FS^XZ`;
                } else {
                    // For other data types, create a generic label
                    zplData = `^XA^FO50,50^A0N,50,50^FD${dataType} Data^FS^XZ`;
                }
                
                console.log('Generated ZPL data:', zplData.substring(0, 200));

                // Call Labelary API with ZPL data using correct endpoint format
                // Try different Labelary endpoint formats to get PNG responses
                let labelaryUrl;
                
                // Try the newer endpoint format first
                labelaryUrl = `https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/`;
                console.log('Trying Labelary API URL:', labelaryUrl);
                
                // Use POST method with ZPL data in body
                fetch(labelaryUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'image/png',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: zplData
                })
                .then(response => {
                    console.log('Labelary API response status:', response.status, response.statusText);
                    console.log('Labelary API response headers:', response.headers);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    // Check if we got an image response
                    const contentType = response.headers.get('content-type');
                    console.log('Response content type:', contentType);
                    
                    if (contentType && contentType.includes('image/')) {
                        console.log('Successfully received image response from Labelary');
                        return response.blob();
                    } else {
                        throw new Error('Response is not an image');
                    }
                })
                .then(blob => {
                    console.log('Labelary API success, blob size:', blob.size);
                    const imageUrl = URL.createObjectURL(blob);
                    resolve(imageUrl);
                })
                .catch(error => {
                    console.error('Direct Labelary API call failed:', error);
                    // If direct call fails due to CORS, create a local ZPL preview
                    console.log('Falling back to local ZPL preview');
                    createLocalZPLPreview(zplData, resolve);
    });
        });
        }



        function createLocalZPLPreview(zplData, resolve) {
            console.log('Creating local ZPL preview for:', zplData.substring(0, 100));
            
            // Create a local preview that simulates what the ZPL would look like
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to 4x6 label proportions (203 DPI)
            canvas.width = 812; // 4 inches * 203 DPI
            canvas.height = 1218; // 6 inches * 203 DPI
            
            // Background (white label)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Border (black label border)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Parse ZPL and create visual representation
            let labelTexts = [];
            let hasContent = false;
            
            // Try to extract text content from ZPL
            // Look for ^FD (Field Data) commands
            const fdMatches = zplData.match(/\^FD([^^]*)/g);
            if (fdMatches && fdMatches.length > 0) {
                // Extract text from all FD commands
                labelTexts = fdMatches.map(match => match.substring(3)); // Remove ^FD
                hasContent = true;
                console.log('Found FD texts:', labelTexts);
            }
            
            // If no FD commands found, try to extract any readable text
            if (!hasContent) {
                const readableText = zplData.replace(/[\x00-\x1F\x7F-\xFF]/g, ' ').trim();
                if (readableText.length > 0) {
                    labelTexts = [readableText.substring(0, 100)];
                    hasContent = true;
                }
            }
            
            // Always draw something, even if parsing fails
            if (hasContent && labelTexts.length > 0) {
                // Text styling (simulating ZPL font)
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                // Position text in multiple lines to simulate label layout
                let yPosition = 100;
                labelTexts.forEach((text, index) => {
                    if (index < 8) { // Limit to 8 lines to fit on label
                        const displayText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                        ctx.fillText(displayText, 50, yPosition);
                        yPosition += 40;
                    }
                });
                
                // Add subtitle
                ctx.font = '16px monospace';
                ctx.fillStyle = '#666666';
                ctx.fillText('ZPL Preview (Local)', 50, yPosition + 20);
            } else {
                // Fallback: show ZPL structure
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('ZPL Label Preview', canvas.width / 2, canvas.height / 2);
                
                ctx.font = '16px monospace';
                ctx.fillStyle = '#666666';
                ctx.fillText('Local Preview Generated', canvas.width / 2, canvas.height / 2 + 40);
            }
            
            // Add ZPL indicator
            ctx.font = '14px monospace';
            ctx.fillStyle = '#999999';
            ctx.fillText('ZPL Data Length: ' + zplData.length + ' chars', 50, canvas.height - 30);
            
            // Convert to data URL
            const imageUrl = canvas.toDataURL('image/png');
            console.log('Local ZPL preview created successfully');
            resolve(imageUrl);
        }

        function createPlaceholderImage(imgElement, text, color) {
            // Create a canvas-based placeholder image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 400;
            canvas.height = 300;
            
            // Background
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Border
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Text
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            
            // Subtitle
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('Labelary Preview', canvas.width / 2, canvas.height / 2 + 40);
            
            // Convert to data URL
            imgElement.src = canvas.toDataURL('image/png');
        }



        function clearLabelInputs() {
            base64Input.value = '';
            dataLengthSpan.textContent = '0 characters';
            hideResults();
            hideError();
            hideProcessStatus();
            
            // Clear the preview area completely
            const previewContainer = document.getElementById('preview-container');
            const dataTypeSpan = document.getElementById('data-type');
            const processedStatus = document.getElementById('processed-status');
            
            // Reset data type display
            if (dataTypeSpan) dataTypeSpan.textContent = '-';
            if (processedStatus) processedStatus.textContent = '';
            
            // Clear preview container completely
            if (previewContainer) {
                // Keep only the preview-info div
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
            }
        }

        function showProcessStatus() {
            processStatus.style.display = 'block';
        }

        function hideProcessStatus() {
            processStatus.style.display = 'none';
        }

        function showResults() {
            labelResults.style.display = 'block';
        }

        function hideResults() {
            labelResults.style.display = 'none';
        }

        function showError(message) {
            document.getElementById('error-text').textContent = message;
            labelError.style.display = 'block';
        }

        function hideError() {
            labelError.style.display = 'none';
        }

        function resetProcessSteps() {
            document.querySelectorAll('.status-step').forEach(step => {
                step.className = 'status-step';
                step.innerHTML = '<i class="fas fa-circle"></i><span>' + step.querySelector('span').textContent + '</span>';
            });
        }

        function updateProcessStep(stepId, status) {
            const step = document.getElementById(stepId);
            if (step) {
                step.className = `status-step ${status}`;
                if (status === 'completed') {
                    step.innerHTML = '<i class="fas fa-check-circle"></i><span>' + step.querySelector('span').textContent + '</span>';
                } else if (status === 'error') {
                    step.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + step.querySelector('span').textContent + '</span>';
                }
            }
        }

        // Add event listeners for copy and download buttons
        const copyBtn = document.getElementById('copy-label-btn');
        const downloadBtn = document.getElementById('download-label-btn');
        const filenameInput = document.getElementById('filename-input');

        if (copyBtn) {
            copyBtn.addEventListener('click', copyLabelData);
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadLabelData);
        }

        // Store the current label data for copy/download
        let currentLabelData = null;
        let currentDataType = null;

        function copyLabelData() {
            try {
                // Look for the actual preview image in the preview container
                const previewContainer = document.getElementById('preview-container');
                const previewImage = previewContainer.querySelector('img, embed');
                
                if (previewImage && previewImage.tagName === 'IMG') {
                    // For images, copy the image to clipboard
                    copyImageToClipboard(previewImage);
                } else if (previewImage && previewImage.tagName === 'EMBED') {
                    // For PDF embeds, try to capture as image
                    copyPDFAsImage(previewImage);
                } else {
                    // Fallback to copying data based on type
                    copyDataBasedOnType();
                }
            } catch (error) {
                console.error('Copy failed:', error);
                // Fallback to original data copy
                copyDataBasedOnType();
            }
        }

        function copyImageToClipboard(imgElement) {
            // Create a canvas to capture the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match image
            canvas.width = imgElement.naturalWidth || imgElement.width;
            canvas.height = imgElement.naturalHeight || imgElement.height;
            
            // Draw image to canvas
            ctx.drawImage(imgElement, 0, 0);
            
            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                try {
                    // Copy blob to clipboard
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);
                    showCopyNotification('Preview image copied to clipboard!', 'success');
                } catch (error) {
                    console.error('Failed to copy image to clipboard:', error);
                    // Fallback to data copy
                    copyDataBasedOnType();
                }
            }, 'image/png');
        }

        function copyPDFAsImage(embedElement) {
            // For PDF embeds, we can't directly capture them as images
            // So we'll fall back to copying the original Base64 data
            copyDataBasedOnType();
        }

        function copyDataBasedOnType() {
            try {
                // Try to get the original Base64 input first
                const base64Input = document.getElementById('base64-input');
                if (base64Input && base64Input.value.trim()) {
                    window.copyToClipboard(base64Input.value.trim());
                    showCopyNotification('Base64 data copied to clipboard!', 'success');
                    return;
                }
                
                // If no Base64 input, try to copy current label data
                if (currentLabelData) {
                    window.copyToClipboard(currentLabelData);
                    showCopyNotification('Label data copied to clipboard!', 'success');
                    return;
                }
                
                showCopyNotification('No data available to copy', 'error');
            } catch (error) {
                console.error('Data copy failed:', error);
                showCopyNotification('Failed to copy data', 'error');
            }
        }

        function downloadLabelData() {
            try {
                const filename = filenameInput.value.trim() || 'label';
                let blob;
                let extension;

                // Look for the actual preview image in the preview container
                const previewContainer = document.getElementById('preview-container');
                const previewImage = previewContainer.querySelector('img, embed');

                if (previewImage && previewImage.tagName === 'IMG') {
                    // For images, download the actual preview image
                    downloadImageFromElement(previewImage, filename);
                    return;
                } else if (previewImage && previewImage.tagName === 'EMBED') {
                    // For PDF embeds, download the original PDF
                    downloadPDFFromBase64(filename);
                    return;
                } else {
                    // Fallback to downloading data based on type
                    downloadDataBasedOnType(filename);
                }
            } catch (error) {
                console.error('Download failed:', error);
                showCopyNotification('Failed to download file', 'error');
            }
        }

        function downloadImageFromElement(imgElement, filename) {
            try {
                // Create a canvas to capture the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size to match image
                canvas.width = imgElement.naturalWidth || imgElement.width;
                canvas.height = imgElement.naturalHeight || imgElement.height;
                
                // Draw image to canvas
                ctx.drawImage(imgElement, 0, 0);
                
                // Convert canvas to blob and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filename}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showCopyNotification('Preview image downloaded successfully!', 'success');
                }, 'image/png');
            } catch (error) {
                console.error('Failed to download image:', error);
                // Fallback to data download
                downloadDataBasedOnType(filename);
            }
        }

        function downloadPDFFromBase64(filename) {
            try {
                const base64Data = document.getElementById('base64-input').value.trim();
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showCopyNotification('PDF downloaded successfully!', 'success');
            } catch (error) {
                console.error('Failed to download PDF:', error);
                showCopyNotification('Failed to download PDF', 'error');
            }
        }

        function downloadDataBasedOnType(filename) {
            try {
                // Try to get the original Base64 input first
                const base64Input = document.getElementById('base64-input');
                if (base64Input && base64Input.value.trim()) {
                    // Download the Base64 data as a text file
                    const blob = new Blob([base64Input.value.trim()], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filename}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showCopyNotification('Base64 data downloaded successfully!', 'success');
                    return;
                }
                
                // If no Base64 input, try to download current label data
                if (currentLabelData) {
                    const blob = new Blob([currentLabelData], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filename}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showCopyNotification('Label data downloaded successfully!', 'success');
                    return;
                }
                
                showCopyNotification('No data available to download', 'error');
            } catch (error) {
                console.error('Data download failed:', error);
                showCopyNotification('Failed to download file', 'error');
            }
        }

        // Update the generateLabelPreview function to store data
        const originalGenerateLabelPreview = window.generateLabelPreview;
        window.generateLabelPreview = function(data, dataType) {
            currentLabelData = data;
            currentDataType = dataType;
            return originalGenerateLabelPreview(data, dataType);
        };
    }

    // Initialize Range Jumping functionality
    function initializeRangeJumping() {
        const copyQueryBtn = document.getElementById('copy-query');
        const insertScriptInput = document.getElementById('insert-script-input');
        const jumpAmountInput = document.getElementById('jump-amount');
        const generateUpdateBtn = document.getElementById('generate-update');
        const clearRangeJumpBtn = document.getElementById('clear-range-jump');
        const rangeJumpResults = document.getElementById('range-jump-results');
        const updateScript = document.getElementById('update-script');
        const copyUpdateScriptBtn = document.getElementById('copy-update-script');
        const optionTabs = document.querySelectorAll('.option-tab');
        const optionContents = document.querySelectorAll('.option-content');

        // Option tab switching
        optionTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const option = this.getAttribute('data-option');
                
                // Update active tab
                optionTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update active content
                optionContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === option + '-content') {
                        content.classList.add('active');
                    }
                });
            });
        });

        // Copy query button
        copyQueryBtn.addEventListener('click', function() {
            const queryText = document.getElementById('range-query').textContent;
            window.copyToClipboard(queryText);
        });

        // Generate update script button
        generateUpdateBtn.addEventListener('click', function() {
            const insertScript = insertScriptInput.value.trim();
            const jumpAmount = parseInt(jumpAmountInput.value) || 0;

            if (!insertScript) {
                alert('Please paste your INSERT script results first.');
                return;
            }

            if (jumpAmount <= 0) {
                alert('Please enter a valid jump amount (greater than 0).');
                return;
            }

            try {
                const updateScripts = generateUpdateScripts(insertScript, jumpAmount);
                updateScript.textContent = updateScripts;
                rangeJumpResults.style.display = 'block';
                rangeJumpResults.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                alert('Error generating update script: ' + error.message);
            }
        });

        // Clear button
        clearRangeJumpBtn.addEventListener('click', function() {
            insertScriptInput.value = '';
            jumpAmountInput.value = '';
            rangeJumpResults.style.display = 'none';
        });

        // Copy update script button
        copyUpdateScriptBtn.addEventListener('click', function() {
            const scriptText = updateScript.textContent;
            if (scriptText) {
                window.copyToClipboard(scriptText);
            }
        });

        function generateUpdateScripts(insertScript, jumpAmount) {
            console.log('Input script:', insertScript);
            
            // Parse the INSERT script to extract the values
            const lines = insertScript.split('\n').filter(line => line.trim());
            const updateScripts = [];

            // Process the script line by line to find VALUES lines
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                console.log('Processing line:', line);
                
                // Look for VALUES lines that contain the actual data
                if (line.toUpperCase().startsWith('VALUES')) {
                    console.log('Found VALUES line:', line);
                    try {
                        // Extract values from VALUES line - handle multi-line format
                        const valuesMatch = line.match(/VALUES\s*\(([^)]+)\)/i);
                        if (valuesMatch) {
                            console.log('Values match found:', valuesMatch[1]);
                            const valuesString = valuesMatch[1];
                            
                            // Parse the values
                            const cleanValues = parseValues(valuesString);
                            console.log('Clean values:', cleanValues);
                            
                            // Generate UPDATE statements
                            generateUpdateStatements(cleanValues, jumpAmount, updateScripts);
                        } else {
                            console.log('No VALUES match found in line:', line);
                        }
                    } catch (error) {
                        console.error('Error parsing VALUES line:', line, error);
                    }
                }
                
                // Also check if this line contains VALUES data but doesn't start with VALUES
                // This handles the case where VALUES is on one line and data is on the next
                // But only if it looks like actual data (contains numbers and quotes)
                if (line.includes('(') && line.includes(')') && line.includes(',') && 
                    !line.toUpperCase().startsWith('VALUES') && 
                    !line.toUpperCase().includes('CONTRACT_NO') && 
                    !line.toUpperCase().includes('RANGE_ID') &&
                    (line.includes("'") || line.match(/\d+/))) {
                    console.log('Found potential VALUES data line:', line);
                    try {
                        // Try to extract values from this line
                        const valuesMatch = line.match(/\(([^)]+)\)/);
                        if (valuesMatch) {
                            console.log('Values match found in data line:', valuesMatch[1]);
                            const valuesString = valuesMatch[1];
                            
                            // Parse the values
                            const cleanValues = parseValues(valuesString);
                            console.log('Clean values from data line:', cleanValues);
                            
                            // Generate UPDATE statements
                            generateUpdateStatements(cleanValues, jumpAmount, updateScripts);
                        }
                    } catch (error) {
                        console.error('Error parsing data line:', line, error);
                    }
                }
            }

            console.log('Generated update scripts:', updateScripts);

            if (updateScripts.length === 0) {
                throw new Error('No valid INSERT statements found. Please check your input format.');
            }

            return updateScripts.join('\n\n');
        }

        function parseValues(valuesString) {
            // Split by comma, but be careful with quoted strings
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let j = 0; j < valuesString.length; j++) {
                const char = valuesString[j];
                
                if ((char === "'" || char === '"') && !inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                    currentValue += char;
                } else if (char === quoteChar && inQuotes) {
                    inQuotes = false;
                    quoteChar = '';
                    currentValue += char;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            // Add the last value
            if (currentValue.trim()) {
                values.push(currentValue.trim());
            }
            
            console.log('Parsed values:', values);
            
            // Clean up values (remove quotes)
            const cleanValues = values.map(v => v.replace(/^['"]|['"]$/g, ''));
            return cleanValues;
        }

        function generateUpdateStatements(cleanValues, jumpAmount, updateScripts) {
            // Extract the relevant values (assuming the order from the SQL query)
            // CONTRACT_NO, RANGE_ID, CONS_START_NO, CONS_END_NO, CONS_CUR_NO, ITEM_RANGE_ID, START_NO, END_NO, CUR_NO
            if (cleanValues.length >= 9) {
                const contractNo = cleanValues[0];
                const rangeId = cleanValues[1];
                const consCurNo = cleanValues[4];
                const itemRangeId = cleanValues[5];
                const curNo = cleanValues[8];

                console.log('Extracted values:', { contractNo, rangeId, consCurNo, itemRangeId, curNo });

                // Generate UPDATE statements
                if (rangeId && consCurNo && !isNaN(parseInt(consCurNo))) {
                    const newConsCurNo = parseInt(consCurNo) + jumpAmount;
                    updateScripts.push(`UPDATE SHIP_RANGES SET cons_cur_no = ${newConsCurNo} WHERE ID = ${rangeId};`);
                }

                if (itemRangeId && curNo && !isNaN(parseInt(curNo))) {
                    const newCurNo = parseInt(curNo) + jumpAmount;
                    updateScripts.push(`UPDATE ITEM_RANGES SET cur_no = ${newCurNo} WHERE ID = ${itemRangeId};`);
                }
            } else {
                console.log('Not enough values found:', cleanValues.length);
            }
        }
    }
    

    // Close modals when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            toolModal.style.display = 'none';
        });
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            toolModal.style.display = 'none';
        }
    });

    // Header background change on scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    });

// Global function for copying to clipboard
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success notification
        showCopyNotification('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show success notification even for fallback
        showCopyNotification('Copied to clipboard!', 'success');
    });
};

// Function to show copy notification
function showCopyNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.copy-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `copy-notification copy-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 2000);
}

    // Initialize Route Mapping functionality
    function initializeRouteMapping() {
        // Carrier and service data
        const carrierServices = {
            'DPD': [
                { name: 'Next Day Delivery', code: '12' },
                { name: 'Standard Delivery', code: '10' },
                { name: 'Saturday Delivery', code: '15' }
            ],
            'DPD Local': [
                { name: 'Same Day Local', code: 'L01' },
                { name: 'Next Day Local', code: 'L02' }
            ],
            'DHL eCom': [
                { name: 'Standard eCom', code: 'EC01' },
                { name: 'Express eCom', code: 'EC02' },
                { name: 'Premium eCom', code: 'EC03' }
            ],
            'Evri': [
                { name: 'EVRI NEXT DAY IOD', code: 'Nday' },
                { name: 'EVRI STANDARD', code: 'Std' },
                { name: 'EVRI EXPRESS', code: 'Exp' }
            ],
            'UPS': [
                { name: 'UPS Standard', code: 'UPS01' },
                { name: 'UPS Express', code: 'UPS02' },
                { name: 'UPS Next Day Air', code: 'UPS03' }
            ],
            'GFSI': [
                { name: 'GFSI Standard', code: 'GFS01' },
                { name: 'GFSI Express', code: 'GFS02' },
                { name: 'GFSI Premium', code: 'GFS03' }
            ]
        };

        // Get DOM elements
        const carrierSelect = document.getElementById('carrier-select');
        // Service dropdown and code are removed from UI; keep variables undefined-safe
        const serviceSelect = document.getElementById('service-select');
        const serviceCodeInput = document.getElementById('service-code');
        const generateSqlBtn = document.getElementById('generate-sql');
        const clearRouteBtn = document.getElementById('clear-route');
        const routeResults = document.getElementById('route-results');
        const sqlScript = document.getElementById('sql-script');
        const copySqlBtn = document.getElementById('copy-sql');

    // Populate services when carrier is selected
    carrierSelect.addEventListener('change', function() {
        const selectedCarrier = this.value;
        if (serviceSelect) serviceSelect.innerHTML = '';
        if (serviceCodeInput) serviceCodeInput.value = '';
        
        // Show/hide Evri-specific fields
        const evriFields = document.getElementById('evri-fields');
        if (selectedCarrier === 'Evri') {
            evriFields.style.display = 'block';
            // No standard service select for Evri
            if (serviceSelect) {
                serviceSelect.disabled = true;
                serviceSelect.innerHTML = '<option value="">Evri uses custom service selection below</option>';
            }
        } else {
            evriFields.style.display = 'none';
            if (serviceSelect) {
                serviceSelect.disabled = true; // hide/disable since removed
                serviceSelect.innerHTML = '<option value="">No services required</option>';
            }
        }
    });

    // Update service code when service is selected
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.code && serviceCodeInput) {
                serviceCodeInput.value = selectedOption.dataset.code;
            } else if (serviceCodeInput) {
                serviceCodeInput.value = '';
            }
        });
    }

    // Generate SQL button
    generateSqlBtn.addEventListener('click', function() {
        const carrier = carrierSelect.value;
        
        if (!carrier) {
            alert('Please select a carrier first.');
            return;
        }

        let sql = '';
        
        if (carrier === 'Evri') {
            // Handle Evri-specific SQL generation
            sql = generateEvriSQL();
        } else {
            alert('Only Evri is supported right now.');
            return;
        }

        if (sql) {
            sqlScript.textContent = sql;
            routeResults.style.display = 'block';
            
            // Scroll to results
            routeResults.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Function to generate Evri SQL
    function generateEvriSQL() {
        const accountNumber = document.getElementById('evri-account').value;
        const isIOD = document.getElementById('evri-iod').checked;
        const isPOD = document.getElementById('evri-pod').checked;
        const isNextDay = document.getElementById('evri-next-day').checked;
        const is2Day = document.getElementById('evri-2-day').checked;
        const routeDesc = document.getElementById('evri-route-desc').value || 'Evri';

        // Validation
        if (!accountNumber || accountNumber < 0 || accountNumber > 9) {
            alert('Please enter a valid account number (0-9).');
            return '';
        }

        if (!isIOD && !isPOD) {
            alert('Please select at least one delivery type (IOD or POD).');
            return '';
        }

        if (!isNextDay && !is2Day) {
            alert('Please select at least one service (Next Day or 2 Day).');
            return '';
        }

        let sqlStatements = [];

        // Generate SQL for each combination
        if (isNextDay) {
            if (isIOD) {
                const routeCode = `ND${accountNumber}IOD`;
                const contractNo = `7RY07${accountNumber}`;
                sqlStatements.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('${routeCode}','HERMES','${contractNo}','NDAY','${routeDesc} IOD',null,null);`);
            }
            if (isPOD) {
                const routeCode = `ND${accountNumber}POD`;
                const contractNo = `1RY01${accountNumber}`;
                sqlStatements.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('${routeCode}','HERMES','${contractNo}','NDAY','${routeDesc} POD',null,null);`);
            }
        }

        if (is2Day) {
            if (isIOD) {
                const routeCode = `2D${accountNumber}IOD`;
                const contractNo = `7RY07${accountNumber}`;
                sqlStatements.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('${routeCode}','HERMES','${contractNo}','2DAY','${routeDesc} IOD',null,null);`);
            }
            if (isPOD) {
                const routeCode = `2D${accountNumber}POD`;
                const contractNo = `1RY01${accountNumber}`;
                sqlStatements.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('${routeCode}','HERMES','${contractNo}','2DAY','${routeDesc} POD',null,null);`);
            }
        }

        return sqlStatements.join('\n\n');
    }

    // Clear button
    clearRouteBtn.addEventListener('click', function() {
        carrierSelect.value = '';
        if (serviceSelect) {
            serviceSelect.innerHTML = '';
            serviceSelect.disabled = true;
        }
        if (serviceCodeInput) serviceCodeInput.value = '';
        
        // Clear Evri-specific fields
        document.getElementById('evri-fields').style.display = 'none';
        document.getElementById('evri-account').value = '';
        document.getElementById('evri-iod').checked = false;
        document.getElementById('evri-pod').checked = false;
        document.getElementById('evri-next-day').checked = false;
        document.getElementById('evri-2-day').checked = false;
        document.getElementById('evri-route-desc').value = '';
        
        routeResults.style.display = 'none';
    });

        // Copy SQL button
        copySqlBtn.addEventListener('click', function() {
            const sqlText = sqlScript.textContent;
            if (sqlText) {
                window.copyToClipboard(sqlText);
            }
        });
    }

