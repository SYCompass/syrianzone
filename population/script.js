const appState={
    map:null,
    geojsonLayer:null,
    populationData:{},
    dataSources:{},
    currentDataSource:null,
    showDataSources:false,
    allPopulationData:null
};

const tooltip=document.getElementById('hover-tooltip');

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
    if(pop===0)return'#2a3033';
    if(pop>1_000_000)return'#4ade80';
    if(pop>500_000)return'#3a7d5a';
    if(pop>100_000)return'#5D695F';
    return'#5D695F';
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
        'Al Ḥasakah':['Al Hasakah','Hasakah'],
        'Ar Raqqah':['Raqqa'],
        'As Suwayda\'':['As Suwayda','Suwayda','As-Suwayda'],
        'Dar`a':['Daraa'],
        'Dayr Az Zawr':['Deir ez-Zor','Deir Ezzor'],
        'Rif Dimashq':['Damascus Countryside']
    };
    if(special[provinceName]){
        for(const v of special[provinceName])
            if(appState.populationData[v])return appState.populationData[v];
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
                    const popStr=pop?pop.toLocaleString('ar-SY'):'لا توجد بيانات';
                    tooltip.innerHTML=
                        `<div class="city-name">${name}</div>
                         <div>عدد السكان: ${popStr}</div>
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

async function loadPopulationData(){
    const res=await fetch('population_data.json');
    const data=await res.json();
    appState.allPopulationData=data;

    const sourcesGrid=document.getElementById('sourcesGrid');
    sourcesGrid.innerHTML='';

    data.sources.forEach(src=>{
        const id=`source_${src.source_id}`;
        appState.dataSources[id]={
            name:`المصدر ${src.source_id} (${src.date})`,
            description:src.note||'بيانات سكان',
            data:src.cities
        };

        const item=document.createElement('div');
        item.className='source-item';
        item.dataset.source=id;
        item.innerHTML=`
            <h4 class="source-name">المصدر ${src.source_id} (${src.date})</h4>
            <p class="source-description">${appState.dataSources[id].description}</p>
            <p style="font-size:.7rem;color:#5D695F;margin-top:2px">
                ${Object.keys(src.cities).length} مدينة
            </p>`;
        item.addEventListener('click',()=>selectDataSource(id));
        sourcesGrid.appendChild(item);
    });
    if(data.sources.length)selectDataSource(`source_${data.sources[0].source_id}`);
}

function selectDataSource(id){
    const src=appState.dataSources[id];
    if(!src)return;

    document.querySelectorAll('.source-item').forEach(el=>{
        el.classList.remove('selected');
        el.querySelector('.source-name').textContent=
            el.querySelector('.source-name').textContent.replace(' ✓','');
    });
    const sel=document.querySelector(`[data-source="${id}"]`);
    if(sel){
        sel.classList.add('selected');
        sel.querySelector('.source-name').textContent=src.name+' ✓';
    }

    appState.populationData=src.data;
    appState.currentDataSource=src.name;
    if(appState.geojsonLayer)appState.geojsonLayer.setStyle(getFeatureStyle);
    
    // Close the data sources panel
    const panel=document.getElementById('dataSourcesPanel');
    const btn=document.getElementById('dataSourcesBtn');
    appState.showDataSources=false;
    panel.classList.add('hidden');
    btn.classList.remove('active');
}

function addLegend(){
    const legend=L.control({position:'bottomright'});
    legend.onAdd=function(){
        const div=L.DomUtil.create('div','leaflet-control legend');
        const grades=[
            {label:'لا توجد بيانات',color:'#2a3033'},
            {label:'أقل من ١٠٠ ألف',color:'#5D695F'},
            {label:'١٠٠ ألف – ٥٠٠ ألف',color:'#3a7d5a'},
            {label:'أكثر من مليون',color:'#4ade80'}
        ];
        grades.forEach(g=>{
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

    fetch('syria_provinces.geojson')
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
    getCurrentSource:()=>appState.currentDataSource
};