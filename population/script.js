// Configuration constants
const CONFIG = {
    GOOGLE_SHEETS: {
        SHEET_ID: '2PACX-1vS6vFJV6ldATqU0Gi-0tnn-2VPBWz8So0zbVpWoCIdv7f_m7tOyDXPlAsOncPzB_y-LD9ZxgPw9AOAl',
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
        MAX_RETRIES: 3
    },
    CSV: {
        DELIMITER: ',',
        TRIM_HEADERS: true
    },
    CACHE: {
        NAMESPACE: 'population'
    }
};

const appState={
    map:null,
    geojsonLayer:null,
    populationData:{},
    dataSources:{},
    currentDataSource:null,
    currentDataType:'population',
    showDataSources:false,
    allPopulationData:null,
    dataTypeGroups:{}
};

const tooltip=document.getElementById('hover-tooltip');

// Data type configurations
const DATA_TYPE_CONFIG = {
    population: {
        label: 'عدد السكان',
        labelAr: 'السكان',
        colors: {
            none: '#2a3033',
            low: '#5D695F',
            medium: '#3a7d5a',
            high: '#4ade80'
        },
        legend: [
            {label:'لا توجد بيانات',color:'#2a3033'},
            {label:'أقل من ١٠٠ ألف',color:'#5D695F'},
            {label:'١٠٠ ألف – ٥٠٠ ألف',color:'#3a7d5a'},
            {label:'أكثر من مليون',color:'#4ade80'}
        ],
        thresholds: [100000, 500000, 1000000]
    },
    idp: {
        label: 'النازحين داخلياً',
        labelAr: 'النازحين',
        colors: {
            none: '#2a3033',
            low: '#fbbf24',
            medium: '#f59e0b',
            high: '#dc2626'
        },
        legend: [
            {label:'لا توجد بيانات',color:'#2a3033'},
            {label:'أقل من ١٠٠ ألف',color:'#fbbf24'},
            {label:'١٠٠ ألف – ٥٠٠ ألف',color:'#f59e0b'},
            {label:'أكثر من ٥٠٠ ألف',color:'#dc2626'}
        ],
        thresholds: [100000, 500000, 1000000]
    },
    idp_returnees: {
        label: 'العائدون من النزوح',
        labelAr: 'العائدون',
        colors: {
            none: '#2a3033',
            low: '#60a5fa',
            medium: '#3b82f6',
            high: '#1d4ed8'
        },
        legend: [
            {label:'لا توجد بيانات',color:'#2a3033'},
            {label:'أقل من ٥٠ ألف',color:'#60a5fa'},
            {label:'٥٠ ألف – ١٠٠ ألف',color:'#3b82f6'},
            {label:'أكثر من ١٠٠ ألف',color:'#1d4ed8'}
        ],
        thresholds: [50000, 100000, 200000]
    }
};

function initializeMap(){
    appState.map=L.map('map',{
        center:[35.0,38.5],
        zoom:7,
        zoomControl:false,
        attributionControl:false,
        dragging:false,
        touchZoom:false,
        doubleClickZoom:false,
        scrollWheelZoom:false,
        boxZoom:false,
        keyboard:false
    });
    addLegend();
    createDataTypeTabs();
}

function createDataTypeTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'dataTypeTabs';
    tabsContainer.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        padding: 4px;
        gap: 4px;
    `;
    
    Object.keys(DATA_TYPE_CONFIG).forEach(type => {
        const tab = document.createElement('button');
        tab.className = 'data-type-tab';
        tab.dataset.type = type;
        tab.textContent = DATA_TYPE_CONFIG[type].labelAr;
        tab.style.cssText = `
            padding: 8px 16px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            font-weight: 500;
            color: #5D695F;
            transition: all 0.2s;
        `;
        
        if (type === appState.currentDataType) {
            tab.style.background = '#e5e7eb';
            tab.style.color = '#1f2937';
        }
        
        tab.addEventListener('click', () => selectDataType(type));
        tabsContainer.appendChild(tab);
    });
    
    document.getElementById('map').appendChild(tabsContainer);
}

function selectDataType(type) {
    appState.currentDataType = type;
    
    // Update tab styles
    document.querySelectorAll('.data-type-tab').forEach(tab => {
        if (tab.dataset.type === type) {
            tab.style.background = '#e5e7eb';
            tab.style.color = '#1f2937';
        } else {
            tab.style.background = 'transparent';
            tab.style.color = '#5D695F';
        }
    });
    
    // Update legend
    updateLegend();
    
    // Update sources panel AND auto-select first source
    updateSourcesPanel();
    
    // Reset map colors
    if (appState.geojsonLayer) {
        appState.geojsonLayer.setStyle(getFeatureStyle);
    }
}

function updateSourcesPanel() {
    const sourcesGrid = document.getElementById('sourcesGrid');
    sourcesGrid.innerHTML = '';
    
    const sources = appState.dataTypeGroups[appState.currentDataType] || [];
    
    if (sources.length === 0) {
        sourcesGrid.innerHTML = '<div style="padding:20px;text-align:center;color:#5D695F">لا توجد مصادر متاحة</div>';
        return;
    }
    
    sources.forEach(src => {
        const id = `${appState.currentDataType}_${src.source_id}`;
        
        const item = document.createElement('div');
        item.className = 'source-item';
        item.dataset.source = id;
        item.innerHTML = `
            <h4 class="source-name">المصدر ${src.source_id} (${src.date})</h4>
            <p class="source-description">${src.note || 'بيانات'}</p>
            <p style="font-size:.7rem;color:#5D695F;margin-top:2px">
                ${Object.keys(src.cities).length} محافظة
            </p>`;
        item.addEventListener('click', () => selectDataSource(id));
        sourcesGrid.appendChild(item);
    });
    
    // Auto-select first source
    if (sources.length > 0) {
        const firstSourceId = `${appState.currentDataType}_${sources[0].source_id}`;
        selectDataSource(firstSourceId);
    }
}

function normalizeCityName(name){
    if(!name)return'';
    return name.trim()
        .replace(/['`]/g,'')
        .replace(/Ḥ/g,'H')
        .toLowerCase();
}

function createNameMapping(cities){
    const mapping={};
    Object.keys(cities).forEach(city=>{
        mapping[normalizeCityName(city)]=city;
    });
    return mapping;
}

function getColor(pop){
    const config = DATA_TYPE_CONFIG[appState.currentDataType];
    if(!config) return '#2a3033';
    
    if(pop===0)return config.colors.none;
    if(pop>config.thresholds[2])return config.colors.high;
    if(pop>config.thresholds[1])return config.colors.medium;
    if(pop>config.thresholds[0])return config.colors.low;
    return config.colors.low;
}

function getFeatureStyle(feature){
    const name=feature.properties.province_name;
    const pop=findPopulation(name);
    return{
        fillColor:getColor(pop),
        weight:2,
        opacity:1,
        color:'#5D695F',
        fillOpacity:.7
    };
}

function findPopulation(provinceName){
    let pop=0;
    if(!appState.populationData)return pop;

    if(appState.populationData[provinceName])return appState.populationData[provinceName];

    const normalized=normalizeCityName(provinceName);
    const mapping=createNameMapping(appState.populationData);
    if(mapping[normalized])return appState.populationData[mapping[normalized]];

    const special={
        'Al Ḥasakah':['Al Hasakah','Hasakah','Al-Hasakeh'],
        'Ar Raqqah':['Raqqa','Ar Raqqa','Ar-Raqqa'],
        'As Suwayda\'':['As Suwayda','Suwayda','As-Suwayda','As-Sweida'],
        'Dar`a':['Daraa','Dar\'a'],
        'Dayr Az Zawr':['Deir ez-Zor','Deir Ezzor','Deir-ez-Zor'],
        'Rif Dimashq':['Damascus Countryside','Rural Damascus'],
        'Ḥimş':['Homs'],
        'Ḩamāh':['Hama'],
        'Idlib':['Idleb'],
        'Ţarţūs':['Tartous']
    };
    if(special[provinceName]){
        for(const v of special[provinceName])
            {if(appState.populationData[v])return appState.populationData[v];}
    }
    return pop;
}

