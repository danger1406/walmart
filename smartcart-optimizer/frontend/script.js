// --- Map and Pathfinding Setup ---
const GRID_SIZE = 30;
const MAP_WIDTH = 19 * GRID_SIZE;
const MAP_HEIGHT = 20 * GRID_SIZE;
const GRID_COLS = Math.floor(MAP_WIDTH / GRID_SIZE);
const GRID_ROWS = Math.floor(MAP_HEIGHT / GRID_SIZE);

// Supermarket shelves/obstacles (x, y, w, h in grid cells)
const shelves = [
    { label: 'DELI', x: 1, y: 1, w: 4, h: 2, color: '#b2bec3' },
    { label: 'BAKERY', x: 5, y: 1, w: 4, h: 2, color: '#b2bec3' },
    { label: 'PRODUCE', x: 13, y: 1, w: 5, h: 5, color: '#74b9ff' },
    { label: '', x: 18, y: 1, w: 1, h: 19, color: '#b2bec3' },
    { label: 'MEAT', x: 1, y: 3, w: 4, h: 2, color: '#ff7675' },
    { label: 'SEAFOOD', x: 5, y: 3, w: 4, h: 2, color: '#ff7675' },
    { label: 'GROCERY 1', x: 1, y: 5, w: 4, h: 2, color: '#b2bec3' },
    { label: 'GROCERY 2', x: 5, y: 5, w: 4, h: 2, color: '#b2bec3' },
    { label: 'BEVERAGES', x: 1, y: 7, w: 4, h: 2, color: '#a29bfe' },
    { label: 'SNACKS', x: 5, y: 7, w: 4, h: 2, color: '#a29bfe' },
    { label: 'DAIRY PRODUCTS 1', x: 12, y: 7, w: 1, h: 6, color: '#74b9ff' },
    { label: 'DAIRY PRODUCTS 2', x: 16, y: 7, w: 1, h: 6, color: '#74b9ff' },
    { label: '', x: 1, y: 11, w: 7, h: 1, color: '#b2bec3' },
    { label: '', x: 1, y: 12, w: 1, h: 4, color: '#b2bec3' },
    { label: '', x: 2, y: 15, w: 6, h: 1, color: '#b2bec3' },
    { label: '', x: 3, y: 17, w: 8, h: 1, color: '#b2bec3' },
    { label: 'FROZEN FOODS', x: 12, y: 17, w: 7, h: 2, color: '#74b9ff' }
];

const ENTRANCE_COORDS = [0.5 * GRID_SIZE, 0.5 * GRID_SIZE]; // bottom left
const EXIT_COORDS = [18.5 * GRID_SIZE, 19.5 * GRID_SIZE]; // bottom right

// --- Fetch section/item mapping from backend ---
let sectionMap = {};
let supportedItems = [];
let originalSupportedItems = [];
const API_BASE = window.API_BASE_URL || 'http://127.0.0.1:5000';

