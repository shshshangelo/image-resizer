class ImageResizer {
    constructor() {
        this.originalImage = null;
        this.resizedImageData = null;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.previewSection = document.getElementById('previewSection');
        this.loading = document.getElementById('loading');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.resizedCanvas = document.getElementById('resizedCanvas');
        this.originalInfo = document.getElementById('originalInfo');
        this.resizedInfo = document.getElementById('resizedInfo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Debug: Check if elements are found
        console.log('Canvas elements found:', {
            originalCanvas: !!this.originalCanvas,
            resizedCanvas: !!this.resizedCanvas,
            originalInfo: !!this.originalInfo,
            resizedInfo: !!this.resizedInfo
        });
    }

    setupEventListeners() {
        // File input events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Control buttons
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Handle window resize for responsive behavior
        window.addEventListener('resize', () => this.handleResize());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        this.showLoading(true);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.processImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    processImage() {
        try {
            console.log('Processing image:', this.originalImage.width, 'x', this.originalImage.height);
            
            // Display original image
            this.displayOriginalImage();
            
            // Create 1:1 resized image
            this.createResizedImage();
            
            // Show preview section
            this.previewSection.style.display = 'block';
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
            this.showLoading(false);
        }
    }

    displayOriginalImage() {
        const canvas = this.originalCanvas;
        const ctx = canvas.getContext('2d');
        
        console.log('Displaying original image, canvas element:', canvas);
        console.log('Original image dimensions:', this.originalImage.width, 'x', this.originalImage.height);
        
        // Responsive canvas sizing based on screen size
        const isMobile = window.innerWidth <= 768;
        const maxDisplaySize = isMobile ? 300 : 400;
        const aspectRatio = this.originalImage.width / this.originalImage.height;
        
        let displayWidth, displayHeight;
        if (aspectRatio > 1) {
            displayWidth = Math.min(maxDisplaySize, this.originalImage.width);
            displayHeight = displayWidth / aspectRatio;
        } else {
            displayHeight = Math.min(maxDisplaySize, this.originalImage.height);
            displayWidth = displayHeight * aspectRatio;
        }
        
        // Ensure canvas doesn't exceed container width on mobile
        const containerWidth = canvas.parentElement.offsetWidth - 20; // Account for padding
        console.log('Container width:', containerWidth);
        
        if (containerWidth > 0 && displayWidth > containerWidth) {
            displayWidth = containerWidth;
            displayHeight = displayWidth / aspectRatio;
            console.log('Adjusted dimensions for container:', displayWidth, 'x', displayHeight);
        }
        
        console.log('Canvas display dimensions:', displayWidth, 'x', displayHeight);
        
        // Set canvas dimensions
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // Clear canvas and draw image
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        ctx.drawImage(this.originalImage, 0, 0, displayWidth, displayHeight);
        
        console.log('Image drawn to canvas');
        
        // Update info with mobile-friendly formatting
        const infoText = isMobile 
            ? `${this.originalImage.width}×${this.originalImage.height}px | ${aspectRatio.toFixed(2)}:1`
            : `Size: ${this.originalImage.width} × ${this.originalImage.height}px | Aspect Ratio: ${aspectRatio.toFixed(2)}:1`;
        
        this.originalInfo.textContent = infoText;
    }

    createResizedImage() {
        const canvas = this.resizedCanvas;
        const ctx = canvas.getContext('2d');
        
        // Calculate the size for 1:1 aspect ratio
        const maxDimension = Math.max(this.originalImage.width, this.originalImage.height);
        
        // Set canvas size
        canvas.width = maxDimension;
        canvas.height = maxDimension;
        
        // Detect dominant color from the image
        const dominantColor = this.getDominantColor(this.originalImage);
        
        // Fill with detected background color
        ctx.fillStyle = dominantColor;
        ctx.fillRect(0, 0, maxDimension, maxDimension);
        
        // Calculate position to center the image
        const x = (maxDimension - this.originalImage.width) / 2;
        const y = (maxDimension - this.originalImage.height) / 2;
        
        // Draw the original image centered
        ctx.drawImage(this.originalImage, x, y);
        
        // Store the resized image data for download
        this.resizedImageData = canvas.toDataURL('image/png');
        
        // Update info with mobile-friendly formatting
        const isMobile = window.innerWidth <= 768;
        const infoText = isMobile 
            ? `${maxDimension}×${maxDimension}px | 1:1 | ${dominantColor}`
            : `Size: ${maxDimension} × ${maxDimension}px | Aspect Ratio: 1:1 | Background: ${dominantColor}`;
        
        this.resizedInfo.textContent = infoText;
    }

    downloadImage() {
        if (!this.resizedImageData) {
            alert('No image to download. Please upload an image first.');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.download = 'resized-image-1x1.png';
        link.href = this.resizedImageData;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    reset() {
        // Clear all data
        this.originalImage = null;
        this.resizedImageData = null;
        
        // Clear file input
        this.fileInput.value = '';
        
        // Hide preview section
        this.previewSection.style.display = 'none';
        
        // Clear canvases
        const originalCtx = this.originalCanvas.getContext('2d');
        const resizedCtx = this.resizedCanvas.getContext('2d');
        originalCtx.clearRect(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        resizedCtx.clearRect(0, 0, this.resizedCanvas.width, this.resizedCanvas.height);
        
        // Clear info
        this.originalInfo.textContent = '';
        this.resizedInfo.textContent = '';
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
        this.uploadArea.style.display = show ? 'none' : 'block';
    }

    getDominantColor(image) {
        // Create a temporary canvas to analyze the image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Use a smaller size for faster processing
        const sampleSize = 200;
        const aspectRatio = image.width / image.height;
        
        let sampleWidth, sampleHeight;
        if (aspectRatio > 1) {
            sampleWidth = sampleSize;
            sampleHeight = sampleSize / aspectRatio;
        } else {
            sampleHeight = sampleSize;
            sampleWidth = sampleSize * aspectRatio;
        }
        
        tempCanvas.width = sampleWidth;
        tempCanvas.height = sampleHeight;
        
        // Draw the image scaled down
        tempCtx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
        
        // Get image data
        const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;
        
        // Color frequency map
        const colorMap = {};
        const step = 4; // Sample every 4th pixel for performance
        
        for (let i = 0; i < data.length; i += step * 4) {
            const r = Math.round(data[i] / 10) * 10; // Round to nearest 10 for grouping
            const g = Math.round(data[i + 1] / 10) * 10;
            const b = Math.round(data[i + 2] / 10) * 10;
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            const colorKey = `${r},${g},${b}`;
            colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
        }
        
        // Find the most frequent color
        let maxCount = 0;
        let dominantColor = '#ffffff'; // fallback
        
        for (const [colorKey, count] of Object.entries(colorMap)) {
            if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = colorKey.split(',').map(Number);
                dominantColor = `rgb(${r}, ${g}, ${b})`;
            }
        }
        
        return dominantColor;
    }

    handleResize() {
        // Debounce resize events to avoid excessive processing
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.originalImage) {
                // Re-display images with new responsive sizing
                this.displayOriginalImage();
                this.createResizedImage();
            }
        }, 250);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageResizer();
});