function loadGeoJsonToMap(data){
    if(appState.geojsonLayer)appState.map.removeLayer(appState.geojsonLayer);

    appState.geojsonLayer=L.geoJSON(data,{
        style:getFeatureStyle,
        onEachFeature:(feature,layer)=>{
            layer.on({
                mouseover:e=>{
                    const l=e.target;
                    l.setStyle({weight:3,color:'#B7BBBD',fillOpacity:.9});
                    l.bringToFront();

                    const name=feature.properties.province_name||'غير معروف';
                    const pop=findPopulation(name);
                    const config = DATA_TYPE_CONFIG[appState.currentDataType];
                    const popStr=pop?pop.toLocaleString('en-US'):'لا توجد بيانات';
                    tooltip.innerHTML=
                        `<div class="city-name">${name}</div>
                         <div>${config.label}: ${popStr}</div>
                         ${appState.currentDataSource?`<div style="font-size:11px;color:#5D695F;margin-top:2px">المصدر: ${appState.currentDataSource}</div>`:''}`;
                    tooltip.classList.remove('hidden');
                },
                mouseout:e=>{
                    appState.geojsonLayer.resetStyle(e.target);
                    tooltip.classList.add('hidden');
                },
                mousemove:e=>{
                    tooltip.style.left=(e.originalEvent.clientX+12)+'px';
                    tooltip.style.top=(e.originalEvent.clientY-28)+'px';
                }
            });
        }
    }).addTo(appState.map);

    appState.map.fitBounds(appState.geojsonLayer.getBounds());
}

// Process raw CSV data into sources format
function processPopulationData(rawData) {
    if (!rawData || rawData.length === 0) {
        throw new Error('No data found in CSV');
    }

    const dataTypeGroups = {
        population: [],
        idp: [],
        idp_returnees: []
    };
    const sourceMap = {};

    rawData.forEach((row) => {
        const dataType = row.data_type || row.Data_Type || row['data_type'] || 'population';
        const sourceId = row.source_id || row.Source_ID || row['Source ID'];
        const sourceUrl = row.source_url || row.Source_URL || row['Source URL'];
        const date = row.date || row.Date;
        const note = row.note || row.Note;
        const cityName = row.city_name || row.City_Name || row['City Name'];
        const populationStr = row.population || row.Population;

        if (!sourceId || !cityName || !dataType) return;

        const population = parseInt(populationStr) || 0;
        const key = `${dataType}_${sourceId}`;

        if (!sourceMap[key]) {
            sourceMap[key] = {
                data_type: dataType,
                source_id: parseInt(sourceId),
                source_url: sourceUrl,
                date: date,
                note: note,
                cities: {}
            };
            if (dataTypeGroups[dataType]) {
                dataTypeGroups[dataType].push(sourceMap[key]);
            }
        }

        if (cityName && population >= 0) {
            sourceMap[key].cities[cityName] = population;
        }
    });

    return { dataTypeGroups: dataTypeGroups };
}

async function loadPopulationData(){
    try {
        const cache = window.SZ?.cache?.createCache(CONFIG.CACHE.NAMESPACE) || null;
        const cachedData = cache?.get('populationData') || null;
        if (cachedData) {
            setupPopulationData(cachedData);
            return;
        }

        const loader = async () => {
            const csvUrl = `https://docs.google.com/spreadsheets/d/e/${CONFIG.GOOGLE_SHEETS.SHEET_ID}/pub?output=csv`;
            const res = await window.SZ.http.fetchWithRetry(csvUrl, {
                retries: CONFIG.GOOGLE_SHEETS.MAX_RETRIES,
                acceptTypes: 'text/csv, text/plain, */*'
            });
            const rows = window.SZ.csv.parseCSVToObjects(res.text, {
                delimiter: CONFIG.CSV.DELIMITER,
                trimHeaders: CONFIG.CSV.TRIM_HEADERS
            });
            return rows;
        };

        const rawData = await window.SZ.offline.runWithOfflineRetry(loader, {
            onError: (error) => console.error('Error loading population data:', error)
        });

        const data = processPopulationData(rawData);

        cache?.set('populationData', data, CONFIG.GOOGLE_SHEETS.CACHE_DURATION);

        setupPopulationData(data);
    } catch(error) {
        console.error('Error loading population data:', error);
        throw error;
    }
}

