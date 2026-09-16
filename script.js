const { board: BOARD, theme: THEME, evidence: EVIDENCE, links: LINKS, ui: UI } = window.BOARD_DATA;
const LANGUAGE_CONFIG = window.BOARD_DATA.language || {};
let language = 'ru';

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
const readerCover = document.querySelector('#readerCover');
const languageScreen = document.querySelector('#languageScreen');
const languageTitle = document.querySelector('#languageTitle');
const languagePrompt = document.querySelector('#languagePrompt');
const view = { x: 0, y: 0, scale: 1, dragging: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 };

function localized(value, fallback = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value ?? fallback;
  return value[language] ?? value.ru ?? value.en ?? fallback;
}
function localizedImage(image) {
  const selected = localized(image, image);
  if (typeof selected === 'string') return { src: selected };
  if (!selected || typeof selected !== 'object') return selected;
  const field = key => selected[key] ?? image.ru?.[key] ?? image.en?.[key] ?? '';
  return { ...selected, src: field('src'), alt: field('alt') };
}
function localizedItem(item) {
  const result = { ...item };
  ['text', 'caption', 'meta', 'alt', 'href', 'readerTitle', 'readerByline', 'readerBody', 'readerText', 'readerMeta'].forEach(key => { if (key in result) result[key] = localized(result[key]); });
  if (result.image) result.image = localizedImage(result.image);
  return result;
}
function localizedCover(cover) {
  if (typeof cover === 'string') return { image: cover };
  const selected = localized(cover, cover);
  if (!selected || typeof selected !== 'object') return selected;
  return { ...cover, ...selected, image: localizedImage(selected.image), alt: localized(selected.alt, localized(selected.alt, '')) };
}
function currentUI() { return UI[language] || UI.ru || UI.en || {}; }
function applyLanguageUI() {
  const labels = currentUI(); document.documentElement.lang = language;
  document.title = language === 'en' ? 'ARCHIVE // Lev Orlov' : 'АРХИВ // Лев Орлов'; document.querySelector('#boardShell').setAttribute('aria-label', labels.board || 'Interactive investigation board'); document.querySelector('#zoomOut').setAttribute('aria-label', labels.zoomOut || 'Zoom out'); document.querySelector('#zoomIn').setAttribute('aria-label', labels.zoomIn || 'Zoom in');
  languageTitle.textContent = labels.languageTitle || 'Choose a language'; languagePrompt.textContent = labels.languagePrompt || '';
  document.querySelector('.toolbar-label').textContent = labels.zoom || 'zoom'; document.querySelector('#toolbarHint').lastChild.textContent = ` ${labels.hint || ''}`;
  document.querySelector('#resetView').firstChild.textContent = `${labels.reset || 'reset view'} `;
  document.querySelector('#boardHelp').firstChild.textContent = labels.help || ''; document.querySelector('#boardHelp span').textContent = labels.helpCards || '';
  document.querySelector('#boardStamp').firstChild.textContent = `${labels.stamp || ''}`; document.querySelector('.reader-close').setAttribute('aria-label', labels.close || 'Close story'); readerPageLink.textContent = labels.pageLink || 'open separate page ↗';
}
function startBoard(selected) {
  language = selected === 'en' ? 'en' : 'ru';
  try { localStorage.setItem(LANGUAGE_CONFIG.storageKey || 'archive-language', language); } catch (error) { /* localStorage may be unavailable on file:// */ }
  applyLanguageUI(); languageScreen.classList.add('is-hidden'); document.body.classList.remove('language-pending'); render();
}
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => startBoard(button.dataset.language)));

function visualMarkup(item) {
  item = localizedItem(item);
  if (item.material === 'tape' || item.material === 'label') return `<div class="artifact-art tape-art texture-${item.texture || 'paper'}" style="--tape-color:${item.color || '#b18b4a'}"><span>${escapeText(item.text)}</span></div>`;
  if (item.material === 'marker') return `<div class="artifact-art marker-art"><strong>${item.text.replace(/\n/g, '<br>')}</strong></div>`;
  if (item.material === 'clipping') return `<div class="artifact-art clipping-art"><strong>${item.text.replace(/\n/g, '<br>')}</strong><i></i><i></i><i></i></div>`;
  if (item.material === 'manuscript') return `<div class="artifact-art manuscript-art"><span>${item.text.replace(/\n/g, '<br>')}</span><i></i><i></i><b>Л.О.</b></div>`;
  if (item.material === 'cover') { const labels = currentUI(); return `<div class="artifact-art cover-art"><small>${escapeText(labels.author)}</small><strong>${item.text.replace(/\n/g, '<br>')}</strong><em>${escapeText(labels.story)}</em></div>`; }
  const image = typeof item.image === 'object' ? item.image : { src: item.image };
  if (image.src) return `<img class="artifact-art source-image" src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || item.alt || item.caption)}" draggable="false">`;
  return '';
}

