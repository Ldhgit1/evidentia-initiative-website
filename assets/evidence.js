async function loadEvidencePosts() {
  var container = document.getElementById('evidence-container');
  if (!container) return;

  var { data, error } = await getSB()
    .from('evidence_posts')
    .select('*')
    .order('date', { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p style="color:var(--gray-700);grid-column:1/-1;">No evidence posts yet. Check back soon.</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach(function (post) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.onclick = function () { openEvidenceModal(post); };

    var img = post.image
      ? '<img src="' + escapeHtml(post.image) + '" alt="' + escapeHtml(post.title) + '" style="width:100%;height:180px;object-fit:cover;border-radius:var(--rounded-md) var(--rounded-md) 0 0;" />'
      : '';

    var date = post.date ? new Date(post.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    card.innerHTML = img + '<div style="padding:24px;">'
      + '<p class="tag" style="margin-bottom:8px;">' + escapeHtml(post.category || 'Research') + '</p>'
      + '<h3 style="font-size:var(--text-lg);margin-bottom:8px;line-height:1.3;">' + escapeHtml(post.title) + '</h3>'
      + (date ? '<p style="font-size:var(--text-xs);color:var(--gray-700);letter-spacing:.04em;">' + date + '</p>' : '')
      + '</div>';

    container.appendChild(card);
  });
}

function openEvidenceModal(post) {
  var modal = document.getElementById('evidence-modal');
  if (!modal) return;

  document.getElementById('em-category').textContent = post.category || 'Research';
  document.getElementById('em-title').textContent = post.title || '';

  var date = post.date ? new Date(post.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '';
  document.getElementById('em-date').textContent = date;

  var img = document.getElementById('em-img');
  if (post.image) { img.src = post.image; img.alt = post.title || ''; img.style.display = 'block'; }
  else { img.style.display = 'none'; }

  var summaryBox = document.getElementById('em-summary-box');
  var summaryEl = document.getElementById('em-summary');
  if (post.summary) { summaryEl.textContent = post.summary; summaryBox.style.display = 'block'; }
  else { summaryBox.style.display = 'none'; }

  var blocksEl = document.getElementById('em-blocks');
  blocksEl.innerHTML = '';
  if (post.blocks && typeof renderBlocksInModal === 'function') {
    renderBlocksInModal(post.blocks, blocksEl);
  }

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeEvidenceModalBtn() {
  var modal = document.getElementById('evidence-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function closeEvidenceModal(e) {
  if (e.target === document.getElementById('evidence-modal')) closeEvidenceModalBtn();
}

document.addEventListener('DOMContentLoaded', loadEvidencePosts);
