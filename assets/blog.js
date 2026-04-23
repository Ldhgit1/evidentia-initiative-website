// Blog page logic for blog/index.html

function showPage(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderBlogCard(postData) {
  var coverHtml = postData.coverSrc
    ? '<img src="' + postData.coverSrc + '" style="width:100%;height:200px;object-fit:cover;" alt="' + (postData.title || '') + '" />'
    : '<div style="width:100%;height:200px;background:var(--dark-green);display:flex;align-items:center;justify-content:center;"><span style="color:rgba(255,255,255,.3);font-size:11px;font-weight:700;letter-spacing:.1em;">NO COVER</span></div>';
  var byline = (postData.author ? 'By ' + postData.author : '') +
    (postData.author && postData.date ? ' · ' : '') +
    (postData.date || (!postData.author ? 'Just now' : ''));
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'background:#fff;border-radius:var(--rounded-xl);overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--gray-300);cursor:pointer;position:relative;';
  card.innerHTML = coverHtml +
    '<div style="padding:24px;">' +
      '<span class="tag">' + (postData.category || 'General') + '</span>' +
      '<h3 style="font-size:var(--text-lg);margin:8px 0 10px;">' + postData.title + '</h3>' +
      '<p class="blog-card-summary" style="font-size:var(--text-sm);color:var(--gray-700);line-height:175%;margin-bottom:16px;">' + (postData.summary || '') + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:var(--text-xs);color:var(--gray-700);">' +
        '<span>' + byline + '</span>' +
        '<span style="color:var(--orange);font-weight:700;">Read more →</span>' +
      '</div></div>';
  card.onclick = function() { openBlogPost(postData); };
  document.getElementById('blog-posts-container').appendChild(card);
}

async function loadBlogPosts() {
  var sb = getSB();
  var result = await sb.from('blog_posts').select('*').order('created_at', { ascending: false });
  if (result.error) { console.error('Error loading blog posts:', result.error); return; }
  document.getElementById('blog-posts-container').innerHTML = '';
  (result.data || []).forEach(function(row) {
    renderBlogCard({
      id: row.id,
      title: row.title,
      category: row.category,
      summary: row.summary,
      author: row.author,
      date: row.date,
      coverSrc: row.cover_src || '',
      blocks: row.blocks || [],
      references: row.post_references || ''
    });
  });
}

function openBlogPost(postData) {
  document.getElementById('bm-title').textContent = postData.title || '';
  document.getElementById('bm-category').textContent = postData.category || 'General';

  var authorEl = document.getElementById('bm-sidebar-author');
  var authorWrap = document.getElementById('bm-sidebar-author-wrap');
  if (postData.author) {
    authorEl.textContent = postData.author;
    authorWrap.style.display = 'block';
  } else {
    authorWrap.style.display = 'none';
  }

  var dateEl = document.getElementById('bm-sidebar-date');
  var dateWrap = document.getElementById('bm-sidebar-date-wrap');
  if (postData.date) {
    dateEl.textContent = postData.date;
    dateWrap.style.display = 'block';
  } else {
    dateWrap.style.display = 'none';
  }

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

  renderBlocksInModal(postData.blocks || [], document.getElementById('bm-blocks'), 'bm-toc-list', 'bm-toc');
  renderReferences(postData.references || '', document.getElementById('bm-blocks'));
  _currentPostId = postData.id || null;
  loadBlogComments(_currentPostId);
  showPage('blog-post');
}

// ── Comments ─────────────────────────────────────────────

var _currentPostId = null;

function renderComment(comment) {
  var list = document.getElementById('bm-comments-list');
  var item = document.createElement('div');
  item.style.cssText = 'background:var(--gray); border-radius:var(--rounded-lg); padding:16px 20px;';
  var date = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  item.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; gap:8px;">' +
      '<span style="font-size:var(--text-sm); font-weight:700; color:var(--midnight-green);">' + escapeHtml(comment.name) + '</span>' +
      '<span style="font-size:var(--text-xs); color:var(--gray-700); white-space:nowrap;">' + date + '</span>' +
    '</div>' +
    '<p style="font-size:var(--text-sm); color:var(--gray-700); line-height:1.7; margin:0;">' + escapeHtml(comment.comment) + '</p>';
  list.appendChild(item);
}

async function loadBlogComments(postId) {
  var list = document.getElementById('bm-comments-list');
  list.innerHTML = '';
  if (!postId) return;
  var sb = getSB();
  var result = await sb.from('blog_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
  if (result.error) { console.error('Error loading comments:', result.error); return; }
  (result.data || []).forEach(function(row) { renderComment(row); });
  if (!result.data || result.data.length === 0) {
    list.innerHTML = '<p style="font-size:var(--text-sm); color:var(--gray-700);">No comments yet. Be the first!</p>';
  }
}

async function submitBlogComment(e) {
  e.preventDefault();
  var name = document.getElementById('bm-comment-name').value.trim();
  var comment = document.getElementById('bm-comment-text').value.trim();
  if (!name || !comment || !_currentPostId) return;
  var btn = document.getElementById('bm-comment-btn');
  btn.disabled = true;
  btn.textContent = 'Posting…';
  var sb = getSB();
  var result = await sb.from('blog_comments').insert([{ post_id: _currentPostId, name: name, comment: comment }]);
  if (result.error) {
    console.error('Error posting comment:', result.error);
    btn.disabled = false;
    btn.textContent = 'Post Comment';
    alert('Failed to post comment. Please try again.');
    return;
  }
  document.getElementById('bm-comment-name').value = '';
  document.getElementById('bm-comment-text').value = '';
  btn.disabled = false;
  btn.textContent = 'Post Comment';
  var list = document.getElementById('bm-comments-list');
  if (list.querySelector('p')) list.innerHTML = '';
  renderComment({ name: name, comment: comment, created_at: new Date().toISOString() });
}

document.addEventListener('DOMContentLoaded', function() {
  loadBlogPosts();
});
