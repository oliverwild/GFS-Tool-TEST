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
        } else if (toolType === 'label-preview') {
            document.getElementById('default-wip').style.display = 'none';
            document.getElementById('label-preview-content').style.display = 'block';
            initializeLabelPreview();
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

    // Initialize Label Preview functionality
    function initializeLabelPreview() {
        const base64Input = document.getElementById('base64-input');
        const dataLengthSpan = document.getElementById('data-length');
        const processBtn = document.getElementById('process-label');
        const clearBtn = document.getElementById('clear-label');
        const processStatus = document.getElementById('process-status');
        const labelResults = document.getElementById('label-results');
        const labelError = document.getElementById('label-error');
        const downloadBtn = document.getElementById('download-png');

        // Update data length as user types
        base64Input.addEventListener('input', function() {
            const length = this.value.length;
            dataLengthSpan.textContent = `${length.toLocaleString()} characters`;
        });

        // Process button click
        processBtn.addEventListener('click', processLabel);

        // Clear button click
        clearBtn.addEventListener('click', clearLabelInputs);

        // Download button click
        downloadBtn.addEventListener('click', downloadLabel);

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
                
                // Step 2: Try PDF conversion
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
                // Clean the Base64 string (remove whitespace, newlines, etc.)
                const cleaned = base64String.replace(/\s/g, '');
                
                // Try to decode
                const decoded = atob(cleaned);
                
                // Convert to Uint8Array for further processing
                const bytes = new Uint8Array(decoded.length);
                for (let i = 0; i < decoded.length; i++) {
                    bytes[i] = decoded.charCodeAt(i);
                }
                
                return bytes;
            } catch (error) {
                throw new Error('Invalid Base64 data. Please check your input.');
            }
        }

        function identifyDataType(data) {
            // Check if it's a PDF (PDF files start with %PDF)
            if (data.length >= 4) {
                const header = String.fromCharCode(...data.slice(0, 4));
                if (header === '%PDF') {
                    return 'PDF';
                }
            }
            
            // Check if it's an image (common image headers)
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
            
            // Check if it's text
            const text = String.fromCharCode(...data);
            if (text.match(/^[\x20-\x7E\t\n\r]*$/)) {
                return 'Text';
            }
            
            return 'Binary Data';
        }

        function generateLabelPreview(data, dataType) {
            // For now, we'll create a placeholder preview
            // In a real implementation, this would call the Labelary API
            
            const previewImg = document.getElementById('label-preview-img');
            const dataTypeSpan = document.getElementById('data-type');
            const processedStatus = document.getElementById('processed-status');
            
            // Update info
            dataTypeSpan.textContent = dataType;
            processedStatus.textContent = 'Successfully processed';
            
            // Create a placeholder image (in real implementation, this would be from Labelary)
            if (dataType === 'PDF') {
                // For PDFs, we'd normally convert to image via Labelary
                createPlaceholderImage(previewImg, 'PDF Label', '#667eea');
            } else if (dataType.includes('Image')) {
                // For images, we could display them directly
                createPlaceholderImage(previewImg, 'Image Label', '#10b981');
            } else {
                // For text or binary, create a text representation
                createPlaceholderImage(previewImg, 'Text/Binary Label', '#f59e0b');
            }
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

        function downloadLabel() {
            const imgElement = document.getElementById('label-preview-img');
            if (imgElement.src) {
                const link = document.createElement('a');
                link.download = 'label-preview.png';
                link.href = imgElement.src;
                link.click();
            }
        }

        function clearLabelInputs() {
            base64Input.value = '';
            dataLengthSpan.textContent = '0 characters';
            hideResults();
            hideError();
            hideProcessStatus();
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

