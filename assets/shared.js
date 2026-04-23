// Shared utilities used across all pages

function toggleMenu() {
  var m = document.getElementById('mobile-menu');
  m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}

function setSvcPanel(i) {
  document.querySelectorAll('#svc-accordion .svc-panel').forEach(function(p, idx) {
    var isActive = idx === i;
    p.style.flex = isActive ? '3.5' : '1.5';
    var ac = p.querySelector('.svc-active-content');
    var it = p.querySelector('.svc-inactive-title');
    if (ac) ac.style.display = isActive ? 'flex' : 'none';
    if (it) it.style.display = isActive ? 'none' : 'flex';
  });
}

var _sbClient = null;
function getSB() {
  if (!_sbClient) _sbClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return _sbClient;
}

function buildChart(canvas, type, title, labels, values) {
  var isPie = (type === 'pie' || type === 'doughnut');
  var palette = ['#f06632', '#003366', '#00193a', '#225c41', '#004e74', '#e69d00', '#3d5a80'];
  return new Chart(canvas, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: title || 'Data',
        data: values,
        backgroundColor: isPie ? palette.slice(0, values.length) : 'rgba(240,102,50,0.75)',
        borderColor: isPie ? palette.slice(0, values.length) : '#f06632',
        borderWidth: isPie ? 0 : 2,
        tension: 0.35,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: !!title, text: title, font: { size: 14 } },
        legend: { display: isPie }
      },
      scales: isPie ? {} : { y: { beginAtZero: true } }
    }
  });
}

// 4-param version: tocListId and tocWrapperId are optional
function renderBlocksInModal(blocks, container, tocListId, tocWrapperId) {
  container.innerHTML = '';
  var tocList = tocListId ? document.getElementById(tocListId) : null;
  var tocWrap = tocWrapperId ? document.getElementById(tocWrapperId) : null;
  if (tocList) tocList.innerHTML = '';
  var headingCount = 0;

  blocks.forEach(function(block, idx) {
    if (block.type === 'text') {
      var p = document.createElement('div');
      p.style.cssText = 'font-size:var(--text-base);color:var(--midnight-green);line-height:1.9;margin-bottom:24px;';
      p.innerHTML = block.content || '';
      container.appendChild(p);
    } else if (block.type === 'heading') {
      var h = document.createElement('h3');
      var anchorId = 'section-' + idx;
      h.id = anchorId;
      h.style.cssText = 'font-size:var(--text-xl);color:var(--midnight-green);margin:36px 0 12px;line-height:1.3;scroll-margin-top:90px;';
      h.textContent = block.content || '';
      container.appendChild(h);
      if (tocList && block.content) {
        headingCount++;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + anchorId;
        a.className = 'post-toc-link';
        a.textContent = block.content;
        a.onclick = (function(el) {
          return function(e) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        })(h);
        li.appendChild(a);
        tocList.appendChild(li);
      }
    } else if (block.type === 'image') {
      var div = document.createElement('div');
      div.style.cssText = 'margin-bottom:32px;text-align:center;';
      if (block.src) {
        var im = document.createElement('img');
        im.src = block.src;
        im.style.cssText = 'max-width:100%;border-radius:var(--rounded-lg);max-height:500px;object-fit:contain;display:block;';
        div.appendChild(im);
      }
      if (block.caption) {
        var cap = document.createElement('p');
        cap.style.cssText = 'font-size:12px;color:var(--gray-700);margin-top:8px;font-style:italic;';
        cap.textContent = block.caption;
        div.appendChild(cap);
      }
      container.appendChild(div);
    } else if (block.type === 'chart') {
      var cWrap = document.createElement('div');
      cWrap.style.cssText = 'margin-bottom:24px;';
      var canvas = document.createElement('canvas');
      canvas.id = 'mc-' + idx + '-' + Date.now();
      cWrap.appendChild(canvas);
      if (block.title) {
        var chartCap = document.createElement('p');
        chartCap.style.cssText = 'font-size:12px;color:var(--gray-700);margin-top:8px;';
        chartCap.textContent = block.title;
        cWrap.appendChild(chartCap);
      }
      container.appendChild(cWrap);
      (function(c, b) {
        setTimeout(function() { buildChart(c, b.chartType || 'bar', b.title || '', b.labels || [], b.values || []); }, 60);
      })(canvas, block);
    }
  });

  if (tocWrap) tocWrap.style.display = headingCount > 0 ? 'block' : 'none';
}

function renderReferences(refs, container) {
  var existing = container.querySelector('.post-references-section');
  if (existing) existing.remove();
  if (!refs) return;
  var lines = refs.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  if (!lines.length) return;
  var section = document.createElement('div');
  section.className = 'post-references-section';
  section.style.cssText = 'margin-top:32px; padding-top:24px; border-top:1px solid var(--gray-300);';
  var heading = document.createElement('p');
  heading.style.cssText = 'font-size:var(--text-xs); font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gray-700); margin:0 0 12px;';
  heading.textContent = 'References';
  section.appendChild(heading);
  var ol = document.createElement('ol');
  ol.style.cssText = 'padding-left:20px; margin:0;';
  lines.forEach(function(line) {
    var li = document.createElement('li');
    li.style.cssText = 'font-size:var(--text-sm); color:var(--gray-700); line-height:1.6; margin-bottom:6px;';
    li.textContent = line;
    ol.appendChild(li);
  });
  section.appendChild(ol);
  container.appendChild(section);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
