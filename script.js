// Settings Management
function initializeSettings(toolModal) {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const themeSelect = document.getElementById('theme-select');
    const resetSettingsBtn = document.getElementById('reset-settings');
    
    loadSettings();
    
    if (settingsToggle) {
        settingsToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (toolModal) {
                toolModal.style.display = 'none';
            }
            
            showSimpleSettingsModal();
        });
    }
    
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    } else {
        console.error('Close settings button not found!');
    }
    
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            saveSettings();
        });
    } else {
        console.error('Theme select not found!');
    }
    
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            resetSettings();
        });
    } else {
        console.error('Reset settings button not found!');
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal.style.display === 'block') {
            settingsModal.style.display = 'none';
        }
    });
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
    
    const theme = settings.theme || 'dark';
    applyTheme(theme);
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = theme;
    } else {
        console.error('Theme select element not found!');
    }
    
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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        body.setAttribute('data-theme', theme);
    }
}

function resetSettings() {
    localStorage.removeItem('gfs-settings');
    location.reload();
}

// Tool Management
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
    
    initializeDragAndDrop();
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

// Simple Settings Modal
function showSimpleSettingsModal() {
    const existingModal = document.getElementById('simple-settings-modal');
    if (existingModal) {
        existingModal.remove();
    }
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
    
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    modal.setAttribute('data-theme', currentTheme);
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
    
    content.innerHTML = `
        <div style="position: relative; margin-bottom: 1rem;">
            <h2 style="margin: 0; color: var(--text-primary, #ffffff);">Settings</h2>
            <button id="close-simple-settings" class="close-modal-btn" style="position: absolute; top: 0; right: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; font-size: 16px;"><i class="fas fa-times"></i></button>
        </div>
        
        <div style="height: 1px; background: var(--border-color, #666); margin-bottom: 1.5rem;"></div>
        
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
    
    document.getElementById('close-simple-settings').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('reset-simple-settings').addEventListener('click', () => {
        localStorage.removeItem('gfs-settings');
        location.reload();
    });
    const themeSlider = document.getElementById('theme-toggle-slider');
    const themeSliderHandle = themeSlider.querySelector('div');
    if (currentTheme === 'dark') {
        themeSlider.style.background = '#333333';
        themeSlider.style.borderColor = '#555555';
        themeSliderHandle.style.background = '#ffffff';
        themeSliderHandle.style.transform = 'translateX(30px)';
    } else {
        themeSlider.style.background = '#ffffff';
        themeSlider.style.borderColor = '#000000';
        themeSliderHandle.style.background = '#000000';
        themeSliderHandle.style.transform = 'translateX(0px)';
    }
    
    themeSlider.addEventListener('click', () => {
        const isDark = themeSlider.style.background === 'rgb(51, 51, 51)';
        
        if (isDark) {
            themeSlider.style.background = '#ffffff';
            themeSlider.style.borderColor = '#000000';
            themeSliderHandle.style.background = '#000000';
            themeSliderHandle.style.transform = 'translateX(0px)';
            applyTheme('light');
            modal.setAttribute('data-theme', 'light');
        } else {
            themeSlider.style.background = '#333333';
            themeSlider.style.borderColor = '#555555';
            themeSliderHandle.style.background = '#ffffff';
            themeSliderHandle.style.transform = 'translateX(30px)';
            applyTheme('dark');
            modal.setAttribute('data-theme', 'dark');
        }
        
        saveSettings();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    populateSimpleToolList();
}

function populateSimpleToolList() {
    const toolList = document.getElementById('simple-tool-list');
    const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
    
    const toolOrder = (settings.toolOrder && settings.toolOrder.length > 0) ? settings.toolOrder : ['range-splitting', 'label-preview', 'range-jumping', 'route-mapping'];
    const toolVisibility = (settings.toolVisibility && Object.keys(settings.toolVisibility).length > 0) ? settings.toolVisibility : {
        'range-splitting': true,
        'label-preview': true,
        'range-jumping': true,
        'route-mapping': true
    };
    
    const toolData = {
        'range-splitting': { name: 'Range Splitting', description: 'Split ranges into smaller segments' },
        'label-preview': { name: 'Label Preview', description: 'Preview and generate shipping labels' },
        'range-jumping': { name: 'Range Jumping', description: 'Generate UPDATE scripts for range numbers' },
        'route-mapping': { name: 'Route Mapping', description: 'Generate SQL INSERT statements for carrier routes' }
    };
    
    toolList.innerHTML = '';
    
    toolOrder.forEach(toolId => {
        const tool = toolData[toolId];
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
    
    initializeSimpleDragAndDrop();
    document.querySelectorAll('.simple-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const toolId = toggle.dataset.toolId;
            const isActive = toggle.style.background === 'rgb(76, 175, 80)';
            
            toggle.style.background = isActive ? '#666' : '#4CAF50';
            toggle.querySelector('div').style.transform = isActive ? 'translateX(0px)' : 'translateX(20px)';
            
            const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
            if (!settings.toolVisibility) settings.toolVisibility = {};
            settings.toolVisibility[toolId] = !isActive;
            localStorage.setItem('gfs-settings', JSON.stringify(settings));
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
    let dropIndicator = null;
    
    function createDropIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.style.cssText = `
            height: 2px;
            background: #4CAF50;
            margin: 2px 0;
            border-radius: 1px;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        return indicator;
    }
    
    toolList.addEventListener('dragstart', (e) => {
        draggedElement = e.target.closest('.simple-tool-item');
        if (draggedElement) {
            draggedElement.style.opacity = '1';
            draggedElement.style.transform = 'scale(1.02)';
            draggedElement.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            draggedElement.style.zIndex = '1000';
            draggedElement.style.border = '2px solid #4CAF50';
            
            dropIndicator = createDropIndicator();
        }
    });
    
    toolList.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.style.opacity = '1';
            draggedElement.style.transform = 'scale(1)';
            draggedElement.style.boxShadow = '';
            draggedElement.style.zIndex = '';
            draggedElement.style.border = '';
            draggedElement = null;
        }
        
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.parentNode.removeChild(dropIndicator);
        }
        dropIndicator = null;
    });
    
    toolList.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedElement) return;
        
        const afterElement = getSimpleDragAfterElement(toolList, e.clientY);
        
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.parentNode.removeChild(dropIndicator);
        }
        
        if (afterElement) {
            toolList.insertBefore(dropIndicator, afterElement);
        } else {
            toolList.appendChild(dropIndicator);
        }
        
        dropIndicator.style.opacity = '1';
    });
    
    toolList.addEventListener('dragleave', (e) => {
        if (!toolList.contains(e.relatedTarget)) {
            if (dropIndicator) {
                dropIndicator.style.opacity = '0';
            }
        }
    });
    
    toolList.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.parentNode.removeChild(dropIndicator);
        }
        dropIndicator = null;
        
        if (draggedElement) {
            const afterElement = getSimpleDragAfterElement(toolList, e.clientY);
            
            if (afterElement) {
                toolList.insertBefore(draggedElement, afterElement);
            } else {
                toolList.appendChild(draggedElement);
            }
            
            const newOrder = Array.from(toolList.children).map(item => item.dataset.toolId);
            const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
            settings.toolOrder = newOrder;
            localStorage.setItem('gfs-settings', JSON.stringify(settings));
            
            applyToolOrder(newOrder);
        }
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