function escapeAttribute(value = '') { return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeText(value = '') { return escapeAttribute(value).replace(/\n/g, '<br>'); }

function cardMarkup(item) {
  item = localizedItem(item);
  const frame = frameConfig(item);
  const frameClass = item.image || item.material === 'polaroid' ? `frame-enabled frame-${frame.preset} ${safeClasses(frame.className)}` : '';
  return `<article class="evidence-card material-${item.material} ${frameClass} mode-${item.mode || 'framed'}" data-id="${escapeAttribute(item.id)}" tabindex="0" role="link" aria-label="${escapeAttribute(item.caption || 'Открыть улику')}">${item.pin ? '<span class="pin" aria-hidden="true"></span>' : ''}${visualMarkup(item)}<div class="artifact-caption"><b>${escapeText(item.caption)}</b><span>${escapeText(item.meta)}</span></div></article>`;
}
function cssSize(value, fallback) { if (value === undefined || value === null || value === '') return fallback; return typeof value === 'number' ? `${value}px` : String(value); }
const FRAME_PRESETS = new Set(['plain', 'polaroid', 'photo-frame', 'newspaper', 'file', 'torn']);
const FRAME_PROPERTIES = { background: 'background', border: 'border', borderRadius: 'borderRadius', padding: 'padding', boxShadow: 'boxShadow', clipPath: 'clipPath', mask: 'mask', opacity: 'opacity' };
const IMAGE_PROPERTIES = { fit: 'objectFit', objectPosition: 'objectPosition', opacity: 'opacity', filter: 'filter', transform: 'transform' };
function safeCssValue(value) { const text = String(value ?? ''); return text.length <= 180 && !/[;{}<>]/.test(text) ? text : ''; }
function safeClasses(value) { return String(value || '').split(/\s+/).filter(name => /^[a-z][a-z0-9_-]*$/i.test(name)).join(' '); }
function frameConfig(item) {
  const legacy = item.material === 'polaroid' ? 'polaroid' : item.mode === 'plain' ? 'plain' : item.mode === 'framed' || item.frame ? 'photo-frame' : 'plain';
  const frame = typeof item.frame === 'object' ? item.frame : { preset: item.frame || legacy };
  const legacyStyle = typeof item.frame === 'string' && !FRAME_PRESETS.has(item.frame) ? { background: item.frame } : {};
  return { preset: FRAME_PRESETS.has(frame.preset) ? frame.preset : legacy, className: frame.className || item.frameClass || '', style: { ...legacyStyle, ...(frame.style || {}), ...(item.frameStyle || {}) }, frame };
}
function applyStyle(element, properties, values) { Object.entries(properties).forEach(([source, target]) => { const value = safeCssValue(values[source]); if (value) element.style[target] = value; }); }
function applyCardStyles(card, item) {
  const frame = frameConfig(item); const image = typeof item.image === 'object' ? { ...item, ...item.image } : item;
  card.style.left = cssSize(item.x, '0px'); card.style.top = cssSize(item.y, '0px'); card.style.width = cssSize(item.width, '210px'); card.style.height = cssSize(item.height, 'auto'); card.style.zIndex = String(Number(item.zIndex) || 1); card.style.transform = `rotate(${Number(item.rotation) || 0}deg)`;
  card.style.setProperty('--ratio', safeCssValue(item.aspectRatio || item.ratio || 'auto') || 'auto');
  card.style.setProperty('--frame', safeCssValue(item.frameColor || (typeof item.frame === 'string' ? item.frame : '#f3eee1')) || '#f3eee1');
  card.style.setProperty('--padding', cssSize(item.framePadding ?? item.padding, '8px'));
  applyStyle(card, FRAME_PROPERTIES, { ...frame.style, ...(item.frameStyle || {}) });
  const source = card.querySelector('.source-image'); if (!source) return;
  source.style.aspectRatio = safeCssValue(image.aspectRatio || image.ratio || 'auto') || 'auto';
  applyStyle(source, IMAGE_PROPERTIES, image);
  source.style.width = '100%'; source.style.height = cssSize(image.height, 'auto');
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
function render() { boardSpace.style.width = `${BOARD.width}px`; boardSpace.style.height = `${BOARD.height}px`; document.documentElement.style.setProperty('--board-color', THEME.board.color); document.documentElement.style.setProperty('--board-texture', THEME.board.texture); document.documentElement.style.setProperty('--board-image', THEME.board.image ? `url('${THEME.board.image}')` : 'none'); document.documentElement.style.setProperty('--board-size', THEME.board.size); document.documentElement.style.setProperty('--reader-background', THEME.reader.background); document.documentElement.style.setProperty('--reader-opacity', THEME.reader.opacity); document.documentElement.style.setProperty('--reader-text-color', THEME.reader.textColor); document.documentElement.style.setProperty('--reader-accent', THEME.reader.accent); document.documentElement.style.setProperty('--reader-width', THEME.reader.width); cardsLayer.innerHTML = EVIDENCE.map(cardMarkup).join(''); EVIDENCE.forEach(item => applyCardStyles(cardsLayer.querySelector(`[data-id="${item.id}"]`), item)); drawConnections(); bindCards(); watchMaterialSizes(); cardsLayer.querySelectorAll('img').forEach(image => image.addEventListener('load', drawConnections)); window.addEventListener('resize', drawConnections); updateView(); }
function updateView() { boardSpace.style.transform = `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})`; zoomValue.textContent = `${Math.round(view.scale * 100)}%`; }
function setZoom(next, focalX = boardViewport.clientWidth / 2, focalY = boardViewport.clientHeight / 2) {
  const old = view.scale; view.scale = Math.min(BOARD.maxZoom, Math.max(BOARD.minZoom, next));
  view.x = focalX - (focalX - view.x) * view.scale / old; view.y = focalY - (focalY - view.y) * view.scale / old; updateView();
}
function resetView() { view.x = 0; view.y = 0; view.scale = 1; updateView(); }
function openReader(item) {
  item = localizedItem(item);
  const labels = currentUI();
  readerTitle.textContent = item.readerTitle || item.caption || 'Дело';
  readerByline.textContent = item.readerByline || item.readerMeta || item.meta || '';
  readerBody.textContent = item.readerBody || item.readerText || item.text || 'Текст рассказа пока не добавлен.';
  const cover = localizedCover(item.readerCover || item.cover);
  const coverImage = cover && localizedImage(cover.image);
  readerPanel.classList.toggle('has-reader-cover', Boolean(coverImage && coverImage.src));
  if (coverImage && coverImage.src) { readerCover.src = coverImage.src; readerCover.alt = coverImage.alt || cover.alt || item.readerTitle || item.caption || ''; readerCover.style.width = cssSize(cover.width, '100%'); readerCover.style.height = cssSize(cover.height, 'auto'); readerCover.style.objectFit = cover.fit || 'cover'; readerCover.style.objectPosition = cover.objectPosition || 'center'; }
  readerPageLink.href = item.href || '#'; readerPageLink.textContent = labels.pageLink || 'open separate page ↗';
  readerPanel.classList.add('is-open'); readerPanel.setAttribute('aria-hidden', 'false'); document.body.classList.add('reader-is-open');
  readerPanel.querySelector('.reader-close').focus();
}
function closeReader() { readerPanel.classList.remove('is-open'); readerPanel.setAttribute('aria-hidden', 'true'); document.body.classList.remove('reader-is-open'); }
function openCard(item) { item = localizedItem(item); if (!item.href || item.href === '#') return; if (item.reader === 'panel') openReader(item); else window.location.href = item.href; }
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
applyLanguageUI();
let savedLanguage = '';
try { savedLanguage = localStorage.getItem(LANGUAGE_CONFIG.storageKey || 'archive-language') || ''; } catch (error) { savedLanguage = ''; }
if (savedLanguage === 'ru' || savedLanguage === 'en') startBoard(savedLanguage);
