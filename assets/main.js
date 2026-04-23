// SPA-specific logic for index.html

function showPage(page, updateHistory) {
  if (updateHistory === undefined) updateHistory = true;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
  var a = document.getElementById('nav-' + page);
  if (a) a.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (updateHistory) {
    var url = page === 'home' ? window.location.pathname : '#' + page;
    window.history.pushState({ page: page }, '', url);
  }
}

window.addEventListener('popstate', function(event) {
  if (event.state && event.state.page) {
    showPage(event.state.page, false);
  } else {
    var hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById('page-' + hash)) {
      showPage(hash, false);
    } else {
      showPage('home', false);
    }
  }
});

// ── Blog modal (SPA) ─────────────────────────────────────
function openBlogModal(postData) {
  document.getElementById('bm-title').textContent = postData.title;
  document.getElementById('bm-category').textContent = postData.category || 'General';
  document.getElementById('bm-date').textContent = postData.date || 'Just now';
  var img = document.getElementById('bm-img');
  img.src = postData.coverSrc || '';
  img.style.display = postData.coverSrc ? 'block' : 'none';
  var summaryBox = document.getElementById('bm-summary-box');
  if (postData.summary) {
    document.getElementById('bm-summary').textContent = postData.summary;
    summaryBox.style.display = 'block';
  } else {
    summaryBox.style.display = 'none';
  }
  renderBlocksInModal(postData.blocks || [], document.getElementById('bm-blocks'));
  document.getElementById('blog-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeBlogModalBtn() {
  document.getElementById('blog-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function closeBlogModal(e) {
  if (e.target.id === 'blog-modal') closeBlogModalBtn();
}

// ── Evidence modal ───────────────────────────────────────
function openEvidenceModal(postData) {
  document.getElementById('em-title').textContent = postData.title;
  document.getElementById('em-category').textContent = postData.category || 'Research';
  document.getElementById('em-date').textContent = postData.date || 'Just now';
  var img = document.getElementById('em-img');
  img.src = postData.coverSrc || '';
  img.style.display = postData.coverSrc ? 'block' : 'none';
  var summaryBox = document.getElementById('em-summary-box');
  if (postData.summary) {
    document.getElementById('em-summary').textContent = postData.summary;
    summaryBox.style.display = 'block';
  } else {
    summaryBox.style.display = 'none';
  }
  renderBlocksInModal(postData.blocks || [], document.getElementById('em-blocks'));
  document.getElementById('evidence-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeEvidenceModalBtn() {
  document.getElementById('evidence-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function closeEvidenceModal(e) {
  if (e.target.id === 'evidence-modal') closeEvidenceModalBtn();
}

// ── Initialization ───────────────────────────────────────
var initialHash = window.location.hash.replace('#', '');
var startPage = (initialHash && document.getElementById('page-' + initialHash)) ? initialHash : 'home';
showPage(startPage, false);
var initUrl = startPage === 'home' ? window.location.pathname : '#' + startPage;
window.history.replaceState({ page: startPage }, '', initUrl);

// ── Hero carousel ────────────────────────────────────────
var heroCurrent = 0;
var heroSlides = document.getElementById('hero-slides');
var heroDurations = [5000, 15000];
var heroTimer;

function heroScheduleNext() {
  clearTimeout(heroTimer);
  heroTimer = setTimeout(function() {
    heroGo(heroCurrent === 0 ? 1 : 0);
  }, heroDurations[heroCurrent]);
}

function heroGo(index) {
  heroCurrent = index;
  heroSlides.style.transform = 'translateX(-' + (index * 50) + '%)';
  document.getElementById('hero-dot-0').style.opacity = index === 0 ? '1' : '0.4';
  document.getElementById('hero-dot-1').style.opacity = index === 1 ? '1' : '0.4';
  heroScheduleNext();
}

heroScheduleNext();

(function() {
  var el = document.getElementById('hero-carousel');
  var startX = 0;
  el.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', function(e) {
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) heroGo(diff > 0 ? 1 : 0);
  }, { passive: true });
})();

// ── Work carousel ─────────────────────────────────────────
var workCurrent = 0;
var workTotal = 2;
var workTimer;

function workAnimate(index) {
  var slides = document.querySelectorAll('.work-slide');
  slides.forEach(function(s, i) {
    var els = s.querySelectorAll('.slide-content > *');
    var bg = s.querySelector('.slide-bg');
    if (i === index) {
      els.forEach(function(el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
      if (bg) bg.style.transform = 'scale(1.04)';
    } else {
      els.forEach(function(el) { el.style.opacity = '0'; el.style.transform = 'translateY(24px)'; });
      if (bg) bg.style.transform = 'scale(1)';
    }
  });

  document.querySelectorAll('.work-dot').forEach(function(d, i) {
    d.style.width = i === index ? '28px' : '14px';
    d.style.background = i === index ? 'var(--orange)' : 'rgba(255,255,255,.35)';
  });

  var counter = document.getElementById('work-counter');
  if (counter) counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(workTotal).padStart(2, '0');
}

function workGoTo(index) {
  workCurrent = index;
  var track = document.getElementById('work-track');
  if (track) track.style.transform = 'translateX(-' + (index * 100) + '%)';
  workAnimate(index);
  resetWorkTimer();
}

function workSlide(dir) {
  workGoTo((workCurrent + dir + workTotal) % workTotal);
}

function resetWorkTimer() {
  clearInterval(workTimer);
  workTimer = setInterval(function() { workSlide(1); }, 5000);
}

(function() {
  var startX = 0;
  var track = document.getElementById('work-track');
  if (!track) return;
  track.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function(e) {
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) workSlide(diff > 0 ? 1 : -1);
  });
})();

workAnimate(0);
resetWorkTimer();
