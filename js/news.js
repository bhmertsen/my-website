// news.js — reads from API if available, otherwise falls back to localStorage
(function(){
  function escapeHtml(str){ return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function fetchNews(){
    try{
      var base = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
      var res = await fetch(base + '/api/news');
      if(!res.ok) throw new Error('api error');
      var data = await res.json();
      return data;
    }catch(e){
      throw e;
    }
  }

  async function renderPreview(){
    var container = document.getElementById('news-preview');
    if(!container) return;

    var list = [];
    try{ list = await fetchNews(); }
    catch(_e){ container.innerHTML = '<div class="small" style="color:#f66">Haberler yüklenemedi.</div>'; return; }

    if(!list || list.length === 0){
      container.innerHTML = '<div class="small">Henüz haber yok.</div>';
      return;
    }

    var html = '';
    var max = Math.min(list.length, 6);
    for(var i=0;i<max;i++){
      var it = list[i];
      html += '<article class="news-large"><a href="news.html#n'+(it._id||it.id)+'"><img src="'+(it.image||'assets/images/default.png')+'" alt="'+escapeHtml(it.title)+'"><div class="news-caption"><h3>'+escapeHtml(it.title)+'</h3><div class="date">'+escapeHtml(it.date||'')+'</div></div></a></article>';
    }

    container.innerHTML = html;
  }

  async function renderNewsList(){
    var listEl = document.getElementById('news-list');
    if(!listEl) return;
    var list = [];
    try{ list = await fetchNews(); }catch(_e){ listEl.innerHTML = '<p>Haberler yüklenemedi.</p>'; return; }
    if(list.length === 0){ listEl.innerHTML = '<p>Henüz haber yok.</p>'; return; }
    var html = '';
    list.forEach(function(it){
      var img = it.image || 'assets/images/default.png';
      html += '<article class="news-card-item">';
      html +=   '<a href="#n'+(it._id||it.id)+'"><img src="'+img+'" alt="'+escapeHtml(it.title)+'"></a>';
      html +=   '<div class="nc-body">';
      html +=     '<h3><a href="#n'+(it._id||it.id)+'" style="color:#fff;text-decoration:none">'+escapeHtml(it.title)+'</a></h3>';
      html +=     '<div class="small">'+escapeHtml(it.date||'')+'</div>';
      if(it.excerpt){ html +=   '<p>'+escapeHtml(it.excerpt)+'</p>'; }
      html +=   '</div>';
      html += '</article>';
    });
    listEl.innerHTML = html;
  }

  function handleAnchor(){
    if(!location.hash) return;
    var m = location.hash.match(/^#n(\w+)$/);
    if(!m) return;
    var id = m[1];
    // try to fetch single news by id from API only
    (async function(){
      var found = null;
      try{
        var base = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
        var resp = await fetch(base + '/api/news');
        if(resp.ok){
          var list = await resp.json();
          found = list.find(x => (x._id||String(x.id)) === id || String(x.id) === id);
        }
      }catch(e){/* ignore */}
      if(!found) return;
      var main = document.querySelector('main.container');
      if(!main) return;
      var el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = '<h2>'+escapeHtml(found.title)+'</h2><div class="small">'+escapeHtml(found.date)+'</div><img src="'+(found.image||'assets/images/default.png')+'" style="max-width:100%;margin:12px 0"><p>'+escapeHtml(found.content||'')+'</p>';
      main.insertBefore(el, main.firstChild);
      history.replaceState(null,'',location.pathname+location.search);
    })();
  }

  document.addEventListener('DOMContentLoaded', function(){ renderPreview(); renderNewsList(); handleAnchor(); });
})();