function setupPopulationData(data) {
    appState.allPopulationData = data;
    appState.dataTypeGroups = data.dataTypeGroups;
    
    updateSourcesPanel();
}

function selectDataSource(id){
    // Extract source ID from the end (everything after last underscore)
    const lastUnderscoreIndex = id.lastIndexOf('_');
    const sourceId = parseInt(id.substring(lastUnderscoreIndex + 1));
    const dataType = id.substring(0, lastUnderscoreIndex);
    
    const sources = appState.dataTypeGroups[dataType] || [];
    const src = sources.find(s => s.source_id === sourceId);
    
    if(!src)return;

    document.querySelectorAll('.source-item').forEach(el=>{
        el.classList.remove('selected');
        const nameEl = el.querySelector('.source-name');
        if (nameEl) {
            nameEl.textContent = nameEl.textContent.replace(' ✓','');
        }
    });
    
    const sel=document.querySelector(`[data-source="${id}"]`);
    if(sel){
        sel.classList.add('selected');
        const nameEl = sel.querySelector('.source-name');
        if (nameEl) {
            nameEl.textContent = `المصدر ${src.source_id} (${src.date}) ✓`;
        }
    }

    appState.populationData=src.cities;
    appState.currentDataSource=`المصدر ${src.source_id} (${src.date})`;
    if(appState.geojsonLayer)appState.geojsonLayer.setStyle(getFeatureStyle);
    
    const panel=document.getElementById('dataSourcesPanel');
    const btn=document.getElementById('dataSourcesBtn');
    appState.showDataSources=false;
    panel.classList.add('hidden');
    btn.classList.remove('active');
}

function updateLegend() {
    const legendDiv = document.querySelector('.legend');
    if (!legendDiv) return;
    
    const config = DATA_TYPE_CONFIG[appState.currentDataType];
    if (!config) return;
    
    legendDiv.innerHTML = '';
    config.legend.forEach(g=>{
        legendDiv.innerHTML+=`<div style="margin-bottom:4px">
            <i style="background:${g.color}"></i>${g.label}
        </div>`;
    });
}

function addLegend(){
    const legend=L.control({position:'bottomright'});
    legend.onAdd=function(){
        const div=L.DomUtil.create('div','leaflet-control legend');
        const config = DATA_TYPE_CONFIG[appState.currentDataType];
        config.legend.forEach(g=>{
            div.innerHTML+=`<div style="margin-bottom:4px">
                <i style="background:${g.color}"></i>${g.label}
            </div>`;
        });
        return div;
    };
    legend.addTo(appState.map);
}

document.getElementById('dataSourcesBtn').addEventListener('click',function(){
    const panel=document.getElementById('dataSourcesPanel');
    appState.showDataSources=!appState.showDataSources;
    panel.classList.toggle('hidden');
    this.classList.toggle('active');
});

document.addEventListener('DOMContentLoaded',async()=>{
    initializeMap();
    await loadPopulationData();

    fetch('/population/syria_provinces.geojson')
        .then(r=>r.json())
        .then(loadGeoJsonToMap)
        .catch(err=>console.error(err));
});

window.SyrianAtlas={
    loadGeoJson:loadGeoJsonToMap,
    setPopulationData:d=>{
        appState.populationData=d;
        if(appState.geojsonLayer)appState.geojsonLayer.setStyle(getFeatureStyle);
    },
    getCurrentSource:()=>appState.currentDataSource,
    setDataType:(type)=>selectDataType(type)
};