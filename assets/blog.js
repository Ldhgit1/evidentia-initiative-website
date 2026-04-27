// Blog page — pagination, slug URLs, comments

var _allPosts = [];
var _currentPage = 1;
var _postsPerPage = 10;
var _currentPostId = null;

// ── Slug helper ───────────────────────────────────────────

function slugify(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

// ── Page switching ────────────────────────────────────────

function showPage(which) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var el = document.getElementById('page-' + which);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBackToBlog() {
  document.title = 'Blog | Evidence for Good';
  history.pushState({ view: 'list', page: _currentPage }, '', '/blog/');
  showPage('blog');
}

// ── Load all posts ────────────────────────────────────────

async function loadBlogPosts() {
  var container = document.getElementById('blog-posts-container');
  container.innerHTML = '<p style="color:var(--gray-700);grid-column:1/-1;">Loading posts…</p>';

  var result = await getSB()
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (result.error || !result.data) {
    container.innerHTML = '<p style="color:var(--gray-700);grid-column:1/-1;">Could not load posts. Please try again later.</p>';
    return;
  }

  _allPosts = result.data.map(function(row) {
    var dateStr = '';
    if (row.date) {
      try { dateStr = new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
      catch(e) { dateStr = row.date; }
    }
    return {
      id:         row.id,
      title:      row.title      || '',
      category:   row.category   || 'General',
      summary:    row.summary    || '',
      author:     row.author     || '',
      date:       dateStr,
      coverSrc:   row.cover_src  || row.image || '',
      blocks:     row.blocks     || [],
      references: row.post_references || ''
    };
  });

  renderPage(1);
  checkURLForPost();
}

// ── Render a page of cards ────────────────────────────────

function renderPage(page) {
  _currentPage = page;
  var container = document.getElementById('blog-posts-container');
  container.innerHTML = '';

  var start = (page - 1) * _postsPerPage;
  var slice = _allPosts.slice(start, start + _postsPerPage);

  if (slice.length === 0) {
    container.innerHTML = '<p style="color:var(--gray-700);grid-column:1/-1;">No posts yet. Check back soon.</p>';
  } else {
    slice.forEach(renderBlogCard);
  }

  renderPagination();
}

// ── Pagination controls ───────────────────────────────────

function renderPagination() {
  var existing = document.getElementById('blog-pagination');
  if (existing) existing.remove();

  var total = Math.ceil(_allPosts.length / _postsPerPage);
  if (total <= 1) return;

  var wrap = document.createElement('div');
  wrap.id = 'blog-pagination';
  wrap.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;margin-top:48px;flex-wrap:wrap;';

  var btnBase = 'border-radius:4px;padding:8px 16px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid var(--gray-300);background:none;color:var(--midnight-green);';
  var btnActive = 'border-radius:4px;padding:8px 14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;border:1px solid var(--midnight-green);background:var(--midnight-green);color:#fff;min-width:40px;';
  var btnDisabled = 'opacity:0.4;pointer-events:none;';

  // Previous
  var prev = document.createElement('button');
  prev.textContent = '← Previous';
  prev.style.cssText = btnBase + (_currentPage === 1 ? btnDisabled : '');
  prev.onclick = function() { renderPage(_currentPage - 1); window.scrollTo({ top: 0 }); };
  wrap.appendChild(prev);

  // Page numbers — show all if ≤ 7, otherwise show smart ellipsis
  var pages = [];
  if (total <= 7) {
    for (var i = 1; i <= total; i++) pages.push(i);
  } else {
    pages = [1];
    if (_currentPage > 3) pages.push('…');
    for (var j = Math.max(2, _currentPage - 1); j <= Math.min(total - 1, _currentPage + 1); j++) pages.push(j);
    if (_currentPage < total - 2) pages.push('…');
    pages.push(total);
  }

  pages.forEach(function(n) {
    if (n === '…') {
      var dots = document.createElement('span');
      dots.textContent = '…';
      dots.style.cssText = 'padding:8px 4px;color:var(--gray-700);font-size:14px;';
      wrap.appendChild(dots);
    } else {
      var btn = document.createElement('button');
      btn.textContent = n;
      btn.style.cssText = n === _currentPage ? btnActive : btnBase;
      (function(pageNum) {
        btn.onclick = function() { renderPage(pageNum); window.scrollTo({ top: 0 }); };
      })(n);
      wrap.appendChild(btn);
    }
  });

  // Next
  var next = document.createElement('button');
  next.textContent = 'Next →';
  next.style.cssText = btnBase + (_currentPage === total ? btnDisabled : '');
  next.onclick = function() { renderPage(_currentPage + 1); window.scrollTo({ top: 0 }); };
  wrap.appendChild(next);

  document.getElementById('blog-posts-container').after(wrap);
}

// ── Render single card ────────────────────────────────────

function renderBlogCard(post) {
  var coverHtml = post.coverSrc
    ? '<img src="' + escapeHtml(post.coverSrc) + '" alt="' + escapeHtml(post.title) + '" style="width:100%;height:200px;object-fit:cover;" loading="lazy" />'
    : '<div style="width:100%;height:200px;background:var(--dark-green);display:flex;align-items:center;justify-content:center;"><span style="color:rgba(255,255,255,.25);font-size:11px;font-weight:700;letter-spacing:.12em;">E4G</span></div>';

  var byline = (post.author ? 'By ' + post.author : '') +
    (post.author && post.date ? ' · ' : '') + post.date;

  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'background:#fff;border-radius:var(--rounded-xl);overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--gray-300);cursor:pointer;transition:box-shadow .2s,transform .2s;';
  card.onmouseover = function() { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; };
  card.onmouseout  = function() { this.style.transform = ''; this.style.boxShadow = ''; };

  card.innerHTML = coverHtml +
    '<div style="padding:24px;">' +
      '<span class="tag">' + escapeHtml(post.category) + '</span>' +
      '<h3 style="font-size:var(--text-lg);margin:8px 0 10px;line-height:1.35;">' + escapeHtml(post.title) + '</h3>' +
      '<p class="blog-card-summary" style="font-size:var(--text-sm);color:var(--gray-700);line-height:175%;margin-bottom:16px;">' + escapeHtml(post.summary) + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:var(--text-xs);color:var(--gray-700);">' +
        '<span>' + escapeHtml(byline) + '</span>' +
        '<span style="color:var(--orange);font-weight:700;">Read more →</span>' +
      '</div>' +
    '</div>';

  card.onclick = function() { openBlogPost(post); };
  document.getElementById('blog-posts-container').appendChild(card);
}

// ── Open post ─────────────────────────────────────────────

function openBlogPost(post) {
  // Cover image
  var img = document.getElementById('bm-img');
  if (post.coverSrc) {
    img.src = post.coverSrc;
    img.alt = post.title;
    img.style.display = 'block';
  } else {
    img.src = '';
    img.style.display = 'none';
  }

  // Title
  document.getElementById('bm-title').textContent = post.title;

  // Category
  document.getElementById('bm-category').textContent = post.category;

  // Author
  var authorWrap = document.getElementById('bm-sidebar-author-wrap');
  if (post.author) {
    document.getElementById('bm-sidebar-author').textContent = post.author;
    authorWrap.style.display = 'block';
  } else {
    authorWrap.style.display = 'none';
  }

  // Date
  var dateWrap = document.getElementById('bm-sidebar-date-wrap');
  if (post.date) {
    document.getElementById('bm-sidebar-date').textContent = post.date;
    dateWrap.style.display = 'block';
  } else {
    dateWrap.style.display = 'none';
  }

  // Summary box
  var sumBox = document.getElementById('bm-summary-box');
  if (post.summary) {
    document.getElementById('bm-summary').textContent = post.summary;
    sumBox.style.display = 'block';
  } else {
    sumBox.style.display = 'none';
  }

  // Content blocks + TOC
  renderBlocksInModal(post.blocks || [], document.getElementById('bm-blocks'), 'bm-toc-list', 'bm-toc');
  renderReferences(post.references || '', document.getElementById('bm-blocks'));

  // Comments
  _currentPostId = post.id;
  loadBlogComments(post.id);

  // URL + document title
  var slug = slugify(post.title);
  document.title = post.title + ' | Evidence for Good';
  history.pushState({ view: 'post', postId: post.id, slug: slug }, '', '/blog/' + slug);

  showPage('blog-post');
}

// ── Check URL on load (deep link support) ─────────────────

function checkURLForPost() {
  var path = window.location.pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '');
  if (!path) return;
  var match = _allPosts.find(function(p) { return slugify(p.title) === path; });
  if (match) openBlogPost(match);
}

// ── Browser back/forward ──────────────────────────────────

window.addEventListener('popstate', function(e) {
  var state = e.state || {};
  if (state.view === 'post') {
    var match = _allPosts.find(function(p) { return p.id === state.postId; });
    if (match) { openBlogPost(match); return; }
  }
  document.title = 'Blog | Evidence for Good';
  showPage('blog');
  if (state.page && state.page !== _currentPage) renderPage(state.page);
});

// ── Comments ──────────────────────────────────────────────

function renderComment(comment) {
  var list = document.getElementById('bm-comments-list');
  var item = document.createElement('div');
  item.style.cssText = 'background:var(--gray);border-radius:var(--rounded-lg);padding:16px 20px;';
  var date = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  item.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;gap:8px;">' +
      '<span style="font-size:var(--text-sm);font-weight:700;color:var(--midnight-green);">' + escapeHtml(comment.name) + '</span>' +
      '<span style="font-size:var(--text-xs);color:var(--gray-700);white-space:nowrap;">' + date + '</span>' +
    '</div>' +
    '<p style="font-size:var(--text-sm);color:var(--gray-700);line-height:1.7;margin:0;">' + escapeHtml(comment.comment) + '</p>';
  list.appendChild(item);
}

async function loadBlogComments(postId) {
  var list = document.getElementById('bm-comments-list');
  list.innerHTML = '<p style="font-size:var(--text-sm);color:var(--gray-700);">Loading comments…</p>';
  if (!postId) { list.innerHTML = ''; return; }
  var result = await getSB()
    .from('blog_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  list.innerHTML = '';
  if (result.error || !result.data || result.data.length === 0) {
    list.innerHTML = '<p style="font-size:var(--text-sm);color:var(--gray-700);">No comments yet. Be the first!</p>';
    return;
  }
  result.data.forEach(renderComment);
}

async function submitBlogComment(e) {
  e.preventDefault();
  var name    = document.getElementById('bm-comment-name').value.trim();
  var comment = document.getElementById('bm-comment-text').value.trim();
  if (!name || !comment || !_currentPostId) return;
  var btn = document.getElementById('bm-comment-btn');
  btn.disabled = true;
  btn.textContent = 'Posting…';
  var result = await getSB().from('blog_comments').insert([{ post_id: _currentPostId, name: name, comment: comment }]);
  btn.disabled = false;
  btn.textContent = 'Post Comment';
  if (result.error) { alert('Failed to post comment. Please try again.'); return; }
  document.getElementById('bm-comment-name').value = '';
  document.getElementById('bm-comment-text').value = '';
  var list = document.getElementById('bm-comments-list');
  var emptyMsg = list.querySelector('p');
  if (emptyMsg) list.innerHTML = '';
  renderComment({ name: name, comment: comment, created_at: new Date().toISOString() });
}

document.addEventListener('DOMContentLoaded', loadBlogPosts);