// Enhanced CSS animations to add to the existing styles
const additionalCSS = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    
    .pin-notification {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .item-pin {
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        will-change: transform;
    }
    
    .item-pin:hover {
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
    
    .item-pin.selected {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
        100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
    }
`;

// Add the additional CSS to the document
function addEnhancedStyles() {
    const style = document.createElement('style');
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}

// Move getSectionCenter to top-level scope
function getSectionCenter(section) {
    if (!section || !sectionMap[section] || !sectionMap[section].coordinates) {
        console.error(`No coordinates found for section: ${section}`);
        return null;
    }
    return sectionMap[section].coordinates;
}

document.addEventListener('DOMContentLoaded', () => {
    fetch(`${API_BASE}/api/sections`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch section data from backend.');
            return res.json();
        })
        .then(data => {
            sectionMap = data.sections || {};
            supportedItems = data.supported_items ? [...data.supported_items] : [];
            originalSupportedItems = [...supportedItems];
            drawStoreBase();
            hideErrorState();
            createCustomAutocomplete();
            addEnhancedStyles();
        })
        .catch(err => {
            console.error('Fetch error:', err);
            showErrorState('Could not load store layout. Please check backend connection or console for details.');
        });

    // --- Custom Autocomplete Dropdown ---
    function createCustomAutocomplete() {
        const input = document.getElementById('item-input');
        let dropdown = document.createElement('div');
        dropdown.className = 'custom-autocomplete-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.zIndex = '1000';
        dropdown.style.background = '#fff';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.width = input.offsetWidth + 'px';
        dropdown.style.maxHeight = '180px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.display = 'none';
        input.parentNode.appendChild(dropdown);

        function showDropdown(matches) {
            dropdown.innerHTML = '';
            if (!matches.length) {
                dropdown.style.display = 'none';
                return;
            }
            matches.forEach(item => {
                const option = document.createElement('div');
                option.className = 'autocomplete-option';
                option.textContent = item;
                option.style.padding = '8px 12px';
                option.style.cursor = 'pointer';
                option.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    input.value = item;
                    dropdown.style.display = 'none';
                });
                dropdown.appendChild(option);
            });
            dropdown.style.display = 'block';
        }

        input.addEventListener('input', () => {
            const value = input.value.toLowerCase();
            if (!value) {
                showDropdown(supportedItems);
                return;
            }
            const matches = supportedItems.filter(item => item.toLowerCase().includes(value));
            showDropdown(matches);
        });
        input.addEventListener('focus', () => {
            if (!input.value) {
                showDropdown(supportedItems);
            } else {
                const value = input.value.toLowerCase();
                const matches = supportedItems.filter(item => item.toLowerCase().includes(value));
                showDropdown(matches);
            }
        });
        input.addEventListener('blur', () => {
            setTimeout(() => { dropdown.style.display = 'none'; }, 100);
        });
    }

    // --- Shopping List Management ---
    let shoppingList = [];

    const shoppingListEl = document.getElementById('shopping-list');
    const itemInput = document.getElementById('item-input');
    const addItemBtn = document.getElementById('add-item-btn');
    const optimizeBtn = document.getElementById('optimize-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const distanceValue = document.getElementById('distance-value');
    const timeValue = document.getElementById('time-value');
    const savingsValue = document.getElementById('savings-value');
    const directionsList = document.getElementById('directions-list');
    const storeMap = document.getElementById('store-map');
    const itemCountBadge = document.getElementById('item-count-badge');

    function updateItemCountBadge() {
        if (itemCountBadge) {
            itemCountBadge.textContent = shoppingList.length;
            itemCountBadge.style.transform = 'scale(1.1)';
            setTimeout(() => {
                itemCountBadge.style.transform = 'scale(1)';
            }, 200);
        }
    }

    function addItemToList(item) {
        if (!item) {
            showErrorState('Item not supported or empty.');
            return;
        }
        const normalized = item.trim().toLowerCase();
        const match = supportedItems.find(i => i.toLowerCase() === normalized);
        if (!match) {
            showErrorState('Item not supported.');
            return;
        }
        if (shoppingList.includes(match)) {
            showErrorState('Item already in list.');
            return;
        }
        shoppingList.push(match);
        supportedItems = supportedItems.filter(i => i !== match);
        renderShoppingList();
        hideErrorState();
    }

    function removeItemFromList(idx) {
        const removed = shoppingList[idx];
        shoppingList = shoppingList.filter((item, i) => i !== idx);
        // Restore the removed item to supportedItems
        if (removed && !supportedItems.includes(removed)) {
            supportedItems.push(removed);
            supportedItems.sort();
        }
        renderShoppingList();
    }

    function validateShoppingList() {
        if (shoppingList.length === 0) {
            showErrorState('Shopping list is empty.');
            return false;
        }
        for (let item of shoppingList) {
            if (!originalSupportedItems.includes(item)) {
                showErrorState(`Item '${item}' not available.`);
                return false;
            }
        }
        return true;
    }

    function renderShoppingList() {
        shoppingListEl.innerHTML = '';
        shoppingList.forEach((item, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="item-name">${item}</span>
                <button class="remove-item-btn" onclick="removeItemFromList(${idx})">
                    Remove
                </button>
            `;
            shoppingListEl.appendChild(li);
        });
        updateItemCountBadge();
        drawAllItemPins();
    }

    // --- API Integration ---
    async function callBackendAPI(shoppingList) {
        showLoadingState();
        hideErrorState();
        try {
            const res = await fetch(`${API_BASE}/api/optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopping_list: shoppingList, store_layout: 'walmart_default' })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'API error');
            }
            const data = await res.json();
            displayRoute(data);
        } catch (err) {
            console.error('API call error:', err);
            showErrorState(err.message || 'Network error');
        } finally {
            hideLoadingState();
        }
    }

    // --- UI Management ---
    function displayRoute(routeData) {
        if (!routeData.optimized_route) {
            showErrorState('No route found.');
            return;
        }
        if (!routeData.full_path) {
            showErrorState('Route path is missing from backend.');
            return;
        }
        drawRoutePathFromBackend(routeData.full_path, routeData.savings_percentage);
        const selectedItems = routeData.optimized_route.map(r => r.item);
        drawAllItemPins(selectedItems, selectedItems);
        updateStatistics({
            distance: routeData.total_distance,
            time: routeData.estimated_time,
            savings: routeData.savings_percentage
        });
        showDirections(routeData.directions);
        shoppingList = [];
        supportedItems = [...originalSupportedItems];
        renderShoppingList();
    }

    function updateStatistics(stats) {
        animateStatistic('distance-value', stats.distance || 0);
        animateStatistic('time-value', stats.time || 0);
        animateStatistic('savings-value', stats.savings || 0);
    }

    function animateStatistic(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
            element.textContent = Math.round(currentValue);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = Math.round(targetValue);
                element.style.transform = 'scale(1.1)';
                element.style.transition = 'transform 0.2s ease';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        }
        requestAnimationFrame(animate);
    }

    function showLoadingState() {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        if (optimizeBtn) {
            optimizeBtn.disabled = true;
            optimizeBtn.innerHTML = `
                <span class="button-text">Optimizing...</span>
                <div class="spinner-small"></div>
            `;
        }
    }

    function hideLoadingState() {
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (optimizeBtn) {
            optimizeBtn.disabled = false;
            optimizeBtn.innerHTML = `
                <span class="button-text">Optimize Route</span>
                <span class="button-icon">✨</span>
            `;
        }
    }

    function showErrorState(msg) {
        if (!errorMessage) return;
        if (window.errorTimeout) clearTimeout(window.errorTimeout);
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
        document.getElementById('app-container').classList.add('error-active');
        errorMessage.style.animation = 'shake 0.5s ease-in-out';
        window.errorTimeout = setTimeout(() => {
            hideErrorState();
        }, 5000);
    }

    function hideErrorState() {
        if (!errorMessage) return;
        if (window.errorTimeout) clearTimeout(window.errorTimeout);
        errorMessage.style.animation = '';
        errorMessage.classList.add('hidden');
        document.getElementById('app-container').classList.remove('error-active');
    }

    function showDirections(directions) {
        directionsList.innerHTML = '';
        directions.forEach((dir, idx) => {
            const li = document.createElement('li');
            li.textContent = dir;
            if (dir.includes('checkout')) {
                li.classList.add('checkout-step');
            }
            directionsList.appendChild(li);
        });
    }

    // --- Map Drawing ---
    function drawStoreBase() {
        storeMap.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', MAP_WIDTH);
        svg.setAttribute('height', MAP_HEIGHT);
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.zIndex = '0';
        // Draw grid
        for (let i = 0; i <= 19; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', i * GRID_SIZE);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', i * GRID_SIZE);
            line.setAttribute('y2', MAP_HEIGHT);
            line.setAttribute('stroke', '#eee');
            svg.appendChild(line);
        }
        for (let i = 0; i <= 20; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', i * GRID_SIZE);
            line.setAttribute('x2', MAP_WIDTH);
            line.setAttribute('y2', i * GRID_SIZE);
            line.setAttribute('stroke', '#eee');
            svg.appendChild(line);
        }
        // Draw shelves
        shelves.forEach(s => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', s.x * GRID_SIZE);
            rect.setAttribute('y', s.y * GRID_SIZE);
            rect.setAttribute('width', s.w * GRID_SIZE);
            rect.setAttribute('height', s.h * GRID_SIZE);
            rect.setAttribute('fill', s.color || '#b2bec3');
            rect.setAttribute('stroke', '#636e72');
            rect.setAttribute('stroke-width', '2');
            svg.appendChild(rect);
            if (s.label) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                let x = s.x * GRID_SIZE + (s.w * GRID_SIZE) / 2;
                let y = s.y * GRID_SIZE + (s.h * GRID_SIZE) / 2 + 5;
                // Special offset for DAIRY PRODUCTS 1 and 2
                if (s.label === 'DAIRY PRODUCTS 1') {
                    x -= 30; // shift left
                }
                if (s.label === 'DAIRY PRODUCTS 2') {
                    x += 30; // shift right
                }
                if (s.label === 'DAIRY PRODUCTS 1' || s.label === 'DAIRY PRODUCTS 2') {
                    y -= 8; // Adjust upward to vertically center two-line label
                }
                text.setAttribute('x', x);
                text.setAttribute('y', y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '14');
                text.setAttribute('fill', '#2c3e50');
                if (s.label === 'DAIRY PRODUCTS 1' || s.label === 'DAIRY PRODUCTS 2') {
                    const [first, ...rest] = s.label.split(' ');
                    const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    tspan1.setAttribute('x', x);
                    tspan1.setAttribute('dy', '0');
                    tspan1.textContent = first;
                    const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    tspan2.setAttribute('x', x);
                    tspan2.setAttribute('dy', '1.2em');
                    tspan2.textContent = rest.join(' ');
                    text.appendChild(tspan1);
                    text.appendChild(tspan2);
                } else {
                    text.textContent = s.label;
                }
                svg.appendChild(text);
            }
        });
        // Draw entrance/exit icons
        const entranceG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        entranceG.innerHTML = '<circle cx="0" cy="0" r="14" fill="#27ae60"/><text x="0" y="6" text-anchor="middle" font-size="18" fill="#fff">E</text>';
        entranceG.setAttribute('transform', `translate(${ENTRANCE_COORDS[0]},${ENTRANCE_COORDS[1]})`);
        svg.appendChild(entranceG);
        // Add entrance label above
        const entranceLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        entranceLabel.setAttribute('x', ENTRANCE_COORDS[0]);
        entranceLabel.setAttribute('y', ENTRANCE_COORDS[1] - 22);
        entranceLabel.setAttribute('text-anchor', 'middle');
        entranceLabel.setAttribute('font-size', '14');
        entranceLabel.setAttribute('fill', '#27ae60');
        entranceLabel.textContent = 'Entrance';
        svg.appendChild(entranceLabel);
        const exitG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        exitG.innerHTML = '<circle cx="0" cy="0" r="14" fill="#e74c3c"/><text x="0" y="6" text-anchor="middle" font-size="18" fill="#fff">X</text>';
        exitG.setAttribute('transform', `translate(${EXIT_COORDS[0]},${EXIT_COORDS[1]})`);
        svg.appendChild(exitG);
        // Add exit label above
        const exitLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        exitLabel.setAttribute('x', EXIT_COORDS[0]);
        exitLabel.setAttribute('y', EXIT_COORDS[1] - 22);
        exitLabel.setAttribute('text-anchor', 'middle');
        exitLabel.setAttribute('font-size', '14');
        exitLabel.setAttribute('fill', '#e74c3c');
        exitLabel.textContent = 'Exit';
        svg.appendChild(exitLabel);
        storeMap.appendChild(svg);
        drawAllItemPins();
    }

    // --- Route Drawing ---
    function drawRoutePathFromBackend(fullPath, savings) {
        let svg = storeMap.querySelector('svg.route-svg');
        if (svg) svg.remove();
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', MAP_WIDTH);
        svg.setAttribute('height', MAP_HEIGHT);
        svg.classList.add('route-svg');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.zIndex = '1';
        let pathStr = '';
        fullPath.forEach((pt, i) => {
            pathStr += (i === 0 ? 'M' : 'L') + pt[0] + ' ' + pt[1] + ' ';
        });
        const routePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        routePath.setAttribute('d', pathStr);
        routePath.setAttribute('class', 'route-path');
        svg.appendChild(routePath);
        // --- Animated Dot ---
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', 8);
        dot.setAttribute('fill', '#0984e3');
        dot.setAttribute('stroke', '#fff');
        dot.setAttribute('stroke-width', '3');
        svg.appendChild(dot);
        let progress = 0;
        function animateDot() {
            if (progress >= fullPath.length - 1) return;
            const [x1, y1] = fullPath[progress];
            const [x2, y2] = fullPath[progress + 1];
            let t = 0;
            function step() {
                if (t > 1) {
                    progress++;
                    animateDot(); // Call animateDot for the next segment
                    return;
                }
                const x = x1 + (x2 - x1) * t;
                const y = y1 + (y2 - y1) * t;
                dot.setAttribute('cx', x);
                dot.setAttribute('cy', y);
                t += 0.03;
                requestAnimationFrame(step);
            }
            step();
        }
        dot.setAttribute('cx', fullPath[0][0]);
        dot.setAttribute('cy', fullPath[0][1]);
        animateDot();
        storeMap.appendChild(svg);
        updateStatisticsFromPath(fullPath, savings);
    }

    function updateStatisticsFromPath(path, savings) {
        let dist = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i][0] - path[i-1][0];
            const dy = path[i][1] - path[i-1][1];
            dist += Math.sqrt(dx * dx + dy * dy);
        }
        const distanceMeters = dist;
        const timeMinutes = Math.ceil(distanceMeters / 1.2 / 60);
        distanceValue.textContent = distanceMeters.toFixed(2);
        timeValue.textContent = timeMinutes;
        savingsValue.textContent = (savings || 0).toFixed(2);
    }

    // --- Pin Drawing ---
    function drawAllItemPins(selectedItems = [], routeOrder = []) {
        storeMap.querySelectorAll('.item-pin').forEach(pin => pin.remove());
        let missing = [];
        for (const item of shoppingList) {
            const section = Object.keys(sectionMap).find(sec => sectionMap[sec].items && sectionMap[sec].items.includes(item));
            const coords = section ? getSectionCenter(section) : null;
            if (!coords) {
                missing.push(item);
                console.warn(`Skipping pin for '${item}': no valid coordinates.`);
                continue;
            }
            let idx = routeOrder.findIndex(x => x === item);
            let isSelected = selectedItems.includes(item);
            createItemPin(item, coords, isSelected ? (idx + 1) : '', isSelected ? 'selected' : 'faded');
        }
        if (missing.length > 0) {
            showErrorState('Some items are not mapped to shelves: ' + missing.join(', '));
        } else {
            hideErrorState();
        }
    }

    function createItemPin(item, coordinates, step = '', style = '') {
        const pin = document.createElement('div');
        pin.className = 'item-pin';
        
        if (style === 'faded') {
            pin.classList.add('faded');
        }
        if (style === 'selected') {
            pin.classList.add('selected');
        }
        
        pin.style.left = (coordinates[0] - 20) + 'px';
        pin.style.top = (coordinates[1] - 20) + 'px';
        pin.innerHTML = step ? `${step}` : '•';
        pin.title = item;
        pin.setAttribute('aria-label', `Item: ${item}${step ? ', step ' + step : ''}`);
        pin.tabIndex = 0;
        
        // Enhanced click handler with visual feedback
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePinClick(item);
            
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(102, 126, 234, 0.3);
                pointer-events: none;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                width: 80px;
                height: 80px;
                left: -20px;
                top: -20px;
            `;
            pin.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
        
        pin.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handlePinClick(item);
        });
        
        pin.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePinClick(item);
            }
        });
        
        // Add hover effect
        pin.addEventListener('mouseenter', () => {
            pin.style.transform = 'scale(1.1)';
            pin.style.zIndex = '10';
        });
        
        pin.addEventListener('mouseleave', () => {
            pin.style.transform = 'scale(1)';
            pin.style.zIndex = '2';
        });
        
        storeMap.appendChild(pin);
    }

    function handlePinClick(item) {
        showErrorState(`Selected: ${item}`);
        const listItems = shoppingListEl.querySelectorAll('li');
        listItems.forEach(li => {
            if (li.textContent.includes(item)) {
                li.style.backgroundColor = '#e8f0fe';
                setTimeout(() => li.style.backgroundColor = '', 2000);
            }
        });
    }

    // --- Event Listeners ---
    document.getElementById('shopping-list-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const item = itemInput.value.trim();
        addItemToList(item);
        itemInput.value = '';
    });

    addItemBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const item = itemInput.value.trim();
        addItemToList(item);
        itemInput.value = '';
    });

    errorMessage.addEventListener('click', (e) => {
        if (e.target === errorMessage || e.target.textContent === '✕') {
            hideErrorState();
        }
    });

    optimizeBtn.addEventListener('click', function() {
        if (validateShoppingList()) {
            callBackendAPI(shoppingList);
        }
    });
});
