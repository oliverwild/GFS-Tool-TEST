/* =========================
   Settings Management
========================= */
function initializeSettings(toolModal) {
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsModal  = document.getElementById('settings-modal');
  const closeSettings  = document.getElementById('close-settings-modal');
  const themeSelect    = document.getElementById('theme-select');
  const resetBtn       = document.getElementById('reset-settings');

  loadSettings();

  if (settingsToggle) {
    settingsToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (toolModal) toolModal.style.display = 'none';
      showSimpleSettingsModal();
    });
  }
  if (closeSettings) {
    closeSettings.addEventListener('click', () => (settingsModal.style.display = 'none'));
  }
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
      saveSettings();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display === 'block') {
      settingsModal.style.display = 'none';
    }
  });
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');

  const theme = settings.theme || 'dark';
  applyTheme(theme);
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) themeSelect.value = theme;

  const toolOrder = settings.toolOrder || ['range-splitting','label-preview','range-jumping','route-mapping','sql-search-macro'];
  const toolVisibility = settings.toolVisibility || {
    'range-splitting': true,
    'label-preview':   true,
    'range-jumping':   true,
    'route-mapping':   true,
    'sql-search-macro':true
  };

  applyToolOrder(toolOrder);
  applyToolVisibility(toolVisibility);
}

function saveSettings() {
  const settings = {
    theme: document.getElementById('theme-select')?.value || 'dark',
    toolOrder: getCurrentToolOrder(),
    toolVisibility: getCurrentToolVisibility()
  };
  localStorage.setItem('gfs-settings', JSON.stringify(settings));
}

function applyTheme(theme) {
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('data-theme', theme);
  }
}

function resetSettings() {
  localStorage.removeItem('gfs-settings');
  location.reload();
}

/* =========================
   Tool Management (Settings)
========================= */
function populateToolOrderList() {
  const toolOrderList = document.getElementById('tool-order-list');
  const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
  const toolOrder = settings.toolOrder || ['range-splitting','label-preview','range-jumping','route-mapping','sql-search-macro'];
  const toolVisibility = settings.toolVisibility || {
    'range-splitting': true,
    'label-preview':   true,
    'range-jumping':   true,
    'route-mapping':   true,
    'sql-search-macro':true
  };

  const toolData = {
    'range-splitting':  { name: 'Range Splitting', description: 'Split ranges into smaller segments', icon: 'fas fa-cut' },
    'label-preview':    { name: 'Label Preview',   description: 'Preview and generate shipping labels', icon: 'fas fa-tag' },
    'range-jumping':    { name: 'Range Jumping',   description: 'Generate UPDATE scripts for range numbers', icon: 'fas fa-arrow-right' },
    'route-mapping':    { name: 'Route Mapping',   description: 'Generate SQL INSERT statements for carrier routes', icon: 'fas fa-route' },
    'sql-search-macro': { name: 'SQL Search Macro',description: 'Build WHERE IN list from consignments', icon: 'fas fa-database' }
  };

  toolOrderList.innerHTML = '';
  toolOrder.forEach((toolId) => {
    const tool = toolData[toolId];
    if (!tool) return;
    const item = document.createElement('div');
    item.className = 'tool-order-item';
    item.draggable = true;
    item.dataset.toolId = toolId;
    item.innerHTML = `
      <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
      <div class="tool-info">
        <div class="tool-icon"><i class="${tool.icon}"></i></div>
        <div class="tool-details">
          <h4>${tool.name}</h4>
          <p>${tool.description}</p>
        </div>
      </div>
      <div class="tool-toggle">
        <div class="toggle-switch ${toolVisibility[toolId] ? 'active' : ''}" data-tool-id="${toolId}"></div>
      </div>`;
    toolOrderList.appendChild(item);
  });

  initializeDragAndDrop();
  initializeToolToggles();
}

