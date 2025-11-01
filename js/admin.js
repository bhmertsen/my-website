// admin.js — client-side admin panel now using API when available
(function(){
  function getToken(){
    return sessionStorage.getItem('adminToken');
  }
  function authRequired(){
    var t = getToken();
    if(!t){ location.href = 'login.html'; }
  }

  // only run on panel page
  if(location.pathname.endsWith('/panel.html') || location.pathname.endsWith('admin/panel.html')){
    authRequired();

    var form = document.getElementById('news-form');
    var listEl = document.getElementById('news-list-admin');

    function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    async function apiFetch(path, opts){
      opts = opts || {};
      opts.headers = opts.headers || {};
      if(!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
      var token = getToken();
      if(token && token !== 'local-fallback') opts.headers['Authorization'] = 'Bearer ' + token;
      try{
        var res = await fetch(path, opts);
        if(!res.ok) throw new Error('Network response not ok');
        return await res.json();
      }catch(e){
        throw e;
      }
    }

    // fallback storage functions
    function getLocalNews(){ try{ return JSON.parse(localStorage.getItem('news_vitrine')||'[]'); }catch(e){return []} }
    function saveLocalNews(list){ localStorage.setItem('news_vitrine', JSON.stringify(list)); }

    async function loadList(){
      listEl.innerHTML = '<div class="small">Yükleniyor...</div>';
      try{
        var items = await apiFetch('/api/news');
        renderList(items);
      }catch(err){
        // fallback to localStorage
        var items = getLocalNews();
        renderList(items);
      }
    }

    function readFileAsDataURL(file){
      return new Promise(function(resolve,reject){
        var fr = new FileReader();
        fr.onload = function(){ resolve(fr.result); };
        fr.onerror = function(e){ reject(e); };
        fr.readAsDataURL(file);
      });
    }

    function renderList(items){
      listEl.innerHTML = '';
      items.forEach(function(it){
        var div = document.createElement('div'); div.className='news-item-admin';
        var left = document.createElement('div'); left.innerHTML = '<strong>'+escapeHtml(it.title)+'</strong><div class="small">'+escapeHtml(it.date||'')+'</div>';
        var right = document.createElement('div');
        var edit = document.createElement('button'); edit.className='btn'; edit.textContent='Düzenle';
        var del = document.createElement('button'); del.className='btn btn-danger'; del.textContent='Sil';
        edit.addEventListener('click', function(){ populateForm(it); });
        del.addEventListener('click', function(){ if(confirm('Silinsin mi?')){ removeItem(it); } });
        right.appendChild(edit); right.appendChild(del);
        div.appendChild(left); div.appendChild(right);
        listEl.appendChild(div);
      });
    }

    function populateForm(it){
      form.title.value = it.title || '';
      form.date.value = it.date || '';
      form.image.value = it.image && it.image.indexOf('data:') === -1 ? it.image : '';
      var preview = document.getElementById('image-preview');
      if(it.image){ preview.src = it.image; } else { preview.src = '../assets/images/default.png'; }
      form.excerpt.value = it.excerpt || '';
      form.content.value = it.content || '';
      form.dataset.editId = it._id || it.id || '';
    }

    async function removeItem(it){
      // if item has _id and server token, try API delete
      if(it._id && getToken() && getToken() !== 'local-fallback'){
        try{ await apiFetch('/api/news/' + it._id, { method: 'DELETE' }); loadList(); alert('Silindi'); return; }catch(e){ /* fallthrough */ }
      }
      // fallback local
      var items = getLocalNews().filter(function(x){ return (x.id || x._id) !== (it.id || it._id) });
      saveLocalNews(items); loadList(); alert('Silindi (local)');
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var payload = {
        title: form.title.value.trim(),
        date: form.date.value.trim(),
        image: form.image.value.trim() || '',
        excerpt: form.excerpt.value.trim(),
        content: form.content.value.trim(),
        published: true
      };

      // if user selected a file, convert to base64 and include it
      var fileInput = document.getElementById('imageFile');
      if(fileInput && fileInput.files && fileInput.files[0]){
        try{
          var dataUrl = await readFileAsDataURL(fileInput.files[0]);
          payload.image = dataUrl;
        }catch(err){ console.warn('Image read failed', err); }
      }

      // ensure we have a fallback image
      if(!payload.image) payload.image = form.image.value.trim() || 'assets/images/default.png';

      var editId = form.dataset.editId;
      if(editId){
        // update
        if(getToken() && getToken() !== 'local-fallback'){
          try{
            await apiFetch('/api/news/' + editId, { method: 'PUT', body: JSON.stringify(payload) });
            alert('Güncellendi'); form.reset(); delete form.dataset.editId; loadList(); return;
          }catch(e){ /* fallback below */ }
        }
        // fallback local update
        var items = getLocalNews().map(function(x){ if((x.id||x._id) == editId){ return Object.assign({}, x, payload); } return x; });
        saveLocalNews(items); alert('Güncellendi (local)'); form.reset(); delete form.dataset.editId; loadList();
      } else {
        // create
        if(getToken() && getToken() !== 'local-fallback'){
          try{
            await apiFetch('/api/news', { method: 'POST', body: JSON.stringify(payload) });
            alert('Kaydedildi'); form.reset(); loadList(); return;
          }catch(e){ /* fallback */ }
        }
        // fallback to local
        var items = getLocalNews();
        var id = Date.now();
        // include image if present (base64 or URL)
        items.unshift(Object.assign({ id: id }, payload));
        saveLocalNews(items);
        alert('Kaydedildi (local)'); form.reset(); loadList();
      }
    });

    document.getElementById('clear-form').addEventListener('click', function(){ form.reset(); delete form.dataset.editId; });

    document.getElementById('logout').addEventListener('click', function(){ sessionStorage.removeItem('adminToken'); location.href='login.html'; });

    loadList();

    // Live broadcast settings management
    (function(){
      var formLive = document.getElementById('live-form');
      if(!formLive) return;
      function getLiveLocal(){ try{ return JSON.parse(localStorage.getItem('live_settings')||'{}'); }catch(e){ return {}; } }
      function setLiveLocal(v){ try{ localStorage.setItem('live_settings', JSON.stringify(v||{})); }catch(e){} }
      async function populate(){
        var chEl = document.getElementById('liveChannel');
        var dtEl = document.getElementById('liveDateTime');
        var urlEl = document.getElementById('liveUrl');
        // Try API first
        try{
          var data = await apiFetch('/api/live');
          if(data){
            if(chEl) chEl.value = data.channel || '';
            if(dtEl) dtEl.value = data.datetime || '';
            if(urlEl) urlEl.value = data.url || '';
            // also cache locally for offline
            setLiveLocal({ channel: data.channel||'', datetime: data.datetime||'', url: data.url||'' });
            return;
          }
        }catch(e){ /* fallback to local */ }
        var s = getLiveLocal();
        if(chEl) chEl.value = s.channel || '';
        if(dtEl) dtEl.value = s.datetime || '';
        if(urlEl) urlEl.value = s.url || '';
      }
      populate();
      formLive.addEventListener('submit', function(e){
        e.preventDefault();
        var ch = document.getElementById('liveChannel').value.trim();
        var dt = document.getElementById('liveDateTime').value.trim();
        var url = (document.getElementById('liveUrl').value||'').trim();
        (async function(){
          // Try API PUT with auth token (if not local-fallback)
          var token = getToken();
          if(token && token !== 'local-fallback'){
            try{
              await apiFetch('/api/live', { method: 'PUT', body: JSON.stringify({ channel: ch, datetime: dt, url: url }) });
              // cache
              setLiveLocal({ channel: ch, datetime: dt, url: url });
              alert('Canlı yayın bilgileri kaydedildi');
              return;
            }catch(err){ /* fall through to local */ }
          }
          // Local fallback
          setLiveLocal({ channel: ch, datetime: dt, url: url });
          alert('Canlı yayın bilgileri kaydedildi (local)');
        })();
      });
      var clearBtn = document.getElementById('live-clear');
      if(clearBtn){ clearBtn.addEventListener('click', function(){
        (async function(){
          var token = getToken();
          if(token && token !== 'local-fallback'){
            try{ await apiFetch('/api/live', { method: 'PUT', body: JSON.stringify({ channel:'', datetime:'', url:'' }) }); }catch(e){}
          }
          localStorage.removeItem('live_settings');
          populate();
          alert('Canlı yayın bilgileri temizlendi');
        })();
      }); }
    })();
  }
})();