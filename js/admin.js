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
    var messagesListEl = document.getElementById('messages-list-admin');

    function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    async function apiFetch(path, opts){
      opts = opts || {};
      opts.headers = opts.headers || {};
      if(!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
      var token = getToken();
      if(token && token !== 'local-fallback') opts.headers['Authorization'] = 'Bearer ' + token;
      try{
        var base = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
        var res = await fetch(base + path, opts);
        if(!res.ok) throw new Error('Network response not ok');
        return await res.json();
      }catch(e){
        throw e;
      }
    }

    async function loadList(){
      listEl.innerHTML = '<div class="small">Yükleniyor...</div>';
      try{
        var items = await apiFetch('/api/news');
        renderList(items);
      }catch(err){
        listEl.innerHTML = '<div class="small" style="color:#f66">Haberler yüklenemedi. Sunucuya bağlanılamıyor.</div>';
      }
    }

    async function loadMessages(){
      if(!messagesListEl) return;
      messagesListEl.innerHTML = '<div class="small">Yükleniyor...</div>';
      try{
        var msgs = await apiFetch('/api/messages');
        renderMessages(msgs || []);
      }catch(err){
        messagesListEl.innerHTML = '<div class="small" style="color:#f66">Mesajlar yüklenemedi. Sunucuya bağlanılamıyor.</div>';
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

    function renderMessages(items){
      if(!messagesListEl) return;
      if(!items || items.length === 0){
        messagesListEl.innerHTML = '<div class="small">Henüz mesaj yok.</div>';
        return;
      }
      messagesListEl.innerHTML = '';
      items.forEach(function(msg){
        var wrap = document.createElement('div'); wrap.className = 'message-item-admin';
        var top = document.createElement('div');
        var created = msg.createdAt ? new Date(msg.createdAt).toLocaleString('tr-TR') : '';
        var namePart = '<strong>'+escapeHtml(msg.name||'')+'</strong>';
        var phonePart = msg.phone ? ' <span class="small">('+escapeHtml(msg.phone)+')</span>' : '';
        var datePart = created ? '<div class="small">'+escapeHtml(created)+'</div>' : '';
        top.innerHTML = namePart + phonePart + datePart;
        var body = document.createElement('div'); body.className = 'small'; body.textContent = msg.message || '';
        wrap.appendChild(top);
        wrap.appendChild(body);
        messagesListEl.appendChild(wrap);
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
      if(it._id && getToken()){
        try{ await apiFetch('/api/news/' + it._id, { method: 'DELETE' }); loadList(); alert('Silindi'); return; }catch(e){
          alert('Silme başarısız: sunucu hatası');
        }
      }
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
        try{
          await apiFetch('/api/news/' + editId, { method: 'PUT', body: JSON.stringify(payload) });
          alert('Güncellendi'); form.reset(); delete form.dataset.editId; loadList(); return;
        }catch(e){
          alert('Güncelleme başarısız: sunucu hatası');
        }
      } else {
        // create
        try{
          await apiFetch('/api/news', { method: 'POST', body: JSON.stringify(payload) });
          alert('Kaydedildi'); form.reset(); loadList(); return;
        }catch(e){
          alert('Kaydetme başarısız: sunucu hatası');
        }
      }
    });

    document.getElementById('clear-form').addEventListener('click', function(){ form.reset(); delete form.dataset.editId; });

    document.getElementById('logout').addEventListener('click', function(){ sessionStorage.removeItem('adminToken'); location.href='login.html'; });

    loadList();
    loadMessages();

    // Live broadcast settings management
    (function(){
      var formLive = document.getElementById('live-form');
      if(!formLive) return;
      async function populate(){
        var chEl = document.getElementById('liveChannel');
        var dtEl = document.getElementById('liveDateTime');
        var urlEl = document.getElementById('liveUrl');
        try{
          var data = await apiFetch('/api/live');
          if(data){
            if(chEl) chEl.value = data.channel || '';
            if(dtEl) dtEl.value = data.datetime || '';
            if(urlEl) urlEl.value = data.url || '';
            return;
          }
        }catch(e){
          if(chEl) chEl.value = '';
          if(dtEl) dtEl.value = '';
          if(urlEl) urlEl.value = '';
        }
      }
      populate();
      formLive.addEventListener('submit', function(e){
        e.preventDefault();
        var ch = document.getElementById('liveChannel').value.trim();
        var dt = document.getElementById('liveDateTime').value.trim();
        var url = (document.getElementById('liveUrl').value||'').trim();
        (async function(){
          try{
            await apiFetch('/api/live', { method: 'PUT', body: JSON.stringify({ channel: ch, datetime: dt, url: url }) });
            alert('Canlı yayın bilgileri kaydedildi');
            return;
          }catch(err){
            alert('Kaydetme başarısız: sunucu hatası');
          }
        })();
      });
      var clearBtn = document.getElementById('live-clear');
      if(clearBtn){ clearBtn.addEventListener('click', function(){
        (async function(){
          try{ await apiFetch('/api/live', { method: 'PUT', body: JSON.stringify({ channel:'', datetime:'', url:'' }) }); }
          catch(e){}
          populate();
          alert('Canlı yayın bilgileri temizlendi');
        })();
      }); }
    })();
  }
})();