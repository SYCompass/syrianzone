// Configuration constants
const CONFIG = {
    GOOGLE_SHEETS: {
        SHEET_ID: '2PACX-1vS6vFJV6ldATqU0Gi-0tnn-2VPBWz8So0zbVpWoCIdv7f_m7tOyDXPlAsOncPzB_y-LD9ZxgPw9AOAl',
        CACHE_DURATION: 24 * 60 * 60 * 1000,
        MAX_RETRIES: 3
    },
    CSV: { DELIMITER: ',', TRIM_HEADERS: true },
    CACHE: { NAMESPACE: 'population' }
};

const appState = {
    map: null,
    geojsonLayer: null,
    populationData: {},
    currentDataSource: null,
    currentDataType: 'population',
    allPopulationData: null,
    dataTypeGroups: {}
};

const tooltip = document.getElementById('hover-tooltip');
tooltip.classList.add('hidden');

const DATA_TYPE_CONFIG = {
    population: {
        label: 'عدد السكان', labelAr: 'السكان', colors: { none: '#2a3033', low: '#235A82', medium: '#388BFD', high: '#84B9FF' },
        legend: [{ label: 'لا توجد بيانات', color: '#2a3033' }, { label: 'أقل من ١٠٠ ألف', color: '#235A82' }, { label: '١٠٠ ألف – ٥٠٠ ألف', color: '#388BFD' }, { label: 'أكثر من مليون', color: '#84B9FF' }],
        thresholds: [100000, 500000, 1000000]
    },
    idp: {
        label: 'النازحين داخلياً', labelAr: 'النازحين', colors: { none: '#2a3033', low: '#A0522D', medium: '#D2691E', high: '#FF7F50' },
        legend: [{ label: 'لا توجد بيانات', color: '#2a3033' }, { label: 'أقل من ١٠٠ ألف', color: '#A0522D' }, { label: '١٠٠ ألف – ٥٠٠ ألف', color: '#D2691E' }, { label: 'أكثر من ٥٠٠ ألف', color: '#FF7F50' }],
        thresholds: [100000, 500000, 1000000]
    },
    idp_returnees: {
        label: 'العائدون من النزوح', labelAr: 'العائدون', colors: { none: '#2a3033', low: '#006400', medium: '#228B22', high: '#32CD32' },
        legend: [{ label: 'لا توجد بيانات', color: '#2a3033' }, { label: 'أقل من ٥٠ ألف', color: '#006400' }, { label: '٥٠ ألف – ١٠٠ ألف', color: '#228B22' }, { label: 'أكثر من ١٠٠ ألف', color: '#32CD32' }],
        thresholds: [50000, 100000, 200000]
    }
};

function initializeMap() {
    appState.map = L.map('map', { center: [35.0, 38.5], zoom: 7, zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false });
    addLegend();
    createDataTypeTabs();
}

function createDataTypeTabs() {
    const tabsContainer = document.getElementById('dataTypeTabs');
    tabsContainer.innerHTML = '';
    Object.keys(DATA_TYPE_CONFIG).forEach(type => {
        const tab = document.createElement('button');
        tab.className = 'data-type-tab';
        tab.dataset.type = type;
        tab.textContent = DATA_TYPE_CONFIG[type].labelAr;
        if (type === appState.currentDataType) tab.classList.add('active');
        tab.addEventListener('click', () => selectDataType(type));
        tabsContainer.appendChild(tab);
    });
}

function selectDataType(type) {
    appState.currentDataType = type;
    document.querySelectorAll('.data-type-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.type === type));
    updateLegend();
    updateSourcesPanel();
    if (appState.geojsonLayer) appState.geojsonLayer.setStyle(getFeatureStyle);
}

function updateSourcesPanel() {
    const sourcesGrid = document.getElementById('sourcesGrid');
    sourcesGrid.innerHTML = '';
    const sources = appState.dataTypeGroups[appState.currentDataType] || [];
    if (sources.length === 0) {
        sourcesGrid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--secondary-text)">لا توجد مصادر متاحة</div>';
        return;
    }
    sources.forEach(src => {
        const id = `${appState.currentDataType}_${src.source_id}`;
        const item = document.createElement('div');
        item.className = 'source-item';
        item.dataset.source = id;
        item.innerHTML = `<h4 class="source-name">${src.note || 'بيانات'} (${src.date})</h4><p class="source-description">المصدر: ${src.source_id} | ${Object.keys(src.cities).length} محافظة</p>`;
        item.addEventListener('click', () => selectDataSource(id));
        sourcesGrid.appendChild(item);
    });
    if (sources.length > 0) {
        const firstSourceId = `${appState.currentDataType}_${sources[0].source_id}`;
        selectDataSource(firstSourceId);
    }
}

