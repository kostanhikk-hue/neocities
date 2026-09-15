const { board: BOARD, theme: THEME, evidence: EVIDENCE, links: LINKS } = window.BOARD_DATA;

const boardViewport = document.querySelector('#boardViewport');
const boardSpace = document.querySelector('#boardSpace');
const cardsLayer = document.querySelector('#cardsLayer');
const connections = document.querySelector('#connections');
const zoomValue = document.querySelector('#zoomValue');
const boardHelp = document.querySelector('#boardHelp');
const readerPanel = document.querySelector('#readerPanel');
const readerTitle = document.querySelector('#readerTitle');
const readerByline = document.querySelector('#readerByline');
const readerBody = document.querySelector('#readerBody');
const readerPageLink = document.querySelector('#readerPageLink');
const view = { x: 0, y: 0, scale: 1, dragging: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 };

function visualMarkup(item) {
  if (item.material === 'tape' || item.material === 'label') return `<div class="artifact-art tape-art texture-${item.texture || 'paper'}" style="--tape-color:${item.color || '#b18b4a'}"><span>${escapeText(item.text)}</span></div>`;
  if (item.material === 'marker') return `<div class="artifact-art marker-art"><strong>${item.text.replace(/\n/g, '<br>')}</strong></div>`;
  if (item.material === 'clipping') return `<div class="artifact-art clipping-art"><strong>${item.text.replace(/\n/g, '<br>')}</strong><i></i><i></i><i></i></div>`;
  if (item.material === 'manuscript') return `<div class="artifact-art manuscript-art"><span>${item.text.replace(/\n/g, '<br>')}</span><i></i><i></i><b>Л.О.</b></div>`;
  if (item.material === 'cover') return `<div class="artifact-art cover-art"><small>ЛЕВ ОРЛОВ</small><strong>${item.text.replace(/\n/g, '<br>')}</strong><em>рассказ</em></div>`;
  if (item.material === 'image') return `<img class="artifact-art source-image mode-${item.mode || 'framed'}" src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.caption)}" draggable="false">`;
  return `<img class="artifact-art source-image" src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.caption)}" draggable="false">`;
}

function escapeAttribute(value = '') { return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeText(value = '') { return escapeAttribute(value).replace(/\n/g, '<br>'); }

function cardMarkup(item) {
  const frame = item.frame ? `frame-${item.frame}` : '';
  const styles = `left:${item.x}px;top:${item.y}px;width:${item.width || 210}px;--ratio:${item.ratio || 'auto'};--frame:${item.frame || '#f3eee1'};--padding:${item.padding || 8}px;transform:rotate(${item.rotation || 0}deg);z-index:${item.zIndex || 1};`;
  return `<article class="evidence-card material-${item.material} ${frame} mode-${item.mode || 'framed'}" data-id="${item.id}" tabindex="0" role="link" aria-label="${item.caption || 'Открыть улику'}" style="${styles}">${item.pin ? '<span class="pin" aria-hidden="true"></span>' : ''}${visualMarkup(item)}<div class="artifact-caption"><b>${item.caption || ''}</b><span>${item.meta || ''}</span></div></article>`;
}

function drawConnections() {
  const links = LINKS.concat(EVIDENCE.flatMap(item => (item.links || []).map(link => typeof link === 'string' ? { from: item.id, to: link } : { from: item.id, ...link })));
  connections.innerHTML = links.map((link, index) => {
    const { from, to, fromAnchor, toAnchor, fromPoint, toPoint, sag } = Array.isArray(link) ? { from: link[0], to: link[1] } : link;
    const a = EVIDENCE.find(item => item.id === from); const b = EVIDENCE.find(item => item.id === to);
    if (!a || !b) return '';
    const point = (item, anchor, custom) => { const p = custom || (item.anchors && item.anchors[anchor]); const element = cardsLayer.querySelector(`[data-id="${item.id}"]`); const width = element ? element.offsetWidth : (item.width || 210); const height = element ? element.offsetHeight : 90; return p ? [item.x + width * p[0], item.y + height * p[1]] : [item.x + width / 2, item.y + height / 2]; };
    const [ax, ay] = point(a, fromAnchor, fromPoint); const [bx, by] = point(b, toAnchor, toPoint); const bend = sag ?? (index % 3 === 0 ? 78 : index % 2 ? -58 : 42); const dx = bx - ax; const dy = by - ay; const length = Math.max(70, Math.hypot(dx, dy) * .32); const direction = dx >= 0 ? 1 : -1;
    return `<path class="connection" d="M ${ax} ${ay} C ${ax + direction * length} ${ay + bend}, ${bx - direction * length} ${by + bend}, ${bx} ${by}" />`;
  }).join('');
}

function watchMaterialSizes() { if (!window.ResizeObserver) return; const observer = new ResizeObserver(drawConnections); cardsLayer.querySelectorAll('.evidence-card').forEach(card => observer.observe(card)); }
function render() { boardSpace.style.width = `${BOARD.width}px`; boardSpace.style.height = `${BOARD.height}px`; document.documentElement.style.setProperty('--board-color', THEME.board.color); document.documentElement.style.setProperty('--board-texture', THEME.board.texture); document.documentElement.style.setProperty('--board-image', THEME.board.image ? `url('${THEME.board.image}')` : 'none'); document.documentElement.style.setProperty('--board-size', THEME.board.size); document.documentElement.style.setProperty('--reader-background', THEME.reader.background); document.documentElement.style.setProperty('--reader-opacity', THEME.reader.opacity); document.documentElement.style.setProperty('--reader-text-color', THEME.reader.textColor); document.documentElement.style.setProperty('--reader-accent', THEME.reader.accent); document.documentElement.style.setProperty('--reader-width', THEME.reader.width); cardsLayer.innerHTML = EVIDENCE.map(cardMarkup).join(''); drawConnections(); bindCards(); watchMaterialSizes(); cardsLayer.querySelectorAll('img').forEach(image => image.addEventListener('load', drawConnections)); window.addEventListener('resize', drawConnections); updateView(); }
function updateView() { boardSpace.style.transform = `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})`; zoomValue.textContent = `${Math.round(view.scale * 100)}%`; }
function setZoom(next, focalX = boardViewport.clientWidth / 2, focalY = boardViewport.clientHeight / 2) {
  const old = view.scale; view.scale = Math.min(BOARD.maxZoom, Math.max(BOARD.minZoom, next));
  view.x = focalX - (focalX - view.x) * view.scale / old; view.y = focalY - (focalY - view.y) * view.scale / old; updateView();
}
function resetView() { view.x = 0; view.y = 0; view.scale = 1; updateView(); }
function openReader(item) {
  readerTitle.textContent = item.readerTitle || item.caption || 'Дело';
  readerByline.textContent = item.readerByline || item.readerMeta || item.meta || '';
  readerBody.textContent = item.readerBody || item.readerText || item.text || 'Текст рассказа пока не добавлен.';
  readerPageLink.href = item.href || '#';
  readerPanel.classList.add('is-open'); readerPanel.setAttribute('aria-hidden', 'false'); document.body.classList.add('reader-is-open');
  readerPanel.querySelector('.reader-close').focus();
}
function closeReader() { readerPanel.classList.remove('is-open'); readerPanel.setAttribute('aria-hidden', 'true'); document.body.classList.remove('reader-is-open'); }
function openCard(item) { if (!item.href || item.href === '#') return; if (item.reader === 'panel') openReader(item); else window.location.href = item.href; }
function bindCards() { cardsLayer.querySelectorAll('.evidence-card').forEach(card => { const item = EVIDENCE.find(entry => entry.id === card.dataset.id); card.addEventListener('click', () => { if (!view.moved) openCard(item); }); card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCard(item); } }); }); }

