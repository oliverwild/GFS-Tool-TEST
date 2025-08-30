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
            description: 'Decode Base64 and preview labels either with PDF or Labelary API.',
            howToUse: [
                'Paste your Base64 encoded data (PDF, text, images, etc.)',
                'Click "Process Label" to decode and identify content type',
                'View the generated label preview from Labelary',
                'Download as PNG if needed'
            ],
            examples: [
                'Input: Base64 encoded data (PDF, text, images)',
                'Process: Decode → Identify Type → Convert to ZPL → Labelary API',
                'Output: Visual label preview based on content type'
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
        } else if (toolType === 'route-mapping') {
            document.getElementById('default-wip').style.display = 'none';
            document.getElementById('route-mapping-content').style.display = 'block';
            // Route Mapping is initialized via DOMContentLoaded event listener
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

// Route Mapping Tool Functionality
document.addEventListener('DOMContentLoaded', function() {
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
        serviceSelect.innerHTML = '<option value="">Select a service...</option>';
        serviceCodeInput.value = '';
        
        // Show/hide Evri-specific fields
        const evriFields = document.getElementById('evri-fields');
        if (selectedCarrier === 'Evri') {
            evriFields.style.display = 'block';
            // Disable regular service selection for Evri
            serviceSelect.disabled = true;
            serviceSelect.innerHTML = '<option value="">Evri uses custom service selection below</option>';
        } else {
            evriFields.style.display = 'none';
            serviceSelect.disabled = false;
            
            if (selectedCarrier && carrierServices[selectedCarrier]) {
                carrierServices[selectedCarrier].forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.name;
                    option.textContent = service.name;
                    option.dataset.code = service.code;
                    serviceSelect.appendChild(option);
                });
            }
        }
    });

    // Update service code when service is selected
    serviceSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.code) {
            serviceCodeInput.value = selectedOption.dataset.code;
        } else {
            serviceCodeInput.value = '';
        }
    });

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
            // Handle other carriers with original logic
            const service = serviceSelect.value;
            const serviceCode = serviceCodeInput.value;
            const origin = document.getElementById('origin').value;
            const destination = document.getElementById('destination').value;
            const priority = document.getElementById('priority').value;
            const notes = document.getElementById('notes').value;

            if (!service || !serviceCode) {
                alert('Please select a service first.');
                return;
            }

            sql = `INSERT INTO route_mapping (
    carrier_name,
    service_name,
    service_code,
    origin,
    destination,
    priority,
    notes,
    created_date
) VALUES (
    '${carrier}',
    '${service}',
    '${serviceCode}',
    '${origin || 'NULL'}',
    '${destination || 'NULL'}',
    '${priority}',
    '${notes || 'NULL'}',
    GETDATE()
);`;
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
        serviceSelect.innerHTML = '<option value="">Select a carrier first...</option>';
        serviceSelect.disabled = true;
        serviceCodeInput.value = '';
        document.getElementById('origin').value = '';
        document.getElementById('destination').value = '';
        document.getElementById('priority').value = 'Standard';
        document.getElementById('notes').value = '';
        
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
});

