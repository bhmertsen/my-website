// admin.js — client-side admin panel now using API when available
(function(){
  function getToken(){
    return sessionStorage.getItem('adminToken');
  }
  function authRequired(){
    var t = getToken();
    if(!t){ location.href = '/login'; }
  }

  // only run on panel page
  if(location.pathname.endsWith('/panel.html') || location.pathname.endsWith('admin/panel.html') || location.pathname.endsWith('/admin') || location.pathname.endsWith('/admin/')){
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

    var currentMessages = [];

    async function loadMessages(){
      if(!messagesListEl) return;
      messagesListEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px;text-align:center">Yükleniyor...</div>';
      try{
        var msgs = await apiFetch('/api/messages');
        currentMessages = Array.isArray(msgs) ? msgs : [];
        renderMessages(currentMessages);
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
      if(!items || items.length === 0){
        listEl.innerHTML = '<div class="small">Henüz kayıtlı haber bulunmuyor.</div>';
        return;
      }
      items.forEach(function(it){
        var div = document.createElement('div'); div.className='news-item-admin';
        var left = document.createElement('div');
        var newsId = it._id || it.id || '';
        left.innerHTML = '<strong>'+escapeHtml(it.title)+'</strong><div class="small">'+escapeHtml(it.date||'')+'</div>';
        var right = document.createElement('div'); right.className = 'news-item-actions';
        var view = document.createElement('a'); view.className = 'btn btn-view'; view.href = '/news.html#n' + newsId; view.target = '_blank'; view.innerHTML = '<i class="fa fa-eye"></i> Gör';
        var edit = document.createElement('button'); edit.className='btn btn-secondary'; edit.innerHTML='<i class="fa fa-pen"></i> Düzenle';
        var del = document.createElement('button'); del.className='btn btn-danger'; del.innerHTML='<i class="fa fa-trash"></i> Sil';
        edit.addEventListener('click', function(){ populateForm(it); });
        del.addEventListener('click', function(){ if(confirm('Silinsin mi?')){ removeItem(it); } });
        right.appendChild(view); right.appendChild(edit); right.appendChild(del);
        div.appendChild(left); div.appendChild(right);
        listEl.appendChild(div);
      });
    }

    function renderMessages(items){
      if(!messagesListEl) return;
      if(!items || items.length === 0){
        messagesListEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px;text-align:center">Henüz gelen mesaj bulunmuyor.</div>';
        return;
      }
      messagesListEl.innerHTML = '';
      items.forEach(function(msg){
        var wrap = document.createElement('div'); wrap.className = 'message-item-admin';
        var top = document.createElement('div'); top.className = 'message-header';
        var created = msg.createdAt ? new Date(msg.createdAt).toLocaleString('tr-TR', { dateStyle:'short', timeStyle:'short' }) : '';
        var namePart = '<span class="message-author">'+escapeHtml(msg.name||'İsimsiz')+'</span>';
        var phonePart = msg.phone ? '<span class="message-phone"><i class="fa-solid fa-phone" style="font-size:10px"></i> '+escapeHtml(msg.phone)+'</span>' : '';
        var datePart = created ? '<span class="message-date">'+escapeHtml(created)+'</span>' : '';
        top.innerHTML = '<div>' + namePart + phonePart + '</div>' + datePart;
        var body = document.createElement('div'); body.className = 'message-body'; body.textContent = msg.message || '';
        wrap.appendChild(top);
        wrap.appendChild(body);
        messagesListEl.appendChild(wrap);
      });
    }

    // Live preview for image input
    var imageInputEl = document.getElementById('imageInput');
    var imagePreviewEl = document.getElementById('image-preview');
    if(imageInputEl && imagePreviewEl){
      imageInputEl.addEventListener('input', function(){
        var val = this.value.trim();
        imagePreviewEl.src = val || '/assets/images/default.png';
      });
    }

    function populateForm(it){
      form.title.value = it.title || '';
      form.date.value = it.date || '';
      form.image.value = it.image && it.image.indexOf('data:') === -1 ? it.image : '';
      var preview = document.getElementById('image-preview');
      if(it.image){ preview.src = it.image; } else { preview.src = '/assets/images/default.png'; }
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

    var toggleNewsBtn = document.getElementById('toggle-news-list');
    var newsCard = document.getElementById('news-list-card');
    if(toggleNewsBtn && newsCard){
      toggleNewsBtn.addEventListener('click', function(){
        var isHidden = newsCard.style.display === 'none';
        newsCard.style.display = isHidden ? 'block' : 'none';
        toggleNewsBtn.innerHTML = isHidden ? '<i class="fa fa-eye"></i> Mevcut Haberleri Gizle' : '<i class="fa fa-eye-slash"></i> Mevcut Haberleri Göster';
      });
    }

    function printMessagesList(){
      if(!currentMessages || currentMessages.length === 0){
        alert('Yazdırılacak mesaj bulunamadı.');
        return;
      }

      var printWin = window.open('', '_blank', 'width=960,height=750');
      if(!printWin){
        alert('Yazdırma penceresi açılamadı. Lütfen tarayıcınızın açılır pencere (popup) engelleyicisini kapatın.');
        return;
      }

      var rowsHtml = '';
      currentMessages.forEach(function(msg, index){
        var created = msg.createdAt ? new Date(msg.createdAt).toLocaleString('tr-TR', { dateStyle:'medium', timeStyle:'short' }) : '—';
        var name = escapeHtml(msg.name || 'İsimsiz');
        var phone = escapeHtml(msg.phone || 'Belirtilmedi');
        var message = escapeHtml(msg.message || '').replace(/\n/g, '<br>');
        rowsHtml += '<tr>' +
          '<td class="text-center">' + (index + 1) + '</td>' +
          '<td class="nowrap">' + created + '</td>' +
          '<td><strong>' + name + '</strong></td>' +
          '<td class="nowrap">' + phone + '</td>' +
          '<td>' + message + '</td>' +
        '</tr>';
      });

      var reportDate = new Date().toLocaleString('tr-TR', { dateStyle:'full', timeStyle:'short' });

      var docHtml = '<!DOCTYPE html>' +
        '<html lang="tr">' +
        '<head>' +
          '<meta charset="utf-8">' +
          '<title>İletişim Mesajları Raporu — Cenk Özatıcı</title>' +
          '<style>' +
            '@page { size: A4 portrait; margin: 12mm 14mm; }' +
            '* { box-sizing: border-box; }' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; margin: 0; padding: 24px; font-size: 13px; line-height: 1.4; }' +
            '.header { border-bottom: 2px solid #c70039; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }' +
            '.header h1 { margin: 0; font-size: 20px; color: #111827; }' +
            '.header .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }' +
            '.meta-info { text-align: right; font-size: 12px; color: #4b5563; }' +
            'table { width: 100%; border-collapse: collapse; margin-top: 12px; }' +
            'th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }' +
            'th { background: #f3f4f6; color: #1f2937; font-weight: 600; font-size: 12px; }' +
            'tr:nth-child(even) td { background: #fafafa; }' +
            '.text-center { text-align: center; }' +
            '.nowrap { white-space: nowrap; }' +
            '.footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }' +
            '@media print { body { padding: 0; } tr { page-break-inside: avoid; } }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<div class="header">' +
            '<div>' +
              '<h1>Cenk Özatıcı — Web Sitesi İletişim Mesajları</h1>' +
              '<div class="subtitle">Gelen İletişim Formu Başvuruları Listesi</div>' +
            '</div>' +
            '<div class="meta-info">' +
              '<div><strong>Rapor Tarihi:</strong> ' + reportDate + '</div>' +
              '<div><strong>Toplam Mesaj:</strong> ' + currentMessages.length + ' adet</div>' +
            '</div>' +
          '</div>' +
          '<table>' +
            '<thead>' +
              '<tr>' +
                '<th style="width:36px" class="text-center">#</th>' +
                '<th style="width:115px">Tarih</th>' +
                '<th style="width:140px">Adı Soyadı</th>' +
                '<th style="width:115px">Telefon No</th>' +
                '<th>Mesaj</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              rowsHtml +
            '</tbody>' +
          '</table>' +
          '<div class="footer">' +
            '<span>Cenk Özatıcı Yönetim Paneli Sistem Raporu</span>' +
            '<span>Sayfa 1</span>' +
          '</div>' +
          '<script>' +
            'window.onload = function(){ window.focus(); window.print(); };' +
          '<' + '/script>' +
        '</body>' +
        '</html>';

      printWin.document.open();
      printWin.document.write(docHtml);
      printWin.document.close();
    }

    var printBtn = document.getElementById('print-messages-btn');
    if(printBtn){
      printBtn.addEventListener('click', printMessagesList);
    }

    var refreshMsgBtn = document.getElementById('refresh-messages-btn');
    if(refreshMsgBtn){
      refreshMsgBtn.addEventListener('click', loadMessages);
    }

    document.getElementById('logout').addEventListener('click', function(){ sessionStorage.removeItem('adminToken'); location.href='/login'; });

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