document.querySelector('#zoomIn').addEventListener('click', () => setZoom(view.scale + .1));
document.querySelector('#zoomOut').addEventListener('click', () => setZoom(view.scale - .1));
document.querySelector('#resetView').addEventListener('click', resetView);
boardViewport.addEventListener('wheel', event => { event.preventDefault(); setZoom(view.scale + (event.deltaY < 0 ? .08 : -.08), event.offsetX, event.offsetY); }, { passive: false });
boardViewport.addEventListener('pointerdown', event => { if (event.target.closest('.evidence-card')) return; event.preventDefault(); view.dragging = true; view.moved = false; view.startX = event.clientX; view.startY = event.clientY; view.originX = view.x; view.originY = view.y; boardViewport.classList.add('is-dragging'); boardViewport.setPointerCapture(event.pointerId); });
boardViewport.addEventListener('pointermove', event => { if (!view.dragging) return; event.preventDefault(); const dx = event.clientX - view.startX; const dy = event.clientY - view.startY; view.moved = Math.abs(dx) + Math.abs(dy) > 5; view.x = view.originX + dx; view.y = view.originY + dy; updateView(); });
boardViewport.addEventListener('pointerup', event => { view.dragging = false; boardViewport.classList.remove('is-dragging'); boardViewport.releasePointerCapture(event.pointerId); setTimeout(() => { view.moved = false; }, 0); });
boardViewport.addEventListener('pointercancel', event => { view.dragging = false; boardViewport.classList.remove('is-dragging'); boardViewport.releasePointerCapture(event.pointerId); });
boardViewport.addEventListener('dragstart', event => event.preventDefault());
boardViewport.addEventListener('keydown', event => { if (event.key.toLowerCase() === 'r') resetView(); if (event.key === '+' || event.key === '=') setZoom(view.scale + .1); if (event.key === '-') setZoom(view.scale - .1); });
readerPanel.querySelectorAll('[data-reader-close]').forEach(element => element.addEventListener('click', closeReader));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && readerPanel.classList.contains('is-open')) closeReader(); });
setTimeout(() => boardHelp.classList.add('is-hidden'), 5000);
render();