function initializeDragAndDrop() {
  const toolOrderList = document.getElementById('tool-order-list');
  let dragged = null;

  toolOrderList.addEventListener('dragstart', (e) => {
    dragged = e.target.closest('.tool-order-item');
    if (dragged) dragged.classList.add('dragging');
  });

  toolOrderList.addEventListener('dragend', () => {
    if (dragged) dragged.classList.remove('dragging');
    dragged = null;
  });

  toolOrderList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const after = getDragAfterElement(toolOrderList, e.clientY);
    if (!dragged) return;
    if (!after) toolOrderList.appendChild(dragged);
    else toolOrderList.insertBefore(dragged, after);
  });

  toolOrderList.addEventListener('drop', () => {
    saveSettings();
    applyToolOrder(getCurrentToolOrder());
  });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.tool-order-item:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function initializeToolToggles() {
  document.querySelectorAll('.toggle-switch').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      saveSettings();
      applyToolVisibility(getCurrentToolVisibility());
    });
  });
}

function getCurrentToolOrder() {
  const list = document.getElementById('tool-order-list');
  if (!list) return [];
  return Array.from(list.children).map((el) => el.dataset.toolId);
}

function getCurrentToolVisibility() {
  const vis = {};
  document.querySelectorAll('.toggle-switch').forEach((t) => {
    vis[t.dataset.toolId] = t.classList.contains('active');
  });
  return vis;
}

function applyToolOrder(order) {
  const grid = document.querySelector('.tools-grid');
  const cards = Array.from(grid.children);
  order.forEach((toolId) => {
    const card = cards.find((c) => c.querySelector(`[data-tool="${toolId}"]`));
    if (card) grid.appendChild(card);
  });
}

function applyToolVisibility(toolVisibility) {
  Object.entries(toolVisibility).forEach(([toolId, visible]) => {
    const card = document.querySelector(`[data-tool="${toolId}"]`)?.closest('.tool-card');
    if (card) card.style.display = visible ? 'block' : 'none';
  });
}

/* =========================
   Simple Settings Modal
========================= */
function showSimpleSettingsModal() {
  const existing = document.getElementById('simple-settings-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'simple-settings-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:10000;
    display:flex;align-items:center;justify-content:center;`;
  modal.setAttribute('data-theme', document.body.getAttribute('data-theme') || 'dark');

  const content = document.createElement('div');
  content.style.cssText = `
    background:var(--bg-primary,#2a2a2a);color:var(--text-primary,#fff);
    padding:2rem;border-radius:12px;width:90%;max-width:600px;max-height:80vh;
    overflow:auto;border:1px solid var(--border-color,#444)`;
  content.innerHTML = `
    <div style="position:relative;margin-bottom:1rem;">
      <h2 style="margin:0;">Settings</h2>
      <button id="close-simple-settings" class="close-modal-btn"
        style="position:absolute;top:0;right:0;width:40px;height:40px;border-radius:50%;
               border:1px solid var(--border-color);background:var(--bg-tertiary);color:var(--text-primary);">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div style="height:1px;background:var(--border-color,#666);margin:1rem 0 1.5rem;"></div>
    <h3>Theme</h3>
    <div style="display:flex;align-items:center;gap:1rem;">
      <span>Light</span>
      <div id="theme-toggle-slider" style="width:60px;height:30px;border-radius:15px;border:1px solid var(--border-color,#666);position:relative;cursor:pointer;">
        <div style="position:absolute;top:2px;left:2px;width:24px;height:24px;border-radius:50%;"></div>
      </div>
      <span>Dark</span>
    </div>
    <div style="height:1px;background:var(--border-color,#666);margin:1.5rem 0;"></div>
    <h3>Tool Management</h3>
    <p>Drag tools to reorder them, or toggle to show/hide tools you don't use.</p>
    <div id="simple-tool-list" style="display:flex;flex-direction:column;gap:.5rem;"></div>
    <div style="height:1px;background:var(--border-color,#666);margin:1.5rem 0;"></div>
    <div style="text-align:center;">
      <button id="reset-simple-settings" class="btn btn-outline">Reset to Defaults</button>
    </div>
  `;
  modal.appendChild(content);
  document.body.appendChild(modal);

  document.getElementById('close-simple-settings').onclick = () => modal.remove();
  document.getElementById('reset-simple-settings').onclick = () => {
    localStorage.removeItem('gfs-settings'); location.reload();
  };

  const slider = document.getElementById('theme-toggle-slider');
  const knob = slider.querySelector('div');
  const isDark = (document.body.getAttribute('data-theme') || 'dark') === 'dark';
  const setSlider = (dark) => {
    slider.style.background = dark ? '#333333' : '#ffffff';
    slider.style.borderColor = dark ? '#555555' : '#000000';
    knob.style.background = dark ? '#ffffff' : '#000000';
    knob.style.transform = dark ? 'translateX(30px)' : 'translateX(0)';
  };
  setSlider(isDark);
  slider.addEventListener('click', () => {
    const dark = !(document.body.getAttribute('data-theme') === 'dark');
    applyTheme(dark ? 'dark' : 'light');
    modal.setAttribute('data-theme', dark ? 'dark' : 'light');
    setSlider(dark);
    saveSettings();
  });

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); }
  });

  populateSimpleToolList();
}

