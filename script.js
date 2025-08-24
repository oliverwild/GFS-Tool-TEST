// Modal functionality for GFS Tools
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const toolModal = document.getElementById('tool-modal');
    const wikiModal = document.getElementById('wiki-modal');
    const modalTitle = document.getElementById('modal-title');
    const wikiTitle = document.getElementById('wiki-title');
    const wikiContent = document.getElementById('wiki-content');

    // Get close buttons
    const closeButtons = document.querySelectorAll('.close');

    // Tool data for wiki content
    const toolWikiData = {
        'range-jumping': {
            title: 'Range Jumping Tool',
            description: 'Convert SQL inserts to update scripts with number jumping functionality.',
            howToUse: [
                'Paste your SQL INSERT statements into the input area',
                'Enter the jump number you want to apply',
                'Click "Convert" to generate the UPDATE script',
                'Copy the generated script for use in your database'
            ],
            examples: [
                'Input: INSERT INTO table (id, name) VALUES (1, "Item 1")',
                'Jump Number: 100',
                'Output: UPDATE table SET id = id + 100 WHERE id = 1'
            ]
        },
        'range-splitting': {
            title: 'Range Splitting Tool',
            description: 'Split number ranges by percentage for efficient distribution.',
            howToUse: [
                'Enter the starting number in the first field',
                'Enter the ending number in the second field',
                'Adjust the percentage slider to your desired split',
                'View the calculated ranges and copy results'
            ],
            examples: [
                'Start: 1, End: 100, Split: 50%',
                'Result: Range 1-50 and Range 51-100'
            ]
        },
        'label-preview': {
            title: 'Label Preview Tool',
            description: 'Decode Base64, convert to PDF, and preview labels with Labelary API.',
            howToUse: [
                'Paste your Base64 encoded label data',
                'Click "Process" to decode and convert',
                'View the label preview',
                'Download as PNG if needed'
            ],
            examples: [
                'Input: Base64 encoded label data',
                'Process: Decode → PDF conversion → Labelary API',
                'Output: Visual label preview'
            ]
        },
        'route-mapping': {
            title: 'Route Mapping Tool',
            description: 'Generate SQL inserts for carriers, services, and route details.',
            howToUse: [
                'Select carrier from the dropdown menu',
                'Choose applicable services',
                'Fill in additional route details',
                'Generate SQL inserts for database use'
            ],
            examples: [
                'Carrier: FedEx, Services: Ground, Express',
                'Details: Origin, Destination, Transit Time',
                'Output: SQL INSERT statements for each route'
            ]
        }
    };

    // Open tool modal
    document.querySelectorAll('.open-tool').forEach(button => {
        button.addEventListener('click', function() {
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

            const totalRange = end - start + 1;
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
            document.getElementById('first-range').textContent = firstRange;
            document.getElementById('first-count').textContent = `${firstCount} numbers`;
            document.getElementById('second-range').textContent = secondRange;
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

    // Open wiki modal
    document.querySelectorAll('.wiki-tool').forEach(button => {
        button.addEventListener('click', function() {
            const toolType = this.getAttribute('data-tool');
            const toolData = toolWikiData[toolType];
            
            if (toolData) {
                wikiTitle.textContent = `${toolData.title} - Wiki`;
                wikiContent.innerHTML = generateWikiContent(toolData);
                wikiModal.style.display = 'block';
            }
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });

    // Generate wiki content
    function generateWikiContent(toolData) {
        return `
            <div class="wiki-section">
                <h3>Description</h3>
                <p>${toolData.description}</p>
                
                <h3>How to Use</h3>
                <ol>
                    ${toolData.howToUse.map(step => `<li>${step}</li>`).join('')}
                </ol>
                
                <h3>Examples</h3>
                <div class="examples">
                    ${toolData.examples.map(example => `<div class="example-item">${example}</div>`).join('')}
                </div>
            </div>
        `;
    }

    // Close modals when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            toolModal.style.display = 'none';
            wikiModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === toolModal) {
            toolModal.style.display = 'none';
        }
        if (event.target === wikiModal) {
            wikiModal.style.display = 'none';
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            toolModal.style.display = 'none';
            wikiModal.style.display = 'none';
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

