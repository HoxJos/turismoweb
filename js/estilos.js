// estilos.js - lógica del sitio de viajes (cliente-side, localStorage)
(function(){
  const STORAGE_FAV = 'viajes_favorites_v1';

  // sample data (puedes reemplazar o ampliar)
  const SAMPLE = [
    {id:'d1',name:'Playa de Cancún',country:'México',region:'americas',type:'playa',price:399, img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60'},
    {id:'d2',name:'París',country:'Francia',region:'europe',type:'ciudad',price:899, img:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=60'},
    {id:'d3',name:'Monte Fuji',country:'Japón',region:'asia',type:'montaña',price:699, img:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=60'},
    {id:'d4',name:'Safari en Kenia',country:'Kenia',region:'africa',type:'aventura',price:1299, img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60'},
    {id:'d5',name:'Bora Bora',country:'Polinesia Francesa',region:'oceania',type:'playa',price:1499, img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60'}
  ];

  // elements
  const search = document.getElementById('search');
  const regionSel = document.getElementById('region');
  const typeSel = document.getElementById('type');
  const listEl = document.getElementById('destinations-list');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const fileInput = document.getElementById('file-input');
  const favoritesBtn = document.getElementById('favorites-btn');
  const favCount = document.getElementById('fav-count');

  let destinations = SAMPLE.slice();
  let favorites = loadFavorites();

  // initial render
  render();
  updateFavCount();

  // events
  search.addEventListener('input', render);
  regionSel.addEventListener('change', render);
  typeSel.addEventListener('change', render);
  exportBtn.addEventListener('click', exportFavorites);
  importBtn.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', handleImport);
  favoritesBtn.addEventListener('click', showFavorites);

  function loadFavorites(){
    try{
      const raw = localStorage.getItem(STORAGE_FAV);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ console.error(e); return []; }
  }

  function saveFavorites(){
    localStorage.setItem(STORAGE_FAV, JSON.stringify(favorites));
    updateFavCount();
  }

  function updateFavCount(){
    favCount.textContent = String(favorites.length || 0);
  }

  function render(list){
    const q = (search.value || '').trim().toLowerCase();
    let out = destinations.slice();
    const region = regionSel.value;
    const type = typeSel.value;

    if(region && region!=='all') out = out.filter(d=> d.region===region);
    if(type && type!=='all') out = out.filter(d=> d.type===type);
    if(q) out = out.filter(d=> (d.name||'').toLowerCase().includes(q) || (d.country||'').toLowerCase().includes(q));

    listEl.innerHTML = '';
    if(out.length===0){ listEl.innerHTML = '<div class="empty card">No se encontraron destinos.</div>'; return; }

    out.forEach(d=>{
      const el = document.createElement('div');
      el.className = 'destination card';
      el.innerHTML = `
        <div class="thumb" style="background-image:url('${d.img}')"></div>
        <div class="info">
          <h4>${escapeHtml(d.name)}</h4>
          <div class="meta">${escapeHtml(d.country)} — <span class="small">${capitalize(d.type)}</span></div>
          <div class="row">
            <div class="small">Desde $${Number(d.price).toFixed(0)}</div>
            <div style="margin-left:auto">
              <button class="btn" data-action="details" data-id="${d.id}">Ver</button>
              <button class="btn fav-btn" data-action="fav" data-id="${d.id}">${favorites.includes(d.id)?'❤️':'♡'}</button>
            </div>
          </div>
        </div>
      `;

      el.querySelectorAll('button').forEach(btn=> btn.addEventListener('click', ()=> handleAction(btn.dataset.action, btn.dataset.id)));
      listEl.appendChild(el);
    });
  }

  function handleAction(action,id){
    const dest = destinations.find(d=>d.id===id);
    if(!dest) return;
    if(action==='fav'){
      if(favorites.includes(id)){
        favorites = favorites.filter(x=>x!==id);
      } else {
        favorites.push(id);
      }
      saveFavorites();
      render();
    }
    if(action==='details'){
      showDetails(dest);
    }
  }

  function showDetails(d){
    const html = `
      <div style="padding:12px">
        <h3>${escapeHtml(d.name)}</h3>
        <p class="meta">${escapeHtml(d.country)} — ${capitalize(d.type)}</p>
        <p>Precio desde <strong>$${Number(d.price).toFixed(0)}</strong></p>
        <p class="small">Descripción de ejemplo: disfruta de una experiencia inolvidable en ${escapeHtml(d.name)}.</p>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button id="book-btn" class="btn primary">Reservar (simulado)</button>
          <button id="close-btn" class="btn">Cerrar</button>
        </div>
      </div>
    `;
    const win = window.open('', '_blank', 'width=420,height=520');
    win.document.write(`<html><head><title>${d.name}</title><link rel=stylesheet href="../css/estilos.css"></head><body>${html}</body></html>`);
  }

  function showFavorites(){
    const favs = favorites.map(id=> destinations.find(d=>d.id===id)).filter(Boolean);
    const win = window.open('', '_blank', 'width=640,height=700');
    let html = '<div style="padding:18px"><h2>Favoritos</h2>';
    if(favs.length===0) html += '<p>No tienes favoritos guardados.</p>';
    favs.forEach(f=>{
      html += `<div style="margin-bottom:12px"><strong>${escapeHtml(f.name)}</strong> — ${escapeHtml(f.country)}<br/><small>Desde $${Number(f.price).toFixed(0)}</small></div>`;
    });
    html += '</div>';
    win.document.write(`<html><head><title>Favoritos</title><link rel=stylesheet href="../css/estilos.css"></head><body>${html}</body></html>`);
  }

  function exportFavorites(){
    const data = favorites.map(id=> destinations.find(d=>d.id===id)).filter(Boolean);
    if(data.length===0){ alert('No hay favoritos para exportar'); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='viajes_favoritos.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function handleImport(e){
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      try{
        const parsed = JSON.parse(ev.target.result);
        // accept array of destinations or ids
        if(Array.isArray(parsed)){
          parsed.forEach(p=>{
            if(p.id && !destinations.find(d=>d.id===p.id)) destinations.push(p);
            if(p.id && !favorites.includes(p.id)) favorites.push(p.id);
          });
          saveFavorites();
          render();
          alert('Importación completada');
        }
      }catch(err){ console.error(err); alert('Error importando JSON'); }
    };
    reader.readAsText(f);
    fileInput.value = '';
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }
  function capitalize(s){ if(!s) return ''; return s[0].toUpperCase()+s.slice(1); }

})();