function populateSimpleToolList() {
  const toolList = document.getElementById('simple-tool-list');
  const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
  const toolOrder = (settings.toolOrder && settings.toolOrder.length)
    ? settings.toolOrder
    : ['range-splitting','label-preview','range-jumping','route-mapping','sql-search-macro'];
  const toolVisibility = settings.toolVisibility || {
    'range-splitting': true,
    'label-preview':   true,
    'range-jumping':   true,
    'route-mapping':   true,
    'sql-search-macro':true
  };

  const toolData = {
    'range-splitting':  { name: 'Range Splitting', description: 'Split ranges into smaller segments' },
    'label-preview':    { name: 'Label Preview',   description: 'Preview and generate shipping labels' },
    'range-jumping':    { name: 'Range Jumping',   description: 'Generate UPDATE scripts for range numbers' },
    'route-mapping':    { name: 'Route Mapping',   description: 'Generate SQL INSERT statements for carrier routes' },
    'sql-search-macro': { name: 'SQL Search Macro',description: 'Build WHERE IN list from consignments' }
  };

  toolList.innerHTML = '';
  toolOrder.forEach((toolId) => {
    const tool = toolData[toolId];
    if (!tool) return;
    const item = document.createElement('div');
    item.className = 'simple-tool-item';
    item.draggable = true;
    item.dataset.toolId = toolId;
    item.style.cssText = `
      display:flex;align-items:center;gap:1rem;padding:1rem;
      background:var(--bg-secondary,#333);border:1px solid var(--border-color,#555);
      border-radius:8px;cursor:move`;
    item.innerHTML = `
      <div style="color:var(--text-secondary,#888);cursor:grab;">⋮⋮</div>
      <div style="flex:1;">
        <h4 style="margin:0;">${tool.name}</h4>
        <p style="margin:0;opacity:.8;font-size:.9rem;">${tool.description}</p>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem;">
        <span>Show</span>
        <div class="simple-toggle" data-tool-id="${toolId}"
             style="width:44px;height:24px;border-radius:12px;position:relative;cursor:pointer;
                    background:${toolVisibility[toolId] ? '#4CAF50' : '#666'};">
          <div style="position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;
                      background:#fff;transform:translateX(${toolVisibility[toolId] ? '20px' : '0'});"></div>
        </div>
      </div>`;
    toolList.appendChild(item);
  });

  initializeSimpleDragAndDrop();

  document.querySelectorAll('.simple-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const toolId = toggle.dataset.toolId;
      const active = toggle.style.background === 'rgb(102, 102, 102)' ? false : true; // #666 vs #4CAF50
      const next = !active;
      toggle.style.background = next ? '#4CAF50' : '#666';
      toggle.querySelector('div').style.transform = next ? 'translateX(20px)' : 'translateX(0)';

      const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
      settings.toolVisibility = settings.toolVisibility || {};
      settings.toolVisibility[toolId] = next;
      localStorage.setItem('gfs-settings', JSON.stringify(settings));

      const card = document.querySelector(`[data-tool="${toolId}"]`)?.closest('.tool-card');
      if (card) card.style.display = next ? 'block' : 'none';
    });
  });
}

