(function(){
  var LS_EQUIP = 'nobreak_calc_equip_v1';
  var LS_CUSTOM = 'nobreak_calc_custom_models_v1';
  var LS_TOUR_SEEN = 'nobreak_calc_tour_seen_v1';
  var LS_LEARNED_POWER = 'nobreak_calc_learned_power_v1';
  var LS_THEME = 'nobreak_calc_theme_v1';
  var LS_USER_CATALOG = 'nobreak_calc_user_catalog_v1';

  // ---------- catálogo de nobreaks (dados em js/data-nobreaks.js) ----------
  var presetCatalog = (typeof NOBREAK_PRESET_CATALOG !== 'undefined' ? NOBREAK_PRESET_CATALOG.slice() : []);
  presetCatalog.forEach(function(m, i){ m.id = 'preset-' + i; m.source = 'preset'; });

  var customCatalog = loadCustomModels();
  var equipamentos = loadEquipamentos();
  var mode = 'a';
  var editIndex = -1;
  var searchTerm = '';
  var lastDistParams = null; // {load, desiredMin, margin, eff} — reaproveitado pelo seletor manual

  var els = {
    eqBody: document.getElementById('eq-body'),
    eqNote: document.getElementById('eq-note'),
    totalLoad: document.getElementById('total-load'),
    name: document.getElementById('eq-name'),
    power: document.getElementById('eq-power'),
    qty: document.getElementById('eq-qty'),
    addBtn: document.getElementById('btn-add'),
    cancelEditBtn: document.getElementById('btn-cancel-edit'),
    catalogDl: document.getElementById('eq-catalog-dl'),
    catalogCount: document.getElementById('catalog-count'),
    search: document.getElementById('eq-search'),
    loadExampleBtn: document.getElementById('btn-load-example'),
    clearAllBtn: document.getElementById('btn-clear-all'),

    // catálogo de equipamentos (modal)
    catalogBtn: document.getElementById('catalog-btn'),
    catModalBackdrop: document.getElementById('cat-modal-backdrop'),
    catModal: document.getElementById('cat-modal'),
    catModalClose: document.getElementById('cat-modal-close'),
    catName: document.getElementById('cat-name'),
    catPower: document.getElementById('cat-power'),
    catCategory: document.getElementById('cat-category'),
    catCategoryDl: document.getElementById('cat-category-dl'),
    catSaveBtn: document.getElementById('cat-save-btn'),
    catCancelEditBtn: document.getElementById('cat-cancel-edit-btn'),
    catSearch: document.getElementById('cat-search'),
    catList: document.getElementById('cat-list'),

    modeABtn: document.getElementById('mode-a-btn'),
    modeBBtn: document.getElementById('mode-b-btn'),
    panelA: document.getElementById('panel-a'),
    panelB: document.getElementById('panel-b'),

    // modo A
    model: document.getElementById('a-model'),
    modelInfo: document.getElementById('a-model-info'),
    aVa: document.getElementById('a-va'),
    aPf: document.getElementById('a-pf'),
    aAh: document.getElementById('a-ah'),
    aVdc: document.getElementById('a-vdc'),
    aNbat: document.getElementById('a-nbat'),
    aEff: document.getElementById('a-eff'),
    aBig: document.getElementById('a-big'),
    aSub: document.getElementById('a-sub'),
    aPill: document.getElementById('a-pill'),
    aPillText: document.getElementById('a-pill-text'),
    aLoadPct: document.getElementById('a-load-pct'),
    aLoadFill: document.getElementById('a-load-fill'),
    aStatLoad: document.getElementById('a-stat-load'),
    aStatCap: document.getElementById('a-stat-cap'),
    aStatEnergy: document.getElementById('a-stat-energy'),
    aStatTime: document.getElementById('a-stat-time'),
    aClientName: document.getElementById('a-client-name'),
    aReportBtn: document.getElementById('a-report-btn'),

    // custom form
    customToggle: document.getElementById('btn-custom-toggle'),
    customForm: document.getElementById('custom-form'),
    customSave: document.getElementById('btn-custom-save'),
    customCancel: document.getElementById('btn-custom-cancel'),
    cName: document.getElementById('c-name'),
    cVa: document.getElementById('c-va'),
    cNbat: document.getElementById('c-nbat'),

    // modo B
    bMin: document.getElementById('b-min'),
    bMargin: document.getElementById('b-margin'),
    bVdc: document.getElementById('b-vdc'),
    bEff: document.getElementById('b-eff'),
    bPf: document.getElementById('b-pf'),
    bBatAh: document.getElementById('b-batah'),
    bBig: document.getElementById('b-big'),
    bSub: document.getElementById('b-sub'),
    bStatLoad: document.getElementById('b-stat-load'),
    bStatEnergy: document.getElementById('b-stat-energy'),
    bStatVa: document.getElementById('b-stat-va'),
    bStatNbat: document.getElementById('b-stat-nbat'),
    bSuggestion: document.getElementById('b-suggestion'),
    bDistResult: document.getElementById('b-dist-result'),
    bManualModel: document.getElementById('b-manual-model'),
    bManualResult: document.getElementById('b-manual-result'),
    bClientName: document.getElementById('b-client-name'),

    // cadastro simplificado de nobreak (modo B — nome + VA)
    bcToggle: document.getElementById('btn-bc-toggle'),
    bcForm: document.getElementById('bc-form'),
    bcSave: document.getElementById('btn-bc-save'),
    bcCancel: document.getElementById('btn-bc-cancel'),
    bcName: document.getElementById('bc-name'),
    bcVa: document.getElementById('bc-va'),
    bcNbat: document.getElementById('bc-nbat'),

    // gráfico de distribuição de carga
    loadChartCard: document.getElementById('load-chart-card'),
    loadChart: document.getElementById('load-chart'),

    // tema claro/escuro
    themeToggle: document.getElementById('theme-toggle'),

    // navegação e feedback
    quicknav: document.getElementById('quicknav'),
    toastContainer: document.getElementById('toast-container'),
    tourBtn: document.getElementById('tour-btn'),
    tourBlocker: document.getElementById('tour-blocker'),
    tourTooltip: document.getElementById('tour-tooltip'),
    tourTitle: document.getElementById('tour-title'),
    tourText: document.getElementById('tour-text'),
    tourStepCount: document.getElementById('tour-step-count'),
    tourPrev: document.getElementById('tour-prev'),
    tourNext: document.getElementById('tour-next'),
    tourSkip: document.getElementById('tour-skip')
  };

  function fmt(n, decimals){
    decimals = decimals === undefined ? 0 : decimals;
    if(!isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function fullCatalog(){
    return presetCatalog.concat(customCatalog);
  }

  function defaultEquipamentos(){
    return [
      {name:'Servidor', power:400, qty:1},
      {name:'Switch PoE 24 portas', power:150, qty:1},
      {name:'Roteador', power:15, qty:1},
      {name:'Monitor', power:40, qty:1},
      {name:'DVR/NVR', power:35, qty:1}
    ];
  }

  // ---------- toast ----------
  function showToast(message){
    if(!els.toastContainer) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    els.toastContainer.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    setTimeout(function(){
      el.classList.remove('show');
      setTimeout(function(){ el.remove(); }, 250);
    }, 2400);
  }

  // ---------- persistência (localStorage) ----------
  function loadEquipamentos(){
    try{
      var raw = localStorage.getItem(LS_EQUIP);
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length) return parsed;
      }
    }catch(e){}
    return defaultEquipamentos();
  }
  function saveEquipamentos(){
    try{ localStorage.setItem(LS_EQUIP, JSON.stringify(equipamentos)); }catch(e){}
  }
  function loadCustomModels(){
    try{
      var raw = localStorage.getItem(LS_CUSTOM);
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed)) return parsed;
      }
    }catch(e){}
    return [];
  }
  function saveCustomModels(){
    try{ localStorage.setItem(LS_CUSTOM, JSON.stringify(customCatalog)); }catch(e){}
  }

  // ---------- equipamentos ----------
  function totalLoadW(){
    return equipamentos.reduce(function(sum, e){ return sum + (e.poe ? 0 : e.power * e.qty); }, 0);
  }

  function matchesSearch(e, term){
    if(!term) return true;
    return e.name.toLowerCase().indexOf(term) !== -1;
  }

  function renderTable(){
    els.eqBody.innerHTML = '';
    var term = searchTerm.trim().toLowerCase();
    var visible = equipamentos
      .map(function(e, idx){ return {e: e, idx: idx}; })
      .filter(function(row){ return matchesSearch(row.e, term); });

    if(equipamentos.length === 0){
      var tr = document.createElement('tr');
      tr.className = 'empty-row';
      tr.innerHTML = '<td colspan="5">Nenhum equipamento adicionado</td>';
      els.eqBody.appendChild(tr);
    } else if(visible.length === 0){
      var tr2 = document.createElement('tr');
      tr2.className = 'empty-row';
      tr2.innerHTML = '<td colspan="5">Nenhum equipamento corresponde à busca</td>';
      els.eqBody.appendChild(tr2);
    } else {
      visible.forEach(function(row){
        var e = row.e, idx = row.idx;
        var tr = document.createElement('tr');
        if(e.poe) tr.className = 'is-poe';
        if(idx === editIndex) tr.className = (tr.className ? tr.className + ' ' : '') + 'is-editing';
        var totalW = e.power * e.qty;
        var nameCell = escapeHtml(e.name) + (e.poe ? '<span class="poe-badge">PoE</span>' : '');
        var totalCell = e.poe
          ? '<span title="Não soma no total — alimentado pelo switch">' + fmt(totalW) + '</span>'
          : fmt(totalW);
        tr.innerHTML =
          '<td>' + nameCell + '</td>' +
          '<td class="num-col"><input type="number" class="eq-inline-input eq-power-input" data-idx="' + idx + '" min="0" step="1" value="' + e.power + '" aria-label="Potência unitária de ' + escapeHtml(e.name) + ' em watts"></td>' +
          '<td class="center"><input type="number" class="eq-inline-input eq-qty-input" data-idx="' + idx + '" min="1" step="1" value="' + e.qty + '" aria-label="Quantidade de ' + escapeHtml(e.name) + '"></td>' +
          '<td class="num-col"><span class="eq-total-cell" data-idx="' + idx + '">' + totalCell + '</span></td>' +
          '<td class="center row-actions">' +
            '<button class="edit-btn" data-idx="' + idx + '" aria-label="Editar nome de ' + escapeHtml(e.name) + '">✎</button>' +
            '<button class="rm-btn" data-idx="' + idx + '" aria-label="Remover ' + escapeHtml(e.name) + '">×</button>' +
          '</td>';
        els.eqBody.appendChild(tr);
      });
    }
    els.totalLoad.textContent = fmt(totalLoadW()) + ' W';

    Array.prototype.forEach.call(els.eqBody.querySelectorAll('.rm-btn'), function(btn){
      btn.addEventListener('click', function(){
        var i = parseInt(btn.getAttribute('data-idx'), 10);
        var nome = equipamentos[i] ? equipamentos[i].name : '';
        equipamentos.splice(i, 1);
        if(editIndex === i) cancelEdit();
        saveEquipamentos();
        renderTable();
        recalc();
        showToast('Removido: ' + nome);
      });
    });

    Array.prototype.forEach.call(els.eqBody.querySelectorAll('.edit-btn'), function(btn){
      btn.addEventListener('click', function(){
        var i = parseInt(btn.getAttribute('data-idx'), 10);
        startEdit(i);
      });
    });

    // ---------- edição inline de potência (W) e quantidade ----------
    function updateInlineTotal(i){
      var item = equipamentos[i];
      if(!item) return;
      var totalW = item.power * item.qty;
      var cell = els.eqBody.querySelector('.eq-total-cell[data-idx="' + i + '"]');
      if(cell){
        cell.innerHTML = item.poe
          ? '<span title="Não soma no total — alimentado pelo switch">' + fmt(totalW) + '</span>'
          : fmt(totalW);
      }
      els.totalLoad.textContent = fmt(totalLoadW()) + ' W';
    }

    Array.prototype.forEach.call(els.eqBody.querySelectorAll('.eq-power-input'), function(inp){
      inp.addEventListener('input', function(){
        var i = parseInt(inp.getAttribute('data-idx'), 10);
        var val = parseFloat(inp.value);
        if(!isFinite(val) || val < 0) return;
        equipamentos[i].power = val;
        updateInlineTotal(i);
        recalc();
      });
      inp.addEventListener('change', function(){
        var i = parseInt(inp.getAttribute('data-idx'), 10);
        var val = parseFloat(inp.value);
        if(!isFinite(val) || val < 0){ inp.value = equipamentos[i].power; return; }
        equipamentos[i].power = val;
        learnPower(equipamentos[i].name, val);
        saveEquipamentos();
        updateInlineTotal(i);
        recalc();
      });
    });

    Array.prototype.forEach.call(els.eqBody.querySelectorAll('.eq-qty-input'), function(inp){
      inp.addEventListener('input', function(){
        var i = parseInt(inp.getAttribute('data-idx'), 10);
        var val = parseInt(inp.value, 10);
        if(!isFinite(val) || val < 1) return;
        equipamentos[i].qty = val;
        updateInlineTotal(i);
        recalc();
      });
      inp.addEventListener('change', function(){
        var i = parseInt(inp.getAttribute('data-idx'), 10);
        var val = parseInt(inp.value, 10);
        if(!isFinite(val) || val < 1){ inp.value = equipamentos[i].qty; return; }
        equipamentos[i].qty = val;
        saveEquipamentos();
        updateInlineTotal(i);
        recalc();
      });
    });
  }

  function startEdit(idx){
    var e = equipamentos[idx];
    if(!e) return;
    editIndex = idx;
    els.name.value = e.name;
    els.power.value = e.power;
    els.qty.value = e.qty;
    els.addBtn.textContent = 'Salvar alterações';
    els.cancelEditBtn.hidden = false;
    els.name.focus();
    renderTable();
  }

  function cancelEdit(){
    editIndex = -1;
    els.name.value = '';
    els.power.value = '';
    els.qty.value = '1';
    els.addBtn.textContent = 'Adicionar';
    els.cancelEditBtn.hidden = true;
    renderTable();
  }

  function addEquipment(){
    var name = els.name.value.trim();
    var power = parseFloat(els.power.value);
    var qty = parseInt(els.qty.value, 10);
    if(!name || !isFinite(power) || power <= 0 || !isFinite(qty) || qty <= 0){
      els.name.focus();
      return;
    }
    learnPower(name, power);

    if(editIndex >= 0 && equipamentos[editIndex]){
      // preserva a marcação PoE do item original, se houver (não há mais controle manual pra isso)
      var poe = !!equipamentos[editIndex].poe;
      equipamentos[editIndex] = {name: name, power: power, qty: qty, poe: poe};
      showToast('Equipamento atualizado');
      cancelEdit();
    } else {
      equipamentos.push({name: name, power: power, qty: qty});
      showToast('Adicionado: ' + name);
      els.name.value = '';
      els.power.value = '';
      els.qty.value = '1';
      els.name.focus();
    }
    els.eqNote.hidden = true;
    saveEquipamentos();
    renderTable();
    recalc();
  }

  els.addBtn.addEventListener('click', addEquipment);
  els.cancelEditBtn.addEventListener('click', cancelEdit);
  [els.name, els.power, els.qty].forEach(function(inp){
    inp.addEventListener('keydown', function(ev){ if(ev.key === 'Enter') addEquipment(); });
  });

  // ---------- busca na lista ----------
  if(els.search){
    els.search.addEventListener('input', function(){
      searchTerm = els.search.value;
      renderTable();
    });
  }

  // ---------- carregar exemplo / limpar tudo (com confirmação leve) ----------
  els.loadExampleBtn.addEventListener('click', function(){
    equipamentos = defaultEquipamentos();
    cancelEdit();
    saveEquipamentos();
    els.eqNote.hidden = false;
    renderTable();
    recalc();
    showToast('Exemplo carregado');
  });

  var clearConfirmTimer = null;
  els.clearAllBtn.addEventListener('click', function(){
    if(els.clearAllBtn.dataset.confirming === '1'){
      equipamentos = [];
      cancelEdit();
      saveEquipamentos();
      renderTable();
      recalc();
      resetClearBtn();
      showToast('Lista limpa');
      return;
    }
    els.clearAllBtn.dataset.confirming = '1';
    els.clearAllBtn.textContent = 'Confirmar limpeza?';
    clearConfirmTimer = setTimeout(resetClearBtn, 3000);
  });
  function resetClearBtn(){
    if(clearConfirmTimer){ clearTimeout(clearConfirmTimer); clearConfirmTimer = null; }
    els.clearAllBtn.dataset.confirming = '0';
    els.clearAllBtn.textContent = 'Limpar tudo';
  }

  // ---------- catálogo de equipamentos (aba GERAL) ----------
  var equipCatalog = (typeof EQUIP_CATALOG !== 'undefined') ? EQUIP_CATALOG : [];
  var catalogByLabelLower = {};

  // ---------- catálogo cadastrado pelo usuário (com categorias, editável) ----------
  function loadUserCatalog(){
    try{
      var raw = localStorage.getItem(LS_USER_CATALOG);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function saveUserCatalog(){
    try{ localStorage.setItem(LS_USER_CATALOG, JSON.stringify(userCatalog)); }catch(e){}
  }
  var userCatalog = loadUserCatalog();
  var catEditId = null;
  var catSearchTerm = '';

  function userCatalogLabel(item){
    return '[' + item.category + '] ' + item.name;
  }

  // ---------- potências aprendidas (equipamentos digitados/corrigidos pelo usuário) ----------
  function loadLearnedPower(){
    try{
      var raw = localStorage.getItem(LS_LEARNED_POWER);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  }
  function saveLearnedPower(){
    try{ localStorage.setItem(LS_LEARNED_POWER, JSON.stringify(learnedPower)); }catch(e){}
  }
  var learnedPower = loadLearnedPower();

  // Reconstrói o índice de busca (nome -> item) a partir do catálogo estático +
  // catálogo do usuário, aplicando por cima as potências aprendidas/corrigidas.
  function rebuildCatalogIndex(){
    catalogByLabelLower = {};
    equipCatalog.forEach(function(it){
      catalogByLabelLower[it.l.trim().toLowerCase()] = it;
    });
    userCatalog.forEach(function(it){
      var entry = {l: userCatalogLabel(it), w: it.power, c: it.category};
      catalogByLabelLower[entry.l.trim().toLowerCase()] = entry;
      // também indexa só pelo nome, para quem digitar sem o prefixo de categoria
      var nameKey = it.name.trim().toLowerCase();
      if(!catalogByLabelLower[nameKey]) catalogByLabelLower[nameKey] = entry;
    });
    // Aplica potências aprendidas por cima do catálogo, assim uma correção feita
    // antes já vale para a próxima vez que o item for usado.
    Object.keys(learnedPower).forEach(function(key){
      var hit = catalogByLabelLower[key];
      if(hit) hit.w = learnedPower[key];
    });
  }
  rebuildCatalogIndex();

  function learnPower(name, power){
    var key = name.trim().toLowerCase();
    if(!key || !isFinite(power) || power <= 0) return;
    if(learnedPower[key] !== power){
      learnedPower[key] = power;
      saveLearnedPower();
    }
    var hit = catalogByLabelLower[key];
    if(hit) hit.w = power;
  }

  function renderCatalogDatalist(){
    if(!els.catalogDl) return;
    var frag = document.createDocumentFragment();
    equipCatalog.forEach(function(it){
      var opt = document.createElement('option');
      opt.value = it.l;
      frag.appendChild(opt);
    });
    userCatalog.forEach(function(it){
      var opt = document.createElement('option');
      opt.value = userCatalogLabel(it);
      frag.appendChild(opt);
    });
    els.catalogDl.innerHTML = '';
    els.catalogDl.appendChild(frag);
    if(els.catalogCount) els.catalogCount.textContent = equipCatalog.length + userCatalog.length;
  }

  els.name.addEventListener('input', function(){
    var key = els.name.value.trim().toLowerCase();
    var hit = catalogByLabelLower[key];
    if(hit && hit.w){
      els.power.value = hit.w;
    } else if(learnedPower[key]){
      els.power.value = learnedPower[key];
    }
  });

  // ---------- modal: gestão do catálogo de equipamentos por categoria ----------
  var CAT_FALLBACK = 'Outros';

  function existingCategories(){
    var set = {};
    var order = [];
    equipCatalog.forEach(function(it){
      var c = (it.c || CAT_FALLBACK).trim();
      if(!set[c]){ set[c] = true; order.push(c); }
    });
    userCatalog.forEach(function(it){
      var c = (it.category || CAT_FALLBACK).trim();
      if(!set[c]){ set[c] = true; order.push(c); }
    });
    order.sort(function(a, b){ return a.localeCompare(b, 'pt-BR'); });
    return order;
  }

  function renderCategoryDatalist(){
    if(!els.catCategoryDl) return;
    els.catCategoryDl.innerHTML = existingCategories().map(function(c){
      return '<option value="' + escapeHtml(c) + '"></option>';
    }).join('');
  }

  function cancelCatEdit(){
    catEditId = null;
    els.catName.value = '';
    els.catPower.value = '';
    els.catCategory.value = '';
    els.catSaveBtn.textContent = 'Salvar';
    els.catCancelEditBtn.hidden = true;
  }

  function openCatalogModal(){
    renderCategoryDatalist();
    renderCatalogList();
    els.catModalBackdrop.hidden = false;
    els.catModal.hidden = false;
    els.catName.focus();
  }
  function closeCatalogModal(){
    els.catModalBackdrop.hidden = true;
    els.catModal.hidden = true;
    cancelCatEdit();
  }

  if(els.catalogBtn){ els.catalogBtn.addEventListener('click', openCatalogModal); }
  if(els.catModalClose){ els.catModalClose.addEventListener('click', closeCatalogModal); }
  if(els.catModalBackdrop){ els.catModalBackdrop.addEventListener('click', closeCatalogModal); }
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape' && els.catModal && !els.catModal.hidden) closeCatalogModal();
  });

  function saveCatItem(){
    var name = els.catName.value.trim();
    var power = parseFloat(els.catPower.value);
    var category = els.catCategory.value.trim() || CAT_FALLBACK;
    if(!name || !isFinite(power) || power <= 0){
      els.catName.focus();
      showToast('Informe nome e potência (W) válidos.');
      return;
    }
    if(catEditId){
      var item = userCatalog.filter(function(x){ return x.id === catEditId; })[0];
      if(item){
        item.name = name;
        item.power = power;
        item.category = category;
        showToast('Equipamento atualizado no catálogo');
      }
    } else {
      userCatalog.push({id: 'uc-' + Date.now() + '-' + Math.floor(Math.random() * 1000), name: name, power: power, category: category});
      showToast('Adicionado ao catálogo: ' + name);
    }
    saveUserCatalog();
    rebuildCatalogIndex();
    renderCatalogDatalist();
    renderCategoryDatalist();
    renderCatalogList();
    cancelCatEdit();
  }

  if(els.catSaveBtn){ els.catSaveBtn.addEventListener('click', saveCatItem); }
  if(els.catCancelEditBtn){ els.catCancelEditBtn.addEventListener('click', cancelCatEdit); }
  [els.catName, els.catPower, els.catCategory].forEach(function(inp){
    if(!inp) return;
    inp.addEventListener('keydown', function(ev){ if(ev.key === 'Enter') saveCatItem(); });
  });
  if(els.catSearch){
    els.catSearch.addEventListener('input', function(){
      catSearchTerm = els.catSearch.value;
      renderCatalogList();
    });
  }

  function editCatItem(id){
    var item = userCatalog.filter(function(x){ return x.id === id; })[0];
    if(!item) return;
    catEditId = id;
    els.catName.value = item.name;
    els.catPower.value = item.power;
    els.catCategory.value = item.category;
    els.catSaveBtn.textContent = 'Atualizar';
    els.catCancelEditBtn.hidden = false;
    els.catName.focus();
  }

  function deleteCatItem(id){
    userCatalog = userCatalog.filter(function(x){ return x.id !== id; });
    saveUserCatalog();
    rebuildCatalogIndex();
    renderCatalogDatalist();
    renderCategoryDatalist();
    renderCatalogList();
    showToast('Removido do catálogo');
  }

  function useCatItem(name, power){
    equipamentos.push({name: name, power: power, qty: 1});
    saveEquipamentos();
    els.eqNote.hidden = true;
    renderTable();
    recalc();
    showToast('Adicionado ao rack: ' + name);
  }

  function renderCatalogList(){
    if(!els.catList) return;
    var term = catSearchTerm.trim().toLowerCase();

    // agrupa por categoria — itens estáticos (referência) e do usuário juntos
    var groups = {};
    var order = [];
    function pushItem(category, entry){
      var c = (category || CAT_FALLBACK).trim();
      if(!groups[c]){ groups[c] = []; order.push(c); }
      groups[c].push(entry);
    }
    equipCatalog.forEach(function(it){
      if(term && it.l.toLowerCase().indexOf(term) === -1) return;
      // extrai o nome sem o prefixo "[Categoria] "
      var name = it.l.replace(/^\[[^\]]*\]\s*/, '');
      pushItem(it.c, {name: name, power: it.w, readonly: true, id: null});
    });
    userCatalog.forEach(function(it){
      if(term && it.name.toLowerCase().indexOf(term) === -1) return;
      pushItem(it.category, {name: it.name, power: it.power, readonly: false, id: it.id});
    });

    if(!order.length){
      els.catList.innerHTML = '<p class="cat-empty">Nenhum equipamento encontrado.</p>';
      return;
    }

    order.sort(function(a, b){ return a.localeCompare(b, 'pt-BR'); });

    els.catList.innerHTML = order.map(function(cat){
      var items = groups[cat].slice().sort(function(a, b){ return a.name.localeCompare(b.name, 'pt-BR'); });
      var rows = items.map(function(it){
        var powerText = isFinite(it.power) && it.power ? fmt(it.power) + ' W' : '— W';
        var useBtn = isFinite(it.power) && it.power
          ? '<button type="button" class="cat-use-btn" data-use-name="' + escapeHtml(it.name) + '" data-use-power="' + it.power + '" title="Adicionar ao rack">+ Rack</button>'
          : '';
        var editBtn = it.id ? '<button type="button" class="cat-edit-btn" data-edit-id="' + it.id + '" title="Editar">✎</button>' : '';
        var delBtn = it.id ? '<button type="button" class="cat-del-btn" data-del-id="' + it.id + '" title="Excluir">×</button>' : '';
        return '<div class="cat-item' + (it.readonly ? ' cat-item-readonly' : '') + '">' +
          '<span class="cat-item-name">' + escapeHtml(it.name) + '</span>' +
          '<span class="cat-item-power">' + powerText + '</span>' +
          '<span class="cat-item-actions">' + useBtn + editBtn + delBtn + '</span>' +
          '</div>';
      }).join('');
      return '<div class="cat-group">' +
        '<div class="cat-group-title"><span>' + escapeHtml(cat) + '</span><span class="cat-group-count">' + items.length + '</span></div>' +
        rows +
        '</div>';
    }).join('');
  }

  if(els.catList){
    els.catList.addEventListener('click', function(ev){
      var useBtn = ev.target.closest ? ev.target.closest('.cat-use-btn') : null;
      if(useBtn){
        useCatItem(useBtn.getAttribute('data-use-name'), parseFloat(useBtn.getAttribute('data-use-power')));
        return;
      }
      var editBtn = ev.target.closest ? ev.target.closest('.cat-edit-btn') : null;
      if(editBtn){
        editCatItem(editBtn.getAttribute('data-edit-id'));
        return;
      }
      var delBtn = ev.target.closest ? ev.target.closest('.cat-del-btn') : null;
      if(delBtn){
        deleteCatItem(delBtn.getAttribute('data-del-id'));
        return;
      }
    });
  }

  // ---------- select de modelos ----------
  function renderModelSelect(){
    var current = els.model.value;
    els.model.innerHTML = '';

    var manualOpt = document.createElement('option');
    manualOpt.value = '';
    manualOpt.textContent = 'Configuração manual';
    els.model.appendChild(manualOpt);

    var groups = {};
    var order = [];
    fullCatalog().forEach(function(m){
      var g = m.source === 'custom' ? 'Meus nobreaks' : m.linha;
      if(!groups[g]){ groups[g] = []; order.push(g); }
      groups[g].push(m);
    });

    order.forEach(function(g){
      var og = document.createElement('optgroup');
      og.label = g;
      groups[g].forEach(function(m){
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.modelo + ' — ' + fmt(m.va) + ' VA / ' + fmt(m.w) + ' W';
        og.appendChild(opt);
      });
      els.model.appendChild(og);
    });

    if(current){ els.model.value = current; }
  }

  function applyModel(id){
    if(!id){
      els.modelInfo.hidden = true;
      return;
    }
    var m = fullCatalog().filter(function(x){ return x.id === id; })[0];
    if(!m) return;
    els.aVa.value = m.va;
    els.aPf.value = (m.w / m.va).toFixed(2);
    els.aVdc.value = m.vdc;
    els.aAh.value = m.ah;
    els.aNbat.value = m.nbat;

    var info = '<strong>' + escapeHtml(m.linha) + ' — ' + escapeHtml(m.modelo) + '</strong> · ' + escapeHtml(m.onda) +
      ' · Bateria: ' + m.nbat + '× ' + m.vdc + 'V ' + m.ah + 'Ah' +
      '<br>Aplicação: ' + escapeHtml(m.aplicacao);
    if(m.faixa){
      info += '<br><em>Faixa: ' + escapeHtml(m.faixa) + '</em>';
    }
    els.modelInfo.innerHTML = info;
    els.modelInfo.hidden = false;
    recalc();
  }

  els.model.addEventListener('change', function(){ applyModel(els.model.value); });

  // ---------- form de nobreak personalizado ----------
  els.customToggle.addEventListener('click', function(){
    els.customForm.hidden = !els.customForm.hidden;
  });
  els.customCancel.addEventListener('click', function(){
    els.customForm.hidden = true;
  });
  els.customSave.addEventListener('click', function(){
    var name = els.cName.value.trim();
    var va = parseFloat(els.cVa.value);

    var userNbat = parseFloat(els.cNbat.value);

    if(!name){ els.cName.focus(); return; }
    if(!isFinite(va) || va <= 0){ els.cVa.focus(); return; }

    var specs = estimateNobreakSpecs(va, userNbat);
    var novo = {
      id: 'custom-' + Date.now(),
      linha: 'Personalizado',
      modelo: name,
      onda: 'Não especificado',
      va: va, w: specs.w, vdc: specs.vdc, ah: specs.ah, nbat: specs.nbat,
      aplicacao: 'Modelo personalizado — potência e bateria estimadas automaticamente a partir do VA informado',
      source: 'custom'
    };
    customCatalog.push(novo);
    saveCustomModels();
    renderModelSelect();
    renderManualModelSelect();
    els.model.value = novo.id;
    applyModel(novo.id);

    els.cName.value = '';
    els.cVa.value = '';
    els.cNbat.value = '';
    els.customForm.hidden = true;
    showToast('Nobreak "' + name + '" salvo — ' + fmt(specs.w) + ' W, ' + specs.nbat + '× bateria');
  });

  if(els.bManualModel){
    els.bManualModel.addEventListener('change', updateManualDistribution);
  }

  // ---------- cadastro simplificado de nobreak no Modo B (só nome + VA) ----------
  // Para quem não usa as linhas já cadastradas (XNB, ATTIV, Gamer, Rack/Torre, Online):
  // a potência real (W) e a bateria são estimadas a partir do VA, usando a mesma
  // faixa típica dos nobreaks interativos/semissenoidais mais comuns do mercado.
  function estimateNobreakSpecs(va, userNbat){
    var w = Math.round(va * 0.6 / 10) * 10; // fator de potência típico ~0.6 (interativo/semissenoidal)
    var vdc = 12;
    var estimatedNbat = va <= 900 ? 1 : (va <= 2200 ? 2 : Math.max(2, Math.ceil(va / 1500)));
    var nbat = (isFinite(userNbat) && userNbat > 0) ? Math.round(userNbat) : estimatedNbat;
    var ah = va <= 900 ? 7 : 9;
    return {w: w, vdc: vdc, ah: ah, nbat: nbat};
  }

  if(els.bcToggle){
    els.bcToggle.addEventListener('click', function(){
      els.bcForm.hidden = !els.bcForm.hidden;
      if(!els.bcForm.hidden) els.bcName.focus();
    });
  }
  if(els.bcCancel){
    els.bcCancel.addEventListener('click', function(){
      els.bcForm.hidden = true;
    });
  }
  if(els.bcSave){
    els.bcSave.addEventListener('click', function(){
      var name = els.bcName.value.trim();
      var va = parseFloat(els.bcVa.value);

      var userNbat = parseFloat(els.bcNbat.value);

      if(!name){ els.bcName.focus(); return; }
      if(!isFinite(va) || va <= 0){ els.bcVa.focus(); return; }

      var specs = estimateNobreakSpecs(va, userNbat);
      var novo = {
        id: 'custom-' + Date.now(),
        linha: 'Personalizado',
        modelo: name,
        onda: 'Não especificado',
        va: va, w: specs.w, vdc: specs.vdc, ah: specs.ah, nbat: specs.nbat,
        aplicacao: 'Modelo personalizado — potência e bateria estimadas automaticamente a partir do VA informado',
        source: 'custom'
      };
      customCatalog.push(novo);
      saveCustomModels();
      renderModelSelect();
      renderManualModelSelect();
      els.bManualModel.value = novo.id;
      updateManualDistribution();

      els.bcName.value = '';
      els.bcVa.value = '';
      els.bcNbat.value = '';
      els.bcForm.hidden = true;
      showToast('Nobreak "' + name + '" salvo — ' + fmt(specs.w) + ' W, ' + specs.nbat + '× bateria');
    });
  }

  // ---------- troca de modo ----------
  function setMode(m){
    mode = m;
    var isA = m === 'a';
    els.panelA.hidden = !isA;
    els.panelB.hidden = isA;
    els.modeABtn.classList.toggle('active', isA);
    els.modeBBtn.classList.toggle('active', !isA);
    els.modeABtn.setAttribute('aria-selected', isA ? 'true' : 'false');
    els.modeBBtn.setAttribute('aria-selected', !isA ? 'true' : 'false');
    recalc();
  }
  els.modeABtn.addEventListener('click', function(){ setMode('a'); });
  els.modeBBtn.addEventListener('click', function(){ setMode('b'); });

  var watchedA = [els.aVa, els.aPf, els.aAh, els.aVdc, els.aNbat, els.aEff];
  var watchedB = [els.bMin, els.bMargin, els.bVdc, els.bEff, els.bPf, els.bBatAh];
  watchedA.concat(watchedB).forEach(function(inp){
    inp.addEventListener('input', recalc);
  });

  // ---------- cálculo modo A ----------
  var lastModeAState = null;

  function recalcModeA(load){
    var va = parseFloat(els.aVa.value) || 0;
    var pf = parseFloat(els.aPf.value) || 0;
    var ah = parseFloat(els.aAh.value) || 0;
    var vdc = parseFloat(els.aVdc.value) || 0;
    var nbat = parseFloat(els.aNbat.value) || 0;
    var eff = (parseFloat(els.aEff.value) || 0) / 100;

    var usefulCapacityW = va * pf;
    var energyWh = ah * vdc * nbat * eff;
    var autonomyMin = load > 0 ? (energyWh / load) * 60 : 0;
    var loadPct = usefulCapacityW > 0 ? (load / usefulCapacityW) * 100 : 0;

    els.aStatLoad.textContent = fmt(load) + ' W';
    els.aStatCap.textContent = fmt(usefulCapacityW) + ' W';
    els.aStatEnergy.textContent = fmt(energyWh, 1) + ' Wh';

    var hours = Math.floor(autonomyMin / 60);
    var mins = Math.round(autonomyMin % 60);
    els.aStatTime.textContent = hours + 'h ' + mins + 'min';

    if(load <= 0){
      els.aBig.innerHTML = '— <small>min</small>';
      els.aSub.textContent = 'adicione ao menos um equipamento';
    } else if(autonomyMin >= 60){
      els.aBig.innerHTML = fmt(hours) + '<small>h</small> ' + fmt(mins) + '<small>min</small>';
      els.aSub.textContent = 'com a carga e bateria informadas';
    } else {
      els.aBig.innerHTML = fmt(autonomyMin, 1) + ' <small>min</small>';
      els.aSub.textContent = 'com a carga e bateria informadas';
    }

    els.aLoadPct.textContent = fmt(Math.min(loadPct, 999), 0) + '%';
    els.aLoadFill.style.width = Math.min(loadPct, 100) + '%';

    els.aPill.classList.remove('ok','warn','danger');
    if(usefulCapacityW <= 0){
      els.aPill.classList.add('warn');
      els.aPillText.textContent = 'Configure o nobreak';
      els.aLoadFill.style.background = 'var(--text-dim)';
    } else if(loadPct >= 100){
      els.aPill.classList.add('danger');
      els.aPillText.textContent = 'Sobrecarga';
      els.aLoadFill.style.background = 'var(--danger)';
    } else if(loadPct >= 80){
      els.aPill.classList.add('warn');
      els.aPillText.textContent = 'Próximo do limite';
      els.aLoadFill.style.background = 'var(--warn)';
    } else {
      els.aPill.classList.add('ok');
      els.aPillText.textContent = 'Dentro do limite';
      els.aLoadFill.style.background = 'var(--good)';
    }

    lastModeAState = {
      load: load,
      usefulCapacityW: usefulCapacityW,
      energyWh: energyWh,
      autonomyMin: autonomyMin,
      loadPct: loadPct
    };
  }

  function modeAReportModel(){
    var id = els.model ? els.model.value : '';
    var m = id ? fullCatalog().filter(function(x){ return x.id === id; })[0] : null;
    if(m) return m;
    return {
      modelo: 'Configuração manual',
      linha: null,
      source: null,
      va: parseFloat(els.aVa.value) || 0,
      w: (parseFloat(els.aVa.value) || 0) * (parseFloat(els.aPf.value) || 0),
      vdc: parseFloat(els.aVdc.value) || 0,
      ah: parseFloat(els.aAh.value) || 0,
      nbat: parseFloat(els.aNbat.value) || 0
    };
  }

  if(els.aReportBtn){
    els.aReportBtn.addEventListener('click', function(){
      if(!lastModeAState || lastModeAState.load <= 0){
        showToast('Adicione ao menos um equipamento antes de gerar o relatório.');
        return;
      }
      var m = modeAReportModel();
      openReport(buildReportHTMLModeA(m, lastModeAState.load, lastModeAState.usefulCapacityW, lastModeAState.energyWh, lastModeAState.autonomyMin, lastModeAState.loadPct));
    });
  }

  // ---------- cálculo modo B ----------
  function recalcModeB(load){
    var desiredMin = parseFloat(els.bMin.value) || 0;
    var margin = (parseFloat(els.bMargin.value) || 0) / 100;
    var vdc = parseFloat(els.bVdc.value) || 0;
    var eff = (parseFloat(els.bEff.value) || 0) / 100;
    var pf = parseFloat(els.bPf.value) || 0;
    var refBatAh = parseFloat(els.bBatAh.value) || 0;

    var energyNeededWh = load * (desiredMin / 60) * (1 + margin);
    var ahNeeded = (vdc > 0 && eff > 0) ? energyNeededWh / (vdc * eff) : 0;
    var vaNeeded = pf > 0 ? (load / pf) * (1 + margin) : 0;
    var nBatSuggested = refBatAh > 0 ? Math.ceil(ahNeeded / refBatAh) : 0;

    els.bStatLoad.textContent = fmt(load) + ' W';
    els.bStatEnergy.textContent = fmt(energyNeededWh, 1) + ' Wh';
    els.bStatVa.textContent = fmt(vaNeeded) + ' VA';
    els.bStatNbat.textContent = nBatSuggested + '×';

    if(load <= 0 || desiredMin <= 0){
      els.bBig.innerHTML = '— <small>Ah</small>';
      els.bSub.textContent = 'adicione equipamentos e defina a autonomia desejada';
      els.bSuggestion.textContent = 'Preencha os campos para ver a recomendação.';
      els.bDistResult.innerHTML = '<p class="hint">Adicione os equipamentos e informe a autonomia desejada para ver as sugestões.</p>';
      els.bManualResult.innerHTML = '';
      lastDistParams = null;
      return;
    }

    els.bBig.innerHTML = fmt(ahNeeded, 1) + ' <small>Ah @ ' + fmt(vdc) + 'V</small>';
    els.bSub.textContent = 'para ' + fmt(desiredMin) + ' min com margem de ' + fmt(margin * 100) + '%';
    els.bSuggestion.innerHTML =
      'Um único nobreak precisaria de pelo menos <strong>' + fmt(vaNeeded) + ' VA</strong> ' +
      '(considerando FP ' + fmt(pf, 2) + ') e banco de baterias de <strong>' + fmt(ahNeeded, 1) + ' Ah</strong> a ' + fmt(vdc) + 'V — ' +
      'equivalente a cerca de <strong>' + nBatSuggested + ' bateria(s)</strong> de ' + fmt(refBatAh, 1) + ' Ah em paralelo.';

    lastDistParams = {load: load, desiredMin: desiredMin, margin: margin, eff: eff};
    updateDistribution(load, desiredMin, margin, eff);
    updateManualDistribution();
  }

  // ---------- distribuição de carga entre múltiplos nobreaks ----------
  function modelCapacity(m, eff, desiredMin, margin){
    var energyWh = m.nbat * m.ah * m.vdc * eff;
    var maxLoadForAutonomy = desiredMin > 0 ? (energyWh * 60) / (desiredMin * (1 + margin)) : Infinity;
    return {capacity: Math.min(m.w, maxLoadForAutonomy), energyWh: energyWh};
  }

  function groupBinItems(items){
    var map = {};
    var order = [];
    items.forEach(function(it){
      var key = it.name + '|' + it.power;
      if(!map[key]){ map[key] = {name: it.name, power: it.power, qty: 0}; order.push(key); }
      map[key].qty++;
    });
    return order.map(function(k){ return map[k]; });
  }

  function packEquipment(m, eff, desiredMin, margin){
    var cap = modelCapacity(m, eff, desiredMin, margin);
    var units = [];
    equipamentos.forEach(function(e){
      for(var i = 0; i < e.qty; i++){ units.push({name: e.name, power: e.power}); }
    });
    units.sort(function(a, b){ return b.power - a.power; });

    var bins = [];
    var oversized = [];
    units.forEach(function(u){
      if(u.power > cap.capacity){ oversized.push(u); return; }
      var placed = false;
      for(var i = 0; i < bins.length; i++){
        if(bins[i].load + u.power <= cap.capacity){
          bins[i].items.push(u);
          bins[i].load += u.power;
          placed = true;
          break;
        }
      }
      if(!placed){ bins.push({items: [u], load: u.power}); }
    });

    return {capacity: cap.capacity, energyWh: cap.energyWh, bins: bins, oversized: oversized};
  }

  // Todos os modelos do catálogo padrão (js/data-nobreaks.js) são linhas Intelbras
  // (XNB, ATTIV, ATTIV SENO, Gamer, Rack/Torre, Online). Modelos personalizados só
  // contam como Intelbras se o nome/linha disser isso explicitamente.
  function isIntelbras(m){
    if(m.source === 'preset') return true;
    var text = ((m.linha || '') + ' ' + (m.modelo || '')).toUpperCase();
    return text.indexOf('INTELBRAS') !== -1;
  }

  // ---------- ícones genéricos de nobreak (ilustrativos, não são fotos de produto) ----------
  var ICON_TOWER =
    '<svg viewBox="0 0 64 64" width="72" height="72" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="14" y="4" width="36" height="56" rx="5" fill="#eef2f9" stroke="#5b6472" stroke-width="2"/>' +
    '<rect x="20" y="10" width="24" height="13" rx="2" fill="#1e6fd9"/>' +
    '<circle cx="24" cy="34" r="2.2" fill="#1f9d55"/>' +
    '<circle cx="32" cy="34" r="2.2" fill="#5b6472"/>' +
    '<circle cx="40" cy="34" r="2.2" fill="#5b6472"/>' +
    '<rect x="20" y="41" width="24" height="4" rx="1" fill="#5b6472"/>' +
    '<rect x="20" y="48" width="24" height="4" rx="1" fill="#5b6472"/>' +
    '</svg>';
  var ICON_RACK =
    '<svg viewBox="0 0 64 64" width="72" height="72" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="4" y="22" width="56" height="20" rx="3" fill="#eef2f9" stroke="#5b6472" stroke-width="2"/>' +
    '<rect x="9" y="27" width="18" height="10" rx="1" fill="#1e6fd9"/>' +
    '<circle cx="34" cy="32" r="2.2" fill="#1f9d55"/>' +
    '<circle cx="41" cy="32" r="2.2" fill="#5b6472"/>' +
    '<rect x="47" y="28" width="9" height="8" rx="1" fill="#5b6472"/>' +
    '</svg>';

  function genericIcon(m){
    var linha = (m.linha || '').toUpperCase();
    if(linha.indexOf('RACK') !== -1 || linha.indexOf('ONLINE') !== -1) return ICON_RACK;
    return ICON_TOWER;
  }

  // Foto oficial do produto (quando disponível no catálogo), com fallback para o ícone
  // ilustrativo caso a imagem não carregue (offline, hotlink bloqueado, URL alterada).
  function nobreakIcon(m){
    if(m.img){
      var fallback = genericIcon(m).replace(/"/g, '&quot;');
      return '<img src="' + escapeHtml(m.img) + '" alt="Foto do ' + escapeHtml(m.modelo || 'nobreak') +
        '" onerror="this.onerror=null;this.outerHTML=\'' + fallback + '\';">';
    }
    return genericIcon(m);
  }

  // ---------- relatório para impressão / PDF ----------
  function loadClassName(pct){
    if(pct >= 100) return 'danger';
    if(pct >= 80) return 'warn';
    return 'ok';
  }

  function reportHead(title){
    return '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + title + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@700;800&display=swap" rel="stylesheet">' +
      '<style>' +
      ':root{' +
        '--navy:#0f1b2d;--navy2:#16273f;--blue:#1e6fd9;--blue-dark:#144f9e;' +
        '--ink:#151a22;--muted:#5b6472;--line:#e3e8f0;--surface:#f6f8fc;--card:#ffffff;' +
        '--ok:#1f9d55;--ok-bg:#e5f7ec;--warn:#b3790a;--warn-bg:#fbf0dd;--danger:#c23a3a;--danger-bg:#fdeaea;' +
        '}' +
      '*{box-sizing:border-box;}' +
      'body{font-family:"Inter",Arial,Helvetica,sans-serif;color:var(--ink);background:var(--surface);margin:0;padding:0 0 40px;}' +
      '.rp-print-bar{position:sticky;top:0;background:#fff;padding:12px 24px;border-bottom:1px solid var(--line);display:flex;justify-content:flex-end;z-index:10;}' +
      '.rp-print-bar button{background:var(--blue);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(30,111,217,.35);}' +
      '.rp-print-bar button:hover{background:var(--blue-dark);}' +
      '.rp-wrap{max-width:860px;margin:0 auto;padding:0 24px;}' +
      '.rp-hero{background:linear-gradient(135deg,var(--navy) 0%,var(--navy2) 55%,var(--blue-dark) 100%);color:#fff;padding:40px 32px;margin-bottom:28px;}' +
      '.rp-hero-inner{max-width:812px;margin:0 auto;}' +
      '.rp-eyebrow{font-family:"Manrope",sans-serif;text-transform:uppercase;letter-spacing:1.6px;font-size:.72rem;font-weight:800;color:#9fc4f5;margin:0 0 10px;}' +
      '.rp-hero h1{font-family:"Manrope",sans-serif;font-size:1.8rem;font-weight:800;margin:0 0 6px;letter-spacing:-.3px;}' +
      '.rp-hero-meta{color:#c3d4ec;font-size:.88rem;margin-bottom:22px;}' +
      '.rp-hero-meta strong{color:#fff;}' +
      '.rp-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}' +
      '.rp-stat{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:14px 16px;}' +
      '.rp-stat-label{font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;color:#a9c3e6;font-weight:600;margin-bottom:6px;}' +
      '.rp-stat-value{font-family:"Manrope",sans-serif;font-size:1.35rem;font-weight:800;}' +
      '.rp-section{margin-top:36px;}' +
      '.rp-section h2{font-family:"Manrope",sans-serif;font-size:1.05rem;font-weight:800;color:var(--navy);margin:0 0 14px;display:flex;align-items:center;gap:9px;}' +
      '.rp-section h2::before{content:"";width:5px;height:18px;background:var(--blue);border-radius:3px;display:inline-block;}' +
      '.rp-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px;box-shadow:0 1px 3px rgba(15,27,45,.05);}' +
      'table{width:100%;border-collapse:collapse;font-size:.88rem;}' +
      'th{text-align:left;padding:9px 10px;font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);font-weight:700;border-bottom:2px solid var(--line);}' +
      'td{padding:10px;border-bottom:1px solid var(--line);}' +
      'tr:last-child td{border-bottom:none;}' +
      'td.num{text-align:right;font-variant-numeric:tabular-nums;}' +
      'td.center{text-align:center;}' +
      'td.strong{font-weight:700;color:var(--navy);}' +
      '.rp-muted-row td{color:#9aa2b0;}' +
      '.rp-tag-inline{font-size:.68rem;background:var(--surface);color:var(--muted);padding:2px 7px;border-radius:999px;margin-left:4px;}' +
      '.rp-total-bar{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);}' +
      '.rp-total-label{color:var(--muted);font-size:.85rem;font-weight:600;}' +
      '.rp-total-value{font-family:"Manrope",sans-serif;font-weight:800;font-size:1.3rem;color:var(--navy);}' +
      '.rp-nobreak-card{display:flex;gap:22px;align-items:center;flex-wrap:wrap;}' +
      '.rp-nobreak-photo{width:110px;height:110px;flex:0 0 110px;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--line);padding:10px;}' +
      '.rp-nobreak-photo img,.rp-nobreak-photo svg{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;}' +
      '.rp-nobreak-info{flex:1;min-width:220px;}' +
      '.rp-nobreak-info h3{margin:0 0 8px;font-family:"Manrope",sans-serif;font-size:1.3rem;font-weight:800;color:var(--navy);}' +
      '.badge{display:inline-block;font-size:.72rem;font-weight:700;padding:3px 11px;border-radius:999px;margin-right:6px;margin-bottom:6px;}' +
      '.badge-intelbras{background:var(--ok-bg);color:var(--ok);}' +
      '.badge-qty{background:#e4edfc;color:var(--blue-dark);}' +
      '.rp-spec-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px;}' +
      '.rp-spec{background:var(--surface);border-radius:10px;padding:9px 12px;}' +
      '.rp-spec-label{font-size:.66rem;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:700;margin-bottom:3px;}' +
      '.rp-spec-value{font-size:.92rem;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums;}' +
      '.rp-bin{border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-top:14px;background:var(--card);}' +
      '.rp-bin-head{display:flex;align-items:center;gap:12px;}' +
      '.rp-bin-badge{width:32px;height:32px;border-radius:9px;background:var(--navy);color:#fff;font-family:"Manrope",sans-serif;font-weight:800;font-size:.95rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
      '.rp-bin-title{font-weight:700;font-size:.95rem;color:var(--navy);}' +
      '.rp-bin-sub{color:var(--muted);font-size:.82rem;margin-top:1px;}' +
      '.rp-meter{height:7px;border-radius:99px;background:var(--line);margin:12px 0 4px;overflow:hidden;}' +
      '.rp-meter-fill{height:100%;border-radius:99px;}' +
      '.rp-meter-fill.ok{background:var(--ok);}' +
      '.rp-meter-fill.warn{background:var(--warn);}' +
      '.rp-meter-fill.danger{background:var(--danger);}' +
      '.rp-bin-list{list-style:none;margin:10px 0 0;padding:0;font-size:.88rem;}' +
      '.rp-bin-list li{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--line);}' +
      '.rp-bin-list li:first-child{border-top:none;}' +
      '.rp-item-power{color:var(--muted);font-size:.82rem;white-space:nowrap;font-variant-numeric:tabular-nums;}' +
      '.rp-warning{display:flex;gap:12px;align-items:flex-start;background:var(--warn-bg);color:#7a5206;padding:14px 16px;border-radius:10px;font-size:.86rem;margin-top:16px;}' +
      '.rp-warning-icon{font-size:1.1rem;}' +
      '.rp-footer{margin-top:44px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:.76rem;line-height:1.5;}' +
      '.rp-big-meter{height:22px;border-radius:99px;background:var(--line);overflow:hidden;margin:16px 0 6px;}' +
      '.rp-big-meter-fill{height:100%;border-radius:99px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;color:#fff;font-size:.72rem;font-weight:800;font-family:"Manrope",sans-serif;transition:width .3s ease;}' +
      '.rp-big-meter-fill.ok{background:linear-gradient(90deg,#1f9d55,#2bbf6c);}' +
      '.rp-big-meter-fill.warn{background:linear-gradient(90deg,#b3790a,#d99a1f);}' +
      '.rp-big-meter-fill.danger{background:linear-gradient(90deg,#c23a3a,#e35555);}' +
      '.rp-status-line{display:flex;justify-content:space-between;align-items:center;font-size:.82rem;color:var(--muted);}' +
      '.rp-status-pill{display:inline-block;font-size:.74rem;font-weight:800;padding:4px 12px;border-radius:999px;}' +
      '.rp-status-pill.ok{background:var(--ok-bg);color:var(--ok);}' +
      '.rp-status-pill.warn{background:var(--warn-bg);color:var(--warn);}' +
      '.rp-status-pill.danger{background:var(--danger-bg);color:var(--danger);}' +
      '@media (max-width:640px){.rp-stat-row{grid-template-columns:1fr;}.rp-nobreak-card{flex-direction:column;align-items:flex-start;}}' +
      '@media print{.rp-print-bar{display:none;}body{background:#fff;}.rp-hero{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.rp-bin{page-break-inside:avoid;}}' +
      '</style></head><body>' +
      '<div class="rp-print-bar"><button onclick="window.print()">🖨️ Imprimir / salvar como PDF</button></div>';
  }

  function buildReportHTML(m, result, desiredMin, totalLoad){
    var now = new Date();
    var dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    var clientName = els.bClientName ? els.bClientName.value.trim() : '';
    var qtyText = result.bins.length === 1 ? '1 unidade' : result.bins.length + ' unidades';
    var overallMinutes = (result.energyWh / (totalLoad || 1)) * 60;

    var equipRows = equipamentos.map(function(e){
      var total = e.poe ? 0 : e.power * e.qty;
      return '<tr' + (e.poe ? ' class="rp-muted-row"' : '') + '>' +
        '<td>' + escapeHtml(e.name) + (e.poe ? ' <span class="rp-tag-inline">PoE — não soma</span>' : '') + '</td>' +
        '<td class="num">' + fmt(e.power) + ' W</td>' +
        '<td class="num center">' + e.qty + '</td>' +
        '<td class="num strong">' + fmt(total) + ' W</td>' +
        '</tr>';
    }).join('');

    var binsHtml = result.bins.map(function(bin, i){
      var minutes = (result.energyWh / bin.load) * 60;
      var pctRaw = Math.round((bin.load / result.capacity) * 100);
      var pct = Math.min(pctRaw, 999);
      var barPct = Math.min(pctRaw, 100);
      var cls = loadClassName(pctRaw);
      var groups = groupBinItems(bin.items);
      var itemsList = groups.map(function(g){
        return '<li><span>' + (g.qty > 1 ? '<b>' + g.qty + '×</b> ' : '') + escapeHtml(g.name) + '</span>' +
          '<span class="rp-item-power">' + fmt(g.power) + ' W cada</span></li>';
      }).join('');
      return '<div class="rp-bin">' +
        '<div class="rp-bin-head">' +
          '<div class="rp-bin-badge">' + (i + 1) + '</div>' +
          '<div class="rp-bin-headtext">' +
            '<div class="rp-bin-title">Nobreak ' + (i + 1) + ' de ' + result.bins.length + '</div>' +
            '<div class="rp-bin-sub">' + pct + '% de carga · ~' + fmt(minutes, 0) + ' min de autonomia</div>' +
          '</div>' +
        '</div>' +
        '<div class="rp-meter"><div class="rp-meter-fill ' + cls + '" style="width:' + barPct + '%;"></div></div>' +
        '<ul class="rp-bin-list">' + itemsList + '</ul>' +
        '</div>';
    }).join('');

    var oversizedHtml = '';
    if(result.oversized.length){
      var overGroups = groupBinItems(result.oversized);
      oversizedHtml = '<div class="rp-warning"><span class="rp-warning-icon">⚠️</span><div>' +
        '<strong>Atenção:</strong> os itens a seguir são grandes demais para caber sozinhos em uma unidade deste modelo — ' +
        overGroups.map(function(g){ return (g.qty > 1 ? '<b>' + g.qty + '×</b> ' : '') + escapeHtml(g.name); }).join(', ') +
        '.</div></div>';
    }

    return reportHead('Relatório de nobreak' + (clientName ? ' — ' + escapeHtml(clientName) : '')) +

      '<div class="rp-hero"><div class="rp-hero-inner">' +
        '<p class="rp-eyebrow">Proposta técnica · Nobreak</p>' +
        '<h1>Dimensionamento de autonomia' + (clientName ? ' — ' + escapeHtml(clientName) : '') + '</h1>' +
        '<div class="rp-hero-meta">Gerado em <strong>' + dateStr + '</strong></div>' +
        '<div class="rp-stat-row">' +
          '<div class="rp-stat"><div class="rp-stat-label">Carga total</div><div class="rp-stat-value">' + fmt(totalLoad) + ' W</div></div>' +
          '<div class="rp-stat"><div class="rp-stat-label">Autonomia desejada</div><div class="rp-stat-value">' + fmt(desiredMin) + ' min</div></div>' +
          '<div class="rp-stat"><div class="rp-stat-label">Nobreaks recomendados</div><div class="rp-stat-value">' + qtyText + '</div></div>' +
        '</div>' +
      '</div></div>' +

      '<div class="rp-wrap">' +

      '<div class="rp-section"><h2>Equipamentos do rack</h2><div class="rp-card">' +
      '<table><thead><tr><th>Equipamento</th><th style="text-align:right;">Potência</th><th style="text-align:center;">Qtd.</th><th style="text-align:right;">Total</th></tr></thead>' +
      '<tbody>' + equipRows + '</tbody></table>' +
      '<div class="rp-total-bar"><span class="rp-total-label">Carga total do rack</span><span class="rp-total-value">' + fmt(totalLoad) + ' W</span></div>' +
      '</div></div>' +

      '<div class="rp-section"><h2>Nobreak recomendado</h2><div class="rp-card">' +
      '<div class="rp-nobreak-card">' +
        '<div class="rp-nobreak-photo">' + nobreakIcon(m) + '</div>' +
        '<div class="rp-nobreak-info">' +
          '<h3>' + escapeHtml(m.modelo) + '</h3>' +
          '<div>' +
            (isIntelbras(m) ? '<span class="badge badge-intelbras">✓ Intelbras</span>' : '') +
            '<span class="badge badge-qty">' + qtyText + '</span>' +
          '</div>' +
          '<div class="rp-spec-grid">' +
            '<div class="rp-spec"><div class="rp-spec-label">Linha</div><div class="rp-spec-value">' + escapeHtml(m.linha || '—') + '</div></div>' +
            '<div class="rp-spec"><div class="rp-spec-label">Potência</div><div class="rp-spec-value">' + fmt(m.va) + ' VA / ' + fmt(m.w) + ' W</div></div>' +
            '<div class="rp-spec"><div class="rp-spec-label">Bateria</div><div class="rp-spec-value">' + m.nbat + '× ' + m.vdc + 'V ' + m.ah + 'Ah</div></div>' +
            '<div class="rp-spec"><div class="rp-spec-label">Autonomia estimada</div><div class="rp-spec-value">~' + fmt(overallMinutes, 0) + ' min</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div></div>' +

      '<div class="rp-section"><h2>Distribuição dos equipamentos entre as unidades</h2>' +
      binsHtml +
      oversizedHtml +
      '</div>' +

      '<div class="rp-footer">Relatório gerado automaticamente pela Calculadora de Autonomia de Nobreak. Fotos meramente ilustrativas, cortesia do site oficial da Intelbras — cores e acabamento podem variar.</div>' +
      '</div>' +
      '</body></html>';
  }

  function buildReportHTMLModeA(m, totalLoad, usefulCapacityW, energyWh, autonomyMin, loadPct){
    var now = new Date();
    var dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    var clientName = els.aClientName ? els.aClientName.value.trim() : '';

    var equipRows = equipamentos.map(function(e){
      var total = e.poe ? 0 : e.power * e.qty;
      return '<tr' + (e.poe ? ' class="rp-muted-row"' : '') + '>' +
        '<td>' + escapeHtml(e.name) + (e.poe ? ' <span class="rp-tag-inline">PoE — não soma</span>' : '') + '</td>' +
        '<td class="num">' + fmt(e.power) + ' W</td>' +
        '<td class="num center">' + e.qty + '</td>' +
        '<td class="num strong">' + fmt(total) + ' W</td>' +
        '</tr>';
    }).join('');

    var hours = Math.floor(autonomyMin / 60);
    var mins = Math.round(autonomyMin % 60);
    var autonomyText = totalLoad > 0
      ? (autonomyMin >= 60 ? (hours + 'h ' + mins + 'min') : (fmt(autonomyMin, 1) + ' min'))
      : '—';

    var pctRaw = Math.round(Math.min(loadPct, 999));
    var barPct = Math.min(Math.max(pctRaw, 0), 100);
    var cls = usefulCapacityW > 0 ? loadClassName(pctRaw) : 'warn';
    var statusText = usefulCapacityW <= 0 ? 'Configure o nobreak' : (pctRaw >= 100 ? 'Sobrecarga' : (pctRaw >= 80 ? 'Próximo do limite' : 'Dentro do limite'));

    var warningHtml = '';
    if(usefulCapacityW > 0 && pctRaw >= 100){
      warningHtml = '<div class="rp-warning"><span class="rp-warning-icon">⚠️</span><div>' +
        '<strong>Atenção:</strong> a carga total do rack ultrapassa a potência útil deste nobreak. Considere reduzir a carga, redistribuir equipamentos ou usar um modelo de maior capacidade.</div></div>';
    }

    var modelBadges = (m.linha ? (isIntelbras(m) ? '<span class="badge badge-intelbras">✓ Intelbras</span>' : '') : '<span class="badge badge-qty">Configuração manual</span>');

    return reportHead('Relatório de nobreak' + (clientName ? ' — ' + escapeHtml(clientName) : '')) +

      '<div class="rp-hero"><div class="rp-hero-inner">' +
        '<p class="rp-eyebrow">Proposta técnica · Nobreak</p>' +
        '<h1>Autonomia estimada' + (clientName ? ' — ' + escapeHtml(clientName) : '') + '</h1>' +
        '<div class="rp-hero-meta">Gerado em <strong>' + dateStr + '</strong></div>' +
        '<div class="rp-stat-row">' +
          '<div class="rp-stat"><div class="rp-stat-label">Carga total</div><div class="rp-stat-value">' + fmt(totalLoad) + ' W</div></div>' +
          '<div class="rp-stat"><div class="rp-stat-label">Potência útil do nobreak</div><div class="rp-stat-value">' + fmt(usefulCapacityW) + ' W</div></div>' +
          '<div class="rp-stat"><div class="rp-stat-label">Autonomia estimada</div><div class="rp-stat-value">' + autonomyText + '</div></div>' +
        '</div>' +
      '</div></div>' +

      '<div class="rp-wrap">' +

      '<div class="rp-section"><h2>Equipamentos do rack</h2><div class="rp-card">' +
      '<table><thead><tr><th>Equipamento</th><th style="text-align:right;">Potência</th><th style="text-align:center;">Qtd.</th><th style="text-align:right;">Total</th></tr></thead>' +
      '<tbody>' + equipRows + '</tbody></table>' +
      '<div class="rp-total-bar"><span class="rp-total-label">Carga total do rack</span><span class="rp-total-value">' + fmt(totalLoad) + ' W</span></div>' +
      '</div></div>' +

      '<div class="rp-section"><h2>Nobreak utilizado</h2><div class="rp-card">' +
      '<div class="rp-nobreak-card">' +
        '<div class="rp-nobreak-photo">' + nobreakIcon(m) + '</div>' +
        '<div class="rp-nobreak-info">' +
          '<h3>' + escapeHtml(m.modelo) + '</h3>' +
          '<div>' + modelBadges + '</div>' +
          '<div class="rp-spec-grid">' +
            '<div class="rp-spec"><div class="rp-spec-label">Linha</div><div class="rp-spec-value">' + escapeHtml(m.linha || '—') + '</div></div>' +
            '<div class="rp-spec"><div class="rp-spec-label">Potência</div><div class="rp-spec-value">' + fmt(m.va) + ' VA / ' + fmt(m.w) + ' W</div></div>' +
            '<div class="rp-spec"><div class="rp-spec-label">Bateria</div><div class="rp-spec-value">' + m.nbat + '× ' + m.vdc + 'V ' + m.ah + 'Ah</div></div>' +
            '<div class="rp-spec"><div class="rp-spec-label">Energia disponível</div><div class="rp-spec-value">' + fmt(energyWh, 1) + ' Wh</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div></div>' +

      '<div class="rp-section"><h2>Nível de carga</h2><div class="rp-card">' +
      '<div class="rp-status-line"><span>' + fmt(totalLoad) + ' W de ' + fmt(usefulCapacityW) + ' W úteis</span>' +
      '<span class="rp-status-pill ' + cls + '">' + statusText + '</span></div>' +
      '<div class="rp-big-meter"><div class="rp-big-meter-fill ' + cls + '" style="width:' + barPct + '%;">' + (barPct >= 12 ? pctRaw + '%' : '') + '</div></div>' +
      warningHtml +
      '</div></div>' +

      '<div class="rp-footer">Relatório gerado automaticamente pela Calculadora de Autonomia de Nobreak. Fotos meramente ilustrativas, cortesia do site oficial da Intelbras — cores e acabamento podem variar.</div>' +
      '</div>' +
      '</body></html>';
  }

  function openReport(html){
    var win = window.open('', '_blank');
    if(!win){
      showToast('Não foi possível abrir o relatório — verifique o bloqueador de pop-ups.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function rankDistCandidates(desiredMin, margin, eff){
    var candidates = fullCatalog().map(function(m){
      var result = packEquipment(m, eff, desiredMin, margin);
      return {m: m, result: result};
    }).filter(function(c){ return c.result.capacity > 0 && c.result.bins.length > 0; });

    candidates.sort(function(a, b){
      // 1) menos itens que não couberam em nenhuma unidade
      if(a.result.oversized.length !== b.result.oversized.length){
        return a.result.oversized.length - b.result.oversized.length;
      }
      // 2) menor número de nobreaks (reduzir quantidade é a prioridade)
      if(a.result.bins.length !== b.result.bins.length){
        return a.result.bins.length - b.result.bins.length;
      }
      // 3) entre opções equivalentes, prioriza modelos Intelbras
      var intA = isIntelbras(a.m), intB = isIntelbras(b.m);
      if(intA !== intB) return intA ? -1 : 1;
      // 4) menor capacidade ociosa somada (melhor aproveitamento)
      var wasteA = a.result.bins.reduce(function(s, bin){ return s + (a.result.capacity - bin.load); }, 0);
      var wasteB = b.result.bins.reduce(function(s, bin){ return s + (b.result.capacity - bin.load); }, 0);
      if(wasteA !== wasteB) return wasteA - wasteB;
      // 5) menor VA (mais econômico entre equivalentes)
      return a.m.va - b.m.va;
    });

    return candidates;
  }

  // Até 3 sugestões, priorizando Intelbras e o menor número de unidades.
  function bestDistributionChoices(desiredMin, margin, eff, limit){
    return rankDistCandidates(desiredMin, margin, eff).slice(0, limit || 3);
  }

  function loadPctClass(pct){
    if(pct >= 100) return 'danger';
    if(pct >= 80) return 'warn';
    return 'ok';
  }

  function renderDistOption(choice, idx, desiredMin){
    var m = choice.m;
    var result = choice.result;
    var badges = idx === 0 ? '<span class="dist-badge best">Mais indicado</span>' : '<span class="dist-badge">Opção ' + (idx + 1) + '</span>';
    if(isIntelbras(m)) badges += '<span class="dist-badge intelbras">Intelbras</span>';

    var qtyText = result.bins.length === 1 ? '1 unidade' : result.bins.length + ' unidades';

    var html = '<div class="dist-option' + (idx === 0 ? ' is-best' : '') + '">' +
      '<div class="dist-option-header">' +
        '<span class="dist-option-title">' + escapeHtml(m.modelo) + '</span>' +
        '<span class="dist-option-badges">' + badges + '</span>' +
      '</div>' +
      '<div class="dist-summary">Você vai precisar de <strong>' + qtyText + '</strong> deste modelo para manter os equipamentos ligados por ' + fmt(desiredMin) + ' min.</div>';

    html += result.bins.map(function(bin, i){
      var minutes = (result.energyWh / bin.load) * 60;
      var pct = Math.min(Math.round((bin.load / result.capacity) * 100), 999);
      var cls = loadPctClass(pct);
      var groups = groupBinItems(bin.items);
      var itemsText = groups.map(function(g){
        return (g.qty > 1 ? g.qty + '× ' : '') + escapeHtml(g.name);
      }).join(', ');
      return '<div class="dist-bin">' +
        '<div class="dist-bin-title"><span>Nobreak ' + (i + 1) + '</span>' +
        '<span class="cap">' + Math.min(pct, 100) + '% de carga · ~' + fmt(minutes, 0) + ' min de autonomia</span></div>' +
        '<div class="mini-load-bar"><div class="mini-load-fill ' + cls + '" style="width:' + Math.min(pct, 100) + '%"></div></div>' +
        '<div class="dist-bin-items">Equipamentos: ' + itemsText + '</div>' +
        '</div>';
    }).join('');

    if(result.oversized.length){
      var overGroups = groupBinItems(result.oversized);
      html += '<div class="dist-warning">Estes equipamentos são grandes demais para caber sozinhos em uma unidade deste modelo: ' +
        overGroups.map(function(g){ return (g.qty > 1 ? g.qty + '× ' : '') + escapeHtml(g.name); }).join(', ') +
        '.</div>';
    }

    html += '<div class="dist-option-actions"><button type="button" class="btn-report" data-report-idx="' + idx + '">📄 Gerar relatório desta opção</button></div>';

    html += '</div>';
    return html;
  }

  var lastChoices = [];
  var lastManualChoice = null;

  function updateDistribution(load, desiredMin, margin, eff){
    var choices = bestDistributionChoices(desiredMin, margin, eff, 3);
    lastChoices = choices;
    if(!choices.length){
      els.bDistResult.innerHTML = '<div class="dist-warning">Nenhum modelo do catálogo sustenta ' + fmt(desiredMin) + ' min com a margem definida.</div>';
      return;
    }
    els.bDistResult.innerHTML = choices.map(function(choice, idx){
      return renderDistOption(choice, idx, desiredMin);
    }).join('');
  }

  if(els.bDistResult){
    els.bDistResult.addEventListener('click', function(ev){
      var btn = ev.target.closest ? ev.target.closest('.btn-report') : null;
      if(!btn) return;
      var idx = parseInt(btn.getAttribute('data-report-idx'), 10);
      var choice = lastChoices[idx];
      if(choice && lastDistParams){
        openReport(buildReportHTML(choice.m, choice.result, lastDistParams.desiredMin, lastDistParams.load));
      }
    });
  }

  // ---------- escolha manual de nobreak ----------
  function renderManualModelSelect(){
    if(!els.bManualModel) return;
    var previous = els.bManualModel.value;
    els.bManualModel.innerHTML = fullCatalog().map(function(m){
      return '<option value="' + m.id + '">' + escapeHtml(m.modelo) + ' (' + fmt(m.va) + ' VA' + (isIntelbras(m) ? ', Intelbras' : '') + ')</option>';
    }).join('');
    if(previous && fullCatalog().some(function(m){ return m.id === previous; })){
      els.bManualModel.value = previous;
    }
  }

  function updateManualDistribution(){
    if(!els.bManualModel || !els.bManualResult) return;
    if(!lastDistParams){
      els.bManualResult.innerHTML = '';
      return;
    }
    var id = els.bManualModel.value;
    var m = fullCatalog().filter(function(x){ return x.id === id; })[0];
    if(!m){ els.bManualResult.innerHTML = ''; return; }

    var result = packEquipment(m, lastDistParams.eff, lastDistParams.desiredMin, lastDistParams.margin);
    if(result.capacity <= 0){
      els.bManualResult.innerHTML = '<div class="dist-warning">Este modelo não sustenta ' + fmt(lastDistParams.desiredMin) + ' min com a margem definida.</div>';
      lastManualChoice = null;
      return;
    }

    lastManualChoice = {m: m, result: result};

    var qtyText = result.bins.length === 1 ? '1 unidade' : result.bins.length + ' unidades';
    var avgPct = Math.round(result.bins.reduce(function(s, b){ return s + (b.load / result.capacity); }, 0) / result.bins.length * 100);
    var html = '<div class="manual-result">Você vai precisar de <strong>' + qtyText + '</strong> de <strong>' + escapeHtml(m.modelo) + '</strong> para manter os equipamentos ligados por ' + fmt(lastDistParams.desiredMin) + ' min (~' + Math.min(avgPct, 100) + '% de carga média por unidade).</div>';

    if(result.oversized.length){
      var overGroups = groupBinItems(result.oversized);
      html += '<div class="dist-warning">Estes equipamentos são grandes demais para caber sozinhos em uma unidade deste modelo: ' +
        overGroups.map(function(g){ return (g.qty > 1 ? g.qty + '× ' : '') + escapeHtml(g.name); }).join(', ') +
        '.</div>';
    }

    html += '<div class="dist-option-actions"><button type="button" class="btn-report" id="b-manual-report-btn">📄 Gerar relatório deste modelo</button></div>';

    els.bManualResult.innerHTML = html;
  }

  if(els.bManualResult){
    els.bManualResult.addEventListener('click', function(ev){
      var btn = ev.target.closest ? ev.target.closest('#b-manual-report-btn') : null;
      if(!btn) return;
      if(lastManualChoice && lastDistParams){
        openReport(buildReportHTML(lastManualChoice.m, lastManualChoice.result, lastDistParams.desiredMin, lastDistParams.load));
      }
    });
  }

  function recalc(){
    var load = totalLoadW();
    if(mode === 'a'){
      recalcModeA(load);
    } else {
      recalcModeB(load);
    }
    renderLoadChart();
  }

  // ---------- gráfico de distribuição de carga por equipamento ----------
  var LOAD_CHART_MAX_ITEMS = 8;
  function renderLoadChart(){
    if(!els.loadChartCard || !els.loadChart) return;
    var totals = {};
    var order = [];
    equipamentos.forEach(function(e){
      if(e.poe) return;
      var key = e.name;
      if(!(key in totals)){ totals[key] = 0; order.push(key); }
      totals[key] += e.power * e.qty;
    });
    var items = order.map(function(name){ return {name: name, total: totals[name]}; }).filter(function(it){ return it.total > 0; });
    items.sort(function(a, b){ return b.total - a.total; });

    if(!items.length){
      els.loadChartCard.hidden = true;
      els.loadChart.innerHTML = '';
      return;
    }
    els.loadChartCard.hidden = false;

    var grandTotal = items.reduce(function(s, it){ return s + it.total; }, 0);
    var maxVal = items[0].total;
    var shown = items.slice(0, LOAD_CHART_MAX_ITEMS);
    var rest = items.slice(LOAD_CHART_MAX_ITEMS);

    var rowsHtml = shown.map(function(it){
      var pct = grandTotal > 0 ? Math.round((it.total / grandTotal) * 100) : 0;
      var barPct = maxVal > 0 ? Math.max(4, Math.round((it.total / maxVal) * 100)) : 0;
      return '<div class="load-chart-row">' +
        '<span class="load-chart-label" title="' + escapeHtml(it.name) + ' — ' + fmt(it.total) + ' W">' + escapeHtml(it.name) +
          ' <span class="load-chart-watts">' + fmt(it.total) + ' W</span></span>' +
        '<span class="load-chart-track"><span class="load-chart-fill" style="width:' + barPct + '%;"></span></span>' +
        '<span class="load-chart-value">' + pct + '%</span>' +
        '</div>';
    }).join('');

    var restHtml = '';
    if(rest.length){
      var restTotal = rest.reduce(function(s, it){ return s + it.total; }, 0);
      restHtml = '<p class="hint" style="margin-top:10px;margin-bottom:0;">+ ' + rest.length + ' outro(s) equipamento(s) — ' + fmt(restTotal) + ' W no total.</p>';
    }

    els.loadChart.innerHTML = rowsHtml + restHtml;
  }

  // ---------- navegação rápida (quicknav) ----------
  function scrollToId(id){
    var el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  if(els.quicknav){
    Array.prototype.forEach.call(els.quicknav.querySelectorAll('.qn-link'), function(btn){
      btn.addEventListener('click', function(){
        var target = btn.getAttribute('data-target');
        if(target === 'equip') scrollToId('equip-section');
        else if(target === 'config') scrollToId(mode === 'a' ? 'a-config-card' : 'b-config-card');
        else if(target === 'result') scrollToId(mode === 'a' ? 'a-result-card' : 'b-result-card');
      });
    });
  }

  // ---------- tour guiado ----------
  var tourSteps = [
    {mode: null, sel: 'header.top', title: 'Bem-vindo!', text: 'Esta ferramenta calcula a autonomia de um nobreak a partir dos equipamentos do seu rack — ou, ao contrário, ajuda a escolher o nobreak certo para o tempo de backup que você precisa. Vamos ver como usar.'},
    {mode: null, sel: '#eq-name', title: 'Catálogo de equipamentos', text: 'Digite aqui para buscar entre centenas de equipamentos já cadastrados (nobreaks, switches, centrais, servidores...). Você também pode digitar um nome livre se o item não estiver na lista.'},
    {mode: null, sel: '.eq-table', title: 'Editar e remover', text: 'Use o ✎ para editar um item já adicionado, ou o × para removê-lo. A busca acima da tabela ajuda quando a lista crescer.'},
    {mode: null, sel: '#load-chart-card', title: 'Distribuição de carga', text: 'Este gráfico mostra quanto cada equipamento pesa na carga total — útil para identificar rapidamente o que mais consome energia no rack.'},
    {mode: null, sel: '#theme-toggle', title: 'Tema claro/escuro', text: 'Clique aqui para alternar entre tema claro e escuro a qualquer momento.'},
    {mode: null, sel: '.mode-switch', title: 'Duas abas, dois modos de cálculo', text: 'Vamos ver as duas: "Já tenho um nobreak" calcula a autonomia de um nobreak que você já possui. "Quero dimensionar" faz o caminho inverso — você diz quanto tempo precisa e a ferramenta calcula o que comprar.'},
    {mode: 'a', sel: '#a-model', title: 'Aba 1 · Modelo do nobreak', text: 'Escolha um modelo do catálogo (XNB, ATTIV, Gamer, etc.) para preencher VA, bateria e fator de potência automaticamente — ou configure manualmente.'},
    {mode: 'a', sel: '#a-result-card', title: 'Aba 1 · Autonomia estimada', text: 'Aqui aparece o tempo estimado de backup, o quanto da capacidade do nobreak está sendo usado e um alerta se a carga estiver perto do limite.'},
    {mode: 'b', sel: '#b-min', title: 'Aba 2 · Quanto tempo você precisa?', text: 'Agora estamos na segunda aba, "Quero dimensionar". Informe a autonomia desejada e uma margem de segurança — a ferramenta calcula a capacidade de bateria e a potência mínima necessárias.'},
    {mode: 'b', sel: '#b-dist-result', title: 'Aba 2 · Nobreaks recomendados', text: 'A ferramenta já sugere até 3 nobreaks prontos para usar, com quantas unidades você precisa e a porcentagem de carga de cada uma — sem precisar entender nada de VA, Ah ou fator de potência.'},
    {mode: null, sel: '#tour-btn', title: 'Pronto!', text: 'Você pode rever este tour a qualquer momento clicando aqui.'}
  ];
  var tourIndex = 0;
  var tourActive = false;

  function clearHighlight(){
    var prev = document.querySelector('.tour-highlight');
    if(prev) prev.classList.remove('tour-highlight');
  }

  function positionTooltip(target){
    var rect = target.getBoundingClientRect();
    var tt = els.tourTooltip;
    tt.style.visibility = 'hidden';
    tt.hidden = false;
    var ttRect = tt.getBoundingClientRect();
    var margin = 12;
    var top = rect.bottom + margin;
    if(top + ttRect.height > window.innerHeight - 12){
      top = rect.top - ttRect.height - margin;
    }
    if(top < 12) top = 12;
    var left = rect.left;
    if(left + ttRect.width > window.innerWidth - 16){
      left = window.innerWidth - ttRect.width - 16;
    }
    if(left < 16) left = 16;
    tt.style.top = top + 'px';
    tt.style.left = left + 'px';
    tt.style.visibility = 'visible';
  }

  function showTourStep(){
    var step = tourSteps[tourIndex];
    if(!step) { endTour(); return; }
    if(step.mode) setMode(step.mode);
    clearHighlight();
    var target = document.querySelector(step.sel);
    if(!target){
      if(tourIndex < tourSteps.length - 1){ tourIndex++; showTourStep(); }
      else endTour();
      return;
    }
    target.scrollIntoView({behavior: 'smooth', block: 'center'});
    setTimeout(function(){
      target.classList.add('tour-highlight');
      els.tourTitle.textContent = step.title;
      els.tourText.textContent = step.text;
      els.tourStepCount.textContent = (tourIndex + 1) + ' / ' + tourSteps.length;
      els.tourPrev.disabled = tourIndex === 0;
      els.tourNext.textContent = tourIndex === tourSteps.length - 1 ? 'Concluir' : 'Próximo';
      positionTooltip(target);
    }, 320);
  }

  function startTour(){
    tourActive = true;
    tourIndex = 0;
    els.tourBlocker.hidden = false;
    showTourStep();
  }

  function endTour(){
    tourActive = false;
    clearHighlight();
    els.tourBlocker.hidden = true;
    els.tourTooltip.hidden = true;
    try{ localStorage.setItem(LS_TOUR_SEEN, '1'); }catch(e){}
  }

  // ---------- tema claro/escuro ----------
  function effectiveTheme(){
    var explicit = document.documentElement.getAttribute('data-theme');
    if(explicit === 'light' || explicit === 'dark') return explicit;
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  if(els.themeToggle){
    els.themeToggle.addEventListener('click', function(){
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try{ localStorage.setItem(LS_THEME, next); }catch(e){}
    });
  }

  els.tourBtn.addEventListener('click', startTour);
  els.tourSkip.addEventListener('click', endTour);
  els.tourNext.addEventListener('click', function(){
    if(tourIndex >= tourSteps.length - 1){ endTour(); return; }
    tourIndex++;
    showTourStep();
  });
  els.tourPrev.addEventListener('click', function(){
    if(tourIndex <= 0) return;
    tourIndex--;
    showTourStep();
  });
  els.tourBlocker.addEventListener('click', endTour);
  document.addEventListener('keydown', function(ev){
    if(!tourActive) return;
    if(ev.key === 'Escape') endTour();
  });

  renderModelSelect();
  renderManualModelSelect();
  renderCatalogDatalist();
  renderTable();
  recalc();

  try{
    if(!localStorage.getItem(LS_TOUR_SEEN)){
      setTimeout(startTour, 700);
    }
  }catch(e){}
})();
