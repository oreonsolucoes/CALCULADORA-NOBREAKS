(function(){
  var LS_EQUIP = 'nobreak_calc_equip_v1';
  var LS_CUSTOM = 'nobreak_calc_custom_models_v1';
  var LS_TOUR_SEEN = 'nobreak_calc_tour_seen_v1';
  var LS_LEARNED_POWER = 'nobreak_calc_learned_power_v1';

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
    poe: document.getElementById('eq-poe'),
    addBtn: document.getElementById('btn-add'),
    cancelEditBtn: document.getElementById('btn-cancel-edit'),
    catalogDl: document.getElementById('eq-catalog-dl'),
    catalogCount: document.getElementById('catalog-count'),
    search: document.getElementById('eq-search'),
    loadExampleBtn: document.getElementById('btn-load-example'),
    clearAllBtn: document.getElementById('btn-clear-all'),

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

    // custom form
    customToggle: document.getElementById('btn-custom-toggle'),
    customForm: document.getElementById('custom-form'),
    customSave: document.getElementById('btn-custom-save'),
    customCancel: document.getElementById('btn-custom-cancel'),
    cName: document.getElementById('c-name'),
    cVa: document.getElementById('c-va'),
    cW: document.getElementById('c-w'),
    cVdc: document.getElementById('c-vdc'),
    cAh: document.getElementById('c-ah'),
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
      {name:'Servidor', power:400, qty:1, poe:false},
      {name:'Switch PoE 24 portas', power:150, qty:1, poe:false},
      {name:'Câmera IP', power:15, qty:4, poe:true},
      {name:'Roteador', power:15, qty:1, poe:false},
      {name:'Monitor', power:40, qty:1, poe:false}
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
          '<td class="num-col">' + fmt(e.power) + '</td>' +
          '<td class="center">' + e.qty + '</td>' +
          '<td class="num-col">' + totalCell + '</td>' +
          '<td class="center row-actions">' +
            '<button class="edit-btn" data-idx="' + idx + '" aria-label="Editar ' + escapeHtml(e.name) + '">✎</button>' +
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
  }

  function startEdit(idx){
    var e = equipamentos[idx];
    if(!e) return;
    editIndex = idx;
    els.name.value = e.name;
    els.power.value = e.power;
    els.qty.value = e.qty;
    els.poe.checked = !!e.poe;
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
    els.poe.checked = false;
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
    var poe = !!els.poe.checked;
    learnPower(name, power);

    if(editIndex >= 0 && equipamentos[editIndex]){
      equipamentos[editIndex] = {name: name, power: power, qty: qty, poe: poe};
      showToast('Equipamento atualizado');
      cancelEdit();
    } else {
      equipamentos.push({name: name, power: power, qty: qty, poe: poe});
      showToast('Adicionado: ' + name);
      els.name.value = '';
      els.power.value = '';
      els.qty.value = '1';
      els.poe.checked = false;
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
  equipCatalog.forEach(function(it){
    catalogByLabelLower[it.l.trim().toLowerCase()] = it;
  });

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
  // Aplica potências aprendidas por cima do catálogo assim que a página carrega,
  // assim uma correção feita antes já vale para a próxima vez que o item for usado.
  Object.keys(learnedPower).forEach(function(key){
    var hit = catalogByLabelLower[key];
    if(hit) hit.w = learnedPower[key];
  });

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
    els.catalogDl.innerHTML = '';
    els.catalogDl.appendChild(frag);
    if(els.catalogCount) els.catalogCount.textContent = equipCatalog.length;
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
    var w = parseFloat(els.cW.value);
    var vdc = parseFloat(els.cVdc.value);
    var ah = parseFloat(els.cAh.value);
    var nbat = parseInt(els.cNbat.value, 10);

    if(!name || !isFinite(va) || va <= 0 || !isFinite(w) || w <= 0 || !isFinite(vdc) || vdc <= 0 || !isFinite(ah) || ah <= 0 || !isFinite(nbat) || nbat <= 0){
      els.cName.focus();
      return;
    }

    var novo = {
      id: 'custom-' + Date.now(),
      linha: 'Personalizado',
      modelo: name,
      onda: 'Não especificado',
      va: va, w: w, vdc: vdc, ah: ah, nbat: nbat,
      aplicacao: 'Modelo personalizado adicionado por você',
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
    els.cW.value = '';
    els.cAh.value = '';
    els.cNbat.value = '1';
    els.customForm.hidden = true;
    showToast('Nobreak "' + name + '" salvo na lista');
  });

  if(els.bManualModel){
    els.bManualModel.addEventListener('change', updateManualDistribution);
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

    html += '</div>';
    return html;
  }

  function updateDistribution(load, desiredMin, margin, eff){
    var choices = bestDistributionChoices(desiredMin, margin, eff, 3);
    if(!choices.length){
      els.bDistResult.innerHTML = '<div class="dist-warning">Nenhum modelo do catálogo sustenta ' + fmt(desiredMin) + ' min com a margem definida.</div>';
      return;
    }
    els.bDistResult.innerHTML = choices.map(function(choice, idx){
      return renderDistOption(choice, idx, desiredMin);
    }).join('');
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
      return;
    }

    var qtyText = result.bins.length === 1 ? '1 unidade' : result.bins.length + ' unidades';
    var avgPct = Math.round(result.bins.reduce(function(s, b){ return s + (b.load / result.capacity); }, 0) / result.bins.length * 100);
    var html = '<div class="manual-result">Você vai precisar de <strong>' + qtyText + '</strong> de <strong>' + escapeHtml(m.modelo) + '</strong> para manter os equipamentos ligados por ' + fmt(lastDistParams.desiredMin) + ' min (~' + Math.min(avgPct, 100) + '% de carga média por unidade).</div>';

    if(result.oversized.length){
      var overGroups = groupBinItems(result.oversized);
      html += '<div class="dist-warning">Estes equipamentos são grandes demais para caber sozinhos em uma unidade deste modelo: ' +
        overGroups.map(function(g){ return (g.qty > 1 ? g.qty + '× ' : '') + escapeHtml(g.name); }).join(', ') +
        '.</div>';
    }

    els.bManualResult.innerHTML = html;
  }

  function recalc(){
    var load = totalLoadW();
    if(mode === 'a'){
      recalcModeA(load);
    } else {
      recalcModeB(load);
    }
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
    {mode: null, sel: '.poe-check-row', title: 'Equipamentos PoE', text: 'Uma câmera ou leitor alimentado por um switch PoE não deve contar separado — marque esta caixa e o item entra na lista só como referência, sem somar na carga total (quem soma é o switch).'},
    {mode: null, sel: '.eq-table', title: 'Editar e remover', text: 'Use o ✎ para editar um item já adicionado, ou o × para removê-lo. A busca acima da tabela ajuda quando a lista crescer.'},
    {mode: null, sel: '.mode-switch', title: 'Dois modos de cálculo', text: '"Já tenho um nobreak" calcula a autonomia de um nobreak que você já possui. "Quero dimensionar" faz o caminho inverso: você diz quanto tempo precisa e a ferramenta calcula o que comprar.'},
    {mode: 'a', sel: '#a-model', title: 'Modelo do nobreak', text: 'Escolha um modelo do catálogo (XNB, ATTIV, Gamer, etc.) para preencher VA, bateria e fator de potência automaticamente — ou configure manualmente.'},
    {mode: 'a', sel: '#a-result-card', title: 'Autonomia estimada', text: 'Aqui aparece o tempo estimado de backup, o quanto da capacidade do nobreak está sendo usado e um alerta se a carga estiver perto do limite.'},
    {mode: 'b', sel: '#b-min', title: 'Quanto tempo você precisa?', text: 'Informe a autonomia desejada e uma margem de segurança — a ferramenta calcula a capacidade de bateria e a potência mínima necessárias.'},
    {mode: 'b', sel: '#b-dist-result', title: 'Nobreaks recomendados', text: 'A ferramenta já sugere até 3 nobreaks prontos para usar, com quantas unidades você precisa e a porcentagem de carga de cada uma — sem precisar entender nada de VA, Ah ou fator de potência.'},
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
