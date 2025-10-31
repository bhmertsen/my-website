document.addEventListener('DOMContentLoaded', function(){

  // Small interaction: toggle submenus in sidebar
  document.querySelectorAll('.side-menu .has-sub').forEach(function(el){
    el.addEventListener('click', function(){
      // simple toggle - just change caret (placeholder for submenu)
      var caret = this.querySelector('.caret');
      if(caret) caret.textContent = caret.textContent === '▾' ? '▸' : '▾';
    });
  });

  // Replace missing images with a local default image, then fallback to remote placeholder if local also missing
  function applyImageFallbacks(){
    document.querySelectorAll('img').forEach(function(img){
      // skip if already handled
      if(img.dataset.fallbackHandled) return;

      // mark as handled to prevent duplicate listeners
      img.dataset.fallbackHandled = '1';

      img.addEventListener('error', function onErr(){
        if(img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = '1';

        // determine sensible size
        var w = parseInt(img.getAttribute('width')) || img.clientWidth || 600;
        var h = parseInt(img.getAttribute('height')) || img.clientHeight || 400;
        if(!w || w < 50) w = 600;
        if(!h || h < 50) h = 400;

  var localPath = 'assets/images/default.png';
        // try local placeholder first
        img.src = localPath;

        // if local also fails to load within a short time, use remote placeholder
        setTimeout(function(){
          // naturalWidth==0 indicates load failure in many browsers
          if(!img.complete || img.naturalWidth === 0){
            var text = encodeURIComponent('Resim');
            img.src = 'https://via.placeholder.com/' + w + 'x' + h + '.png?text=' + text;
          }
        }, 300);
      });

      // pre-load test: will trigger error handler if original src missing
      var tester = new Image();
      tester.onload = function(){ /* image exists */ };
      tester.onerror = function(){
            try{ img.dispatchEvent(new Event('error')); }catch(e){ img.src = 'assets/images/default.png'; }
      };
      // start test load
      tester.src = img.src;
    });
  }

  // Run fallbacks early so missing local files are replaced
  applyImageFallbacks();

  // Mobile sidebar toggle
  var body = document.body;
  var menuBtn = document.querySelector('.menu-toggle');
  var overlay = document.createElement('div'); overlay.className = 'sidebar-overlay'; document.body.appendChild(overlay);
  var sidebarEl = document.querySelector('.sidebar');
  function openSidebar(){
    body.classList.add('sidebar-open');
    // animation
    if(sidebarEl){ sidebarEl.classList.remove('animate-in'); void sidebarEl.offsetWidth; sidebarEl.classList.add('animate-in'); }
    if(menuBtn){ menuBtn.setAttribute('aria-expanded','true'); menuBtn.classList.add('open'); menuBtn.textContent = '✕'; }
  }
  function closeSidebar(){
    body.classList.remove('sidebar-open');
    if(menuBtn){ menuBtn.setAttribute('aria-expanded','false'); menuBtn.classList.remove('open'); menuBtn.textContent = '☰'; }
  }
  if(menuBtn){ menuBtn.addEventListener('click', function(){ if(body.classList.contains('sidebar-open')) closeSidebar(); else openSidebar(); }); }
  overlay.addEventListener('click', closeSidebar);
  // ensure sidebar is closed when resizing to wide screens
  window.addEventListener('resize', function(){ if(window.innerWidth > 1000) closeSidebar(); });

  // Basic slider placeholder behavior (if multiple .slider-item elements are present)
  var slider = document.querySelector('.slider');
  if(slider){
    var items = slider.querySelectorAll('.slider-item');
    if(items.length > 0){
      var current = 0;
      function show(i){
        items.forEach(function(it, idx){
          it.style.display = idx===i? 'block' : 'none';
        });
      }
      show(current);

      var prevBtn = document.querySelector('.slider-prev');
      var nextBtn = document.querySelector('.slider-next');
      if(prevBtn){prevBtn.addEventListener('click', function(){ current = (current-1+items.length)%items.length; show(current); });}
      if(nextBtn){nextBtn.addEventListener('click', function(){ current = (current+1)%items.length; show(current); });}

      // Auto-advance every 6s
      setInterval(function(){ current=(current+1)%items.length; show(current); },6000);
    }
  }

  // If later images are added dynamically you can call applyImageFallbacks() again

  // Sidebar contact form handling (saves to localStorage and optionally POSTs to /api/messages)
  var sidebarForm = document.getElementById('sidebar-contact-form');
  if(sidebarForm){
    sidebarForm.addEventListener('submit', function(evt){
      evt.preventDefault();
      var name = (sidebarForm.elements['name']||{}).value || '';
      var phone = (sidebarForm.elements['phone']||{}).value || '';
      var message = (sidebarForm.elements['message']||{}).value || '';
      name = name.trim(); message = message.trim(); phone = phone.trim();
      var resultEl = document.getElementById('sidebar-contact-result');
      if(!name || !message){
        if(resultEl){ resultEl.style.display = 'block'; resultEl.style.color = '#f66'; resultEl.textContent = 'Lütfen Ad Soyad ve Mesaj alanlarını doldurun.'; }
        return;
      }

      var entry = { name: name, phone: phone, message: message, created: new Date().toISOString() };

      try{
        var existing = JSON.parse(localStorage.getItem('messages_submissions') || '[]');
        existing.unshift(entry);
        localStorage.setItem('messages_submissions', JSON.stringify(existing));
      }catch(e){
        // ignore storage errors
      }

      // show success
      if(resultEl){ resultEl.style.display = 'block'; resultEl.style.color = 'lightgreen'; resultEl.textContent = 'Mesajınız kaydedildi. Teşekkürler.'; }
      sidebarForm.reset();
      setTimeout(function(){ if(resultEl) resultEl.style.display = 'none'; }, 4000);

      // Try to POST to server if available (non-blocking)
      try{
        fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) })
          .then(function(res){ /* silently succeed */ })
          .catch(function(){ /* ignore network errors */ });
      }catch(e){ /* ignore */ }
    });
  }

  // Live Broadcast countdown
  (function(){
    var box = document.getElementById('live-broadcast');
    if(!box) return;
    try{
      var dtStr = box.getAttribute('data-datetime');
      var channel = box.getAttribute('data-channel') || '';
      var url = box.getAttribute('data-url') || '#';
      var dateEl = document.getElementById('live-date');
      var linkEl = document.getElementById('live-link');
      var chEl = box.querySelector('.channel');
      if(chEl) chEl.textContent = channel;
      if(linkEl) linkEl.href = url;
      var target = new Date(dtStr);
      if(dateEl){
        try{
          var fmt = target.toLocaleString('tr-TR', { dateStyle:'full', timeStyle:'short' });
          dateEl.textContent = fmt + ' • ' + channel;
        }catch(e){ dateEl.textContent = dtStr + ' • ' + channel; }
      }

      var units = {
        days: box.querySelector('[data-unit="days"]'),
        hours: box.querySelector('[data-unit="hours"]'),
        minutes: box.querySelector('[data-unit="minutes"]'),
        seconds: box.querySelector('[data-unit="seconds"]')
      };

      function pad(n){ return (n<10? '0':'') + n; }
      function tick(){
        var now = new Date();
        var diff = target - now;
        if(diff <= 0){
          if(units.days) units.days.textContent = '00';
          if(units.hours) units.hours.textContent = '00';
          if(units.minutes) units.minutes.textContent = '00';
          if(units.seconds) units.seconds.textContent = '00';
          var badge = box.querySelector('.badge');
          if(badge){ badge.innerHTML = '<i class="fa fa-wifi"></i> Yayında'; }
          return; // stop updating
        }
        var s = Math.floor(diff/1000);
        var days = Math.floor(s/86400); s -= days*86400;
        var hrs = Math.floor(s/3600); s -= hrs*3600;
        var mins = Math.floor(s/60); s -= mins*60;
        var secs = s;
        if(units.days) units.days.textContent = pad(days);
        if(units.hours) units.hours.textContent = pad(hrs);
        if(units.minutes) units.minutes.textContent = pad(mins);
        if(units.seconds) units.seconds.textContent = pad(secs);
        requestAnimationFrame(function(){ setTimeout(tick, 1000); });
      }
      tick();
    }catch(e){ /* ignore */ }
  })();
});