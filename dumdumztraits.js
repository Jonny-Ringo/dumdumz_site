class DumDumzBrowser {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.nfts = [];
        this.rarityData = {};
        this.selectedTraits = new Map();
        this.traitTypes = new Map();
        this.sortBy = '';
        this.searchTerm = '';
        
        // Cache DOM elements
        this.elements = {
            searchBox: document.querySelector('.search-box'),
            traitsFilter: document.querySelector('.traits-filter'),
            nftGrid: document.querySelector('.nft-grid'),
            paginationNumbers: document.querySelector('.pagination-numbers'),
            prevButton: document.querySelector('.pagination-prev'),
            nextButton: document.querySelector('.pagination-next'),
            modal: document.querySelector('.nft-modal'),
            modalContent: document.querySelector('.modal-content'),
            modalClose: document.querySelector('.modal-close')
        };
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });
        
        this.elements.prevButton?.addEventListener('click', () => this.previousPage());
        this.elements.nextButton?.addEventListener('click', () => this.nextPage());

        // Add search event listeners
        this.elements.searchBox?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.selectedTraits.clear(); // Clear filters when searching
            this.updateTraitCheckboxes(); // Update UI to reflect cleared filters
            this.filterNFTs();
        });

        this.elements.searchBox?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchTerm = e.target.value.toLowerCase();
                this.selectedTraits.clear();
                this.updateTraitCheckboxes();
                this.filterNFTs();
            }
        });
    }
    
    async initialize() {
        try {
            const response = await fetch('dumdum_full_data.json');
            this.nfts = await response.json();
            this.calculateRarity();
            this.createTraitFilters();
            this.filterNFTs();
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }
    
    calculateRarity() {
        const traitCounts = {};
        
        // First pass: Count occurrences of each trait value
        this.nfts.forEach(nft => {
            nft.attributes.forEach(attr => {
                if (!traitCounts[attr.trait_type]) {
                    traitCounts[attr.trait_type] = {};
                }
                if (!traitCounts[attr.trait_type][attr.value]) {
                    traitCounts[attr.trait_type][attr.value] = 0;
                }
                traitCounts[attr.trait_type][attr.value]++;
                
                // Build trait types map for filtering
                if (!this.traitTypes.has(attr.trait_type)) {
                    this.traitTypes.set(attr.trait_type, new Set());
                }
                this.traitTypes.get(attr.trait_type).add(attr.value);
            });
        });
        
        // Calculate rarity scores by summing trait counts
        this.rarityScores = this.nfts.map((nft, index) => {
            let rarityScore = 0;
            nft.attributes.forEach(attr => {
                // Add the occurrence count of each trait
                rarityScore += traitCounts[attr.trait_type][attr.value];
            });
            return { index, edition: nft.edition, score: rarityScore };
        });
        
        // Sort by score (lower is rarer) and store ranks
        this.rarityScores.sort((a, b) => a.score - b.score);
        this.rarityRanks = new Map();
        this.rarityScores.forEach((item, rank) => {
            this.rarityRanks.set(item.edition, rank + 1);
        });
        
        // Store trait counts for potential display
        this.traitCounts = traitCounts;
    }
    
    getRarityRank(edition) {
        return this.rarityRanks.get(edition) || 0;
    }
    
    updateTraitCheckboxes() {
        // Uncheck all checkboxes when filters are cleared
        const checkboxes = this.elements.traitsFilter.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    createTraitFilters() {
        const container = this.elements.traitsFilter;
        container.innerHTML = '<h3>Traits</h3>';
        
        // Add sort dropdown
        const sortDropdown = document.createElement('select');
        sortDropdown.className = 'sort-dropdown';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Sort by';

        const rarityOption = document.createElement('option');
        rarityOption.value = 'rarity';
        rarityOption.textContent = 'Rarity Rank';

        const rarestTraitOption = document.createElement('option');
        rarestTraitOption.value = 'rarestTrait';
        rarestTraitOption.textContent = 'Rarest Traits';

        sortDropdown.appendChild(defaultOption);
        sortDropdown.appendChild(rarityOption);
        sortDropdown.appendChild(rarestTraitOption);
        
        sortDropdown.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.filterNFTs();
        });
        
        container.appendChild(sortDropdown);
        
        // Sort trait types alphabetically
        const sortedTraitTypes = Array.from(this.traitTypes.keys()).sort();
        
        sortedTraitTypes.forEach(traitType => {
            const traitSection = document.createElement('div');
            traitSection.className = 'trait-section';
            
            // Create collapsible header
            const traitHeader = document.createElement('div');
            traitHeader.className = 'trait-header';
            
            const headerTitle = document.createElement('h4');
            headerTitle.textContent = traitType;
            
            const arrow = document.createElement('span');
            arrow.className = 'arrow';
            arrow.textContent = '▼';
            
            traitHeader.appendChild(headerTitle);
            traitHeader.appendChild(arrow);
            
            // Create content section
            const traitContent = document.createElement('div');
            traitContent.className = 'trait-content';
            
            // Add click handler for collapse/expand
            traitHeader.addEventListener('click', () => {
                traitHeader.classList.toggle('expanded');
                traitContent.classList.toggle('expanded');
            });
            
            // Sort trait values alphabetically
            const sortedValues = Array.from(this.traitTypes.get(traitType)).sort();
            
            sortedValues.forEach(value => {
                const traitOption = document.createElement('div');
                traitOption.className = 'trait-option';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${traitType}-${value}`;
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        // Clear search when applying filters
                        this.searchTerm = '';
                        this.elements.searchBox.value = '';
                        
                        if (!this.selectedTraits.has(traitType)) {
                            this.selectedTraits.set(traitType, new Set());
                        }
                        this.selectedTraits.get(traitType).add(value);
                    } else {
                        this.selectedTraits.get(traitType)?.delete(value);
                        if (this.selectedTraits.get(traitType)?.size === 0) {
                            this.selectedTraits.delete(traitType);
                        }
                    }
                    this.filterNFTs();
                });
                
                const label = document.createElement('label');
                label.htmlFor = `${traitType}-${value}`;
                label.textContent = value;
                
                traitOption.appendChild(checkbox);
                traitOption.appendChild(label);
                traitContent.appendChild(traitOption);
            });
            
            traitSection.appendChild(traitHeader);
            traitSection.appendChild(traitContent);
            container.appendChild(traitSection);
        });
    }
    
    createNFTCard(nft) {
        const card = document.createElement('div');
        card.className = 'nft-card';
        
        const rank = this.rarityRanks.get(nft.edition);
        
        card.innerHTML = `
            <img src="https://arweave.net/${nft.id}" alt="${nft.name}">
            <h3>${nft.name}</h3>
            <p>Rank: ${rank}</p>
        `;
        
        card.addEventListener('click', () => this.showNFTDetails(nft));
        return card;
    }
    
    showNFTDetails(nft) {
        const modalHeader = this.elements.modal.querySelector('.modal-header');
        const modalImage = this.elements.modal.querySelector('.modal-image');
        const modalDetails = this.elements.modal.querySelector('.modal-details');
        
        const rank = this.rarityRanks.get(nft.edition);
        const rarityScore = this.rarityScores.find(score => score.edition === nft.edition)?.score || 0;
        
        modalHeader.innerHTML = `<h2>${nft.name}</h2>`;
        modalImage.innerHTML = `<img src="https://arweave.net/${nft.id}" alt="${nft.name}">`;
        
        // Find the rarest trait when in rarestTrait sort mode
        let rarestTraitCount = Number.MAX_SAFE_INTEGER;
        let rarestTraits = [];
        
        if (this.sortBy === 'rarestTrait') {
            // First find the lowest count
            nft.attributes.forEach(attr => {
                const count = this.traitCounts[attr.trait_type][attr.value];
                if (count < rarestTraitCount) {
                    rarestTraitCount = count;
                    rarestTraits = [attr];
                } else if (count === rarestTraitCount) {
                    rarestTraits.push(attr);
                }
            });
        }
        
        const traitRarityInfo = nft.attributes.map(attr => {
            const count = this.traitCounts[attr.trait_type][attr.value];
            const isRarestTrait = this.sortBy === 'rarestTrait' && 
                                 rarestTraits.some(t => 
                                     t.trait_type === attr.trait_type && 
                                     t.value === attr.value
                                 );
            
            return `
            <div class="trait-item ${isRarestTrait ? 'rarest-trait' : ''}">
                ${attr.trait_type}: ${attr.value}
                <span class="trait-count">
                    (Count: ${count})
                </span>
            </div>
        `;
        }).join('');
        
        modalDetails.innerHTML = `
            <p>Rarity Rank: ${rank} (Total Score: ${rarityScore})</p>
            <h3>Traits</h3>
            ${traitRarityInfo}
        `;
        
        this.elements.modal.style.display = 'block';
    }
    
    closeModal() {
        this.elements.modal.style.display = 'none';
    }
    
    filterNFTs() {
        let filteredNFTs = this.nfts;
        
        // Apply search filter if there's a search term
        if (this.searchTerm) {
            filteredNFTs = filteredNFTs.filter(nft => 
                nft.name.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Apply trait filters if any are selected
        if (this.selectedTraits.size > 0) {
            filteredNFTs = filteredNFTs.filter(nft => {
                return Array.from(this.selectedTraits.entries()).every(([traitType, values]) => {
                    const nftTrait = nft.attributes.find(attr => attr.trait_type === traitType);
                    return nftTrait && values.has(nftTrait.value);
                });
            });
        }
        
        // Apply sorting
        if (this.sortBy === 'rarity') {
            filteredNFTs.sort((a, b) => {
                const rankA = this.rarityRanks.get(a.edition) || 0;
                const rankB = this.rarityRanks.get(b.edition) || 0;
                return rankA - rankB;
            });
        } else if (this.sortBy === 'rarestTrait') {
            filteredNFTs.sort((a, b) => {
                const getLowestTraitCount = (nft) => {
                    let lowestCount = Number.MAX_SAFE_INTEGER;
                    let traitValueWithLowestCount = '';
                    nft.attributes.forEach(attr => {
                        const count = this.traitCounts[attr.trait_type][attr.value];
                        if (count < lowestCount) {
                            lowestCount = count;
                            traitValueWithLowestCount = attr.value;
                        } else if (count === lowestCount && attr.value < traitValueWithLowestCount) {
                            // If counts are equal, take the alphabetically earlier trait
                            traitValueWithLowestCount = attr.value;
                        }
                    });
                    return { count: lowestCount, value: traitValueWithLowestCount };
                };
                
                const resultA = getLowestTraitCount(a);
                const resultB = getLowestTraitCount(b);
                
                // First compare by count
                if (resultA.count !== resultB.count) {
                    return resultA.count - resultB.count;
                }
                // If counts are equal, sort alphabetically by trait value
                return resultA.value.localeCompare(resultB.value);
            });
        }
        
        this.renderNFTs(filteredNFTs);
    }
    
    renderNFTs(nfts) {
        const totalPages = Math.ceil(nfts.length / this.itemsPerPage);
        
        if (this.currentPage > totalPages) {
            this.currentPage = 1;
        }
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentItems = nfts.slice(startIndex, endIndex);
        
        // Clear and populate grid
        this.elements.nftGrid.innerHTML = '';
        currentItems.forEach(nft => {
            this.elements.nftGrid.appendChild(this.createNFTCard(nft));
        });
        
        this.updatePagination(totalPages);
    }
    
    updatePagination(totalPages) {
        // Update prev/next buttons
        this.elements.prevButton.disabled = this.currentPage === 1;
        this.elements.nextButton.disabled = this.currentPage === totalPages;
        
        // Update page numbers
        this.elements.paginationNumbers.innerHTML = '';
        
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === this.currentPage ? 'active' : '';
            pageButton.addEventListener('click', () => {
                this.currentPage = i;
                this.filterNFTs();
            });
            this.elements.paginationNumbers.appendChild(pageButton);
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.filterNFTs();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.nfts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.filterNFTs();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const browser = new DumDumzBrowser();
    browser.initialize();
});