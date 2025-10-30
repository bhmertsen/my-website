// news.js — reads from API if available, otherwise falls back to localStorage
(function(){
  function getLocalNews(){ try{ return JSON.parse(localStorage.getItem('news_vitrine')||'[]'); }catch(e){return []} }
  function saveLocalNews(list){ localStorage.setItem('news_vitrine', JSON.stringify(list)); }

  function escapeHtml(str){ return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function fetchNews(){
    try{
      var res = await fetch('/api/news');
      if(!res.ok) throw new Error('api error');
      var data = await res.json();
      return data;
    }catch(e){
      return null;
    }
  }

  async function renderPreview(){
    var container = document.getElementById('news-preview');
    if(!container) return;

    var list = await fetchNews();
    if(!list){
      list = getLocalNews();
      if(list.length === 0){
        list = [
          {id:1,title:'Kırşehirli Hemşehrilerimizle Bir Araya Geldik',date:'26 Nisan 2023',image:'assets/images/news1.jpg',excerpt:'Kısa özet...',content:'Detaylı içerik...',published:true},
          {id:2,title:'Etlik Şehir Hastanesi Taksi Durağında Taksici Esnafımız İle Bir Araya Geldik',date:'25 Nisan 2023',image:'assets/images/news2.jpg',excerpt:'Kısa özet...',content:'Detaylı içerik...',published:true}
        ];
        saveLocalNews(list);
      }
    }

    var html = '';
    html += '<div class="home-grid">';
    for(var i=0;i<2 && i<list.length;i++){
      var it = list[i];
  html += '<article class="news-large"><a href="news.html#n'+(it._id||it.id)+'"><img src="'+(it.image||'assets/images/default.png')+'" alt="'+escapeHtml(it.title)+'"><div class="news-caption"><h3>'+escapeHtml(it.title)+'</h3><div class="date">'+escapeHtml(it.date)+'</div></div></a></article>';
    }
    html += '</div>';
    html += '<div class="news-row">';
    for(var j=2;j<list.length && j<5;j++){
      var it2 = list[j];
  html += '<article class="news-small"><a href="news.html#n'+(it2._id||it2.id)+'"><img src="'+(it2.image||'assets/images/default.png')+'" alt="'+escapeHtml(it2.title)+'"></a></article>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  async function renderNewsList(){
    var listEl = document.getElementById('news-list');
    if(!listEl) return;
    var list = await fetchNews();
    if(!list){ list = getLocalNews(); }
    if(list.length === 0){ listEl.innerHTML = '<p>Henüz haber yok.</p>'; return; }
    var html = '';
    list.forEach(function(it){
      html += '<div class="card" style="margin-bottom:12px">';
      html += '<h3><a href="#n'+(it._id||it.id)+'">'+escapeHtml(it.title)+'</a></h3>';
      html += '<div class="small">'+escapeHtml(it.date)+'</div>';
      html += '<p>'+escapeHtml(it.excerpt||'')+'</p>';
      html += '</div>';
    });
    listEl.innerHTML = html;
  }

  function handleAnchor(){
    if(!location.hash) return;
    var m = location.hash.match(/^#n(\w+)$/);
    if(!m) return;
    var id = m[1];
    // try to fetch single news by id from API first
    (async function(){
      var found = null;
      try{
        var resp = await fetch('/api/news');
        if(resp.ok){
          var list = await resp.json();
          found = list.find(x => (x._id||String(x.id)) === id || String(x.id) === id);
        }
      }catch(e){/* ignore */}
      if(!found){
        var listL = getLocalNews();
        found = listL.find(x => (x.id||x._id) == id);
      }
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