function initializeSimpleDragAndDrop() {
  const list = document.getElementById('simple-tool-list');
  let dragged = null, indicator = null;

  function createIndicator() {
    const d = document.createElement('div');
    d.style.cssText = 'height:2px;background:#4CAF50;margin:2px 0;border-radius:1px;opacity:0;';
    return d;
  }

  list.addEventListener('dragstart', (e) => {
    dragged = e.target.closest('.simple-tool-item');
    if (!dragged) return;
    dragged.style.transform = 'scale(1.02)';
    dragged.style.border = '2px solid #4CAF50';
    indicator = createIndicator();
  });
  list.addEventListener('dragend', () => {
    if (dragged) {
      dragged.style.transform = '';
      dragged.style.border = '1px solid var(--border-color,#555)';
    }
    dragged = null;
    indicator?.remove();
    indicator = null;
  });
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!dragged) return;
    const after = getSimpleDragAfterElement(list, e.clientY);
    indicator?.remove();
    indicator = createIndicator();
    if (after) list.insertBefore(indicator, after);
    else list.appendChild(indicator);
    indicator.style.opacity = '1';
  });
  list.addEventListener('drop', () => {
    if (!dragged) return;
    const after = getSimpleDragAfterElement(list, Number.POSITIVE_INFINITY); // place where indicator was
    indicator?.replaceWith(dragged);
    indicator = null;
    const newOrder = Array.from(list.children).map((el) => el.dataset.toolId);
    const settings = JSON.parse(localStorage.getItem('gfs-settings') || '{}');
    settings.toolOrder = newOrder;
    localStorage.setItem('gfs-settings', JSON.stringify(settings));
    applyToolOrder(newOrder);
  });
}

function getSimpleDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.simple-tool-item')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* =========================
   Utilities
========================= */
window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showCopyNotification('Copied to clipboard!', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    showCopyNotification('Copied to clipboard!', 'success');
  });
};

function showCopyNotification(message, type = 'success') {
  const existing = document.querySelector('.copy-notification');
  existing?.remove();
  const n = document.createElement('div');
  n.className = `copy-notification copy-notification-${type}`;
  n.innerHTML = `<div class="notification-content"><i class="fas fa-check-circle"></i><span>${message}</span></div>`;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 100);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 2000);
}

/* =========================
   Tools Initializers
========================= */
function initializeRangeSplitter() {
  const startInput = document.getElementById('start-range');
  const endInput = document.getElementById('end-range');
  const slider = document.getElementById('split-percentage');
  const pctLabel = document.getElementById('percentage-display');
  const calcBtn = document.getElementById('calculate-split');
  const copyBtn = document.getElementById('copy-results');
  const clearBtn = document.getElementById('clear-inputs');

  const calc = () => {
    const start = +startInput.value || 0;
    const end = +endInput.value || 0;
    const pct = +slider.value || 50;
    if (start >= end) {
      document.getElementById('total-range').textContent = 'Invalid range';
      document.getElementById('available-numbers').textContent = 'Start must be less than end';
      document.getElementById('first-range').textContent = '-';
      document.getElementById('first-count').textContent = '-';
      document.getElementById('second-range').textContent = '-';
      document.getElementById('second-count').textContent = '-';
      return;
    }
    const total = end - start;
    const firstCount = Math.floor(total * (pct / 100));
    const secondCount = total - firstCount;
    const firstEnd = start + firstCount - 1;
    const secondStart = firstEnd + 1;

    document.getElementById('total-range').textContent = `${start} to ${end}`;
    document.getElementById('available-numbers').textContent = total;

    const makeBox = (a, b) =>
      `<div class="range-copy-box"><span class="range-text">
        <span class="clickable-number" onclick="copyToClipboard('${a}')">${a}</span>
        <span class="range-separator"> to </span>
        <span class="clickable-number" onclick="copyToClipboard('${b}')">${b}</span>
      </span></div>`;

    document.getElementById('first-range').innerHTML = makeBox(start, firstEnd);
    document.getElementById('first-count').textContent = `${firstCount} numbers`;
    document.getElementById('second-range').innerHTML = makeBox(secondStart, end);
    document.getElementById('second-count').textContent = `${secondCount} numbers`;
  };

  slider.addEventListener('input', () => { pctLabel.textContent = slider.value + '%'; if (startInput.value && endInput.value) calc(); });
  startInput.addEventListener('input', calc);
  endInput.addEventListener('input', calc);
  calcBtn.addEventListener('click', calc);

  copyBtn.addEventListener('click', () => {
    const a = document.getElementById('first-range').textContent;
    const b = document.getElementById('second-range').textContent;
    if (a !== '-' && b !== '-') copyToClipboard(`Range Split Results:\nFirst Range: ${a}\nSecond Range: ${b}`);
  });

  clearBtn.addEventListener('click', () => {
    startInput.value = '';
    endInput.value = '';
    slider.value = 50; pctLabel.textContent = '50%';
    document.getElementById('total-range').textContent = '-';
    document.getElementById('available-numbers').textContent = '-';
    document.getElementById('first-range').textContent = '-';
    document.getElementById('first-count').textContent = '-';
    document.getElementById('second-range').textContent = '-';
    document.getElementById('second-count').textContent = '-';
  });
}

