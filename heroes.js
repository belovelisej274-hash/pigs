/* Хрюны-герои и экипировка. Подключается ПОСЛЕ основного скрипта игры. */
(function () {
'use strict';
/* ===== ДАННЫЕ ===== */
const RC = ['#9aa0a6', '#4da3ff', '#a855f7', '#ffb020'];
const RN = ['обычный', 'редкий', 'эпический', 'легендарный'];
const NEED = [2, 3, 5, 8], MAXL = 5, CAP = 4 * 36e5, FR = [20, 40, 80, 160];
const SLN = { hat: 'Шапка', gl: 'Очки', bt: 'Обувь' }, SETS = ['Хрюн-Рок', 'Хрюн-Космос'];
const p = x => Math.round(x * 100) + '%';
const sc = (l, k) => 1 + (k || .2) * (l - 1);          // герои +20%/ур., вещи +25%/ур.
const iv = (b, l) => Math.max(4, Math.round(b / sc(l)));
const HEROES = [
  { id: 'bank', n: 'Хрюн-Банкир', r: 0, t: l => '+' + p(.1 * sc(l)) + ' монет за партию' },
  { id: 'nav', n: 'Хрюн-Штурман', r: 0, t: l => l > 2 ? 'Пунктир показывает траекторию до касания' : 'Пунктир показывает, куда упадёт свинка' },
  { id: 'str', n: 'Хрюн-Силач', r: 1, t: l => 'Каждые ' + iv(15, l) + ' слияний — бесплатная встряска' },
  { id: 'eng', n: 'Хрюн-Инженер', r: 1, t: l => 'Каждые ' + iv(12, l) + ' слияний +1 бомба (до 3 за партию)' },
  { id: 'cook', n: 'Хрюн-Повар', r: 2, t: l => p(.15 * sc(l)) + ' шанс, что свинка будет уровнем выше' },
  { id: 'chr', n: 'Хрюн-Хронос', r: 2, t: l => 'Красная линия терпит ' + (2 + sc(l)).toFixed(1) + ' сек вместо 2' },
  { id: 'fort', n: 'Хрюн-Фортуна', r: 3, t: l => 'Кейсы дешевле на ' + p(.1 * sc(l)) },
  { id: 'king', n: 'Хрюн-Король', r: 3, t: l => '+' + p(.15 * sc(l)) + ' очков и +' + p(.1 * sc(l)) + ' монет' }
];
const ITEMS = [
  { id: 'hat0', s: 'hat', n: 'Кепка-пропеллер', r: 0, set: -1, st: 'c', v: .03 },
  { id: 'hat1', s: 'hat', n: 'Ирокез', r: 1, set: 0, st: 's', v: .05 },
  { id: 'hat2', s: 'hat', n: 'Шлем-аквариум', r: 2, set: 1, st: 'c', v: .08 },
  { id: 'gl0', s: 'gl', n: 'Очки-лупы', r: 0, set: -1, st: 's', v: .03 },
  { id: 'gl1', s: 'gl', n: 'Звёздные очки', r: 2, set: 0, st: 'c', v: .08 },
  { id: 'gl2', s: 'gl', n: 'Космо-визор', r: 3, set: 1, st: 's', v: .12 },
  { id: 'bt0', s: 'bt', n: 'Тапки-хрючки', r: 0, set: -1, st: 'l', v: .3 },
  { id: 'bt1', s: 'bt', n: 'Гриндерсы', r: 1, set: 0, st: 'b', v: .015 },
  { id: 'bt2', s: 'bt', n: 'Ракетные ботинки', r: 2, set: 1, st: 'l', v: .6 }
];
const HM = {}, IM = {};
HEROES.forEach(x => HM[x.id] = x); ITEMS.forEach(x => IM[x.id] = x);
const CASES = {
  h: { n: 'Кейс героя', cost: 500, w: [60, 28, 9, 3], pe: 15, pl: 50, items: HEROES, ci: 3, col: ['#a855f7', '#3b1480', 'rgba(190,120,255,.8)'] },
  g: { n: 'Кейс экипировки', cost: 300, w: [55, 30, 12, 3], pe: 12, pl: 50, items: ITEMS, ci: 2, col: ['#3aa0ff', '#0b2f6b', 'rgba(120,200,255,.8)'] }
};
const itxt = it => ({ c: '+' + p(it.v) + ' монет', s: '+' + p(it.v) + ' очков', l: '+' + it.v + ' сек линии', b: (it.v * 100).toFixed(1) + '% шанс бомбы за слияние' }[it.st]);

/* ===== СОСТОЯНИЕ ===== */
function st() {
  let h = G.h; if (!h || typeof h != 'object') h = G.h = {};
  h.o = h.o || {}; h.e = h.e || {}; h.p = h.p || {};
  h.p.h = h.p.h || { c: 0, l: 0 }; h.p.g = h.p.g || { c: 0, l: 0 };
  h.f = h.f || { ids: [], t: Date.now() }; h.nw = h.nw || {};
  if (!h.init) { h.init = 1; h.o.bank = { l: 1, d: 0 }; h.o.nav = { l: 1, d: 0 }; if (!h.e.hero) h.e.hero = 'bank'; }
  return h;
}
let BN = null, ST = { mg: 0, bombs: 0 }, cf = 0, pcb = null;
const ICC = {};

/* ===== БОНУСЫ (лимиты: экипировка ≤ +35% монет, ≤ +25% очков) ===== */
function bn() {
  const h = st(), o = h.o, B = { coin: 0, score: 0, line: 0, bc: 0, disc: 0, up: 0, si: 0, ei: 0, guide: 0, sb: 0 };
  const H = HM[h.e.hero];
  if (H && o[H.id]) {
    const l = o[H.id].l, s = sc(l);
    if (H.id == 'bank') B.coin += .1 * s; else if (H.id == 'nav') B.guide = 1;
    else if (H.id == 'str') B.si = iv(15, l); else if (H.id == 'eng') B.ei = iv(12, l);
    else if (H.id == 'cook') B.up = .15 * s; else if (H.id == 'chr') B.line += 1000 * s;
    else if (H.id == 'fort') B.disc = .1 * s; else if (H.id == 'king') { B.score += .15 * s; B.coin += .1 * s; }
  }
  let gc = 0, gs = 0; const eq = [];
  for (const sl of ['hat', 'gl', 'bt']) {
    const it = IM[h.e[sl]];
    if (it && o[it.id]) {
      const v = it.v * sc(o[it.id].l, .25); eq.push(it);
      if (it.st == 'c') gc += v; else if (it.st == 's') gs += v; else if (it.st == 'l') B.line += v * 1000; else B.bc += v;
    }
  }
  if (eq.length == 3 && eq[0].set >= 0 && eq.every(x => x.set == eq[0].set)) { gc += .1; B.sb = 1; }
  B.coin += Math.min(.35, gc); B.score += Math.min(.25, gs);
  return B;
}
BN = bn();

/* ===== ВЫДАЧА, ДУБЛИКАТЫ, ГАРАНТИЯ ===== */
function give(id, isH) {
  const h = st(), it = isH ? HM[id] : IM[id], o = h.o[id];
  if (!o) { h.o[id] = { l: 1, d: 0 }; h.nw[id] = 1; return 'НОВЫЙ ' + (isH ? 'ГЕРОЙ' : 'ПРЕДМЕТ') + ': ' + it.n + ' (' + RN[it.r] + ')!'; }
  if (o.l >= MAXL) { const c = [30, 60, 120, 250][it.r]; G.c += c; return it.n + ': макс. уровень, копия → +' + c + ' монет'; }
  o.d++; let up = 0;
  while (o.l < MAXL && o.d >= NEED[o.l - 1]) { o.d -= NEED[o.l - 1]; o.l++; up++; }
  BN = bn();
  if (up) return 'УРОВЕНЬ ' + o.l + '! ' + it.n;
  return it.n + ': +1 копия, до уровня ' + (o.l + 1) + ' осталось ' + (NEED[o.l - 1] - o.d);
}
function roll(k) {
  const h = st(), C = CASES[k], q = h.p[k];
  q.c++; q.l++; let r = 0;
  if (q.l >= C.pl) r = 3;
  else if (q.c >= C.pe) r = Math.random() * (C.w[2] + C.w[3]) < C.w[2] ? 2 : 3;
  else { let x = Math.random() * 100; for (let i = 0; i < 4; i++) { r = i; if ((x -= C.w[i]) < 0) break; } }
  if (r >= 2) q.c = 0; if (r == 3) q.l = 0;
  return r;
}
function html(x, isH) {
  return '<div class=sl style="filter:drop-shadow(0 0 8px ' + RC[x.r] + ')"><img src="' + icon(isH ? 'h' : 'i', x.id) + '"><small style="color:' + RC[x.r] + '">' + x.n + '</small></div>';
}
function pool(k) {
  const C = CASES[k], cnt = [0, 0, 0, 0], isH = k == 'h';
  C.items.forEach(x => cnt[x.r]++);
  const pl = C.items.map(x => ({ w: C.w[x.r] / cnt[x.r], r: x.r, id: x.id, h: html(x, isH), pr: () => give(x.id, isH) }));
  pl.pk = () => { const r = roll(k); let c = pl.filter(x => x.r == r); if (!c.length) c = pl; return c[Math.random() * c.length | 0]; };
  return pl;
}
const px = c => Math.max(1, Math.round(c * (1 - bn().disc)));

/* ===== РИСОВАНИЕ (код, на основе pig() и стиля ACC) ===== */
const BK = { king: c => ACC[1](c, 0) };
const COS = {
  bank: c => { poly(c, [[-.42, -1.05], [-.38, -1.75], [.38, -1.75], [.42, -1.05]], '#1b1b22', '#000'); ell(c, 0, -1.05, .62, .13, 0, '#1b1b22', '#000'); poly(c, [[-.41, -1.15], [.41, -1.15], [.4, -1.3], [-.4, -1.3]], '#ffd23f'); ell(c, .9, .8, .22, .22, 0, '#ffd23f', '#b8860b'); poly(c, [[-.25, .9], [0, .78], [.25, .9], [.25, 1.08], [0, .96], [-.25, 1.08]], '#2e9b3a', '#1d5e27'); },
  nav: c => { ell(c, 0, -1, .62, .24, 0, '#fff', '#99a'); ell(c, 0, -1.12, .5, .14, 0, '#2b6cdf'); poly(c, [[-.5, -.95], [-.1, -.95], [-.3, -.8]], '#1d3f8f'); ln(c, .95, .1, [1.5, -.4], '#b07a3a', .14); ell(c, 1.55, -.45, .12, .12, 0, '#9fd8ff', '#456'); },
  str: c => { poly(c, [[-.75, -.9], [.75, -.8], [.75, -.65], [-.75, -.75]], '#e8112d', '#7a0b13'); ln(c, -.6, 1.02, [.6, 1.02], '#777', .1); ell(c, -.7, 1.02, .14, .22, 0, '#444'); ell(c, .7, 1.02, .14, .22, 0, '#444'); },
  eng: c => { c.beginPath(); c.arc(0, -.9, .68, Math.PI, 0); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#b8860b'; c.lineWidth = .05; c.stroke(); ell(c, 0, -.9, .8, .1, 0, '#ffc107', '#b8860b'); ln(c, .95, .4, [.95, 1], '#999', .1); ell(c, .95, .35, .16, .12, 0, '#999'); },
  cook: c => { ell(c, -.3, -1.35, .28, .28, 0, '#fff', '#ccc'); ell(c, .3, -1.35, .28, .28, 0, '#fff', '#ccc'); ell(c, 0, -1.5, .32, .32, 0, '#fff', '#ccc'); poly(c, [[-.5, -1.05], [.5, -1.05], [.48, -1.3], [-.48, -1.3]], '#fff', '#ccc'); ln(c, .9, .9, [1.1, .3], '#b07a3a', .09); ell(c, .9, .95, .15, .1, .5, '#ddd'); },
  chr: c => { poly(c, [[-.55, -1], [.55, -1], [0, -2]], '#6d3fd1', '#3b1d8f'); ell(c, 0, -1, .62, .1, 0, '#8b5cf6'); ell(c, -.1, -1.5, .07, .07, 0, '#ffe066'); ell(c, .12, -1.25, .05, .05, 0, '#ffe066'); ell(c, 0, .85, .3, .3, 0, '#fff', '#444'); ln(c, 0, .85, [0, .65], '#222', .05); ln(c, 0, .85, [.15, .9], '#222', .05); },
  fort: c => { [[0, -1.2], [.2, -1.4], [0, -1.6], [-.2, -1.4]].forEach(q => ell(c, q[0], q[1], .15, .15, 0, '#2fd27c', '#1d7a4a')); c.beginPath(); c.arc(0, .8, .3, 3.5, 5.9); c.strokeStyle = '#ffd23f'; c.lineWidth = .12; c.stroke(); ell(c, .9, .9, .16, .16, 0, '#ffd23f', '#b8860b'); ell(c, -.95, .8, .14, .14, 0, '#ffd23f', '#b8860b'); },
  king: c => ACC[1](c, 1)
};
const GI = {
  hat0: c => { ell(c, 0, .25, .75, .4, 0, '#4da3ff', '#14407a'); ell(c, .55, .35, .5, .12, 0, '#2b6cdf'); ln(c, 0, -.15, [0, -.5], '#ccc', .07); ell(c, 0, -.55, .5, .08, 0, '#ffd23f', '#b8860b'); },
  hat1: c => { ell(c, 0, .5, .8, .2, 0, '#222', '#000'); for (let i = 0; i < 5; i++) poly(c, [[-.7 + i * .3, .45], [-.55 + i * .3, -.7], [-.4 + i * .3, .45]], '#e8112d', '#7a0b13'); },
  hat2: c => { c.beginPath(); c.arc(0, 0, .75, 0, 7); c.fillStyle = 'rgba(150,220,255,.35)'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .08; c.stroke(); ell(c, -.05, 0, .25, .14, 0, '#ff9f1c'); poly(c, [[.18, 0], [.4, -.12], [.4, .12]], '#ff9f1c'); },
  gl0: c => { for (const x of [-.4, .4]) { c.beginPath(); c.arc(x, 0, .3, 0, 7); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(); c.strokeStyle = '#333'; c.lineWidth = .08; c.stroke(); } ln(c, -.1, 0, [.1, 0], '#333', .07); },
  gl1: c => { for (const x of [-.42, .42]) poly(c, [[x, -.4], [x + .12, -.1], [x + .4, 0], [x + .12, .1], [x, .4], [x - .12, .1], [x - .4, 0], [x - .12, -.1]], '#ffd23f', '#b8860b'); },
  gl2: c => { c.save(); c.shadowColor = '#0ff'; c.shadowBlur = 14; ell(c, 0, 0, .8, .26, 0, 'rgba(0,245,255,.85)', '#fff'); c.restore(); },
  bt0: c => { ell(c, -.4, .2, .3, .45, 0, '#ff9ad0', '#a0206a'); ell(c, .4, .2, .3, .45, 0, '#ff9ad0', '#a0206a'); },
  bt1: c => { for (const s of [-1, 1]) { poly(c, [[s * .7, -.5], [s * .15, -.5], [s * .15, .3], [s * .85, .45], [s * .85, .1]], '#222', '#000'); poly(c, [[s * .15, -.1], [s * .02, 0], [s * .15, .1]], '#c9c9d6'); } },
  bt2: c => { for (const s of [-1, 1]) { poly(c, [[s * .7, -.6], [s * .15, -.6], [s * .15, .2], [s * .8, .2]], '#cfd8e3', '#556'); poly(c, [[s * .25, .25], [s * .45, .9], [s * .65, .25]], '#ff9f1c'); } }
};
function dh(c, id, x, y, r) {            // нарисовать героя: свечение редкости + pig() + костюм
  const H = HM[id], g = c.createRadialGradient(x, y, r * .4, x, y, r * 1.5);
  g.addColorStop(0, RC[H.r] + 'aa'); g.addColorStop(1, RC[H.r] + '00');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.5, 0, 7); c.fill();
  c.save(); c.translate(x, y); c.scale(r, r); if (BK[id]) BK[id](c); c.restore();
  pig(c, 1, x, y, r, 0);
  c.save(); c.translate(x, y); c.scale(r, r); COS[id](c); c.restore();
}
function icon(kind, id) {
  if (!S.length) return '';
  const key = kind + id + '|' + G.s; if (ICC[key]) return ICC[key];
  const k = document.createElement('canvas'); k.width = k.height = 96; const c = k.getContext('2d');
  if (kind == 'h') dh(c, id, 48, 54, 28);
  else { const it = IM[id], g = c.createRadialGradient(48, 48, 6, 48, 48, 46); g.addColorStop(0, RC[it.r] + '88'); g.addColorStop(1, RC[it.r] + '00'); c.fillStyle = g; c.fillRect(0, 0, 96, 96); c.save(); c.translate(48, 48); c.scale(30, 30); GI[id](c); c.restore(); }
  return ICC[kind + id + '|' + G.s] = k.toDataURL();
}

/* ===== ХУКИ В ПАРТИИ ===== */
function shake() { Composite.allBodies(eng.world).forEach(b => { if (b.tier != null) Body.setVelocity(b, { x: Math.random() * 8 - 4, y: -3 - Math.random() * 4 }); }); }
function bomb() { if (ST.bombs >= 3) return; ST.bombs++; G.b.bomb = (G.b.bomb || 0) + 1; sv(); }
function hud() {
  const el = document.getElementById('hxh'); if (!el) return;
  const h = st(), H = HM[h.e.hero];
  if (!H || !h.o[H.id] || !S.length) { el.style.display = 'none'; return; }
  el.style.display = 'block'; const c = el.getContext('2d'); c.clearRect(0, 0, 44, 44); dh(c, H.id, 22, 25, 11);
  const n = BN.si || BN.ei, fr = n ? (ST.mg % n) / n : 1;
  c.beginPath(); c.arc(22, 22, 20, -1.57, -1.57 + 6.283 * (fr || .001)); c.strokeStyle = RC[H.r]; c.lineWidth = 3; c.globalAlpha = n ? 1 : .5; c.stroke(); c.globalAlpha = 1;
}
function start() { ST = { mg: 0, bombs: 0 }; cf = 0; BN = bn(); if (BN.sb) { G.b.bomb = (G.b.bomb || 0) + 1; } sv(); hud(); }
function guideY(x, r) {
  if (!BN.guide) return H;
  let y = H - r;
  Composite.allBodies(eng.world).forEach(b => {
    if (b.tier == null) return; const need = r + R[b.tier], dx = Math.abs(x - b.position.x);
    if (dx < need) y = Math.min(y, b.position.y - Math.sqrt(need * need - dx * dx));
  });
  return Math.max(52, y);
}

/* ===== ФЕРМА ===== */
const frate = () => { const h = st(); return h.f.ids.reduce((a, id) => { const e = h.o[id], H = HM[id]; return a + (e && H ? FR[H.r] * sc(e.l) : 0); }, 0); };
function facc() { const f = st().f, now = Date.now(); if (now < f.t) f.t = now; return Math.floor(Math.min(now - f.t, CAP) / 36e5 * frate()); }
function claim() { const f = st().f, a = facc(); G.c += a; f.t = Date.now(); sv(); return a; }

/* ===== UI ===== */
const bar = (e, r) => !e ? '' : e.l >= MAXL ? '<div class=bar><i style="width:100%"></i></div><small>макс.</small>' : '<div class=bar><i style="width:' + Math.round(e.d / NEED[e.l - 1] * 100) + '%"></i></div><small>копий: ' + e.d + '/' + NEED[e.l - 1] + ' до ур. ' + (e.l + 1) + '</small>';
const btn = (t, a, x) => '<button class=hbt data-hx=' + a + ' ' + x + '>' + t + '</button>';
function heroCard(H) {
  const h = st(), e = h.o[H.id], l = e ? e.l : 0;
  return '<div class="hc r' + H.r + '" style="--rc:' + RC[H.r] + ';opacity:' + (e ? 1 : .5) + '">' + (h.nw[H.id] ? '<i class=nw>NEW</i>' : '') +
    '<img src="' + icon('h', H.id) + '"><b>' + H.n + '</b><br><small style="color:' + RC[H.r] + '">' + RN[H.r] + '</small>' + (e ? ' · ур. ' + l : '') +
    '<br><small>' + H.t(l || 1) + '</small>' + bar(e) +
    (e ? '<div class=hrow>' + btn(h.e.hero == H.id ? 'Выбран' : 'Выбрать', 'sel', 'data-id=' + H.id) + btn(h.f.ids.includes(H.id) ? 'С фермы' : 'На ферму', 'farm', 'data-id=' + H.id) + '</div>' : '<small>Выбей в «Кейсе героя»</small>') + '</div>';
}
function itemCard(it) {
  const h = st(), e = h.o[it.id], l = e ? e.l : 0, on = h.e[it.s] == it.id;
  return '<div class="hc r' + it.r + '" style="--rc:' + RC[it.r] + ';opacity:' + (e ? 1 : .5) + '">' + (h.nw[it.id] ? '<i class=nw>NEW</i>' : '') +
    '<img src="' + icon('i', it.id) + '"><b>' + it.n + '</b><br><small style="color:' + RC[it.r] + '">' + RN[it.r] + '</small>' + (e ? ' · ур. ' + l : '') +
    '<br><small>' + itxt({ st: it.st, v: +(it.v * sc(l || 1, .25)).toFixed(3) }) + (it.set >= 0 ? ' · ' + SETS[it.set] : '') + '</small>' + bar(e) +
    (e ? '<div class=hrow>' + btn(on ? 'Снять' : 'Надеть', 'eq', 'data-id=' + it.id) + '</div>' : '<small>Выбей в «Кейсе экипировки»</small>') + '</div>';
}
function heroTab() {
  const h = st(), H = HM[h.e.hero];
  let s = '<p>Герой в партии: <b>' + (H ? H.n : 'нет') + '</b>. Бонусы работают только в игре.</p>' + btn('Поделиться коллекцией', 'share', '') + '<p class=hh>Герои</p>' + HEROES.map(heroCard).join('') + '<p class=hh>Экипировка</p>';
  ['hat', 'gl', 'bt'].forEach(sl => { s += '<p class=hh>' + SLN[sl] + '</p>' + ITEMS.filter(i => i.s == sl).map(itemCard).join(''); });
  s += '<p class=hh>Наборы</p>' + SETS.map((n, i) => { const c = ITEMS.filter(x => x.set == i && h.e[x.s] == x.id).length; return '<div class="hc" style="--rc:' + (c == 3 ? '#ffb020' : '#999') + '"><b>' + n + '</b>: ' + c + '/3<br><small>Все три вещи: +10% монет и +1 бомба на старте</small></div>'; }).join('');
  return s;
}
function farmTab() {
  const h = st(), a = facc(), r = frate();
  return '<p>Герои на ферме копят монеты, пока тебя нет. Хранилище — до 4 часов.</p><div class="hc" style="--rc:#2fd27c;text-align:center"><b style="font-size:22px">' + ico('coin') + ' ' + a + '</b><br><small>доход: ' + Math.round(r) + ' в час · на ферме: ' + h.f.ids.length + '/3</small><div class=hrow>' + btn('Забрать', 'claim', '') + '</div></div><p class=hh>Герои</p>' +
    HEROES.filter(x => h.o[x.id]).map(x => '<div class="hc r' + x.r + '" style="--rc:' + RC[x.r] + '"><img src="' + icon('h', x.id) + '"><b>' + x.n + '</b><br><small>' + Math.round(FR[x.r] * sc(h.o[x.id].l)) + ' монет/час</small><div class=hrow>' + btn(h.f.ids.includes(x.id) ? 'С фермы' : 'На ферму', 'farm', 'data-id=' + x.id) + '</div></div>').join('');
}
function act(a, d) {
  const h = st();
  if (a == 'sel') { h.e.hero = h.e.hero == d.id ? '' : d.id; delete h.nw[d.id]; }
  else if (a == 'eq') { const it = IM[d.id]; h.e[it.s] = h.e[it.s] == it.id ? '' : it.id; delete h.nw[it.id]; }
  else if (a == 'farm') { claim(); const i = h.f.ids.indexOf(d.id); if (i >= 0) h.f.ids.splice(i, 1); else if (h.f.ids.length < 3) h.f.ids.push(d.id); else mg = 'На ферме максимум 3 героя'; }
  else if (a == 'claim') { const n = claim(); mg = n ? 'Собрано: +' + n + ' монет' : 'Пока пусто — хрюны ещё копят'; }
  else if (a == 'share') { share(); }
  BN = bn(); sv(); hud();
}
function pickUI() {
  const h = st();
  const ch = (id, n, r, on, a, ic) => '<button class="hch' + (on ? ' on' : '') + '" style="--rc:' + RC[r] + '" data-hx=' + a + ' data-id=' + id + '><img src="' + ic + '" width=40 height=40><span>' + n + '</span></button>';
  let s = '<h2 style="margin:0 0 6px">К бою, хрюны!</h2><b>Герой</b><div class=chs>' + HEROES.filter(x => h.o[x.id]).map(x => ch(x.id, x.n.replace('Хрюн-', ''), x.r, h.e.hero == x.id, 'sel', icon('h', x.id))).join('') + '</div>';
  ['hat', 'gl', 'bt'].forEach(sl => { const own = ITEMS.filter(i => i.s == sl && h.o[i.id]); s += '<b>' + SLN[sl] + '</b><div class=chs>' + (own.length ? own.map(i => ch(i.id, i.n, i.r, h.e[sl] == i.id, 'eq', icon('i', i.id))).join('') : '<small>Пока нет — загляни в «Кейс экипировки»</small>') + '</div>'; });
  const B = bn(), t = [];
  if (B.coin) t.push('+' + p(B.coin) + ' монет'); if (B.score) t.push('+' + p(B.score) + ' очков'); if (B.line) t.push('+' + (B.line / 1000).toFixed(1) + ' сек линии'); if (B.sb) t.push('набор: +1 бомба');
  return s + '<p><small>Бонусы: ' + (t.join(', ') || 'нет — партия как обычно') + '</small></p><button class="cs hb" data-hx=play style="justify-content:center;font-size:20px;background:var(--ac);color:#fff">Играть</button>';
}
function pre(cb) {
  const el = document.getElementById('hxp'); pcb = cb;
  el.innerHTML = '<div class=hxb>' + pickUI() + '</div>'; el.classList.add('on');
}
function share() {
  const h = st(), own = HEROES.filter(x => h.o[x.id]), cv = document.createElement('canvas'); cv.width = 720; cv.height = 1100; const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, '#ff7aa2'); g.addColorStop(1, '#5b2a86'); c.fillStyle = g; c.fillRect(0, 0, 720, 1100);
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '700 56px system-ui'; c.fillText('Мои хрюны-герои', 360, 100);
  c.font = '28px system-ui'; c.fillText('Героев: ' + own.length + '/' + HEROES.length + ' · Вещей: ' + ITEMS.filter(i => h.o[i.id]).length + '/' + ITEMS.length, 360, 150);
  own.forEach((H, i) => { const x = 120 + (i % 3) * 240, y = 330 + (i / 3 | 0) * 280; dh(c, H.id, x + 0, y, 70); c.fillStyle = RC[H.r]; c.font = '700 24px system-ui'; c.fillText(H.n.replace('Хрюн-', ''), x, y + 105); c.fillStyle = '#fff'; c.font = '22px system-ui'; c.fillText('ур. ' + h.o[H.id].l, x, y + 135); });
  c.fillStyle = 'rgba(255,255,255,.8)'; c.font = '26px system-ui'; c.fillText('Свинопад', 360, 1050);
  cv.toBlob(async b => {
    try { const f = new File([b], 'hryuny.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: 'Мои хрюны в Свинопаде!' }); return; } } catch (e) { }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'hryuny.png'; a.click(); } catch (e) { }
  });
}
function hap(t) { if (window.CL && !CL.s('hap')) return; try { TG.HapticFeedback.notificationOccurred(t || 'success'); } catch (e) { } }
function tk() { if (window.CL && !CL.s('hap')) return; try { TG.HapticFeedback.impactOccurred('light'); } catch (e) { } }

/* ===== ПУБЛИЧНЫЙ ИНТЕРФЕЙС ===== */
window.HX = {
  merge(t) { ST.mg++; const B = BN;
    if (B.si && ST.mg % B.si == 0) { shake(); burst(180, 300, 6, 'ВСТРЯСКА!'); }
    if (B.ei && ST.mg % B.ei == 0) { bomb(); burst(180, 260, 6, '+БОМБА!'); }
    else if (B.bc && Math.random() < B.bc) { bomb(); }
    hud(); },
  up(t) { return BN.up && t < 4 && Math.random() < BN.up ? t + 1 : t; },
  line() { return BN.line; }, sm() { return 1 + BN.score; }, gy: guideY, price: px, disc() { return bn().disc; },
  coin(n) { const v = n * (1 + BN.coin) + cf, r = Math.floor(v); cf = v - r; return r; },
  cdef(k) { const K = k[0], C = CASES[K]; return { n: C.n, cost: C.cost, a: 'hc', i: K, img: cimg(0, K == 'h' ? 3 : 4), list: [] }; },
  page(k) {
    const K = k[0], C = CASES[K], q = st().p[K], pr = px(C.cost), isH = K == 'h';
    const b = (t, n, x) => '<button class="cs hb" style="justify-content:center;gap:10px" data-hc=' + K + ' ' + x + '>' + t + '<b>' + ico('coin') + ' ' + pr * n + '</b></button>';
    return '<div class=cp><img src="' + cimg(0, isH ? 3 : 4) + '"><p style="font-size:20px;margin:0 0 6px"><b>' + C.n + '</b></p><p style="margin:0 0 10px">до эпика: <b>' + Math.max(0, C.pe - q.c) + '</b> · до легенды: <b>' + Math.max(0, C.pl - q.l) + '</b></p></div>' +
      b('Открыть', 1, 'data-n=1') + b('Быстро (без анимации)', 1, 'data-n=1 data-fast=1') + b('×5', 5, 'data-n=5') + b('×10', 10, 'data-n=10') +
      '<p>Шансы:</p><div class=g3>' + RN.map((n, i) => '<div style="border:2px solid ' + RC[i] + '"><b style="color:' + RC[i] + '">' + n + '</b><br>' + C.w[i] + '%</div>').join('') + '</div>' +
      '<p><small>Эпик или выше гарантирован на ' + C.pe + '-м открытии, легендарный — на ' + C.pl + '-м.</small></p><p>Что внутри:</p><div class=g3>' + C.items.map(x => '<div style="border:2px solid ' + RC[x.r] + '"><img src="' + icon(isH ? 'h' : 'i', x.id) + '"><br>' + x.n + '</div>').join('') + '</div>';
  },
  list() {
    return '<p class=hh>Герои и экипировка</p>' + ['h', 'g'].map(K => { const C = CASES[K], q = st().p[K]; return '<button class="cs hb" data-cv=' + K + '0><img src="' + cimg(0, K == 'h' ? 3 : 4) + '" width=84><span style="flex:1"><b>' + C.n + '</b><br><small>до эпика: ' + Math.max(0, C.pe - q.c) + '</small></span><b>' + ico('coin') + ' ' + px(C.cost) + '</b></button>'; }).join('');
  },
  open(K, n, fast) {
    const C = CASES[K], pl = pool(K), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (n == 1 && !fast && !reduce) { if (G.c >= px(C.cost)) G.z.cs++; spin(pl, C.cost, 0, 1, 0); return; }
    const cost = px(C.cost) * n; if (G.c < cost) { mg = 'Не хватает монет'; return; }
    G.c -= cost; G.z.cs += n; const w = [], t = [];
    for (let i = 0; i < n; i++) { const x = pl.pk(); w.push(x); t.push(x.pr()); }
    const sp = t.join('<br>');
    if (fast || reduce) { mg = 'Открыто: ' + n + '<div class=sm>' + w.map(x => x.h).join('') + '</div>' + sp; sv(); return; }
    multi(w, sp, cimg(0, K == 'h' ? 3 : 4));
  },
  tab(t) { return t == 'hero' ? heroTab() : farmTab(); },
  act, start, pre, hud, hap, tk, share,
  _t: { give, roll, pool, bn, st, facc, claim, frate, HEROES, ITEMS, CASES, setBN() { BN = bn(); }, setCf(v) { cf = v; } }
};

/* ===== ПОДКЛЮЧЕНИЕ К ИГРЕ ===== */
(function init() {
  CART[3] = [CASES.h.col[0], CASES.h.col[1], CASES.h.col[2], 3]; CART[4] = [CASES.g.col[0], CASES.g.col[1], CASES.g.col[2], 2];
  IK.hero = '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>';
  IK.farm = '<path d="M12 21V11"/><path d="M12 11c0-4 3-6 7-6 0 4-2 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>';
  IK.play = '<path d="M8 5v14l11-7z"/>';
  IK.dots = '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>';
  TT.hero = 'Герои'; TT.farm = 'Ферма'; TC.hero = '#a855f7'; TC.farm = '#2fd27c';
  HB[0][1].push(['hero', 'hero'], ['farm', 'farm']);
  const hd = document.getElementById('hd'), cv = document.createElement('canvas'); cv.id = 'hxh'; cv.width = cv.height = 44; hd.appendChild(cv);
  const pp = document.createElement('div'); pp.id = 'hxp'; document.body.appendChild(pp);
  pp.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.hx == 'play') { pp.classList.remove('on'); start(); const f = pcb; pcb = null; if (f) f(); return; }
    if (d.hx) { act(d.hx, d); pp.innerHTML = '<div class=hxb>' + pickUI() + '</div>'; }
  });
  const og = document.getElementById('go').onclick;
  document.getElementById('go').onclick = () => { if (tour) { og(); return; } pre(() => og()); };
  const os = window.startSt; window.startSt = i => pre(() => os(i));
  const nav = document.createElement('nav'); nav.id = 'hxn';
  const items = [['play', 'Игра', ''], ['hero', 'Герои', 'hero'], ['box', 'Кейсы', 'cases'], ['farm', 'Ферма', 'farm'], ['dots', 'Ещё', 'hub']];
  nav.innerHTML = items.map((x, i) => '<button data-n=' + i + '>' + ico(x[0]) + '<span>' + x[1] + '</span></button>').join('');
  document.body.appendChild(nav);
  const pn = document.getElementById('pn'), isOn = () => pn.classList.contains('on');
  nav.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const t = items[+b.dataset.n][2];
    if (!t) { if (isOn()) document.getElementById('cl').click(); return; }
    if (!isOn()) { pst = performance.now(); pau = 1; pn.classList.add('on'); }
    tab = t; mg = ''; rend();
  });
  setInterval(() => { [...nav.children].forEach((b, i) => b.classList.toggle('on', isOn() ? items[i][2] == tab : i == 0)); }, 400);
  setTimeout(hud, 1500);
})();
})();