// Main Application
document.addEventListener('DOMContentLoaded', function() {
    const toolModal = document.getElementById('tool-modal');
    const modalTitle = document.getElementById('modal-title');
    
    initializeSettings(toolModal);
    const closeButtons = document.querySelectorAll('.close-modal-btn');


    document.querySelectorAll('.open-tool').forEach(button => {
        button.addEventListener('click', function() {
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
            
            const toolType = this.getAttribute('data-tool');
            const toolName = this.closest('.tool-card').querySelector('h3').textContent;
            
            modalTitle.textContent = toolName;
            toolModal.style.display = 'block';
            
            showToolContent(toolType);
        
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
        });
    });

    function showToolContent(toolType) {
        document.querySelectorAll('.tool-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('default-wip').style.display = 'block';
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

    function initializeRangeSplitter() {
        const startInput = document.getElementById('start-range');
        const endInput = document.getElementById('end-range');
        const percentageSlider = document.getElementById('split-percentage');
        const percentageDisplay = document.getElementById('percentage-display');
        const calculateBtn = document.getElementById('calculate-split');
        const copyBtn = document.getElementById('copy-results');
        const clearBtn = document.getElementById('clear-inputs');

        percentageSlider.addEventListener('input', function() {
            percentageDisplay.textContent = this.value + '%';
            if (startInput.value && endInput.value) {
                calculateSplit();
            }
        });

        startInput.addEventListener('input', calculateSplit);
        endInput.addEventListener('input', calculateSplit);
        calculateBtn.addEventListener('click', calculateSplit);
        copyBtn.addEventListener('click', copyResults);
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

            updateRangeInfo(`${start} to ${end}`, totalRange);
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
            const firstParts = firstRange.split(' to ');
            const secondParts = secondRange.split(' to ');
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

    function initializeLabelPreview() {
        const base64Input = document.getElementById('base64-input');
        const dataLengthSpan = document.getElementById('data-length');
        const processBtn = document.getElementById('process-label');
        const clearBtn = document.getElementById('clear-label');
        const processStatus = document.getElementById('process-status');
        const labelResults = document.getElementById('label-results');
        const labelError = document.getElementById('label-error');
        base64Input.addEventListener('input', function() {
            const length = this.value.length;
            dataLengthSpan.textContent = `${length.toLocaleString()} characters`;
        });

        processBtn.addEventListener('click', processLabel);
        clearBtn.addEventListener('click', clearLabelInputs);

        function processLabel() {
            const base64Data = base64Input.value.trim();
            if (!base64Data) {
                showError('Please paste your Base64 encoded label data.');
                return;
            }

            hideError();
            hideResults();
            showProcessStatus();
            resetProcessSteps();

            try {
                updateProcessStep('step-decode', 'completed');
                const decodedData = cleanAndDecodeBase64(base64Data);
                
                updateProcessStep('step-convert', 'completed');
                const dataType = identifyDataType(decodedData);
                
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
                let cleaned = base64String;
                
                cleaned = cleaned.replace(/[\s\r\n\t]/g, '');
                cleaned = cleaned.replace(/<\/?Image\/?/g, '');
                cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
                cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
                
                while (cleaned.length % 4 !== 0) {
                    cleaned += '=';
                }
                
                cleaned = cleaned.replace(/=+$/, '');
                while (cleaned.length % 4 !== 0) {
                    cleaned += '=';
                }
                
                const decoded = atob(cleaned);
                
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
            if (data.length >= 4) {
                const header = String.fromCharCode(...data.slice(0, 4));
                
                if (header === '%PDF' || header.startsWith('%PDF')) {
                    return 'PDF';
                }
                
                const firstBytes = data.slice(0, 10);
                const firstBytesText = String.fromCharCode(...firstBytes);
                
                if (firstBytesText.includes('%PDF')) {
                    return 'PDF';
                }
            }
            
            if (data.length >= 8) {
                const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
                const jpgHeader = [0xFF, 0xD8, 0xFF];
                
                if (pngHeader.every((byte, i) => data[i] === byte)) {
                    return 'PNG Image';
                }
                if (jpgHeader.every((byte, i) => data[i] === byte)) {
                    return 'JPEG Image';
                }
            }
            
            const text = String.fromCharCode(...data);
            
            if (text.includes('^XA') || text.includes('^FO') || text.includes('^FD') || text.includes('^FS')) {
                return 'ZPL Text';
            }
            
            if (text.match(/^[\x20-\x7E\t\n\r]*$/)) {
                const readableChars = text.replace(/[\x00-\x1F\x7F]/g, '').length;
                const totalChars = text.length;
                const readabilityRatio = readableChars / totalChars;
                
                const binaryPatterns = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\xA0-\xFF]/g;
                const binaryCharCount = (text.match(binaryPatterns) || []).length;
                const binaryRatio = binaryCharCount / totalChars;
                
                if (readabilityRatio > 0.9 && binaryRatio < 0.05) {
                    return 'Text';
                } else if (readabilityRatio > 0.8 && binaryRatio < 0.1) {
                    return 'Text';
                } else {
                    return 'Binary Data';
                }
            }
            
            return 'Binary Data';
        }

        function generateLabelPreview(data, dataType) {
            const previewContainer = document.getElementById('preview-container');
            const dataTypeSpan = document.getElementById('data-type');
            const processedStatus = document.getElementById('processed-status');
            
            dataTypeSpan.textContent = dataType;
            
            if (dataType === 'PDF') {
                processedStatus.textContent = 'Creating PDF preview...';
                
                const pdfBase64 = btoa(String.fromCharCode(...data));
                const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
                
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                const pdfEmbed = document.createElement('embed');
                pdfEmbed.src = pdfDataUrl;
                pdfEmbed.type = 'application/pdf';
                pdfEmbed.width = '100%';
                pdfEmbed.height = '500';
                pdfEmbed.style.cssText = 'border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                
                previewContainer.appendChild(pdfEmbed);
                
                processedStatus.textContent = 'PDF preview created successfully';
                return;
            }
            
            if (dataType === 'PNG Image') {
                processedStatus.textContent = 'Creating PNG preview...';
                
                const pngBase64 = btoa(String.fromCharCode(...data));
                const pngDataUrl = `data:image/png;base64,${pngBase64}`;
                
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                const pngImg = document.createElement('img');
                pngImg.src = pngDataUrl;
                pngImg.alt = 'PNG Preview';
                pngImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                
                previewContainer.appendChild(pngImg);
                
                processedStatus.textContent = 'PNG preview created successfully';
                return;
            }
            
            if (dataType === 'JPEG Image') {
                processedStatus.textContent = 'Creating JPEG preview...';
                
                const jpegBase64 = btoa(String.fromCharCode(...data));
                const jpegDataUrl = `data:image/jpeg;base64,${jpegBase64}`;
                
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                const jpegImg = document.createElement('img');
                jpegImg.src = jpegDataUrl;
                jpegImg.alt = 'JPEG Preview';
                jpegImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                
                previewContainer.appendChild(jpegImg);
                
                processedStatus.textContent = 'JPEG preview created successfully';
                return;
            }
            
            if (dataType === 'ZPL Text') {
                processedStatus.textContent = 'Processing ZPL with Labelary API...';
                
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                const previewImg = document.createElement('img');
                previewImg.id = 'label-preview-img';
                previewImg.alt = 'Label Preview';
                previewImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                previewContainer.appendChild(previewImg);
                
                callLabelaryAPI(data, dataType).then(labelImageUrl => {
                    previewImg.src = labelImageUrl;
                    processedStatus.textContent = 'ZPL label preview generated successfully';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                }).catch(error => {
                    console.error('Labelary API error for ZPL:', error);
                    createPlaceholderImage(previewImg, 'ZPL Text - API Failed', '#f59e0b');
                    processedStatus.textContent = 'ZPL processing failed, showing placeholder';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                });
                return;
            }
            
            if (dataType === 'Text') {
                processedStatus.textContent = 'Converting text to label with Labelary API...';
                
                const previewInfo = previewContainer.querySelector('.preview-info');
                previewContainer.innerHTML = '';
                if (previewInfo) {
                    previewContainer.appendChild(previewInfo);
                }
                
                const previewImg = document.createElement('img');
                previewImg.id = 'label-preview-img';
                previewImg.alt = 'Label Preview';
                previewImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
                previewContainer.appendChild(previewImg);
                
                callLabelaryAPI(data, dataType).then(labelImageUrl => {
                    previewImg.src = labelImageUrl;
                    processedStatus.textContent = 'Text label generated successfully';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                }).catch(error => {
                    console.error('Labelary API error for text:', error);
                    createPlaceholderImage(previewImg, 'Text Label - API Failed', '#f59e0b');
                    processedStatus.textContent = 'Text processing failed, showing placeholder';
                    previewImg.style.display = 'block';
                    previewImg.style.visibility = 'visible';
                });
                return;
            }
            
            processedStatus.textContent = 'Processing with Labelary API...';
            
            const previewInfo = previewContainer.querySelector('.preview-info');
            previewContainer.innerHTML = '';
            if (previewInfo) {
                previewContainer.appendChild(previewInfo);
            }
            
            const previewImg = document.createElement('img');
            previewImg.id = 'label-preview-img';
            previewImg.alt = 'Label Preview';
            previewImg.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #e5e7eb; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
            previewContainer.appendChild(previewImg);
            
            callLabelaryAPI(data, dataType).then(labelImageUrl => {
                previewImg.src = labelImageUrl;
                processedStatus.textContent = 'Label generated successfully';
                previewImg.style.display = 'block';
                previewImg.style.visibility = 'visible';
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
                let zplData = '';
                
                if (dataType === 'Text') {
                    const text = String.fromCharCode(...data);
                    zplData = `^XA^FO50,50^A0N,50,50^FD${text}^FS^XZ`;
                } else if (dataType === 'ZPL Text') {
                    zplData = String.fromCharCode(...data);
                } else if (dataType === 'Binary Data') {
                    zplData = `^XA^FO50,50^A0N,50,50^FDBinary Data^FS^XZ`;
                } else {
                    zplData = `^XA^FO50,50^A0N,50,50^FD${dataType} Data^FS^XZ`;
                }
                
                let labelaryUrl;
                
                labelaryUrl = `https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/`;
                
                fetch(labelaryUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'image/png',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: zplData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('image/')) {
                        return response.blob();
                    } else {
                        throw new Error('Response is not an image');
                    }
                })
                .then(blob => {
                    const imageUrl = URL.createObjectURL(blob);
                    resolve(imageUrl);
                })
                .catch(error => {
                    console.error('Direct Labelary API call failed:', error);
                    createLocalZPLPreview(zplData, resolve);
    });
        });
        }



        function createLocalZPLPreview(zplData, resolve) {
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
                labelTexts = fdMatches.map(match => match.substring(3));
                hasContent = true;
            }
            
            // If no FD commands found, try to extract any readable text
            if (!hasContent) {
                const readableText = zplData.replace(/[\x00-\x1F\x7F-\xFF]/g, ' ').trim();
                if (readableText.length > 0) {
                    labelTexts = [readableText.substring(0, 100)];
                    hasContent = true;
                }
            }
            
            if (hasContent && labelTexts.length > 0) {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                let yPosition = 100;
                labelTexts.forEach((text, index) => {
                    if (index < 8) {
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
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('ZPL Label Preview', canvas.width / 2, canvas.height / 2);
                
                ctx.font = '16px monospace';
                ctx.fillStyle = '#666666';
                ctx.fillText('Local Preview Generated', canvas.width / 2, canvas.height / 2 + 40);
            }
            
            ctx.font = '14px monospace';
            ctx.fillStyle = '#999999';
            ctx.fillText('ZPL Data Length: ' + zplData.length + ' chars', 50, canvas.height - 30);
            
            const imageUrl = canvas.toDataURL('image/png');
            resolve(imageUrl);
        }

        function createPlaceholderImage(imgElement, text, color) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 400;
            canvas.height = 300;
            
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#666';
            ctx.fillText('Labelary Preview', canvas.width / 2, canvas.height / 2 + 40);
            
            imgElement.src = canvas.toDataURL('image/png');
        }



        function clearLabelInputs() {
            base64Input.value = '';
            dataLengthSpan.textContent = '0 characters';
            hideResults();
            hideError();
            hideProcessStatus();
            
            const previewContainer = document.getElementById('preview-container');
            const dataTypeSpan = document.getElementById('data-type');
            const processedStatus = document.getElementById('processed-status');
            
            if (dataTypeSpan) dataTypeSpan.textContent = '-';
            if (processedStatus) processedStatus.textContent = '';
            
            if (previewContainer) {
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

        optionTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const option = this.getAttribute('data-option');
                
                optionTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                optionContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === option + '-content') {
                        content.classList.add('active');
                    }
                });
            });
        });

        copyQueryBtn.addEventListener('click', function() {
            const queryText = document.getElementById('range-query').textContent;
            window.copyToClipboard(queryText);
        });

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

        copyUpdateScriptBtn.addEventListener('click', function() {
            const scriptText = updateScript.textContent;
            if (scriptText) {
                window.copyToClipboard(scriptText);
            }
        });

        function generateUpdateScripts(insertScript, jumpAmount) {
            const lines = insertScript.split('\n').filter(line => line.trim());
            const updateScripts = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.toUpperCase().startsWith('VALUES')) {
                    try {
                        const valuesMatch = line.match(/VALUES\s*\(([^)]+)\)/i);
                        if (valuesMatch) {
                            const valuesString = valuesMatch[1];
                            
                            const cleanValues = parseValues(valuesString);
                            
                            // Generate UPDATE statements
                            generateUpdateStatements(cleanValues, jumpAmount, updateScripts);
                        }
                    } catch (error) {
                        console.error('Error parsing VALUES line:', error);
                    }
                }
                
                if (line.includes('(') && line.includes(')') && line.includes(',') && 
                    !line.toUpperCase().startsWith('VALUES') && 
                    !line.toUpperCase().includes('CONTRACT_NO') && 
                    !line.toUpperCase().includes('RANGE_ID') &&
                    (line.includes("'") || line.match(/\d+/))) {
                    try {
                        // Try to extract values from this line
                        const valuesMatch = line.match(/\(([^)]+)\)/);
                        if (valuesMatch) {
                            const valuesString = valuesMatch[1];
                            
                            const cleanValues = parseValues(valuesString);
                            
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
            
            if (currentValue.trim()) {
                values.push(currentValue.trim());
            }
            
            const cleanValues = values.map(v => v.replace(/^['"]|['"]$/g, ''));
            return cleanValues;
        }

        function generateUpdateStatements(cleanValues, jumpAmount, updateScripts) {
            if (cleanValues.length >= 9) {
                const contractNo = cleanValues[0];
                const rangeId = cleanValues[1];
                const consCurNo = cleanValues[4];
                const itemRangeId = cleanValues[5];
                const curNo = cleanValues[8];

                if (rangeId && consCurNo && !isNaN(parseInt(consCurNo))) {
                    const newConsCurNo = parseInt(consCurNo) + jumpAmount;
                    updateScripts.push(`UPDATE SHIP_RANGES SET cons_cur_no = ${newConsCurNo} WHERE ID = ${rangeId};`);
                }

                if (itemRangeId && curNo && !isNaN(parseInt(curNo))) {
                    const newCurNo = parseInt(curNo) + jumpAmount;
                    updateScripts.push(`UPDATE ITEM_RANGES SET cur_no = ${newCurNo} WHERE ID = ${itemRangeId};`);
                }
            }
        }
    }
    

    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            toolModal.style.display = 'none';
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            toolModal.style.display = 'none';
        }
    });

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

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showCopyNotification('Copied to clipboard!', 'success');
    });
};

function showCopyNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.copy-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `copy-notification copy-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 2000);
}

    function initializeRouteMapping() {
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

        const carrierSelect = document.getElementById('carrier-select');
        const serviceSelect = document.getElementById('service-select');
        const serviceCodeInput = document.getElementById('service-code');
        const generateSqlBtn = document.getElementById('generate-sql');
        const clearRouteBtn = document.getElementById('clear-route');
        const routeResults = document.getElementById('route-results');
        const sqlScript = document.getElementById('sql-script');
        const copySqlBtn = document.getElementById('copy-sql');

    carrierSelect.addEventListener('change', function() {
        const selectedCarrier = this.value;
        if (serviceSelect) serviceSelect.innerHTML = '';
        if (serviceCodeInput) serviceCodeInput.value = '';
        
        const evriFields = document.getElementById('evri-fields');
        if (selectedCarrier === 'Evri') {
            evriFields.style.display = 'block';
            if (serviceSelect) {
                serviceSelect.disabled = true;
                serviceSelect.innerHTML = '<option value="">Evri uses custom service selection below</option>';
            }
        } else {
            evriFields.style.display = 'none';
            if (serviceSelect) {
                serviceSelect.disabled = true;
                serviceSelect.innerHTML = '<option value="">No services required</option>';
            }
        }
    });

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

    generateSqlBtn.addEventListener('click', function() {
        const carrier = carrierSelect.value;
        
        if (!carrier) {
            alert('Please select a carrier first.');
            return;
        }

        let sql = '';
        
        if (carrier === 'Evri') {
            sql = generateEvriSQL();
        } else {
            alert('Only Evri is supported right now.');
            return;
        }

        if (sql) {
            sqlScript.textContent = sql;
            routeResults.style.display = 'block';
            
            routeResults.scrollIntoView({ behavior: 'smooth' });
        }
    });

    function generateEvriSQL() {
        const accountNumber = document.getElementById('evri-account').value;
        const isIOD = document.getElementById('evri-iod').checked;
        const isPOD = document.getElementById('evri-pod').checked;
        const isNextDay = document.getElementById('evri-next-day').checked;
        const is2Day = document.getElementById('evri-2-day').checked;
        const routeDesc = document.getElementById('evri-route-desc').value || 'Evri';

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

        copySqlBtn.addEventListener('click', function() {
            const sqlText = sqlScript.textContent;
            if (sqlText) {
                window.copyToClipboard(sqlText);
            }
        });
    }
