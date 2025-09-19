(function(){
  const statusEl = document.getElementById('status');
  const tableWrap = document.getElementById('tableWrap');
  const theadRow = document.getElementById('theadRow');
  const tbody = document.getElementById('tbody');
  const provinceSelect = document.getElementById('provinceSelect');
  const searchInput = document.getElementById('searchInput');
  const sexFilter = document.getElementById('sexFilter');
  const ageGroupFilter = document.getElementById('ageGroupFilter');
  const statTotal = document.getElementById('statTotal');
  const statMale = document.getElementById('statMale');
  const statFemale = document.getElementById('statFemale');
  let sexChart, ageChart;

  const PROVINCES = [
    { key: 'qunaitra', label: 'القنيطرة', sheetId: '1lFrQs1onIXLo_kLpvn5oRCoAS_Oro6to8yHHItiYxEE', gid: '1068037771' },
    { key: 'idlib', label: 'إدلب', sheetId: '1bZKrmEUiFHdeID8pXHkT8XBaZ--oo6g2mGNcVvZMCgc', gid: '0' },
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
    return data.filter((row)=>{
      const name = row.__nameNorm;
      const place = row.__placeNorm;
      const rSex = row.__sexNorm;
      const rGroup = row.__ageGroup;
      if (sex && rSex !== sex) return false;
      if (group && rGroup !== group) return false;
      if (q) {
        const hay = `${name} ${place}`;
        if (!hay.includes(q)) return false;
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
  }

  function renderCharts(data){
    const sexCounts = { male: 0, female: 0 };
    const ageCounts = { lt30: 0, '30s': 0, '40s': 0, '50s': 0, '60p': 0 };
    data.forEach(r=>{
      const s = r.__sexNorm;
      if (s === 'ذكر') sexCounts.male++; else if (s === 'أنثى') sexCounts.female++;
      const g = r.__ageGroup || ageToGroup(computeAge(r));
      if (g in ageCounts) ageCounts[g]++;
    });
    const sexCtx = document.getElementById('sexChart');
    const ageCtx = document.getElementById('ageChart');
    if (sexChart) sexChart.destroy();
    if (ageChart) ageChart.destroy();
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
  }

  function renderTable(headers, rows){
    const HEADER_LABELS_AR = {
      'Name': 'الاسم',
      'BirthYear': 'سنة الميلاد',
      'Age 2025': 'العمر 2025',
      'Sex': 'الجنس',
      'Place': 'مكان الولادة',
    };
    theadRow.innerHTML = '';
    const headerDefs = headers.map((key)=>({ key, label: HEADER_LABELS_AR[key] || key }));
    headerDefs.forEach(({ label })=>{
      const th = document.createElement('th');
      th.className = 'px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-50';
      th.textContent = label;
      theadRow.appendChild(th);
    });
    tbody.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      headerDefs.forEach(({ key })=>{
        const td = document.createElement('td');
        td.className = 'px-4 py-2 text-sm border-t';
        td.textContent = r[key] || '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  let originalData = [];
  let headers = [];

  async function load(){
    try {
      statusEl.textContent = 'جاري التحميل…';
      const selectedKey = provinceSelect.value || 'qunaitra';
      const province = PROVINCES.find(p=>p.key===selectedKey) || PROVINCES[0];
      const res = await fetch(csvUrlFor(province), { cache: 'no-store' });
      if(!res.ok){ throw new Error('HTTP '+res.status); }
      const text = await res.text();
      if (window.SZ?.csv?.detectRedirectHTML && window.SZ.csv.detectRedirectHTML(text)) {
        throw new Error('لم يتم نشر الجدول كـ CSV للعامة');
      }
      const objects = window.SZ?.csv?.parseCSVToObjects ? window.SZ.csv.parseCSVToObjects(text) : [];
      headers = objects.length ? Object.keys(objects[0]) : [];
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

  document.addEventListener('DOMContentLoaded', function(){
    // Ensure Chart.js uses Arabic font
    try {
      // Set a global default font family for all charts
      Chart.defaults.font.family = "'IBM Plex Sans Arabic', 'Tahoma', sans-serif";
      Chart.defaults.font.size = 13;
    } catch(e) {}
    provinceSelect.innerHTML = PROVINCES.map(p=>`<option value="${p.key}">${p.label}</option>`).join('');
    provinceSelect.value = PROVINCES[0].key;
    load();
  });
  provinceSelect.addEventListener('change', load);
  searchInput.addEventListener('input', onControlsChange);
  sexFilter.addEventListener('change', onControlsChange);
  ageGroupFilter.addEventListener('change', onControlsChange);
})();


