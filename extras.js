/* Настройки, облачное сохранение (Telegram CloudStorage), отчёт об ошибках, обучение.
   Подключается ПОСЛЕ основного скрипта и heroes.js. */
(function () {
'use strict';
const TGW = window.Telegram && Telegram.WebApp, CS = TGW && TGW.CloudStorage;
const cloudOK = !!(CS && CS.setItem && CS.getItem && (!TGW.isVersionAtLeast || TGW.isVersionAtLeast('6.9')));
const DEF = { snd: 1, hap: 1, theme: 'auto', tut: 0 };
G.set = G.set || {}; for (const k in DEF) if (G.set[k] === undefined) G.set[k] = DEF[k];
if (G.z && G.z.gm > 0 && !G.set.tut) G.set.tut = 1;           // кто уже играл — обучение не навязываем
const E = () => window.__E || (window.__E = []);
let cst = cloudOK ? 'ещё не синхронизировалось' : 'недоступно', cfm = '', chk = '', out = '', ready = !cloudOK, upT = 0, upBusy = 0, upAgain = 0;
const bestV = () => { try { return typeof best !== 'undefined' ? best : 0; } catch (e) { return 0; } };

/* ===== ТЕМА ===== */
function theme() { const r = document.documentElement; if (G.set.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', G.set.theme); }
theme();

/* ===== ОБЛАКО TELEGRAM ===== */
const cget = k => new Promise(r => CS.getItem(k, (e, v) => r(e ? null : v)));
const cset = (k, v) => new Promise(r => CS.setItem(k, v, (e, ok) => r(!e && !!ok)));
const crm = k => new Promise(r => CS.removeItem(k, () => r()));
async function up() {
  if (!cloudOK) return false;
  if (upBusy) { upAgain = 1; return false; }
  upBusy = 1;
  try {
    let old = 0; try { const m0 = JSON.parse(await cget('svm') || 'null'); old = m0 ? m0.n : 0; } catch (e) { }
    const j = JSON.stringify({ g: G, b: bestV() }), ch = [];
    for (let i = 0; i < j.length; i += 3800) ch.push(j.slice(i, i + 3800));
    for (let i = 0; i < ch.length; i++) if (!await cset('sv' + i, ch[i])) { cst = 'ошибка записи'; return false; }
    if (!await cset('svm', JSON.stringify({ n: ch.length, t: G.ts || 0, c: G.c }))) { cst = 'ошибка записи'; return false; }
    for (let i = ch.length; i < old; i++) await crm('sv' + i);
    cst = 'сохранено ' + new Date().toLocaleTimeString(); return true;
  } catch (e) { cst = 'ошибка: ' + e.message; return false; }
  finally { upBusy = 0; if (upAgain) { upAgain = 0; q(); } if (tab === 'set') rend(); }
}
async function down() {
  const m = JSON.parse(await cget('svm') || 'null'); if (!m) return null;
  let s = ''; for (let i = 0; i < m.n; i++) { const c = await cget('sv' + i); if (c == null) return null; s += c; }
  const o = JSON.parse(s); return o && o.g && Array.isArray(o.g.i) ? { o, m } : null;
}
function applySave(o) {
  try { if (sessionStorage.getItem('pig_ld')) return false; sessionStorage.setItem('pig_ld', '1'); } catch (e) { }
  try { localStorage.setItem('pig_save', JSON.stringify(o.g)); if (o.b) localStorage.setItem('pig_best', o.b); } catch (e) { return false; }
  location.reload(); return true;
}
async function load() { try { const d = await down(); if (!d) { cst = 'в облаке пусто или повреждено'; return false; } return applySave(d.o); } catch (e) { cst = 'ошибка: ' + e.message; return false; } }
function q() { if (!cloudOK || !ready) return; clearTimeout(upT); upT = setTimeout(up, 4000); }
function ask(m) {
  const el = document.getElementById('cld');
  el.innerHTML = '<div class=ovc><h2>Найдено облачное сохранение</h2><p>В облаке прогресс новее: монет ' + m.c + '. Загрузить его? Текущий прогресс на этом телефоне будет заменён.</p><div class=hrow><button class=hbt data-cl=cl_yes>Загрузить</button><button class=hbt style="background:#888" data-cl=cl_no>Оставить моё</button></div></div>';
  el.classList.add('on');
}
async function sync() {
  if (!cloudOK) return;
  let m = null; try { m = JSON.parse(await cget('svm') || 'null'); } catch (e) { }
  const lt = G.ts || 0;
  if (!m) { ready = true; await up(); return; }
  if (m.t > lt + 1000) { if (G.z.gm === 0 && G.z.mg === 0) { if (!await load()) ready = true; return; } cst = 'ждём выбор'; ask(m); return; }
  ready = true; if (lt > m.t + 1000) await up(); else cst = 'синхронизировано';
}

/* ===== ОТЧЁТ ОБ ОШИБКАХ И САМОПРОВЕРКА ===== */
function report() {
  const g = G;
  return ['Свинопад ' + (typeof VER !== 'undefined' ? VER : '?'), 'UA: ' + navigator.userAgent, 'Экран: ' + innerWidth + 'x' + innerHeight,
    'Telegram: ' + (TGW ? TGW.platform + ' v' + TGW.version : 'нет'), 'Монеты: ' + g.c + ', партий: ' + (g.z && g.z.gm) + ', ts: ' + g.ts,
    'Рейтинг: ' + (typeof lbSt !== 'undefined' ? lbSt : '?'), 'Облако: ' + cst, 'Ошибки (' + E().length + '):'].concat(E().slice(-15)).join('\n');
}
const CHECKS = [
  ['Спрайты свинок', () => S.length >= 5 && S.every(i => i.width > 0)],
  ['Картинки паков', () => PS.every(a => a.every(i => i.width > 0))],
  ['Физика (Matter.js)', () => typeof Matter !== 'undefined'],
  ['Сохранение на телефоне', () => { localStorage.setItem('pig_t', '1'); return localStorage.getItem('pig_t') === '1'; }],
  ['Облако Telegram', () => cloudOK],
  ['Герои', () => !!window.HX],
  ['Рейтинг (база)', async () => (await fetch(SB_URL + '/rest/v1/scores?select=id&limit=1', { headers: SBH })).ok]
];
async function selfcheck() { const o = []; for (const [n, f] of CHECKS) { let r; try { r = await f(); } catch (e) { r = false; } o.push((r ? '✓ ' : '✗ ') + n); } return o.join('\n'); }
async function copy(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }
const exp = () => btoa(unescape(encodeURIComponent(JSON.stringify({ g: G, b: bestV() }))));
function imp(code) {
  try { const o = JSON.parse(decodeURIComponent(escape(atob(String(code).trim())))); if (!o || !o.g || !Array.isArray(o.g.i)) return false; return applySave(o); } catch (e) { return false; }
}

/* ===== ОБУЧЕНИЕ ===== */
const STEPS = [
  ['Двигай и отпускай', 'Води пальцем влево-вправо и отпусти. Свинка упадёт.', c => { pig(c, 1, 150, 36, 22, 0); c.setLineDash([4, 5]); c.strokeStyle = '#c0457a'; c.beginPath(); c.moveTo(150, 62); c.lineTo(150, 100); c.stroke(); c.setLineDash([]); c.fillStyle = '#c0457a'; c.fillRect(30, 104, 240, 4); }],
  ['Две одинаковые сливаются', 'Столкни двух одинаковых свинок, и получится новая, смешнее.', c => { pig(c, 0, 55, 66, 20, 0); pig(c, 0, 105, 66, 20, 0); c.fillStyle = '#c0457a'; c.font = '700 30px system-ui'; c.fillText('→', 140, 76); pig(c, 1, 225, 62, 28, 0); }],
  ['Следи за красной линией', 'Если свинки поднимутся выше неё и задержатся, партия закончится.', c => { c.setLineDash([8, 6]); c.strokeStyle = '#ff2d2d'; c.lineWidth = 3; c.beginPath(); c.moveTo(10, 34); c.lineTo(290, 34); c.stroke(); c.setLineDash([]); pig(c, 0, 90, 80, 22, 0); pig(c, 2, 160, 84, 26, 0); pig(c, 1, 225, 80, 24, 0); }],
  ['Монеты, кейсы и герои', 'За слияния дают монеты. Трать их на кейсы, героев и скины в разделе «Ещё».', c => { pig(c, 2, 70, 66, 26, 0); pig(c, 3, 150, 66, 26, 0); pig(c, 4, 230, 66, 26, 0); }]
];
let ts = 0;
function drawStep() {
  const el = document.getElementById('tut'), st = STEPS[ts], last = ts == STEPS.length - 1;
  el.innerHTML = '<div class=ovc><canvas id=tcv width=300 height=120></canvas><h2>' + st[0] + '</h2><p>' + st[1] + '</p><div class=dots>' + STEPS.map((_, i) => '<i class="' + (i == ts ? 'on' : '') + '"></i>').join('') + '</div><div class=hrow><button class=hbt data-cl=tnext>' + (last ? 'Поехали!' : 'Дальше') + '</button>' + (last ? '' : '<button class=hbt style="background:#888" data-cl=tskip>Пропустить</button>') + '</div></div>';
  try { const c = document.getElementById('tcv').getContext('2d'); c.clearRect(0, 0, 300, 120); st[2](c); } catch (e) { }
}
function showTut() { ts = 0; document.getElementById('tut').classList.add('on'); drawStep(); }
function endTut() { document.getElementById('tut').classList.remove('on'); G.set.tut = 1; sv(); }

/* ===== ЭКРАН НАСТРОЕК ===== */
const row = (t, v, a, x) => '<button class="cs hb" data-cl=' + a + ' ' + (x || '') + '><span>' + t + '</span><b>' + (v || '') + '</b></button>';
function tabHTML() {
  const s = G.set;
  let h = '<p class=hh>Игра</p>' + row('Звук', s.snd ? 'вкл' : 'выкл', 'tg', 'data-k=snd') + row('Вибрация', s.hap ? 'вкл' : 'выкл', 'tg', 'data-k=hap') +
    '<div class=mr style="margin-bottom:8px">' + [['auto', 'Авто'], ['light', 'Светлая'], ['dark', 'Тёмная']].map(([v, n]) => '<button data-cl=th data-v=' + v + ' style="min-height:44px;font-size:14px;' + (s.theme == v ? 'background:var(--ac);color:#fff' : '') + '">' + n + '</button>').join('') + '</div>' +
    row('Показать обучение', '', 'tut') +
    '<p class=hh>Облако и перенос</p><p><small>' + (cloudOK ? 'Облако Telegram: ' + cst : 'Облако работает только внутри Telegram') + '</small></p>' +
    (cloudOK ? row('Сохранить в облако сейчас', '', 'cup') + row(cfm == 'down' ? 'Точно? Заменит текущий прогресс' : 'Загрузить из облака', '', 'cdown') : '') +
    row('Скопировать код сохранения', '', 'exp') + '<textarea id=imp class=ta placeholder="Вставь сюда код сохранения"></textarea>' + row('Загрузить из кода', '', 'imp') +
    '<p class=hh>Если что-то сломалось</p><p><small>Ошибок в журнале: ' + E().length + '</small></p>' + row('Проверить игру', '', 'chk') + (chk ? '<pre class=ta>' + chk + '</pre>' : '') +
    row('Скопировать отчёт об ошибке', '', 'rep') + (out ? '<textarea class=ta readonly onfocus="this.select()">' + esc(out) + '</textarea>' : '') +
    '<p class=hh>Опасная зона</p>' + row(cfm == 'rst' ? 'Точно удалить ВСЁ? Нажми ещё раз' : 'Сбросить прогресс', '', 'rst');
  return h;
}
async function act(a, d) {
  const was = cfm; cfm = ''; out = '';
  if (a == 'tg') { G.set[d.k] = G.set[d.k] ? 0 : 1; sv(); }
  else if (a == 'th') { G.set.theme = d.v; theme(); sv(); }
  else if (a == 'tut') { showTut(); }
  else if (a == 'cup') { cst = 'сохраняю…'; rend(); ready = true; await up(); mg = cst; }
  else if (a == 'cdown') { if (was == 'down') { await load(); } else cfm = 'down'; }
  else if (a == 'exp') { const c = exp(); if (await copy(c)) mg = 'Код скопирован'; else out = c; }
  else if (a == 'imp') { const v = document.getElementById('imp').value; if (!imp(v)) mg = 'Не получилось: проверь код'; }
  else if (a == 'chk') { chk = 'проверяю…'; rend(); chk = await selfcheck(); }
  else if (a == 'rep') { const r = report(); if (await copy(r)) mg = 'Отчёт скопирован. Вставь его в чат'; else out = r; }
  else if (a == 'rst') {
    if (was == 'rst') { try { ['pig_save', 'pig_best', 'pig_err'].forEach(k => localStorage.removeItem(k)); sessionStorage.setItem('pig_ld', '1'); } catch (e) { } if (cloudOK) { for (let i = 0; i < 8; i++) await crm('sv' + i); await crm('svm'); } location.reload(); return; }
    cfm = 'rst';
  }
  else if (a == 'cl_yes') { document.getElementById('cld').classList.remove('on'); await load(); }
  else if (a == 'cl_no') { document.getElementById('cld').classList.remove('on'); ready = true; await up(); }
  else if (a == 'tnext') { if (ts >= STEPS.length - 1) endTut(); else { ts++; drawStep(); } }
  else if (a == 'tskip') { endTut(); }
  if (tab === 'set') rend();
}

/* ===== ПУБЛИЧНЫЙ ИНТЕРФЕЙС И ПОДКЛЮЧЕНИЕ ===== */
window.CL = {
  s: k => !!G.set[k], q, act, tab: tabHTML,
  _t: { up, down, sync, load, report, selfcheck, exp, imp, applySave, getReady: () => ready, setReady: v => { ready = v; }, cst: () => cst }
};
(function init() {
  IK.gear = '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>';
  TT.set = 'Настройки'; TC.set = '#64748b'; HB[2][1].push(['set', 'gear']);
  ['tut', 'cld'].forEach(id => { const d = document.createElement('div'); d.id = id; d.className = 'ovl'; document.body.appendChild(d); d.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.cl) act(b.dataset.cl, b.dataset); }); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ready && cloudOK) up(); });
  if (cloudOK) sync();
  if (!G.set.tut) { let n = 0; (function w() { if (S.length || ++n > 20) showTut(); else setTimeout(w, 300); })(); }
})();
})();
