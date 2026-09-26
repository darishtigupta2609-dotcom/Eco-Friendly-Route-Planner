let map;
let markerStart;
let markerEnd;

// Login Auth Logic with Map Resize Trigger
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Hide Login Overlay and reveal App Content
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');

    // Initialize or recalculate Map size so it renders properly
    setTimeout(() => {
        if (!map) {
            initMap();
        } else {
            map.invalidateSize();
        }
    }, 200);
});

// Logout Logic
document.getElementById('logout-btn').addEventListener('click', function() {
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('login-overlay').classList.remove('hidden');
});

// Initialize Interactive Live Leaflet Map
function initMap() {
    // Default center: NYC coordinates
    map = L.map('map').setView([40.7128, -74.0060], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Force map container to recalculate layout height
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
}

// Form Submission Event
document.getElementById('route-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const startLoc = document.getElementById('start').value;
    const startLat = parseFloat(document.getElementById('start-lat').value);
    const startLng = parseFloat(document.getElementById('start-lng').value);

    const destLoc = document.getElementById('destination').value;
    const destLat = parseFloat(document.getElementById('dest-lat').value);
    const destLng = parseFloat(document.getElementById('dest-lng').value);

    const distance = parseFloat(document.getElementById('distance').value);

    if (isNaN(distance) || distance <= 0) {
        alert("Please enter a valid distance.");
        return;
    }

    // Update Map with exact Lat/Lng pins
    updateMapPins(startLoc, startLat, startLng, destLoc, destLat, destLng);

    // Transport Modes Engine
    const modes = [
        {
            name: 'Gasoline Car',
            icon: 'fa-car',
            speed: 45,
            fuelPerKm: 0.08,
            co2PerKm: 192,
            score: 30
        },
        {
            name: 'Electric Vehicle',
            icon: 'fa-charging-station',
            speed: 45,
            fuelPerKm: 0,
            co2PerKm: 45,
            score: 80
        },
        {
            name: 'Public Bus',
            icon: 'fa-bus',
            speed: 25,
            fuelPerKm: 0.03,
            co2PerKm: 68,
            score: 75
        },
        {
            name: 'Bicycle',
            icon: 'fa-bicycle',
            speed: 15,
            fuelPerKm: 0,
            co2PerKm: 0,
            score: 100
        },
        {
            name: 'Walking',
            icon: 'fa-person-walking',
            speed: 5,
            fuelPerKm: 0,
            co2PerKm: 0,
            score: 100
        }
    ];

    const cardsGrid = document.getElementById('cards-grid');
    const chartContainer = document.getElementById('emissions-chart');
    
    cardsGrid.innerHTML = '';
    chartContainer.innerHTML = '';

    let maxEmissions = 0;

    const calculatedData = modes.map(mode => {
        const timeMins = Math.round((distance / mode.speed) * 60);
        const fuelUsed = (mode.fuelPerKm * distance).toFixed(2);
        const co2Emissions = Math.round(mode.co2PerKm * distance);

        if (co2Emissions > maxEmissions) {
            maxEmissions = co2Emissions;
        }

        return { ...mode, timeMins, fuelUsed, co2Emissions };
    });

    // Render Cards
    calculatedData.forEach(mode => {
        const isEcoWinner = mode.co2Emissions === 0;
        const card = document.createElement('div');
        card.className = `mode-card ${isEcoWinner ? 'eco-winner' : ''}`;

        card.innerHTML = `
            <h3><i class="fa-solid ${mode.icon}"></i> ${mode.name}</h3>
            <p><strong>Est. Time:</strong> ${mode.timeMins} mins</p>
            <p><strong>Fuel Usage:</strong> ${mode.fuelUsed} L</p>
            <p><strong>Carbon Output:</strong> ${mode.co2Emissions} g CO₂</p>
            <p><strong>Eco Rating:</strong> ${mode.score}/100</p>
        `;
        cardsGrid.appendChild(card);

        // Render Chart Bar
        const barWidth = maxEmissions > 0 ? (mode.co2Emissions / maxEmissions) * 100 : 0;
        const chartItem = document.createElement('div');
        chartItem.className = 'chart-bar-item';
        chartItem.innerHTML = `
            <div class="chart-label">${mode.name} — ${mode.co2Emissions}g CO₂</div>
            <div class="chart-track">
                <div class="chart-fill" style="width: 0%" data-target="${barWidth}"></div>
            </div>
        `;
        chartContainer.appendChild(chartItem);
    });

    // Reveal Results
    const resultsElem = document.getElementById('results');
    resultsElem.classList.remove('hidden');
    resultsElem.scrollIntoView({ behavior: 'smooth' });

    // Animate Chart Bars
    setTimeout(() => {
        document.querySelectorAll('.chart-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-target') + '%';
        });
    }, 100);
});

// Map Marker Helper using exact Lat/Lng
function updateMapPins(startStr, sLat, sLng, destStr, dLat, dLng) {
    if (markerStart) map.removeLayer(markerStart);
    if (markerEnd) map.removeLayer(markerEnd);

    markerStart = L.marker([sLat, sLng]).addTo(map).bindPopup(`<b>Start:</b> ${startStr}<br>Lat: ${sLat}, Lng: ${sLng}`).openPopup();
    markerEnd = L.marker([dLat, dLng]).addTo(map).bindPopup(`<b>Destination:</b> ${destStr}<br>Lat: ${dLat}, Lng: ${dLng}`);

    const group = new L.featureGroup([markerStart, markerEnd]);
    map.fitBounds(group.pad(0.3));
}