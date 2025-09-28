(function(){
  const statusEl = document.getElementById('status');
  const tableWrap = document.getElementById('tableWrap');
  const theadRow = document.getElementById('theadRow');
  const tbody = document.getElementById('tbody');
  const provinceSelect = document.getElementById('provinceSelect');
  const searchInput = document.getElementById('searchInput');
  const sexFilter = document.getElementById('sexFilter');
  const ageGroupFilter = document.getElementById('ageGroupFilter');
  const appealFilter = document.getElementById('appealFilter');
  const statTotal = document.getElementById('statTotal');
  const statMale = document.getElementById('statMale');
  const statFemale = document.getElementById('statFemale');
  const statMalePct = document.getElementById('statMalePct');
  const statFemalePct = document.getElementById('statFemalePct');
  const statAppealed = document.getElementById('statAppealed');
  let sexChart, ageChart, appealChart;

  const PROVINCES = [
    { key: 'all', label: 'الكل', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '125118455' },
    { key: 'qunaitra', label: 'القنيطرة', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '522040139' },
    { key: 'idlib', label: 'إدلب', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '0' },
    { key: 'hama', label: 'حماة', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '694979899' },
    { key: 'damascus', label: 'دمشق', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '1923715976' },
    { key: 'rif-damascus', label: 'ريف دمشق', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '1677791143' },
    { key: 'daraa', label: 'درعا', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '1028853845' },
    { key: 'latakia', label: 'اللاذقية', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '638432279' },
    { key: 'tartus', label: 'طرطوس', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '1926010966' },
    { key: 'homs', label: 'حمص', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '252895295' },
    { key: 'aleppo', label: 'حلب', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '1121899715' },
    { key: 'deir-ez-zor', label: 'دير الزور', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '1166128088' },
  ];

  function csvUrlFor(p){
    return `https://docs.google.com/spreadsheets/d/${p.sheetId}/export?format=csv&gid=${p.gid}`;
  }

  function parseNumeric(value){
    if (typeof value === 'number') return value;
    const m = String(value || '').match(/-?\d+(?:[\.,]\d+)?/);
    if (!m) return 0;
    return Number(m[0].replace(',', '.')) || 0;
  }

  function stripArabicDiacritics(str){
    return (str || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '');
  }
  function normalizeString(str){
    let s = String(str || '');
    s = stripArabicDiacritics(s);
    s = s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    s = s.toLowerCase().trim();
    return s;
  }
  function normalizeSex(value){
    const v = normalizeString(value);
    if (v === 'ذكر') return 'ذكر';
    if (v === 'انثى' || v === 'انثي') return 'أنثى';
    return '';
  }
  function computeAge(row){
    const ageRaw = row['Age'] || row['العمر'] || row['السن'];
    let ageNum = parseNumeric(ageRaw);
    if (!ageNum || ageNum < 0 || ageNum > 120) {
      const by = parseNumeric(row['BirthYear'] || row['سنة الميلاد'] || row['سنة_الميلاد']);
      if (by > 1900 && by < 2100) {
        const nowYear = new Date().getFullYear();
        ageNum = Math.max(0, Math.min(120, nowYear - Math.round(by)));
      }
    }
    return ageNum;
  }
  function ageToGroup(age){
    const a = parseNumeric(age);
    if (a < 30) return 'lt30';
    if (a < 40) return '30s';
    if (a < 50) return '40s';
    if (a < 60) return '50s';
    return '60p';
  }

  function applyFilters(data){
    const q = normalizeString(searchInput.value);
    const sex = sexFilter.value;
    const group = ageGroupFilter.value;
    const appeal = (appealFilter && typeof appealFilter.value === 'string') ? appealFilter.value : '';
    return data.filter((row)=>{
      const name = row.__nameNorm;
      const place = row.__placeNorm;
      const rSex = row.__sexNorm;
      const rGroup = row.__ageGroup;
      const rAppeal = String(row.__appealStatus || '').trim();
      if (sex && rSex !== sex) return false;
      if (group && rGroup !== group) return false;
      if (appeal === 'appealed' && rAppeal !== 'مطعون') return false;
      if (appeal === 'notAppealed' && rAppeal === 'مطعون') return false;
      if (q) {
        const hay = `${name} ${place}`;
        if (!hay.includes(q)) return false;
      }
      // Drop empty rows (common in some sheets) – keep only rows with any real value, preferring Name
      const nameCell = String(row['Name'] || row['الاسم'] || '').trim();
      if (!nameCell) {
        const hasAnyValue = (headers || []).some((k)=> String(row[k] == null ? '' : row[k]).trim() !== '');
        if (!hasAnyValue) return false;
      }
      return true;
    });
  }

  function updateStats(data){
    const total = data.length;
    const male = data.filter((r)=> r.__sexNorm === 'ذكر').length;
    const female = data.filter((r)=> r.__sexNorm === 'أنثى').length;
    statTotal.textContent = String(total);
    statMale.textContent = String(male);
    statFemale.textContent = String(female);
    if (statMalePct) {
      const pct = total > 0 ? Math.round((male / total) * 1000) / 10 : 0;
      statMalePct.textContent = `${pct}%`;
    }
    if (statFemalePct) {
      const pct = total > 0 ? Math.round((female / total) * 1000) / 10 : 0;
      statFemalePct.textContent = `${pct}%`;
    }
    try {
      const appealed = data.filter((r)=> String((r['حالة الطعن']||'')).trim() === 'مطعون').length;
      if (statAppealed) statAppealed.textContent = String(appealed);
      if (statAppealedPct) {
        const pct = total > 0 ? Math.round((appealed / total) * 1000) / 10 : 0;
        statAppealedPct.textContent = `${pct}%`;
      }
    } catch(_) {}
  }

  function renderCharts(data){
    const sexCounts = { male: 0, female: 0 };
    const ageCounts = { lt30: 0, '30s': 0, '40s': 0, '50s': 0, '60p': 0 };
    let appealedCount = 0;
    data.forEach(r=>{
      const s = r.__sexNorm;
      if (s === 'ذكر') sexCounts.male++; else if (s === 'أنثى') sexCounts.female++;
      const g = r.__ageGroup || ageToGroup(computeAge(r));
      if (g in ageCounts) ageCounts[g]++;
      if (String(r.__appealStatus || r['حالة الطعن'] || '').trim() === 'مطعون') appealedCount++;
    });
    const sexCtx = document.getElementById('sexChart');
    const ageCtx = document.getElementById('ageChart');
    const appealCtx = document.getElementById('appealChart');
    if (sexChart) sexChart.destroy();
    if (ageChart) ageChart.destroy();
    if (appealChart) appealChart.destroy();
    const maleBase = '#556A4E';
    const femaleBase = '#A73F46';
    const maleDim = 'rgba(85,106,78,0.3)';
    const femaleDim = 'rgba(167,63,70,0.3)';
    const selectedSex = (typeof sexFilter?.value === 'string' ? sexFilter.value : '').trim();
    const sexColors = selectedSex === 'ذكر'
      ? [maleBase, femaleDim]
      : selectedSex === 'أنثى'
      ? [maleDim, femaleBase]
      : [maleBase, femaleBase];

    sexChart = new Chart(sexCtx, {
      type: 'doughnut',
      data: { labels: ['ذكر','أنثى'], datasets: [{ data: [sexCounts.male, sexCounts.female], backgroundColor: sexColors }] },
      options: {
        plugins: { legend: { position: 'bottom' } },
        onClick: (evt) => {
          try {
            const points = sexChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            const first = points && points[0];
            if (!first) return;
            const label = sexChart.data.labels[first.index];
            // Toggle selection via the existing select control
            const current = sexFilter.value;
            sexFilter.value = current === label ? '' : label;
            onControlsChange();
          } catch (_) {}
        }
      }
    });
    // UX: show pointer cursor over interactive chart
    try { sexCtx.style.cursor = 'pointer'; } catch(e) {}
    const ageBarColor = selectedSex === 'أنثى' ? femaleBase : maleBase;
    ageChart = new Chart(ageCtx, {
      type: 'bar',
      data: { labels: ['<30','30s','40s','50s','60+'], datasets: [{ data: [ageCounts.lt30, ageCounts['30s'], ageCounts['40s'], ageCounts['50s'], ageCounts['60p']], backgroundColor: ageBarColor }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    // Appeal chart
    const notAppealed = Math.max(0, (data.length - appealedCount));
    appealChart = new Chart(appealCtx, {
      type: 'doughnut',
      data: {
        labels: ['مطعون', 'سليم'],
        datasets: [{ data: [appealedCount, notAppealed], backgroundColor: [femaleBase, maleBase] }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  }

  function sortData(data, column, direction) {
    if (!column) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle null/undefined values - put them at the end
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      let result = 0;
      
      if (column === 'BirthYear' || column === 'Age 2025') {
        // Numeric sorting
        const aNum = parseNumeric(aVal);
        const bNum = parseNumeric(bVal);
        result = aNum - bNum;
      } else {
        // Text sorting 
        const aStr = String(aVal).trim();
        const bStr = String(bVal).trim();
        
        try {
          result = aStr.localeCompare(bStr, ['ar', 'ar-SA', 'ar-SY'], {
            numeric: false,
            sensitivity: 'base',
            ignorePunctuation: true
          });
        } catch (e) {
          // Fallback to normalized comparison if localeCompare fails
          const aNorm = normalizeString(aStr);
          const bNorm = normalizeString(bStr);
          result = aNorm < bNorm ? -1 : (aNorm > bNorm ? 1 : 0);
        }
      }
      
      return direction === 'desc' ? -result : result;
    });
  }

  function renderTable(headers, rows){
    const HEADER_LABELS_AR = {
      'Name': 'الاسم',
      'BirthYear': 'سنة الميلاد',
      'Age 2025': 'العمر 2025',
      'Sex': 'الجنس',
      'Place': 'مكان الولادة',
      'Electoral District (الدائرة الانتخابية)': 'الدائرة الانتخابية',
    };
    
    const sortedRows = sortData(rows, sortColumn, sortDirection);
    
    theadRow.innerHTML = '';
    // Build visible headers: drop empty columns in current view and the 'المطعونين' notes column
    const visibleHeaders = (headers || []).filter((key)=>{
      const k = String(key || '').trim();
      if (!k) return false;
      if (k === 'المطعونين') return false;
      // Hide columns that are entirely empty in the current dataset
      try {
        return sortedRows.some((r)=> String(r[key] == null ? '' : r[key]).trim() !== '');
      } catch(_) { return true; }
    });
    const headerDefs = visibleHeaders.map((key)=>({ key, label: HEADER_LABELS_AR[key] || key }));
    headerDefs.forEach(({ key, label })=>{
      const th = document.createElement('th');
      th.className = 'px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50 sortable-header';
      th.setAttribute('data-column', key);
      
      // Add sort indicator - unified component
      const indicator = document.createElement('span');
      indicator.className = 'sort-indicator';
      
      function createSortArrows(isActive, direction) {
        if (isActive) {
          const arrowClass = direction === 'asc' ? 'up' : 'down';
          return `<div class="sort-arrows">
            <div class="sort-arrow ${arrowClass}">▲</div>
          </div>`;
        } else {
          return `<div class="sort-arrows">
            <div class="sort-arrow up">▲</div>
            <div class="sort-arrow down">▲</div>
          </div>`;
        }
      }
      
      if (sortColumn === key) {
        indicator.innerHTML = createSortArrows(true, sortDirection);
        indicator.classList.add('active');
      } else {
        indicator.innerHTML = createSortArrows(false);
      }
      
      th.appendChild(document.createTextNode(label));
      th.appendChild(indicator);
      
      // Add click handler for sorting
      th.addEventListener('click', () => {
        if (sortColumn === key) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortColumn = key;
          sortDirection = 'asc';
        }
        onControlsChange();
      });
      
      theadRow.appendChild(th);
    });
    tbody.innerHTML = '';
    sortedRows.forEach(r=>{
      const tr = document.createElement('tr');
      try {
        if (String(r.__appealStatus || '').trim() === 'مطعون') {
          tr.classList.add('appealed-row');
        }
      } catch(_) {}
      headerDefs.forEach(({ key })=>{
        const td = document.createElement('td');
        td.className = 'px-4 py-2 text-sm border-t';
        td.textContent = r[key] || '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Render New Names table
    try {
      const section = document.getElementById('newNamesSection');
      const body = document.getElementById('newNamesBody');
      const selectedKey = provinceSelect.value || 'damascus';
      const newNamesKey = (headers || []).find((k)=> String(k||'').trim() === 'أسماء جديدة');
      if (!section || !body) return;
      if (selectedKey === 'all' || !newNamesKey) {
        section.style.display = 'none';
        body.innerHTML = '';
        return;
      }
      const items = sortedRows
        .map((r)=> String(r[newNamesKey] == null ? '' : r[newNamesKey]).trim())
        .filter((v)=> v !== '');
      if (items.length === 0) {
        section.style.display = 'none';
        body.innerHTML = '';
        return;
      }
      body.innerHTML = '';
      const countEl = document.getElementById('newNamesCount');
      try { if (countEl) countEl.textContent = String(items.length); } catch(_) {}
      items.forEach((val)=>{
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.className = 'px-4 py-2 text-sm border-t';
        td.textContent = val;
        tr.appendChild(td);
        body.appendChild(tr);
      });
      section.style.display = '';
    } catch(_) {}
  }

  let originalData = [];
  let headers = [];
  let sortColumn = 'Name'; // Default sort by Name
  let sortDirection = 'asc'; // 'asc' or 'desc'

  async function load(){
    try {
      statusEl.textContent = 'جاري التحميل…';
      const selectedKey = provinceSelect.value || 'damascus';
      
      let objects = [];
      
      {
        const province = PROVINCES.find(p=>p.key===selectedKey) || PROVINCES[0];
        const res = await fetch(csvUrlFor(province), { cache: 'no-store' });
        if(!res.ok){ throw new Error('HTTP '+res.status); }
        const text = await res.text();
        if (window.SZ?.csv?.detectRedirectHTML && window.SZ.csv.detectRedirectHTML(text)) {
          throw new Error('لم يتم نشر الجدول كـ CSV للعامة');
        }
        objects = window.SZ?.csv?.parseCSVToObjects ? window.SZ.csv.parseCSVToObjects(text) : [];
      }
      
      headers = objects.length ? Object.keys(objects[0]).filter(key => !key.startsWith('__')) : [];
      const appealKey = headers.find((k)=> String(k || '').trim() === 'حالة الطعن');
      originalData = objects.map(o=>{
        const sexNorm = normalizeSex(o['Sex']||o['الجنس']);
        const ageNum = computeAge(o);
        const ageGroup = ageToGroup(ageNum);
        const base = Object.assign({}, o, {
          __nameNorm: normalizeString(o['Name']||o['الاسم']),
          __placeNorm: normalizeString(o['Place']||o['المكان']),
          __sexNorm: sexNorm,
          __ageGroup: ageGroup,
        });
        try { base.__appealStatus = String((o[appealKey] || '')).trim(); } catch(_) { base.__appealStatus = ''; }
        if (!('Age' in base) && !('العمر' in base) && !('السن' in base)) {
          base['Age'] = String(ageNum || '');
        } else if ('Age' in base) {
          base['Age'] = String(ageNum || base['Age'] || '');
        }
        return base;
      });
      const filtered = applyFilters(originalData);
      renderTable(headers, filtered);
      updateStats(filtered);
      renderCharts(filtered);
      if(filtered.length===0){
        statusEl.textContent = 'لا توجد بيانات لعرضها حالياً';
        tableWrap.style.display = 'none';
      } else {
        statusEl.style.display = 'none';
        tableWrap.style.display = '';
      }
    } catch(e){
      statusEl.textContent = 'تعذّر تحميل البيانات: '+(e && e.message ? e.message : '');
      tableWrap.style.display = 'none';
    }
  }

  function onControlsChange(){
    const filtered = applyFilters(originalData);
    renderTable(headers, filtered);
    updateStats(filtered);
    renderCharts(filtered);
  }

  function resetFilters() {
    provinceSelect.value = 'all';
    searchInput.value = '';
    sexFilter.value = '';
    ageGroupFilter.value = '';
    try { if (appealFilter) appealFilter.value = ''; } catch(_) {}
    sortColumn = 'Name'; // Reset to default sort
    sortDirection = 'asc';
    // Immediately clear charts UI before reload
    try { sexChart?.destroy(); sexChart = undefined; } catch(e) {}
    try { ageChart?.destroy(); ageChart = undefined; } catch(e) {}
    statusEl.style.display = '';
    statusEl.textContent = 'جاري التحميل…';
    tableWrap.style.display = 'none';
    load();
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Ensure Chart.js uses Arabic font
    try {
      // Set a global default font family for all charts
      Chart.defaults.font.family = "'IBM Plex Sans Arabic', 'Tahoma', sans-serif";
      Chart.defaults.font.size = 13;
    } catch(e) {}
    provinceSelect.innerHTML = PROVINCES.map(p=>`<option value="${p.key}">${p.label}</option>`).join('');
    provinceSelect.value = 'damascus';
    
    // Add reset button event listener
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
      resetButton.addEventListener('click', resetFilters);
    }
    
    load();
  });
  provinceSelect.addEventListener('change', load);
  searchInput.addEventListener('input', onControlsChange);
  sexFilter.addEventListener('change', onControlsChange);
  ageGroupFilter.addEventListener('change', onControlsChange);
  try { appealFilter.addEventListener('change', onControlsChange); } catch(_) {}
})();


