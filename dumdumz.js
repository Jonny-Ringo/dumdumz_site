document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navigation = document.querySelector('.navigation');
    const dropdownButtons = document.querySelectorAll('.dropdown-button');

    // Toggle navigation menu
    if (navToggle && navigation) {
        navToggle.addEventListener('click', () => {
            navigation.classList.toggle('active');
        });
    }

    // Add click event listener to each button
    dropdownButtons.forEach(button => {
        if (button.id) { // Only add dropdown functionality to buttons with IDs
            button.addEventListener('click', function(event) {
                event.stopPropagation(); // Prevent event from bubbling up
                const dropdownContent = this.nextElementSibling;
                
                // Close all other dropdowns first
                const allDropdownContents = document.querySelectorAll('.dropdown-content');
                allDropdownContents.forEach(content => {
                    if (content !== dropdownContent) {
                        content.classList.remove('show');
                    }
                });
                
                // Toggle current dropdown
                dropdownContent.classList.toggle('show');
            });
        }
    });

    // Close dropdowns when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.matches('.dropdown-button')) {
            const dropdowns = document.querySelectorAll('.dropdown-content');
            dropdowns.forEach(dropdown => {
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            });
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 879 && 
            navigation?.classList.contains('active') &&
            !navigation.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navigation.classList.remove('active');
        }
    });
});

// Function to cycle DumDumz images
function cycleDumDumzImages() {
    const imgBaseUrl = 'https://arweave.net/NZ4oRsWSwdO0d6X6uf62phxbbMmwf9mzV3xHYO5dDBA/';
    const imgCount = 1984;
    const cycleInterval = 3000;
    
    // Get all dumzpng images
    const dumzImages = document.querySelectorAll('.dumzpng');
    
    // Get multiple random indices at once for initial load
    const getRandomIndices = (count) => {
        const indices = new Set();
        while(indices.size < count) {
            indices.add(Math.floor(Math.random() * imgCount));
        }
        return Array.from(indices);
    };

    // Load initial images in parallel
    const initialIndices = getRandomIndices(dumzImages.length);
    
    // Set initial images immediately
    dumzImages.forEach((img, index) => {
        img.src = `${imgBaseUrl}${initialIndices[index]}.png`;
    });
    
    // Regular cycle function for subsequent changes
    const getRandomImageUrl = () => {
        const randomIndex = Math.floor(Math.random() * imgCount);
        return `${imgBaseUrl}${randomIndex}.png`;
    };
    
    const updateImage = (imgElement) => {
        const newUrl = getRandomImageUrl();
        imgElement.src = newUrl;
    };
    
    // Set up cycling after initial load
    dumzImages.forEach((img, index) => {
        const staggeredInterval = cycleInterval + (index * 1000);
        setInterval(() => updateImage(img), staggeredInterval);
    });
}

// Start as early as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cycleDumDumzImages);
} else {
    cycleDumDumzImages();
}