function normalizeCityName(name) {
    if (!name) return '';
    return name.trim().replace(/['`]/g, '').replace(/Ḥ/g, 'H').toLowerCase();
}

function getColor(pop) {
    const config = DATA_TYPE_CONFIG[appState.currentDataType];
    if (!config) return '#2a3033';
    if (pop === 0) return config.colors.none;
    if (pop > config.thresholds[2]) return config.colors.high;
    if (pop > config.thresholds[1]) return config.colors.medium;
    if (pop > config.thresholds[0]) return config.colors.low;
    return config.colors.low;
}

function getFeatureStyle(feature) {
    const pop = findPopulation(feature.properties.province_name);
    return { fillColor: getColor(pop), weight: 1.5, opacity: 1, color: '#0D1117', fillOpacity: 0.85 };
}

function findPopulation(provinceName) {
    if (!appState.populationData) return 0;
    if (appState.populationData[provinceName]) return appState.populationData[provinceName];
    const normalized = normalizeCityName(provinceName);
    const mapping = Object.keys(appState.populationData).reduce((acc, city) => ({ ...acc, [normalizeCityName(city)]: city }), {});
    if (mapping[normalized]) return appState.populationData[mapping[normalized]];
    const special = { 'Al Ḥasakah': ['Al Hasakah', 'Hasakah'], 'Ar Raqqah': ['Raqqa'], 'As Suwayda\'': ['As Suwayda'], 'Dar`a': ['Daraa'], 'Dayr Az Zawr': ['Deir ez-Zor'], 'Rif Dimashq': ['Rural Damascus'], 'Ḥimş': ['Homs'], 'Ḩamāh': ['Hama'], 'Idlib': ['Idleb'], 'Ţarţūs': ['Tartous'] };
    if (special[provinceName]) {
        for (const v of special[provinceName]) { if (appState.populationData[v]) return appState.populationData[v]; }
    }
    return 0;
}

function loadGeoJsonToMap(data) {
    if (appState.geojsonLayer) appState.map.removeLayer(appState.geojsonLayer);
    appState.geojsonLayer = L.geoJSON(data, {
        style: getFeatureStyle,
        onEachFeature: (feature, layer) => {
            layer.on({
                mouseover: e => {
                    e.target.setStyle({ weight: 3, color: '#E6EDF3', fillOpacity: 1 }).bringToFront();
                    const name = feature.properties.province_name || 'غير معروف';
                    const pop = findPopulation(name);
                    const config = DATA_TYPE_CONFIG[appState.currentDataType];
                    const popStr = pop ? pop.toLocaleString('en-US') : 'لا توجد بيانات';
                    tooltip.innerHTML = `<div class="city-name">${name}</div><div>${config.label}: ${popStr}</div>${appState.currentDataSource ? `<div style="font-size:11px;color:var(--secondary-text);margin-top:2px">${appState.currentDataSource}</div>` : ''}`;
                    tooltip.classList.remove('hidden');
                },
                mouseout: e => {
                    appState.geojsonLayer.resetStyle(e.target);
                    tooltip.classList.add('hidden');
                },
                mousemove: e => {
                    tooltip.style.left = (e.originalEvent.clientX + 15) + 'px';
                    tooltip.style.top = (e.originalEvent.clientY - 30) + 'px';
                }
            });
        }
    }).addTo(appState.map);
    fitMapToScreen();
}

function fitMapToScreen() {
    if (appState.map && appState.geojsonLayer) {
        appState.map.fitBounds(appState.geojsonLayer.getBounds(), {
            padding: [15, 15]
        });
    }
}

function processPopulationData(rawData) {
    if (!rawData || rawData.length === 0) throw new Error('No data found');
    const dataTypeGroups = { population: [], idp: [], idp_returnees: [] };
    const sourceMap = {};
    rawData.forEach(row => {
        const dataType = row.data_type || 'population';
        const sourceId = row.source_id, cityName = row.city_name;
        if (!sourceId || !cityName || !dataType) return;
        const key = `${dataType}_${sourceId}`;
        if (!sourceMap[key]) {
            sourceMap[key] = { data_type: dataType, source_id: parseInt(sourceId), source_url: row.source_url, date: row.date, note: row.note, cities: {} };
            if (dataTypeGroups[dataType]) dataTypeGroups[dataType].push(sourceMap[key]);
        }
        sourceMap[key].cities[cityName] = parseInt(row.population) || 0;
    });
    return { dataTypeGroups };
}

async function loadPopulationData() {
    try {
        const cache = window.SZ?.cache?.createCache(CONFIG.CACHE.NAMESPACE);
        const cachedData = cache?.get('populationData');
        if (cachedData) { setupPopulationData(cachedData); return; }
        const loader = async () => {
            const csvUrl = `https://docs.google.com/spreadsheets/d/e/${CONFIG.GOOGLE_SHEETS.SHEET_ID}/pub?output=csv`;
            const res = await window.SZ.http.fetchWithRetry(csvUrl, { retries: CONFIG.GOOGLE_SHEETS.MAX_RETRIES, acceptTypes: 'text/csv' });
            return window.SZ.csv.parseCSVToObjects(res.text, { delimiter: CONFIG.CSV.DELIMITER, trimHeaders: CONFIG.CSV.TRIM_HEADERS });
        };
        const rawData = await window.SZ.offline.runWithOfflineRetry(loader);
        const data = processPopulationData(rawData);
        cache?.set('populationData', data, CONFIG.GOOGLE_SHEETS.CACHE_DURATION);
        setupPopulationData(data);
    } catch (error) { console.error('Error loading population data:', error); }
}

function setupPopulationData(data) {
    appState.allPopulationData = data;
    appState.dataTypeGroups = data.dataTypeGroups;
    selectDataType(appState.currentDataType);
}

function selectDataSource(id) {
    const [dataType, sourceIdStr] = id.split(/_(?=[^_]*$)/);
    const sourceId = parseInt(sourceIdStr);
    const src = (appState.dataTypeGroups[dataType] || []).find(s => s.source_id === sourceId);
    if (!src) return;
    document.querySelectorAll('.source-item').forEach(el => el.classList.remove('selected'));
    const sel = document.querySelector(`[data-source="${id}"]`);
    if (sel) sel.classList.add('selected');
    appState.populationData = src.cities;
    appState.currentDataSource = `${src.note || 'بيانات'} (${src.date})`;
    if (appState.geojsonLayer) appState.geojsonLayer.setStyle(getFeatureStyle);
}

function updateLegend() {
    const legendDiv = document.querySelector('.legend');
    if (!legendDiv) return;
    const config = DATA_TYPE_CONFIG[appState.currentDataType];
    if (!config) return;
    legendDiv.innerHTML = config.legend.map(g => `<div style="margin-bottom:4px"><i style="background:${g.color}"></i>${g.label}</div>`).join('');
}

function addLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => L.DomUtil.create('div', 'leaflet-control legend');
    legend.addTo(appState.map);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.getElementById('togglePanelBtn').addEventListener('click', () => {
    document.getElementById('controlPanel').classList.toggle('open');
});

document.addEventListener('DOMContentLoaded', async () => {
    initializeMap();
    await loadPopulationData();
    fetch('/population/syria_provinces.geojson')
        .then(r => r.json()).then(loadGeoJsonToMap)
        .catch(err => console.error(err));
    window.addEventListener('resize', debounce(fitMapToScreen, 150));
});

window.SyrianAtlas = {
    setDataType: type => selectDataType(type),
    getCurrentSource: () => appState.currentDataSource,
};