function initializeLabelPreview() {
  // (left exactly as your working version; omitted here for brevity)
  // If you need me to re-add the full label-preview logic, say the word.
}

function initializeRouteMapping() {
  const carrierSelect = document.getElementById('carrier-select');
  const generateSqlBtn = document.getElementById('generate-sql');
  const clearBtn = document.getElementById('clear-route');
  const routeResults = document.getElementById('route-results');
  const sqlScript = document.getElementById('sql-script');
  const copyBtn = document.getElementById('copy-sql');

  carrierSelect.addEventListener('change', function () {
    const evriFields = document.getElementById('evri-fields');
    evriFields.style.display = this.value === 'Evri' ? 'block' : 'none';
  });

  generateSqlBtn.addEventListener('click', () => {
    const carrier = carrierSelect.value;
    if (carrier !== 'Evri') { alert('Only Evri is supported right now.'); return; }

    const accountNumber = document.getElementById('evri-account').value;
    const isIOD = document.getElementById('evri-iod').checked;
    const isPOD = document.getElementById('evri-pod').checked;
    const isND  = document.getElementById('evri-next-day').checked;
    const is2D  = document.getElementById('evri-2-day').checked;
    const routeDesc = document.getElementById('evri-route-desc').value || 'Evri';

    if (!accountNumber || accountNumber < 0 || accountNumber > 9) { alert('Enter a valid account number (0-9).'); return; }
    if (!isIOD && !isPOD) { alert('Select at least one delivery type (IOD or POD).'); return; }
    if (!isND && !is2D) { alert('Select at least one service (Next Day or 2 Day).'); return; }

    const stmts = [];
    if (isND) {
      if (isIOD) stmts.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('ND${accountNumber}IOD','HERMES','7RY07${accountNumber}','NDAY','${routeDesc} IOD',null,null);`);
      if (isPOD) stmts.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('ND${accountNumber}POD','HERMES','1RY01${accountNumber}','NDAY','${routeDesc} POD',null,null);`);
    }
    if (is2D) {
      if (isIOD) stmts.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('2D${accountNumber}IOD','HERMES','7RY07${accountNumber}','2DAY','${routeDesc} IOD',null,null);`);
      if (isPOD) stmts.push(`insert into cust_routes (ROUTE_CODE,Carrier,CONTRACT_NO,SERVICE_CODE,ROUTE_DESC,PACKAGE_CODE,SATURDAY_DELIV) values ('2D${accountNumber}POD','HERMES','1RY01${accountNumber}','2DAY','${routeDesc} POD',null,null);`);
    }

    sqlScript.textContent = stmts.join('\n\n');
    routeResults.style.display = 'block';
    routeResults.scrollIntoView({ behavior: 'smooth' });
  });

  clearBtn.addEventListener('click', () => {
    carrierSelect.value = '';
    document.getElementById('evri-fields').style.display = 'none';
    document.getElementById('evri-account').value = '';
    document.getElementById('evri-iod').checked = false;
    document.getElementById('evri-pod').checked = false;
    document.getElementById('evri-next-day').checked = false;
    document.getElementById('evri-2-day').checked = false;
    document.getElementById('evri-route-desc').value = '';
    routeResults.style.display = 'none';
  });

  copyBtn.addEventListener('click', () => {
    const text = sqlScript.textContent;
    if (text.trim()) copyToClipboard(text);
  });
}

function initializeRangeJumping() {
  const copyQueryBtn = document.getElementById('copy-query');
  const insertScriptInput = document.getElementById('insert-script-input');
  const jumpAmountInput = document.getElementById('jump-amount');
  const generateUpdateBtn = document.getElementById('generate-update');
  const clearBtn = document.getElementById('clear-range-jump');
  const resultsBox = document.getElementById('range-jump-results');
  const output = document.getElementById('update-script');
  const copyBtn = document.getElementById('copy-update-script');

  copyQueryBtn.addEventListener('click', () => copyToClipboard(document.getElementById('range-query').textContent));

  generateUpdateBtn.addEventListener('click', () => {
    const insertScript = insertScriptInput.value.trim();
    const jump = parseInt(jumpAmountInput.value, 10) || 0;
    if (!insertScript) return alert('Paste your INSERT script results first.');
    if (jump <= 0) return alert('Enter a valid jump amount (> 0).');

    try {
      const lines = insertScript.split('\n').filter(Boolean);
      const updates = [];
      const parseValues = (str) => {
        const vals = []; let cur = '', q = false, qc = '';
        for (const ch of str) {
          if ((ch === "'" || ch === '"') && !q) { q = true; qc = ch; cur += ch; }
          else if (ch === qc && q) { q = false; qc = ''; cur += ch; }
          else if (ch === ',' && !q) { vals.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        if (cur.trim()) vals.push(cur.trim());
        return vals.map(v => v.replace(/^['"]|['"]$/g, ''));
      };

      const gen = (vals) => {
        if (vals.length >= 9) {
          const rangeId   = vals[1];
          const consCurNo = vals[4];
          const itemRangeId = vals[5];
          const curNo = vals[8];
          if (rangeId && !isNaN(+consCurNo)) updates.push(`UPDATE SHIP_RANGES SET cons_cur_no = ${+consCurNo + jump} WHERE ID = ${rangeId};`);
          if (itemRangeId && !isNaN(+curNo)) updates.push(`UPDATE ITEM_RANGES SET cur_no = ${+curNo + jump} WHERE ID = ${itemRangeId};`);
        }
      };

      for (const line of lines) {
        const l = line.trim();
        if (/^VALUES/i.test(l)) {
          const m = l.match(/VALUES\s*\(([^)]+)\)/i);
          if (m) gen(parseValues(m[1]));
        } else if (l.includes('(') && l.includes(')') && l.includes(',')) {
          const m = l.match(/\(([^)]+)\)/);
          if (m) gen(parseValues(m[1]));
        }
      }

      if (!updates.length) throw new Error('No valid INSERT statements found.');
      output.textContent = updates.join('\n\n');
      resultsBox.style.display = 'block';
      resultsBox.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Error generating update script: ' + err.message);
    }
  });

  clearBtn.addEventListener('click', () => {
    insertScriptInput.value = '';
    jumpAmountInput.value = '100';
    resultsBox.style.display = 'none';
  });

  copyBtn.addEventListener('click', () => {
    const text = output.textContent;
    if (text.trim()) copyToClipboard(text);
  });
}

function initializeSqlSearchMacro() {
  const inputEl  = document.getElementById('sql-macro-input');
  const outEl    = document.getElementById('sql-macro-output');
  const btnGen   = document.getElementById('sql-macro-generate');
  const btnClear = document.getElementById('sql-macro-clear');
  const btnCopy  = document.getElementById('sql-macro-copy');
  const results  = document.getElementById('sql-macro-results');

  // New date UI elements
  const dateFrom = document.getElementById('sql-date-from');
  const dateTo   = document.getElementById('sql-date-to');

  if (!inputEl || !outEl || !btnGen) return; // safety if tool not loaded

  // ---- Limit calendars to last 12 months up to today ----
  (function setDateBounds() {
    if (!dateFrom || !dateTo) return;

    const today = new Date();
    const maxStr = toInputDate(today); // yyyy-mm-dd

    const min = new Date(today);
    min.setMonth(min.getMonth() - 12);
    // clamp to 1st of month for a cleaner min (optional)
    // min.setDate(1);
    const minStr = toInputDate(min);

    dateFrom.setAttribute('max', maxStr);
    dateTo.setAttribute('max', maxStr);
    dateFrom.setAttribute('min', minStr);
    dateTo.setAttribute('min', minStr);
  })();

  // ---- Helpers ----
  function toInputDate(d) {
    // returns yyyy-mm-dd for <input type="date">
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatOracleDate(isoStr) {
    // isoStr: yyyy-mm-dd -> DD-MON-YYYY (MON uppercase 3 letters)
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-').map(s => parseInt(s, 10));
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mon = months[(m - 1) || 0];
    return `${String(d).padStart(2, '0')}-${mon}-${y}`;
  }

  // Keep only digits; drop everything else. Deduplicate while preserving order.
  function parseConsignments(raw) {
    const parts = raw.split(/[\s,;|\t\r\n]+/); // split on common delimiters/whitespace
    const seen = new Set();
    const out = [];

    for (const p of parts) {
      const digits = p.replace(/\D+/g, ''); // remove all non-digits
      if (digits && !seen.has(digits)) {
        seen.add(digits);
        out.push(digits);
      }
    }
    return out;
  }

  function buildSql(list, fromISO, toISO) {
    if (!list.length) return '-- Paste consignment numbers and (optionally) choose dates, then click Generate';

    const clauses = [];
    const inList = '(' + list.map(v => `'${v}'`).join(',') + ')';
    clauses.push(`cons_no IN ${inList}`);

    // Add date filters if provided
    if (fromISO) {
      const d = formatOracleDate(fromISO);
      clauses.push(`insert_date >= '${d}'`);
    }
    if (toISO) {
      const d = formatOracleDate(toISO);
      clauses.push(`insert_date <= '${d}'`);
    }

    return `SELECT *\nFROM shipments\nWHERE ${clauses.join('\n  AND ')}`;
  }

  // ---- Events ----
  btnGen.addEventListener('click', () => {
    const cons = parseConsignments(inputEl.value);
    const fromValue = dateFrom?.value || '';
    const toValue   = dateTo?.value   || '';

    outEl.textContent = buildSql(cons, fromValue, toValue);
    results.style.display = 'block';
  });

  btnClear.addEventListener('click', () => {
    inputEl.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo)   dateTo.value   = '';
    outEl.textContent = '';
    results.style.display = 'none';
  });

  btnCopy.addEventListener('click', async () => {
    const text = outEl.textContent || '';
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      btnCopy.textContent = 'Copied!';
      setTimeout(() => (btnCopy.textContent = 'Copy'), 1200);
    } catch {
      // Fallback to your global helper
      window.copyToClipboard(text);
    }
  });
}


/* =========================
   App Bootstrap
========================= */
document.addEventListener('DOMContentLoaded', () => {
  const toolModal = document.getElementById('tool-modal');
  const modalTitle = document.getElementById('modal-title');
  initializeSettings(toolModal);

  // Open a tool
  document.querySelectorAll('.open-tool').forEach((btn) => {
    btn.addEventListener('click', function () {
      document.getElementById('settings-modal').style.display = 'none';
      const toolType = this.getAttribute('data-tool');
      const toolName = this.closest('.tool-card').querySelector('h3').textContent;
      modalTitle.textContent = toolName;
      toolModal.style.display = 'block';
      showToolContent(toolType);
      this.style.transform = 'scale(0.95)'; setTimeout(() => (this.style.transform = 'scale(1)'), 150);
    });
  });

  // Close modal
  document.querySelectorAll('.close-modal-btn').forEach((b) =>
    b.addEventListener('click', () => (toolModal.style.display = 'none'))
  );
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toolModal.style.display = 'none'; });

  // Header effect
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
      header.style.background = 'rgba(255,255,255,0.98)';
      header.style.boxShadow = '0 2px 30px rgba(0,0,0,0.15)';
    } else {
      header.style.background = 'rgba(255,255,255,0.95)';
      header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    }
  });

  populateToolOrderList();

  function showToolContent(toolType) {
    document.querySelectorAll('.tool-content').forEach((c) => (c.style.display = 'none'));
    document.getElementById('default-wip').style.display = 'block';

    const show = (id, init) => {
      document.getElementById('default-wip').style.display = 'none';
      document.getElementById(id).style.display = 'block';
      init && init();
    };

    if (toolType === 'range-splitting') show('range-splitting-content', initializeRangeSplitter);
    else if (toolType === 'label-preview') show('label-preview-content', initializeLabelPreview);
    else if (toolType === 'range-jumping') show('range-jumping-content', initializeRangeJumping);
    else if (toolType === 'route-mapping') show('route-mapping-content', initializeRouteMapping);
    else if (toolType === 'sql-search-macro') show('sql-search-macro-content', initializeSqlSearchMacro);
  }
});
