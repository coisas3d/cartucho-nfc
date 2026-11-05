/* Black Rock MC - The Game  |  v2
 * Corrida de motos pseudo-3D em pixel art HD (HTML5 Canvas). Roda em Android e iPhone pelo navegador.
 */
'use strict';
(function () {
const { PERSONAGENS, VIAGENS, CONQUISTAS, FALAS, SOBRE, DE } = window.DADOS;
const SOM = window.SOM, A = window.ARTE;

// ============================================================ CONSTANTES
const W = 640, H = 360, STEP = 1 / 60;
const SEG = 200, ROAD = 800, CAMH = 1000, DRAW = 210;
const CAMD = 1 / Math.tan(50 * Math.PI / 180), PZ = CAMH * CAMD, KMH = 60;
const PX2N = CAMH / (H * 0.8889) / ROAD / 2;          // pixel do sprite -> meia-largura normalizada
const MOTO_HW = 70 * PX2N;
const GUARD_X = -1.16, ACOST = 1.38;
const params = new URLSearchParams(location.search);
const SALA = params.get('sala'), DEV2P = params.get('dev2p') === '1';
window.FONTE_TESTE = params.get('fonteteste') === '1';
// RANKING ONLINE (Supabase, grátis): cole aqui a URL do projeto e a chave "anon public". Veja ranking_supabase.sql
const RANKING_ONLINE = { url: '', chave: '' };
const LINK_JOGO = location.origin + location.pathname;
let MODO = 'viagem';                       // viagem | cafe | relogio
let CLIMA = { tipo: 'sol' };               // sol | chuva | neblina (na serra)

// ============================================================ UTIL
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const css = c => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const guardar = {
  ler(k, d) { try { const v = localStorage.getItem('brmc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  gravar(k, v) { try { localStorage.setItem('brmc_' + k, JSON.stringify(v)); } catch (e) {} }
};
const plural = (n, p) => (n || 0) + ' ' + p + ((n || 0) === 1 ? '' : 'S');
function fmtTempo(t) { if (t == null || !isFinite(t)) return '--:--.-'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }
const txt = (s, x, y, cor, tam, al, sombra) => A.txt(ctx, s, x, y, cor, tam, al, sombra);

// ============================================================ TELA
const tela = document.getElementById('tela'), telaCtx = tela.getContext('2d');
const [buf, ctx] = A.mk(W, H);
const cenas = [A.mk(W, H), A.mk(W, H / 2), A.mk(W, H / 2)];
const hi = document.getElementById('hi'), hiCtx = hi.getContext('2d');
let hiUsado = false;
function hiLimpar() { if (hiUsado) { hiCtx.clearRect(0, 0, hi.width, hi.height); hiUsado = false; } }
// desenha imagem realista em resolução nativa do aparelho (por cima do jogo em pixel art)
function hiFoto(img, x, y, w, h, alpha, reflexo, clip) {
  if (!img || pausado) return;
  const s = hi.width / W; hiCtx.save(); hiCtx.globalAlpha = alpha * (1 - fade); hiCtx.imageSmoothingEnabled = true; hiCtx.imageSmoothingQuality = 'high';
  if (clip) { hiCtx.beginPath(); hiCtx.rect(clip.x * s, clip.y * s, clip.w * s, clip.h * s); hiCtx.clip(); }
  hiCtx.drawImage(img, x * s, y * s, w * s, h * s);
  if (reflexo) {
    hiCtx.beginPath(); hiCtx.rect(x * s - 20, (y + h) * s, w * s + 40, h * 0.35 * s); hiCtx.clip();
    hiCtx.globalAlpha = alpha * 0.16 * (1 - fade); hiCtx.translate(0, (y + h) * 2 * s); hiCtx.scale(1, -1); hiCtx.drawImage(img, x * s, y * s, w * s, h * s);
  }
  hiCtx.restore(); hiUsado = true;
}
function hiMangueira(x1, y1, x2, y2, clip) {
  if (pausado) return;
  const s = hi.width / W; hiCtx.save(); hiCtx.globalAlpha = 1 - fade;
  if (clip) { hiCtx.beginPath(); hiCtx.rect(clip.x * s, clip.y * s, clip.w * s, clip.h * s); hiCtx.clip(); }
  hiCtx.lineCap = 'round'; hiCtx.strokeStyle = '#111'; hiCtx.lineWidth = 6 * s * (clip ? clip.h / H : 1);
  hiCtx.beginPath(); hiCtx.moveTo(x1 * s, y1 * s); hiCtx.bezierCurveTo(x1 * s, (y1 + 90) * s, (x2 + 80) * s, (y2 + 60) * s, (x2 + 8) * s, y2 * s); hiCtx.stroke();
  hiCtx.strokeStyle = 'rgba(255,255,255,0.15)'; hiCtx.lineWidth = 2 * s; hiCtx.stroke();
  // bico da bomba
  hiCtx.translate(x2 * s, y2 * s); hiCtx.rotate(-0.5); hiCtx.fillStyle = '#2a2a2a'; hiCtx.fillRect(-4 * s, -6 * s, 26 * s, 12 * s);
  hiCtx.fillStyle = '#9aa0a8'; hiCtx.fillRect(-14 * s, -2 * s, 14 * s, 4 * s); hiCtx.fillStyle = '#ff6a00'; hiCtx.fillRect(10 * s, -6 * s, 10 * s, 4 * s);
  hiCtx.restore(); hiUsado = true;
}
let vertical = false;
function ajustarTela() {
  const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 3);
  vertical = vh > vw;
  const e = vertical ? vw / W : Math.min(vw / W, vh / H);
  const cw = Math.floor(W * e), ch = Math.floor(H * e);
  document.body.classList.toggle('vertical', vertical);
  const topo = vertical ? Math.max(0, Math.round((vh - ch) * 0.18)) + 'px' : '50%', tr = vertical ? 'translate(-50%, 0)' : 'translate(-50%, -50%)';
  for (const el of [tela, hi]) { el.style.top = topo; el.style.transform = tr; }
  tela.style.width = cw + 'px'; tela.style.height = ch + 'px'; tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr);
  hi.style.width = cw + 'px'; hi.style.height = ch + 'px'; hi.width = tela.width; hi.height = tela.height; hiUsado = true;
}
addEventListener('resize', ajustarTela); addEventListener('orientationchange', () => setTimeout(ajustarTela, 250));

// ============================================================ IMAGENS
const NOMES = ['piloto', 'piloto_leosao', 'piloto_gs1300', 'foto_versys', 'foto_gs850', 'foto_gs1300', 'retrato_jellison', 'retrato_leosao',
  'retrato_jefao', 'emblema_64', 'emblema_128', 'emblema_192', 'car_rear', 'car_front', 'truck_rear', 'truck_front', 'carreta_rear', 'moto_rear', 'moto_front', 'pine', 'rock', 'qr_jogo'];
const IMG = {};
function carregar(prog) {
  let n = 0;
  return Promise.all(NOMES.map(nome => new Promise(ok => {
    const i = new Image();
    i.onload = () => { IMG[nome] = i; prog(++n / NOMES.length); ok(); };
    i.onerror = () => { IMG[nome] = A.mk(8, 8)[0]; prog(++n / NOMES.length); ok(); };
    i.src = 'hd/' + nome + '.png';
  })));
}
function mexer(img, fn) { const [c, g] = A.mk(img.width, img.height); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height), p = d.data; for (let i = 0; i < p.length; i += 4) if (p[i + 3]) fn(p, i); g.putImageData(d, 0, 0); return c; }
function pintarChave(img, cor) {
  return mexer(img, (p, i) => {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (g < 10 && r === 255 && b === 255) { p[i] = cor[0]; p[i + 1] = cor[1]; p[i + 2] = cor[2]; }
    else if (g < 10 && r === 170 && b === 170) { p[i] = cor[0] * .62; p[i + 1] = cor[1] * .62; p[i + 2] = cor[2] * .62; }
    else if (r === 255 && g === 140 && b === 255) { p[i] = (cor[0] + 255) / 2; p[i + 1] = (cor[1] + 255) / 2; p[i + 2] = (cor[2] + 255) / 2; }
  });
}
function trocarVerde(img, cor) {
  return mexer(img, (p, i) => { const r = p[i], g = p[i + 1], b = p[i + 2]; if (g > r + 28 && g > b + 18) { const f = g / 196; for (let k = 0; k < 3; k++) p[i + k] = f <= 1 ? cor[k] * f : cor[k] + (255 - cor[k]) * Math.min(1, (f - 1) * 1.6); } });
}
const cache = {};
const memo = (k, fn) => cache[k] || (cache[k] = fn());
const spriteMoto = (def, ouro) => memo('m' + (def.sprite || 'piloto') + (def.cor || '') + (ouro ? 'ouro' : ''), () => { const b = def.cor ? trocarVerde(IMG[def.sprite || 'piloto'], def.cor) : IMG[def.sprite || 'piloto']; return ouro ? capaceteOuro(b) : b; });
// prêmio: pinta o capacete (alto do sprite) de dourado, preservando o sombreado
function capaceteOuro(img) {
  const [c, g] = A.mk(img.width, img.height); g.drawImage(img, 0, 0);
  const lim = Math.round(img.height * 0.125), x0 = Math.floor(img.width * 0.25), x1 = Math.ceil(img.width * 0.75);
  const d = g.getImageData(0, 0, img.width, lim + 1), p = d.data; let soma = 0, n = 0;
  const lum = i => (p[i] + p[i + 1] + p[i + 2]) / 3;
  for (let y = 0; y <= lim; y++) for (let x = x0; x < x1; x++) { const i = (y * img.width + x) * 4; if (p[i + 3] && lum(i) > 26) { soma += lum(i); n++; } }
  const med = n ? soma / n : 100, ouro = [226, 172, 38];
  for (let y = 0; y <= lim; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.width + x) * 4; if (!p[i + 3] || lum(i) <= 26) continue;
    const t = lum(i) / med; for (let k = 0; k < 3; k++) p[i + k] = t <= 1 ? ouro[k] * (0.55 + 0.45 * t) : ouro[k] + (255 - ouro[k]) * Math.min(1, (t - 1) * 1.5);
    if (y === 2 && x < (x0 + x1) / 2 - 4 && x > x0 + 6) { p[i] = 255; p[i + 1] = 246; p[i + 2] = 200; }
  }
  g.putImageData(d, 0, 0); return c;
}
const spriteVeic = (n, cor) => memo('v' + n + (cor || ''), () => cor ? pintarChave(IMG[n], cor) : IMG[n]);
function tingir(mask, cor) {
  const k = mask.__id + css(cor.map(v => Math.round(v / 6) * 6));
  return memo(k, () => { const [c, g] = A.mk(mask.width, mask.height); g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = css(cor); g.fillRect(0, 0, c.width, c.height); return c; });
}

// ============================================================ PALETA DA VIAGEM (manhã -> pôr do sol)
const CEU = [
  { p: 0.00, topo: [58, 123, 213], base: [170, 216, 255], nev: [186, 220, 246], sol: [0.80, 0.16, 16, [255, 250, 225]], mont: [112, 142, 178], morro: [72, 122, 82], g1: [92, 168, 60], g2: [80, 152, 52] },
  { p: 0.50, topo: [38, 108, 214], base: [150, 206, 255], nev: [176, 214, 246], sol: [0.62, 0.10, 16, [255, 255, 238]], mont: [104, 136, 174], morro: [66, 116, 76], g1: [98, 170, 58], g2: [84, 154, 48] },
  { p: 0.80, topo: [62, 92, 170], base: [255, 198, 126], nev: [255, 212, 164], sol: [0.48, 0.30, 22, [255, 214, 130]], mont: [126, 112, 156], morro: [82, 102, 70], g1: [108, 160, 58], g2: [92, 142, 48] },
  { p: 1.00, topo: [44, 40, 108], base: [255, 136, 72], nev: [255, 156, 108], sol: [0.52, 0.42, 30, [255, 150, 70]], mont: [94, 74, 122], morro: [64, 78, 56], g1: [82, 124, 52], g2: [70, 108, 44] }
];
let PAL = null;
function paleta(p) {
  let i = 0; while (i < CEU.length - 2 && p > CEU[i + 1].p) i++;
  const a = CEU[i], b = CEU[i + 1], t = clamp((p - a.p) / (b.p - a.p), 0, 1), o = {};
  for (const k of ['topo', 'base', 'nev', 'mont', 'morro', 'g1', 'g2']) o[k] = mixc(a[k], b[k], t);
  o.sol = [lerp(a.sol[0], b.sol[0], t), lerp(a.sol[1], b.sol[1], t), lerp(a.sol[2], b.sol[2], t), mixc(a.sol[3], b.sol[3], t)];
  o.tarde = clamp((p - 0.7) / 0.3, 0, 1);
  return o;
}

// ============================================================ PISTA
let VIAGEM = null, segs = [], START_I = 30, FIM_I = 0, FIM_Z = 0, DIST = 1, POSTOS = [], MARCOS = [], PEDAGIOS = [], RADARES = [];
const ART = {};
function easeIn(a, b, p) { return a + (b - a) * p * p; }
function easeInOut(a, b, p) { return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5); }
const ultimoY = () => segs.length ? segs[segs.length - 1].p2.y : 0;
function addSeg(curva, y, zona, tipo) { const n = segs.length; segs.push({ i: n, p1: { y: ultimoY(), z: n * SEG }, p2: { y, z: (n + 1) * SEG }, curva, zona, tipo, spr: [], esc: Math.floor(n / 3) % 2, faixa: Math.floor(n / 4) % 2, posto: false }); }
function addTrecho(e, s, l, curva, morro, zona, tipo) {
  const sy = ultimoY(), ey = sy + morro * SEG, t = e + s + l;
  for (let n = 0; n < e; n++) addSeg(easeIn(0, curva, n / e), easeInOut(sy, ey, n / t), zona, tipo);
  for (let n = 0; n < s; n++) addSeg(curva, easeInOut(sy, ey, (e + n) / t), zona, tipo);
  for (let n = 0; n < l; n++) addSeg(easeInOut(curva, 0, n / l), easeInOut(sy, ey, (e + s + n) / t), zona, tipo);
}
// sprite de cenário: x = posição lateral normalizada (negativo = esquerda); esc = escala; solido = colide
function addSpr(i, img, x, esc, solido, extra) {
  const s = segs[i]; if (!s || !img) return;
  const o = { img, x, esc: esc || 1, solido: !!solido, hw: img.width * (esc || 1) * PX2N * 0.5 };
  if (extra) Object.assign(o, extra);
  s.spr.push(o);
}
function gerarArte() {
  const E = IMG.emblema_128;
  ART.arvores = [1, 2, 3, 4, 5].map(s => A.arvore(s)); ART.eucs = [1, 2, 3].map(s => A.eucalipto(s * 7)); ART.arbustos = [1, 2, 3].map(s => A.arbusto(s * 3));
  ART.cupim = A.cupim(); ART.poste = A.poste(); ART.cerca = A.cerca(); ART.vacas = [1, 2].map(s => A.vaca(s));
  ART.predios = [...Array(10)].map((_, i) => A.predio(i * 13 + 1, i % 3 === 0)); ART.outdoors = [A.outdoor(0, E), A.outdoor(1)];
  ART.posto = A.posto(IMG.emblema_64); ART.pedagio = A.pedagio(); ART.passarela = A.passarela();
  ART.radar = arteRadar();
  const tag = (c, id) => { c.__id = id; return c; };
  ART.mont = tag(A.silhueta(1024, 70, 3, 3, 1), 'mont'); ART.mont2 = tag(A.silhueta(1024, 46, 9, 5, 1.4), 'mont2');
  ART.morro = tag(A.silhueta(1024, 26, 5, 8, 0.6), 'morro'); ART.sky = tag(A.skyline(1024, 90, 4), 'sky');
  ART.basilica = tag(A.basilica(), 'bas'); ART.nuvens = A.nuvens(11);
  const [v, g] = A.mk(W, H); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); ART.vinheta = v;
  ART.topos = {};
}
// placa redonda de velocidade máxima
function placaVel(n) {
  return memo('pv' + n, () => {
    const [c, g] = A.mk(56, 112); g.fillStyle = '#6a6e74'; g.fillRect(26, 40, 5, 72); g.fillStyle = '#9aa0a8'; g.fillRect(26, 40, 2, 72);
    g.fillStyle = '#c81e1e'; g.beginPath(); g.arc(28, 27, 26, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(28, 27, 19, 0, 7); g.fill();
    const s = String(n); g.font = (s.length > 2 ? 10 : 14) + 'px ' + A.FONTE; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#111'; g.fillText(s, 29, 28);
    return c;
  });
}
// poste do radar (câmera + caixa listrada)
function arteRadar() {
  const [c, g] = A.mk(44, 150); g.fillStyle = '#55595f'; g.fillRect(19, 40, 6, 110); g.fillStyle = '#80868e'; g.fillRect(19, 40, 2, 110);
  g.fillStyle = '#d8d8d8'; g.fillRect(4, 4, 36, 44); g.fillStyle = '#222'; g.fillRect(8, 10, 28, 18);
  g.fillStyle = '#111'; g.beginPath(); g.arc(22, 19, 7, 0, 7); g.fill(); g.fillStyle = '#5ab4ff'; g.beginPath(); g.arc(20, 17, 2.5, 0, 7); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#111' : '#f0c020'; g.fillRect(4 + i * 6, 34, 6, 10); }
  g.fillStyle = '#c81e1e'; g.fillRect(30, 6, 6, 3);
  return c;
}
function montarViagem(v) {
  VIAGEM = v; segs = []; const R = A.rng(v.semente);
  let tipo = v.trechos[0].t;
  addTrecho(0, 80, 0, 0, 0, 'cidade', tipo);
  const marcas = [];
  for (const tr of v.trechos) {
    const ini = segs.length, e = Math.round(tr.n * 0.3);
    if (tr.t !== tipo) { marcas.push({ i: ini - 30, placa: tr.t === 'D' ? ['INÍCIO DA', 'PISTA DUPLA', ''] : ['FIM DA', 'PISTA DUPLA', 'MÃO DUPLA'] }); tipo = tr.t; }
    addTrecho(e, tr.n - 2 * e, e, tr.c, tr.m, tr.z, tr.t);
    if (tr.placa || tr.fala) marcas.push({ i: ini + 12, placa: tr.placa, fala: tr.fala });
    if (tr.pedagio) marcas.push({ i: ini + Math.round(tr.n / 2), pedagio: true });
    if (tr.posto) marcas.push({ i: ini + Math.round(tr.n / 2), posto: true });
    if (tr.radar) marcas.push({ i: ini + Math.round(tr.n * 0.6), radar: tr.radar, oculto: !!tr.oculto });
  }
  FIM_I = segs.length + 30; addTrecho(0, 360, 0, 0, 0, 'cidade', tipo);
  FIM_Z = FIM_I * SEG; DIST = FIM_Z - START_I * SEG;
  POSTOS = []; PEDAGIOS = []; MARCOS = []; RADARES = [];
  for (const m of marcas) {
    if (m.posto) {
      const ok = m.i;
      for (let j = ok - 26; j <= ok + 26; j++) segs[j].posto = true;
      POSTOS.push({ i: ok, z0: (ok - 26) * SEG, z1: (ok + 26) * SEG, z: ok * SEG });
      addSpr(ok - 6, ART.posto, 2.2, 1.6, true);
      addSpr(ok - 160, A.placaVerde(['POSTO BRMC', '1 KM', '']), 1.5, 0.9, true);
      addSpr(ok - 80, A.placaVerde(['POSTO BRMC', '500 M', '']), 1.5, 0.9, true);
    } else if (m.pedagio) {
      const k = PEDAGIOS.length;
      PEDAGIOS.push({ k, i: m.i, z: m.i * SEG });
      for (let j = m.i - 30; j < m.i + 14; j++) segs[j].pedagio = true;
      segs[m.i].cancela = k;
      addSpr(m.i + 3, ART.pedagio, 0, 1.25, false, { cruza: true });
      addSpr(m.i - 120, A.placaVerde(['PEDÁGIO', '1 KM', 'PARE NA CANCELA']), 1.5, 0.9, true);
      MARCOS.push({ i: m.i - 70, z: (m.i - 70) * SEG, fala: 'pedagio', feito: false });
    } else if (m.radar) {
      const D = segs[m.i].tipo === 'D';
      RADARES.push({ k: RADARES.length, i: m.i, z: m.i * SEG, lim: m.radar, oculto: m.oculto });
      if (m.oculto) {   // radar escondido atrás da vegetação
        addSpr(m.i, ART.radar, 1.62, 1, true); addSpr(m.i - 1, ART.arbustos[0], 1.48, 1.5, false); addSpr(m.i - 2, ART.arvores[2], 1.85, 1.2, true);
        MARCOS.push({ i: m.i + 25, z: (m.i + 25) * SEG, fala: 'radar_oculto', feito: false });
      } else {
        addSpr(m.i, ART.radar, 1.45, 1, true); addSpr(m.i + 2, placaVel(m.radar), 1.5, 0.8, false);
        addSpr(m.i - 95, placaVel(m.radar), D ? -1.55 : -1.5, 0.9, false);
        addSpr(m.i - 60, A.placaVerde(['FISCALIZAÇÃO', 'ELETRÔNICA', m.radar + ' KM/H']), 1.5, 0.9, true);
        MARCOS.push({ i: m.i - 110, z: (m.i - 110) * SEG, fala: 'radar', feito: false });
      }
    } else {
      if (m.placa) addSpr(m.i, A.placaVerde(m.placa), 1.5, 1, true);
      MARCOS.push({ i: m.i, z: m.i * SEG, fala: m.fala, feito: false });
    }
  }
  // cenário por zona (na via simples a vegetação chega mais perto dos dois lados)
  for (let i = 40; i < segs.length; i++) {
    const s = segs[i], z = s.zona, D = s.tipo === 'D', xe = D ? -4.4 : -1.7;
    if (s.posto || s.pedagio) continue;
    if (D && i % 12 === 0) addSpr(i, ART.poste, -1.55, 1, false);
    if (i % 25 === 0) addSpr(i, A.marcoKm(Math.round((i - START_I) / (FIM_I - START_I) * v.km)), 1.42, 1, false);
    if (z === 'cidade') {
      if (i % 4 === 0) addSpr(i, ART.predios[Math.floor(R() * ART.predios.length)], 2.0 + R() * 1.6, 1.4, true);
      if (i % 5 === 2) addSpr(i, ART.predios[Math.floor(R() * ART.predios.length)], xe - 0.3 - R() * 1.5, 1.4, !D);
    } else if (z === 'eucalipto') {
      if (i % 2 === 0) addSpr(i, ART.eucs[Math.floor(R() * 3)], 1.7 + R() * 2.2, 1.3, true);
      if (i % 3 === 0) addSpr(i, ART.eucs[Math.floor(R() * 3)], xe - R() * 2, 1.3, !D);
    } else if (z === 'serra') {
      if (i % 3 === 0) addSpr(i, R() < 0.6 ? IMG.pine : ART.arvores[Math.floor(R() * 5)], 1.6 + R() * 1.8, R() < 0.6 ? 1.6 : 1.2, true);
      if (i % 4 === 0) addSpr(i, IMG.rock, 1.7 + R() * 2, 1.4, true);
      if (i % 4 === 2) addSpr(i, IMG.pine, xe - R() * 2, 1.6, !D);
      if (!D && i % 4 === 1) addSpr(i, IMG.rock, xe - 0.2 - R() * 1.5, 1.4, true);
    } else {
      if (i % 5 === 0 && R() < 0.8) addSpr(i, ART.arvores[Math.floor(R() * 5)], 1.8 + R() * 2.5, 1.2, true);
      if (i % 3 === 0 && R() < 0.5) addSpr(i, ART.arbustos[Math.floor(R() * 3)], 1.5 + R() * 3, 1, false);
      if (i % 6 === 0) addSpr(i, ART.cerca, 2.6, 1, false);
      if (!D && i % 6 === 3) addSpr(i, ART.cerca, -2.6, 1, false);
      if (i % 47 === 0) addSpr(i, ART.vacas[Math.floor(R() * 2)], 3.2 + R() * 2, 1, false);
      if (i % 29 === 0) addSpr(i, ART.cupim, 2.0 + R() * 2, 1, false);
      if (i % 7 === 0 && R() < 0.6) addSpr(i, ART.arvores[Math.floor(R() * 5)], xe - 0.2 - R() * 2.5, 1.2, !D);
      if (i % 160 === 80) addSpr(i, ART.outdoors[(i / 160 | 0) % 2], 2.4, 1.1, true);
    }
    if (D && i % 420 === 210 && Math.abs(s.curva) < 1) addSpr(i, ART.passarela, -1.45, 1.25, false, { cruza: true });
  }
  const arco = d => memo('arco' + d.join(), () => A.arco(d[0], d[1], d[2], IMG.emblema_128));
  addSpr(START_I, arco(v.largada), 0, 1.15, false, { cruza: true });
  addSpr(FIM_I, arco(v.chegada), 0, 1.15, false, { cruza: true });
  MARCOS.sort((a, b) => a.z - b.z);
  // peso da serra (0-1): onde a chuva e a neblina aparecem
  let d = 1e9; for (const s of segs) { d = s.zona === 'serra' ? 0 : d + 1; s.serra = d; }
  d = 1e9; for (let i = segs.length - 1; i >= 0; i--) { d = segs[i].zona === 'serra' ? 0 : d + 1; segs[i].serra = clamp(1 - Math.min(segs[i].serra, d) / 200, 0, 1); }
}
function usarViagem(v) { if (VIAGEM !== v) { montarViagem(v); return true; } return false; }
const chuvaEm = z => CLIMA.tipo === 'chuva' ? segEm(z).serra : 0;
const nebEm = z => CLIMA.tipo === 'neblina' ? segEm(z).serra : 0;
function sortearClima() {
  const f = params.get('clima'); if (f) return { tipo: f };
  const r = Math.random(), c = MODO === 'cafe' ? [0.35, 0.7] : [0.5, 0.78];
  return { tipo: r < c[0] ? 'sol' : r < c[1] ? 'chuva' : 'neblina' };
}
const segEm = z => segs[clamp(Math.floor(z / SEG), 0, segs.length - 1)];
const progresso = z => clamp((z - START_I * SEG) / DIST, 0, 1);

// ============================================================ TRÂNSITO (pista dupla)
const TIPOS = [
  { tras: 'car_rear', frente: 'car_front', w: 120, len: 420, vmin: 85, vmax: 120, p: 0.5, cores: true },
  { tras: 'moto_rear', frente: 'moto_front', w: 52, len: 220, vmin: 90, vmax: 125, p: 0.1, cores: true },
  { tras: 'truck_rear', frente: 'truck_front', w: 168, len: 820, vmin: 60, vmax: 85, p: 0.22, cores: 'frente', pesado: true },
  { tras: 'carreta_rear', frente: 'truck_front', w: 184, len: 1500, vmin: 55, vmax: 80, p: 0.18, cores: 'frente', pesado: true }
];
const CORES_VEIC = [[200, 30, 30], [30, 80, 200], [228, 228, 228], [34, 34, 38], [240, 200, 40], [120, 120, 132], [20, 120, 60], [150, 60, 30], [90, 140, 200]];
let trafego = [];
function sortear() { let r = Math.random(); for (const t of TIPOS) { if ((r -= t.p) < 0) return t; } return TIPOS[0]; }
const tipoEm = z => segEm(z).tipo;
function criarVeic(z, oposto) {
  const t = sortear(), cor = CORES_VEIC[Math.floor(Math.random() * CORES_VEIC.length)];
  const usa = t.cores === true || (t.cores === 'frente' && oposto);
  const v = rnd(t.vmin, t.vmax) * KMH, D = tipoEm(z) === 'D';
  const faixaD = oposto ? (Math.random() < 0.5 ? -2.55 : -3.45) : (t.pesado ? 0.5 : (Math.random() < 0.6 ? 0.5 : -0.5));
  const x = D ? faixaD : (oposto ? -0.5 : 0.5);
  return { z, x, alvoX: x, faixaD, v: oposto ? -v : v, vBase: v, img: spriteVeic(oposto ? t.frente : t.tras, usa ? cor : null), hw: t.w * PX2N * 0.5, len: t.len, oposto, pesado: !!t.pesado, pisca: 0, freio: 0 };
}
function gerarTrafego() {
  trafego = [];
  for (let z = (START_I + 90) * SEG; z < FIM_Z; z += rnd(15000, 26000)) trafego.push(criarVeic(z, false));
  for (let z = (START_I + 60) * SEG; z < FIM_Z + 80 * SEG; z += rnd(16000, 30000)) trafego.push(criarVeic(z, true));
}
function atualizarTrafego(dt) {
  const fim = FIM_Z + 120 * SEG, ini = (START_I + 40) * SEG;
  for (const v of trafego) {
    const D = tipoEm(v.z) === 'D';
    if (v.oposto) v.alvoX = D ? v.faixaD : -0.5;
    else if (v.cede > 0) { v.cede -= dt; v.alvoX = v.cedeX; v.v = Math.max(v.vBase * 0.7, v.v - 20 * KMH * dt); v.freio = 1; v.pisca = 0.2; }
    else {
      let frente = null, dmin = 1e9;
      for (const o of trafego) { if (o === v || o.oposto) continue; const dz = o.z - v.z; if (dz > 0 && dz < 2600 && Math.abs(o.x - v.x) < 0.4 && dz < dmin) { dmin = dz; frente = o; } }
      v.freio = 0;
      if (!D) { if (v.alvoX !== 0.5) { v.alvoX = 0.5; } }
      if (frente && frente.v < v.vBase - 5 * KMH) {
        const outra = v.x > 0 ? -0.5 : 0.5;
        const livre = D && !trafego.some(o => !o.oposto && o !== v && Math.abs(o.x - outra) < 0.4 && o.z > v.z - 2200 && o.z < v.z + 2200);
        if (!v.pesado && livre && Math.abs(v.alvoX - v.x) < 0.01) { v.alvoX = outra; v.pisca = 1.6; }
        else if (dmin < 1500) { v.v = Math.max(frente.v, v.v - 30 * KMH * dt); v.freio = 1; }
      } else if (v.v < v.vBase) v.v = Math.min(v.vBase, v.v + 10 * KMH * dt);
      if (D && !frente && v.alvoX < 0 && !trafego.some(o => !o.oposto && o !== v && o.x > 0 && o.z > v.z - 1800 && o.z < v.z + 2400)) { v.alvoX = 0.5; v.pisca = 1.4; }
      // pedágio: veículos também param
      const T = PEDAGIOS.find(p => p.z > v.z && p.z - v.z < 3000);
      if (T) { v.v = Math.max(18 * KMH, Math.min(v.v, (T.z - v.z) * 0.9)); }
      v.pisca = Math.max(0, v.pisca - dt);
    }
    if (v.x !== v.alvoX) { const d = v.alvoX - v.x, p = (v.oposto ? 1.4 : 0.6) * dt; v.x = Math.abs(d) < p ? v.alvoX : v.x + Math.sign(d) * p; }
    v.z += v.v * dt;
    if (v.z > fim) v.z = ini + (v.z - fim);
    if (v.z < ini) v.z = fim - (ini - v.z);
  }
}

// ============================================================ ENTRADA
const entrada = [{}, {}], anterior = [{}, {}], pulso = [{}, {}];
const fontes = { teclado: [{}, {}], toque: {}, remoto: {} };
function juntarEntrada() {
  for (const k of ['esq', 'dir', 'acel', 'freio', 'buzina']) {
    entrada[0][k] = !!(fontes.teclado[0][k] || fontes.toque[k] || pulso[0][k]);
    entrada[1][k] = !!(fontes.teclado[1][k] || fontes.remoto[k] || pulso[1][k]);
  }
}
const apertou = (j, k) => entrada[j][k] && !anterior[j][k];
function guardarAnterior() { for (let j = 0; j < 2; j++) { anterior[j] = Object.assign({}, entrada[j]); pulso[j] = {}; } juntarEntrada(); }
const TECLAS = { ArrowLeft: [0, 'esq'], ArrowRight: [0, 'dir'], ArrowUp: [0, 'acel'], ArrowDown: [0, 'freio'], KeyZ: [0, 'acel'], KeyX: [0, 'freio'], Space: [0, 'acel'], Enter: [0, 'acel'],
  KeyH: [0, 'buzina'], KeyB: [0, 'buzina'], KeyA: [1, 'esq'], KeyD: [1, 'dir'], KeyW: [1, 'acel'], KeyS: [1, 'freio'], KeyE: [1, 'buzina'] };
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  SOM.iniciar();
  const t = TECLAS[e.code]; if (!t) { if (e.code === 'Escape' || e.code === 'KeyP') alternarPausa(); return; }
  if (t[0] === 1 && !DEV2P && !p2Conectado) return;
  if (!e.repeat) pulso[t[0]][t[1]] = true; fontes.teclado[t[0]][t[1]] = true; e.preventDefault();
});
addEventListener('keyup', e => { const t = TECLAS[e.code]; if (t) fontes.teclado[t[0]][t[1]] = false; });
function ligarBotoes(container, alvo, aoMudar) {
  const ativos = new Map();
  const atualizar = () => {
    const novo = {}; for (const k of ativos.values()) novo[k] = true;
    for (const k of ['esq', 'dir', 'acel', 'freio', 'buzina']) {
      const v = !!novo[k]; if (alvo[k] !== v) { alvo[k] = v; aoMudar && aoMudar(k, v); }
      const el = container.querySelector('[data-k="' + k + '"]'); if (el) el.classList.toggle('press', v);
    }
  };
  container.querySelectorAll('.bt').forEach(el => {
    const k = el.dataset.k;
    el.addEventListener('pointerdown', e => { e.preventDefault(); SOM.iniciar(); try { el.setPointerCapture(e.pointerId); } catch (x) {} ativos.set(e.pointerId, k); atualizar(); if (navigator.vibrate && guardar.ler('vibrar', true)) navigator.vibrate(8); });
    const solta = e => { if (ativos.get(e.pointerId) === k) { ativos.delete(e.pointerId); atualizar(); } };
    el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta); el.addEventListener('lostpointercapture', solta);
  });
  addEventListener('blur', () => { ativos.clear(); atualizar(); });
}
let alvosToque = [];
tela.addEventListener('pointerdown', e => {
  SOM.iniciar();
  const r = tela.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  for (const a of alvosToque) if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) { a.fn(); return; }
  if (estado.toqueGeral) estado.toqueGeral(x, y);
});

// ============================================================ CORREDORES E FÍSICA
let corredores = [], humanos = [], tempoCorrida = 0, contagem = 0, chegada = [], fimTimer = 0, demo = false, pausado = false;
const CONS = () => VIAGEM.semCombustivel ? 0 : 100 / (DIST * 0.5);
const MARCHAS = [0.2, 0.36, 0.52, 0.68, 0.84, 1.01];
const tempoTanque = def => 2 + Math.pow((def.cc || 800) / 250, 1.4);   // segundos para encher o tanque todo (650: 5,8 s | 853: 7,6 s | 1300: 12 s)

function criarCorredor(def, humano) {
  const max = def.vel * KMH, ouro = humano >= 0 && !demo && usaOuro(def);
  return { nome: def.nome, def, img: spriteMoto(def, ouro), ouro, max, acelB: max / (7.2 - def.acel * 3.4), consumo: 1.4 - def.economia * 0.85, curva: def.curva,
    z: 0, x: 0, v: 0, lean: 0, susp: 0, suspV: 0, crash: 0, giro: 0, comb: 100, fim: false, tempo: null, humano, auto: humano < 0,
    marcha: 1, troca: 0, rpm: 0, vacuoT: 0, vacuo: false, gas: 0, freando: false, abast: null, postoLivre: true, bg: 0, cx: 0, roll: 0,
    fora: false, rasp: 0, reservaDita: false, pag: {}, pagT: 0, abriu: 0, penal: 0, multas: 0, multaT: 0, radarOk: {}, buzinas: 0, buzT: 0, abastecidas: 0, molhado: 0, ia: { skill: (def.ritmo || 0.9) + rnd(-0.02, 0.02), faixa: pick([0.5, 0.35, 0.65]), encher: 0 } };
}
function novaCorrida(escolhas, ehDemo) {
  demo = !!ehDemo;
  const usados = escolhas.map(i => PERSONAGENS[i]);
  const lista = MODO === 'relogio' && !demo ? [] : PERSONAGENS.filter(p => usados.indexOf(p) < 0).map(d => [d, -1]);
  if (demo) CLIMA = { tipo: 'sol' };
  escolhas.forEach((c, j) => lista.push([PERSONAGENS[c], j]));
  corredores = lista.map(([d, h], i) => { const c = criarCorredor(d, h), fila = Math.floor(i / 2); c.z = (START_I - 5 - fila * 5) * SEG; c.x = i % 2 ? 0.55 : -0.35; c.cx = c.x * ROAD; return c; });
  humanos = corredores.filter(c => c.humano >= 0).sort((a, b) => a.humano - b.humano);
  gerarTrafego(); particulas = [[], []]; radio.fila = []; radio.atual = null; radio.cd = 0;
  for (const m of MARCOS) m.feito = false;
  tempoCorrida = 0; contagem = demo ? 0 : 4.0; chegada = []; fimTimer = 0; pausado = false; ranking = null; lanternaDita = false;
  climaDito = false; trovaoT = 8; relampago = 0; flashT = [0, 0];
  // contra o relógio: carrega o fantasma do recorde e começa a gravar o novo
  FANT = null; GRAV = null;
  if (MODO === 'relogio' && !demo) {
    GRAV = [];
    const f = guardar.ler('fantasma_' + VIAGEM.id, null), d = f && PERSONAGENS.find(p => p.id === f.p);
    if (d && f.d && f.d.length > 6) FANT = { d: f.d, img: spriteMoto(d, f.o), def: d, tempo: f.t };
  }
}
const usaOuro = def => guardar.ler('ouro_' + def.id, false) && guardar.ler('usarOuro_' + def.id, true);
let FANT = null, GRAV = null, climaDito = false, trovaoT = 8, relampago = 0, flashT = [0, 0];
function fantasmaEm(t) {
  const d = FANT.d, n = d.length / 3, f = t / 0.1, i = Math.min(n - 1, Math.floor(f)), j = Math.min(n - 1, i + 1), u = clamp(f - i, 0, 1);
  return { z: lerp(d[i * 3], d[j * 3], u) * 10, x: lerp(d[i * 3 + 1], d[j * 3 + 1], u) / 100, lean: lerp(d[i * 3 + 2], d[j * 3 + 2], u) / 100, img: FANT.img, fantasma: true };
}
function tempoFantasma(z) {   // instante em que o fantasma passou por z
  const d = FANT.d, n = d.length / 3; let a = 0, b = n - 1;
  if (z >= d[b * 3] * 10) return null;
  while (b - a > 1) { const m = (a + b) >> 1; if (d[m * 3] * 10 < z) a = m; else b = m; }
  const za = d[a * 3] * 10, zb = d[b * 3] * 10; return (a + (zb > za ? (z - za) / (zb - za) : 0)) * 0.1;
}
const proximoPosto = z => POSTOS.find(p => p.z1 > z) || null;
function precisaAbastecer(c, p) {
  const taxa = CONS() * c.consumo, prox = POSTOS.find(q => q.z > p.z + SEG), alvo = prox ? prox.z : FIM_Z;
  const naChegada = c.comb - (p.z - c.z) * taxa * 0.85;
  return naChegada < (alvo - p.z) * taxa * 1.08 ? Math.min(100, (alvo - p.z) * taxa * 1.15 + 8) : 0;
}

function pilotoIA(c, seg) {
  const ia = c.ia, inp = { acel: true };
  let alvoV = c.max * ia.skill, alvoX = ia.faixa;
  if (c.fim) alvoV = c.max * 0.32;
  else if (!demo && humanos.length) {
    const lider = Math.max.apply(null, humanos.map(h => h.z)), d = c.z - lider;
    if (d > 16000) alvoV *= 0.95; else if (d < -5000) alvoV *= 1.1;
  }
  let curvaMax = 0;
  for (let j = 0; j < 36; j += 3) curvaMax = Math.max(curvaMax, Math.abs(segs[Math.min(seg.i + j, segs.length - 1)].curva));
  if (curvaMax > 0.5) alvoV = Math.min(alvoV, c.max * clamp(0.95 / (curvaMax * 0.4 * (1.15 - 0.35 * c.curva)), 0.55, 1) * (1 - 0.12 * chuvaEm(c.z)));
  // radar: os McNamaras às vezes ignoram a placa...
  const RD = RADARES.find(r => r.z > c.z && r.z - c.z < 75 * SEG);
  if (RD && !c.fim) {
    if (ia.radarK !== RD.k) { ia.radarK = RD.k; ia.ignora = Math.random() < (c.def.perfil === 'McNAMARA' ? 0.4 : 0.12); }
    if (!ia.ignora && !RD.oculto) alvoV = Math.min(alvoV, (RD.lim - 3) * KMH);
  }
  // combustível
  const p = proximoPosto(c.z);
  if (p && !c.fim) {
    if (!ia.encher && c.z < p.z0 && c.z > p.z0 - 70 * SEG) ia.encher = precisaAbastecer(c, p);
    if (ia.encher && c.z > p.z0 - 45 * SEG) { alvoX = 1.7; if (c.z > p.z0 + 4 * SEG) alvoV = c.x > 1.3 ? 0 : c.max * 0.14; }
    if (c.z > p.z1) ia.encher = 0;
  }
  if (c.comb <= 0) alvoV = 0;
  // pedágio: freia até parar na cancela
  const T = PEDAGIOS.find(p => p.z > c.z - 30 && !c.pag[p.k]);
  if (T) { const d = T.z - 60 - c.z; if (d < 70 * SEG) { alvoV = Math.min(alvoV, Math.sqrt(Math.max(0, 2 * c.max * 0.75 * (d - 120)))); if (d < 260) { alvoV = 0; inp.freio = true; } } }
  // trânsito: troca de faixa, corredor e contramão (na via simples)
  if (alvoX < 1.3) {
    let obst = null, melhor = 1e9;
    for (const v of trafego) {
      const dz = v.z - c.z, hor = Math.max(1800, (c.v - v.v) * 1.5);
      if (dz > -(v.len / 2 + 150) && dz < hor && Math.abs(v.x - c.x) < v.hw + MOTO_HW + 0.1 && dz < melhor) { melhor = dz; obst = v; }
    }
    if (obst) {
      const livre = x => {
        if (x < -0.98 || x > 1.3) return false;
        for (const v of trafego) { const dz = v.z - c.z; if (dz > -(v.len / 2 + 220) && dz < Math.max(1500, (c.v - v.v) * 2.4) && Math.abs(v.x - x) < v.hw + MOTO_HW + 0.06) return false; }
        return true;
      };
      const a = obst.x + obst.hw + MOTO_HW + 0.12, b = obst.x - obst.hw - MOTO_HW - 0.12;
      const opc = obst.oposto ? [0.5, 1.15].filter(livre) : [a, b, -0.5, 0.5].filter(livre).sort((m, n) => Math.abs(m - c.x) - Math.abs(n - c.x));
      if (opc.length) alvoX = opc[0];
      else if (obst.oposto) { alvoX = 1.15; alvoV = Math.min(alvoV, c.max * 0.4); }
      else { alvoV = Math.min(alvoV, obst.v * 0.95); if (melhor < obst.len / 2 + 2800) inp.freio = c.v > alvoV + 3 * KMH; }
    }
  }
  inp.esq = c.x > alvoX + 0.05; inp.dir = c.x < alvoX - 0.05;
  if (c.v > alvoV) { inp.acel = false; if (c.v > alvoV + 12 * KMH) inp.freio = true; }
  if (alvoV === 0 && c.v > 2 * KMH) inp.freio = true;
  return inp;
}

function bater(c, novaV) {
  if (c.crash > 0 || c.abast) return;
  c.crash = 1.7; c.giro = 0; c.v = Math.max(0, novaV); c.batidas = (c.batidas || 0) + 1;
  if (c.humano >= 0 && !demo) {
    SOM.batida(); tremor[c.humano] = 0.5; if (navigator.vibrate && guardar.ler('vibrar', true)) navigator.vibrate([60, 40, 120]);
    for (let i = 0; i < 26; i++) emitir(c.humano, 'faisca'); falarSobre('batida', c);
  }
}

function atualizarCorredor(c, dt) {
  const seg = segEm(c.z), max = c.max;
  let inp;
  if (contagem > 0) { inp = c.humano >= 0 ? entrada[c.humano] : { acel: Math.random() < 0.5 }; c.gas = inp.acel ? 1 : 0; c.rpm = lerp(c.rpm, c.gas ? 0.75 + Math.random() * 0.2 : 0.15, 0.2); return; }
  // ---- abastecimento
  if (c.abast) {
    c.v = 0; c.gas = 0; c.abast.t += dt;
    const taxa = 100 / tempoTanque(c.def);
    c.comb = Math.min(100, c.comb + taxa * dt);
    const sair = c.humano >= 0 && !c.auto ? (c.abast.t > 0.7 && apertou(c.humano, 'acel')) : c.comb >= (c.ia.encher || 100);
    if (c.comb >= 100 || sair) { c.abast = null; c.postoLivre = false; c.ia.encher = 0; if (c.humano >= 0 && !demo) SOM.bomba(false); }
    return;
  }
  if (c.humano >= 0 && !c.auto) inp = entrada[c.humano]; else inp = pilotoIA(c, seg);
  if (c.crash > 0) {
    c.crash -= dt; inp = {};
    if (c.crash > 0.7) { c.giro += dt * 14; c.v = Math.max(0, c.v - c.max * 1.3 * dt); } else { c.giro = 0; c.v = 0; c.lean = 0; }
  }
  const pc = c.v / c.max;
  // ---- inclinação e direção (com inércia)
  const st = (inp.esq ? -1 : 0) + (inp.dir ? 1 : 0);
  const alvoLean = st * Math.min(1, 0.45 + pc);
  const mol = c.molhado = chuvaEm(c.z);
  c.lean += (alvoLean - c.lean) * Math.min(1, (4.5 + 4 * c.curva) * (1 - 0.28 * mol) * dt);
  c.x += c.lean * dt * 1.9 * (0.25 + 0.75 * Math.min(1, pc * 1.4));
  c.x -= seg.curva * pc * pc * dt * 0.4 * (1.15 - 0.35 * c.curva) * (1 + 0.4 * mol);
  // ---- motor, marchas, aceleração
  let m = 1; while (m < 6 && pc > MARCHAS[m - 1]) m++;
  if (m > c.marcha && c.gas) { c.troca = 0.12; if (c.humano >= 0 && !demo) SOM.troca(); }
  c.marcha = m;
  const lo = m === 1 ? 0 : MARCHAS[m - 2], hi = MARCHAS[m - 1];
  c.rpm = lerp(c.rpm, c.troca > 0 ? 0.35 : 0.28 + 0.72 * clamp((pc - lo) / (hi - lo), 0, 1), 0.35);
  c.troca = Math.max(0, c.troca - dt);
  c.gas = inp.acel && c.comb > 0 ? 1 : 0; c.freando = !!inp.freio;
  const ladeira = (seg.p2.y - seg.p1.y) / SEG;
  if (c.gas) c.v += c.acelB * (c.vacuo ? 1.25 : 1) * (1 - Math.pow(Math.min(1, c.v / max), 1.6)) * (c.troca > 0 ? 0.3 : 1) * dt;
  else if (inp.freio) c.v -= c.max * 1.1 * (1 - 0.3 * mol) * dt;
  else c.v -= (c.max * 0.1 + c.v * 0.12) * dt;
  c.v -= ladeira * 5200 * dt;
  // ---- vácuo atrás de veículos
  let vac = false;
  for (const o of trafego) { if (o.oposto) continue; const dz = o.z - c.z; if (dz > 250 && dz < 1900 && Math.abs(o.x - c.x) < o.hw) { vac = true; break; } }
  if (!vac) for (const o of corredores) { if (o === c) continue; const dz = o.z - c.z; if (dz > 200 && dz < 1300 && Math.abs(o.x - c.x) < 0.14) { vac = o; break; } }
  c.vacuoT = vac && pc > 0.5 ? c.vacuoT + dt : 0; c.vacuo = c.vacuoT > 0.45; c.vacuoDe = vac;
  // ---- fora da pista, defensa, posto
  const noPosto = seg.posto && c.x > 1.0 && c.x < 3.2, pedagio = seg.pedagio, D = seg.tipo === 'D';
  c.fora = (c.x > ACOST && !noPosto && !pedagio) || (!D && c.x < -ACOST);
  if (c.fora) {
    if (c.v > c.max * 0.32) c.v -= c.max * 1.05 * dt;
    if (Math.random() < 0.3) c.suspV += rnd(-30, 30);
    for (const s of seg.spr) {
      if (!s.solido || s.cruza) continue;
      const cx = s.x < 0 ? s.x - s.hw : s.x + s.hw;
      if (Math.abs(cx - c.x) < s.hw + MOTO_HW) { bater(c, 0); c.x = c.x > 0 ? Math.min(c.x, 1.2) : Math.max(c.x, -1.2); break; }
    }
  }
  if (D && c.x < GUARD_X + 0.1) {
    c.x = GUARD_X + 0.1; if (c.lean < 0) c.lean = 0.25; c.v *= 1 - 0.9 * dt; c.rasp -= dt;
    if (c.humano >= 0 && !demo && c.v > 10 * KMH) { if (c.rasp <= 0) { SOM.raspar(); c.rasp = 0.14; } emitir(c.humano, 'faisca', -1); }
  }
  c.x = clamp(c.x, D ? GUARD_X + 0.1 : -3.0, 3.0);
  c.v = clamp(c.v, 0, max);
  let dist = c.v * dt;
  // ---- pedágio: parar na cancela, pagar na tag e arrancar
  c.abriu = Math.max(0, c.abriu - dt);
  const T = PEDAGIOS.find(p => p.z > c.z - 30 && !c.pag[p.k]);
  if (T) {
    const d = T.z - 60 - c.z;
    if (d < 500 && c.v < 6 * KMH && c.crash <= 0) { c.pagT += dt; if (c.pagT > 1.3) { c.pag[T.k] = true; c.pagT = 0; c.abriu = 1.6; if (c.humano >= 0 && !demo) SOM.cancela(); } }
    else c.pagT = 0;
    if (!c.pag[T.k] && c.z + dist > T.z - 60) {
      if (c.v > 18 * KMH && Math.abs(c.x) < 1.05) { bater(c, 0); if (c.humano >= 0 && !demo) falarSobre('cancela', c); }
      c.v = 0; dist = Math.max(0, T.z - 60 - c.z);
    }
  }
  // ---- combustível
  c.comb = Math.max(0, c.comb - dist * CONS() * c.consumo * (c.gas ? 1 : 0.35));
  if (!noPosto) c.postoLivre = true;
  if (noPosto && c.postoLivre && c.x > 1.1 && c.v < 22 * KMH && c.comb < 98 && !c.fim && c.crash <= 0 && ((c.humano >= 0 && !c.auto) || c.ia.encher)) {
    c.abast = { t: 0, ini: c.comb }; c.v = 0; c.abastecidas++;
    if (c.humano >= 0 && !demo) { SOM.bomba(true); falarSobre('abastecendo', c); }
  }
  if (c.humano >= 0 && !demo && c.comb <= 10 && !c.reservaDita) { c.reservaDita = true; SOM.alerta(); falarSobre('reserva', c); }
  if (c.comb > 20) c.reservaDita = false;
  // ---- suspensão (crista de morro e buracos)
  const seg2 = segEm(c.z + SEG * 2), lad2 = (seg2.p2.y - seg2.p1.y) / SEG;
  c.suspV += (ladeira - lad2) * c.v * 0.012;
  c.suspV += (-c.susp * 120 - c.suspV * 9) * dt; c.susp = clamp(c.susp + c.suspV * dt, -6, 6);
  // ---- radar
  c.multaT = Math.max(0, c.multaT - dt); c.buzT = Math.max(0, c.buzT - dt);
  for (const R of RADARES) if (!c.radarOk[R.k] && c.z < R.z && c.z + dist >= R.z) { c.radarOk[R.k] = true; if (c.v / KMH > R.lim + 7 && c.crash <= 0 && !c.fim) multar(c, R); }
  c.z += dist;
  c.bg = (c.bg + 0.0011 * seg.curva * dist / SEG + 10) % 1;
  // câmera acompanha com atraso (sensação de peso)
  c.cx = lerp(c.cx, c.x * ROAD, Math.min(1, dt * 7));
  c.roll = lerp(c.roll, clamp(-seg.curva * pc * 0.014 - c.lean * 0.03, -0.12, 0.12), Math.min(1, dt * 4));
  if (!c.fim && c.z >= FIM_Z) {
    c.fim = true; c.tempo = tempoCorrida + c.penal; c.auto = true; chegada.push(c);
    if (c.humano >= 0 && !demo) { SOM.chegada(); falarSobre('chegada', c); }
  }
}

function multar(c, R) {
  c.multas++; c.penal += 5; c.multaT = 2.6; c.multaInfo = [Math.round(c.v / KMH), R.lim];
  if (demo) return;
  if (c.humano >= 0) { SOM.flash(); setTimeout(SOM.multa, 250); flashT[c.humano] = 0.4; if (navigator.vibrate && guardar.ler('vibrar', true)) navigator.vibrate([30, 30, 30]); }
  if (c.humano >= 0 || Math.random() < 0.6) { radio.cd = 0; falarSobre('multa', c); }
}
// buzina: os carros da frente abrem passagem (pista dupla: trocam de faixa; via simples: encostam)
function buzinar(c) {
  c.buzT = 0.45; c.buzinas++; SOM.buzina(c.def.motor === 'boxer');
  for (const v of trafego) {
    if (v.oposto) continue; const dz = v.z - c.z;
    if (dz > 0 && dz < 5200 && Math.abs(v.x - c.x) < 0.8) {
      const D = tipoEm(v.z) === 'D';
      const livre = x => !trafego.some(o => !o.oposto && o !== v && Math.abs(o.x - x) < 0.4 && Math.abs(o.z - v.z) < 2200);
      v.cedeX = D && v.x < 0 && livre(0.5) ? 0.5 : 1.16; v.cede = 3.2;
    }
  }
  if (Math.random() < 0.22) falarSobre('buzina', c);
}
function colisoes() {
  for (const c of corredores) {
    if (c.crash > 0 || c.abast) continue;
    for (const v of trafego) {
      const dz = v.z - c.z;
      if (Math.abs(dz) < v.len * 0.5 + 70 && Math.abs(v.x - c.x) < v.hw + MOTO_HW * 0.8) {
        if (v.oposto) { bater(c, 0); c.z = v.z - v.len * 0.5 - 100; c.x = Math.max(c.x, 0.3); }
        else if (c.v - v.v > 40 * KMH) { bater(c, v.v * 0.4); c.z = v.z - v.len * 0.5 - 90; }
        else { c.v = Math.min(c.v, v.v * 0.9); c.z = Math.min(c.z, v.z - v.len * 0.5 - 75); c.x += (c.x > v.x ? 1 : -1) * 0.02; }
      }
    }
  }
  for (let i = 0; i < corredores.length; i++) for (let j = i + 1; j < corredores.length; j++) {
    const a = corredores[i], b = corredores[j]; if (a.abast || b.abast) continue;
    const dz = b.z - a.z, dx = b.x - a.x;
    if (Math.abs(dz) < 110 && Math.abs(dx) < MOTO_HW * 1.7) {
      const tras = dz > 0 ? a : b, frente = dz > 0 ? b : a;
      tras.v = Math.min(tras.v, frente.v * 0.97);
      const emp = (MOTO_HW * 1.7 - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1); a.x -= emp; b.x += emp;
    }
  }
}
function posicao(c) { let p = 1; for (const o of corredores) { if (o === c) continue; if (o.fim && c.fim) { if (o.tempo < c.tempo) p++; } else if (o.fim) p++; else if (!c.fim && o.z > c.z) p++; } return p; }

let tremor = [0, 0], ranking = null, rankT = 0, lanternaT = 0, lanternaDita = false, liderT = 0, geralT = 18;
function atualizarCorrida(dt) {
  if (pausado) return;
  if (contagem > 0) {
    const a = Math.ceil(contagem); contagem -= dt; const b = Math.ceil(contagem);
    if (!demo && a !== b && b <= 3) SOM.bipLargada(b === 0);
    if (!demo && contagem <= 0) falar('largada', null);
  } else tempoCorrida += dt;
  if (!demo) {
    humanos.forEach((h, j) => { if (!h.auto && apertou(j, 'buzina') && h.buzT <= 0 && contagem <= 0) buzinar(h); });
    const h0 = humanos[0];
    if (GRAV && contagem <= 0 && !h0.fim) while (GRAV.length / 3 <= tempoCorrida / 0.1) GRAV.push(Math.round(h0.z / 10), Math.round(h0.x * 100), Math.round(h0.lean * 100));
    // clima
    const ch = chuvaEm(h0.z), nb = nebEm(h0.z);
    if (!climaDito && (ch > 0.5 || nb > 0.5)) { climaDito = true; radio.cd = 0; falarSobre(ch > 0.5 ? 'chuva' : 'neblina', h0); }
    if (ch > 0.6) { trovaoT -= dt; if (trovaoT <= 0) { trovaoT = rnd(9, 17); relampago = 0.5; setTimeout(SOM.trovao, 350); } }
    relampago = Math.max(0, relampago - dt); flashT = flashT.map(f => Math.max(0, f - dt));
    // trilha muda conforme a estrada: pista dupla épica, via simples tranquila, serra tensa
    const sz = segEm(h0.z + 40 * SEG); SOM.estiloMusica && SOM.estiloMusica(sz.zona === 'serra' ? 'serra' : sz.tipo === 'D' ? 'pista' : 'simples');
  }
  atualizarTrafego(dt);
  for (const c of corredores) atualizarCorredor(c, dt);
  colisoes();
  for (let j = 0; j < 2; j++) tremor[j] = Math.max(0, tremor[j] - dt);
  if (!demo) eventosRadio(dt);
  atualizarRadio(dt);
  atualizarParticulas(dt);
  if (!demo && humanos.length && humanos.every(h => h.fim)) { fimTimer += dt; if (fimTimer > 4) irPara(telaResultado()); }
  if (demo && corredores[0].z > FIM_Z - 60 * SEG) novaCorrida([], true);
  if (SOM.ac) {
    if (demo || pausado) SOM.silenciar();
    else {
      humanos.forEach((h, j) => SOM.motor(j, h.abast ? 0.12 : h.rpm, h.gas, j === 0 ? 1 : 0.55, h.def.motor));
      const h0 = humanos[0]; SOM.ambiente(h0.v / h0.max, h0.fora); SOM.chuva && SOM.chuva(chuvaEm(h0.z));
    }
  }
}

// ============================================================ INTERCOMUNICADOR
const radio = { fila: [], atual: null, cd: 0 };
function falante(excluir) {
  const ops = corredores.filter(c => c !== excluir), ia = ops.filter(c => c.humano < 0);
  if (ia.length) return pick(ia);
  const fora = PERSONAGENS.filter(p => !corredores.some(c => c.def === p));   // contra o relógio: a turma fala pelo rádio
  if (fora.length) { const p = pick(fora); return { def: p, nome: p.nome, humano: -1 }; }
  return pick(ops.length ? ops : corredores);
}
function falar(tipo, alvo, quem) {
  if (demo || radio.fila.length > 2) return;
  quem = quem || falante(alvo); if (!quem) return;
  tipo = (VIAGEM.falas && VIAGEM.falas[tipo]) || tipo;
  const op = [];
  (FALAS[tipo] || []).forEach(t => op.push(t));
  const de = quem.def.id && DE[quem.def.id]; if (de && de[tipo]) de[tipo].forEach(t => { op.push(t); op.push(t); op.push(t); });
  const so = alvo && alvo.def.id && SOBRE[alvo.def.id];
  if (so) { if (so[tipo]) so[tipo].forEach(t => { op.push(t); op.push(t); op.push(t); }); if (so.geral && Math.random() < 0.3) so.geral.forEach(t => op.push(t)); }
  if (!op.length) return;
  const t = pick(op).replace(/\{alvo\}/g, alvo ? alvo.nome : 'galera');
  radio.fila.push({ quem, texto: t, t: 0 });
}
function falarSobre(tipo, alvo, quem) { if (radio.cd > 0 && tipo !== 'batida' && tipo !== 'chegada') return; radio.cd = 5; falar(tipo, alvo, quem); }
function atualizarRadio(dt) {
  radio.cd = Math.max(0, radio.cd - dt);
  if (!radio.atual && radio.fila.length) { radio.atual = radio.fila.shift(); radio.atual.dur = Math.max(3.6, radio.atual.texto.length / 34 + 2.6); SOM.radio(); }
  if (radio.atual) {
    const r = radio.atual, antes = Math.floor(r.t * 36); r.t += dt; const dep = Math.floor(r.t * 36);
    if (dep !== antes && dep % 2 === 0 && dep < r.texto.length) SOM.voz(r.quem.def.voz || 170);
    if (r.t > r.dur) radio.atual = null;
  }
}
function eventosRadio(dt) {
  if (contagem > 0) return;
  rankT -= dt;
  if (rankT <= 0) {
    rankT = 0.5;
    const ord = corredores.slice().sort((a, b) => b.z - a.z);
    if (ranking) for (const h of humanos) {
      const iAnt = ranking.indexOf(h), iAgr = ord.indexOf(h);
      if (iAgr < iAnt) { const pass = ranking.slice(iAgr, iAnt).filter(o => o !== h && o.humano < 0 && ord.indexOf(o) > iAgr); if (pass.length && Math.random() < 0.55) falarSobre('ultrapassou', h, pass[0]); }
      else if (iAgr > iAnt) { const por = ord.slice(iAnt, iAgr).filter(o => o !== h && o.humano < 0 && ranking.indexOf(o) > iAnt); if (por.length && Math.random() < 0.55) falarSobre('passou_voce', h, por[0]); }
    }
    ranking = ord;
    const h0 = humanos[0];
    if (corredores.length < 2) { /* sozinho: sem líder/lanterna */ }
    else if (h0 && posicao(h0) === 1) { liderT += 0.5; if (liderT > 4 && Math.random() < 0.05) falarSobre('lider', h0); } else liderT = 0;
    if (h0 && corredores.length > 1 && posicao(h0) === corredores.length && tempoCorrida > 25) { lanternaT += 0.5; if (lanternaT > 8 && !lanternaDita) { lanternaDita = true; falarSobre('lanterna', h0); } } else lanternaT = 0;
    if (h0 && FANT && h0.z > 60 * SEG + START_I * SEG) { const tg = tempoFantasma(h0.z); if (tg != null && tempoCorrida - tg > 3 && Math.random() < 0.03) falarSobre('fantasma', h0); }
    if (h0 && h0.vacuo && h0.vacuoDe && h0.vacuoDe.def && Math.random() < 0.08) falarSobre('vacuo', h0, h0.vacuoDe);
  }
  geralT -= dt;
  if (geralT <= 0) {
    geralT = rnd(20, 32);
    const alvo = pick(corredores), quem = falante(alvo), so = alvo.def.id && SOBRE[alvo.def.id], de = quem && quem.def.id && DE[quem.def.id];
    const op = [].concat(so && so.geral || [], de && de.geral || []);
    if (op.length && !radio.atual && !radio.fila.length) radio.fila.push({ quem, texto: pick(op).replace(/\{alvo\}/g, alvo.nome), t: 0 });
  }
  const lider = Math.max.apply(null, humanos.map(h => h.z));
  for (const m of MARCOS) if (!m.feito && lider >= m.z) {
    m.feito = true;
    if (m.fala === 'pedagio') { radio.cd = 0; falarSobre('pedagio', pick(corredores)); }
    else if (m.fala === 'radar_oculto') { radio.cd = 0; falarSobre(m.fala, humanos[0]); }
    else if (m.fala) { radio.cd = 0; falarSobre(m.fala, humanos[0]); }
  }
}

// ============================================================ PARTÍCULAS (por vista, em coordenadas de tela)
let particulas = [[], []];
function emitir(j, tipo, lado) {
  const P = particulas[j]; if (!P || P.length > 160) return;
  const base = { fumaca: { vx: rnd(-10, 10), vy: rnd(-25, -10), vida: 0.9, r: rnd(3, 5), cor: [200, 200, 205] },
    poeira: { vx: rnd(-50, 50), vy: rnd(-40, -10), vida: 0.6, r: rnd(3, 7), cor: [176, 140, 96] },
    spray: { vx: rnd(-60, 60), vy: rnd(-40, -10), vida: 0.5, r: rnd(2, 4), cor: [214, 224, 236] },
    faisca: { vx: (lado || (Math.random() < 0.5 ? -1 : 1)) * rnd(40, 160), vy: rnd(-120, -30), vida: 0.45, r: 1.5, cor: [255, 220, 120] } }[tipo];
  P.push(Object.assign({ tipo, t: 0, ox: rnd(-14, 14), oy: rnd(-4, 0) }, base));
}
function atualizarParticulas(dt) {
  for (let j = 0; j < 2; j++) {
    const P = particulas[j]; for (const p of P) { p.t += dt; p.ox += p.vx * dt; p.oy += p.vy * dt; if (p.tipo === 'faisca') p.vy += 420 * dt; if (p.tipo === 'fumaca') p.r += 8 * dt; }
    particulas[j] = P.filter(p => p.t < p.vida);
    const h = humanos[j]; if (!h || demo) continue;
    if (h.gas && h.v > 0 && Math.random() < 0.35) emitir(j, 'fumaca');
    if (h.fora && h.v > 20 * KMH) for (let i = 0; i < 2; i++) emitir(j, 'poeira');
    if (h.molhado > 0.4 && h.v > 40 * KMH && !h.fora) emitir(j, 'spray');
  }
}

// ============================================================ RENDER
const tmpA = [], tmpB = [];
for (let i = 0; i < DRAW; i++) { tmpA.push({}); tmpB.push({}); }
function poli(g, x1, y1, x2, y2, x3, y3, x4, y4, c) { g.fillStyle = c; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath(); g.fill(); }
function projetar(p, cx, cy, cz, v, kx, ky, o) {
  const camZ = p.z - cz, s = CAMD / camZ;
  o.cz = camZ; o.s = s; o.x = v.w / 2 - s * cx * kx; o.y = v.h / 2 - s * (p.y - cy) * ky; o.w = s * ROAD * kx;
}
function camada(g, img, v, desloc, base, k, alpha) {
  if (!img) return;
  const w = img.width * k, h = img.height * k; if (alpha != null) g.globalAlpha = alpha;
  let x = -((desloc % 1 + 1) % 1) * w; for (; x < v.w; x += w) g.drawImage(img, Math.round(x), Math.round(base - h), Math.ceil(w) + 1, Math.round(h));
  g.globalAlpha = 1;
}
function desenharSprite(g, img, s, k, sx, sy, offX, clipY, esc, ang) {
  const dw = img.width * s * CAMH * k * esc, dh = img.height * s * CAMH * k * esc;
  if (dw < 1 || dh < 1 || dw > 4000) return;
  const dx = sx + dw * offX, dy = sy - dh, corte = clipY != null ? Math.max(0, dy + dh - clipY) : 0;
  if (corte >= dh) return;
  if (ang) { g.save(); g.translate(sx, sy); g.rotate(ang); g.drawImage(img, -dw / 2, -dh, dw, dh); g.restore(); return; }
  const sh = img.height - img.height * corte / dh; if (sh < 1) return;
  g.drawImage(img, 0, 0, img.width, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh - corte));
}
function brilho(g, x, y, r, cor, a) {
  if (!(r > 0)) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, cor.replace('A', a)); gr.addColorStop(1, cor.replace('A', 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function luz(g, x, y, r, cor, a) { g.globalCompositeOperation = 'lighter'; brilho(g, x, y, r, cor, a); g.globalCompositeOperation = 'source-over'; }

function renderVista(vi, v, foco, idx) {
  const [cena, g] = cenas[vi];
  const k = v.h / H, kx = v.h * 0.8889, ky = v.h / 2;
  const camZ = foco.z - PZ, base = segEm(camZ), basePct = (camZ % SEG) / SEG;
  const pseg = segEm(foco.z), ppct = (foco.z % SEG) / SEG;
  const playerY = lerp(pseg.p1.y, pseg.p2.y, ppct), camY = playerY + CAMH, camX = foco.cx;
  const pr = progresso(foco.z); PAL = paleta(lerp(VIAGEM.ceu[0], VIAGEM.ceu[1], pr));
  // clima: chuva e neblina na serra deixam o céu cinza e a névoa mais densa
  foco.chvA = lerp(foco.chvA || 0, demo ? 0 : chuvaEm(foco.z), 0.03); foco.nebA = lerp(foco.nebA || 0, demo ? 0 : nebEm(foco.z), 0.03);
  const chv = foco.chvA, neb = foco.nebA;
  if (chv > 0.01 || neb > 0.01) {
    const q = Math.max(chv * 0.85, neb * 0.6); for (const kk of ['topo', 'base', 'mont', 'morro']) PAL[kk] = mixc(PAL[kk], [118, 126, 138], q);
    PAL.nev = mixc(PAL.nev, [192, 198, 206], Math.max(chv * 0.6, neb)); PAL.g1 = mixc(PAL.g1, [64, 96, 62], chv * 0.35);
  }
  const horiz = v.h / 2, nevCss = css(PAL.nev);
  // ---- céu, sol, nuvens, montanhas
  const gr = g.createLinearGradient(0, 0, 0, horiz + 10); gr.addColorStop(0, css(PAL.topo)); gr.addColorStop(1, css(PAL.base));
  g.fillStyle = gr; g.fillRect(0, 0, v.w, horiz + 10);
  const sx = ((v.w * PAL.sol[0] - foco.bg * 600) % v.w + v.w) % v.w, sy = v.h * PAL.sol[1], sr = PAL.sol[2] * k * 2, sc = PAL.sol[3];
  const solA = clamp(1 - Math.max(chv, neb) * 1.6, 0, 1);
  if (solA > 0) { g.globalAlpha = solA; luz(g, sx, sy, sr * 6, 'rgba(' + (sc[0] | 0) + ',' + (sc[1] | 0) + ',' + (sc[2] | 0) + ',A)', 0.35 * solA);
    g.fillStyle = css(sc); g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); g.globalAlpha = 1; }
  camada(g, ART.nuvens, v, foco.bg * 0.3 + tempoReal * 0.003, horiz * 0.75, k, 0.85 - PAL.tarde * 0.3);
  if (chv > 0.02) { g.fillStyle = 'rgba(78,86,98,' + (chv * 0.5) + ')'; g.fillRect(0, 0, v.w, horiz + 10); }
  camada(g, tingir(ART.mont, mixc(PAL.mont, PAL.nev, 0.35)), v, foco.bg * 0.5, horiz + 2, k);
  camada(g, tingir(ART.mont2, PAL.mont), v, foco.bg * 0.8, horiz + 2, k);
  const cid = pseg.zona === 'cidade' || segEm(foco.z + 60 * SEG).zona === 'cidade';
  foco.cidA = lerp(foco.cidA || 0, cid ? 1 : 0, 0.02);
  if (foco.cidA > 0.02) camada(g, tingir(ART.sky, mixc(PAL.mont, [40, 40, 50], 0.4)), v, foco.bg * 1.1, horiz + 2, k, foco.cidA);
  camada(g, tingir(ART.morro, PAL.morro), v, foco.bg * 1.5, horiz + 2, k);
  if (VIAGEM.basilica && pr > 0.88) { // Basílica surgindo no horizonte
    const a = clamp((pr - 0.88) / 0.08, 0, 1), bw = ART.basilica.width * k * 0.9, bh = ART.basilica.height * k * 0.9;
    g.globalAlpha = a; g.drawImage(tingir(ART.basilica, mixc(PAL.morro, [30, 20, 40], 0.5)), Math.round(v.w * 0.55 - bw / 2), Math.round(horiz + 2 - bh), bw, bh); g.globalAlpha = 1;
  }
  if (neb > 0.02) { g.globalAlpha = neb * 0.8; g.fillStyle = nevCss; g.fillRect(0, 0, v.w, horiz + 4); g.globalAlpha = 1; }
  g.fillStyle = css(PAL.g1); g.fillRect(0, horiz, v.w, v.h - horiz);
  const nevN = n => { const f = n / DRAW; return Math.min(0.98, f * f * 0.8 + neb * Math.min(1, f * 6) * 0.97 + chv * f * 0.25); };
  // ---- estrada
  let maxy = v.h, x = 0, dx = -(base.curva * basePct);
  const lim = Math.min(DRAW, segs.length - base.i);
  const gra = css(PAL.g1);
  for (let n = 0; n < lim; n++) {
    const s = segs[base.i + n], a = tmpA[n], b = tmpB[n];
    projetar(s.p1, camX - x, camY, camZ, v, kx, ky, a);
    projetar(s.p2, camX - x - dx, camY, camZ, v, kx, ky, b);
    x += dx; dx += s.curva; a.clip = maxy;
    if (a.cz <= CAMD || b.y >= a.y || b.y >= maxy) continue;
    const e = s.esc, X = (p, o) => p.x + p.w * o, D = s.tipo === 'D';
    g.fillStyle = gra; g.fillRect(0, Math.floor(b.y), v.w, Math.ceil(a.y) - Math.floor(b.y));
    const asf = chv > 0.35 ? '#4b4c53' : '#5a5b61', acos = chv > 0.35 ? '#404147' : '#4a4b50', lw = 0.022;
    a.y += 1;   // sobreposição de 1 px: elimina as frestas entre segmentos
    if (D) {   // pista dupla: pista contrária do outro lado do canteiro
      poli(g, X(a, -4.0), a.y, X(a, -2.0), a.y, X(b, -2.0), b.y, X(b, -4.0), b.y, asf);
      if (s.faixa) poli(g, X(a, -3 - 0.025), a.y, X(a, -3 + 0.025), a.y, X(b, -3 + 0.025), b.y, X(b, -3 - 0.025), b.y, '#d8d8d8');
    } else poli(g, X(a, -ACOST), a.y, X(a, -1), a.y, X(b, -1), b.y, X(b, -ACOST), b.y, acos);
    if (s.posto || s.pedagio) poli(g, X(a, 1), a.y, X(a, s.posto ? 3.2 : 2.2), a.y, X(b, s.posto ? 3.2 : 2.2), b.y, X(b, 1), b.y, '#8e8e88');
    else poli(g, X(a, 1), a.y, X(a, ACOST), a.y, X(b, ACOST), b.y, X(b, 1), b.y, acos);
    poli(g, X(a, D ? GUARD_X : -1), a.y, X(a, 1), a.y, X(b, 1), b.y, X(b, D ? GUARD_X : -1), b.y, asf);
    poli(g, X(a, 1 - lw), a.y, X(a, 1 + lw), a.y, X(b, 1 + lw), b.y, X(b, 1 - lw), b.y, '#e8e8e8');
    poli(g, X(a, -1 - lw), a.y, X(a, -1 + lw), a.y, X(b, -1 + lw), b.y, X(b, -1 - lw), b.y, D ? '#f0c020' : '#e8e8e8');
    if (D) { if (s.faixa) poli(g, X(a, -lw), a.y, X(a, lw), a.y, X(b, lw), b.y, X(b, -lw), b.y, '#e8e8e8'); }
    else if (Math.abs(s.curva) > 2.5 || s.pedagio) { for (const o of [-0.03, 0.03]) poli(g, X(a, o - lw * 0.7), a.y, X(a, o + lw * 0.7), a.y, X(b, o + lw * 0.7), b.y, X(b, o - lw * 0.7), b.y, '#f0c020'); }
    else if (s.faixa) poli(g, X(a, -lw), a.y, X(a, lw), a.y, X(b, lw), b.y, X(b, -lw), b.y, '#f0c020');
    a.y -= 1;
    if (s.i === START_I || s.i === FIM_I) for (let j = 0; j < 10; j++) { g.fillStyle = j % 2 ? '#fff' : '#111'; g.fillRect(X(a, -1 + j * 0.2), b.y, a.w * 0.2 + 1, Math.max(1, a.y - b.y)); }
    const nev = nevN(n);
    if (nev > 0.02) { const y0 = Math.round(b.y), y1 = Math.round(a.y); if (y1 > y0) { g.globalAlpha = nev; g.fillStyle = nevCss; g.fillRect(0, y0, v.w, y1 - y0); g.globalAlpha = 1; } }
    maxy = b.y;
  }
  // ---- objetos de trás para frente
  const porSeg = new Map();
  const add = (z, o) => { const i = Math.floor(z / SEG) - base.i; if (i > 0 && i < lim) { let l = porSeg.get(i); if (!l) porSeg.set(i, l = []); l.push(o); } };
  for (const t of trafego) add(t.z, { t });
  for (const c of corredores) if (c !== foco) add(c.z, { c });
  if (FANT && !demo && foco.humano === 0 && contagem <= 0) add(fantasmaEm(tempoCorrida).z, { c: fantasmaEm(tempoCorrida) });
  const tarde = PAL.tarde;
  for (let n = lim - 1; n > 0; n--) {
    const s = segs[base.i + n], a = tmpA[n], b = tmpB[n];
    if (a.cz <= CAMD) continue;
    // defensas metálicas (canteiro)
    if (s.tipo === 'D' && b.y < a.clip) {
      const gh = 160 * a.s * ky, gh2 = 160 * b.s * ky;
      for (const o of [GUARD_X, -1.95]) {
        const xa = a.x + a.w * o, xb = b.x + b.w * o;
        poli(g, xa, Math.min(a.y, a.clip), xa, a.y - gh, xb, b.y - gh2, xb, b.y, s.esc ? '#b4bac2' : '#9aa0a8');
        poli(g, xa, a.y - gh * 0.5, xa, a.y - gh * 0.62, xb, b.y - gh2 * 0.62, xb, b.y - gh2 * 0.5, '#6a7078');
      }
    }
    if (s.cancela != null && a.y - 260 * a.s * ky < a.clip) {
      const pago = foco.pag && foco.pag[s.cancela], hy = 105 * a.s * ky, th = Math.max(2, 9 * a.s * ky);
      for (const bxp of [-1.1, 0, 1.1]) { const x0 = a.x + a.w * bxp, cw = 0.16 * a.w; g.fillStyle = '#d8d4cc'; g.fillRect(x0 - cw / 2, a.y - 2.3 * hy, cw, 2.3 * hy); g.fillStyle = '#3a4a5c'; g.fillRect(x0 - cw * 0.38, a.y - 2.0 * hy, cw * 0.76, 0.8 * hy); g.fillStyle = '#1e7a3a'; g.fillRect(x0 - cw / 2, a.y - 2.45 * hy, cw, 0.18 * hy); }
      for (const ln of [-0.5, 0.5]) {
        const px = a.x + a.w * (ln - 0.42), len = a.w * 0.84;
        g.fillStyle = '#222'; g.fillRect(px - th, a.y - hy - th, th * 2, hy + th);
        if (pago) { for (let q = 0; q < 6; q++) { g.fillStyle = q % 2 ? '#fff' : '#d22'; g.fillRect(px - th / 2, a.y - hy - (q + 1) * len / 6, th, len / 6 + 1); } }
        else for (let q = 0; q < 8; q++) { g.fillStyle = q % 2 ? '#fff' : '#d22'; g.fillRect(px + q * len / 8, a.y - hy - th / 2, len / 8 + 1, th); }
      }
    }
    const nvA = neb > 0.05 ? 1 - nevN(n) : 1; if (nvA < 0.03) continue; g.globalAlpha = nvA;
    for (const sp of s.spr) {
      const off = sp.x === 0 || sp.cruza ? -0.5 : sp.x < 0 ? -1 : 0;
      desenharSprite(g, sp.img, a.s, k, a.x + a.s * sp.x * ROAD * kx, a.y, off, a.clip, sp.esc);
    }
    const lst = porSeg.get(n);
    if (lst) {
      lst.sort((p, q) => (q.t || q.c).z - (p.t || p.c).z);
      for (const o of lst) {
        const obj = o.t || o.c, pct = ((obj.z % SEG) + SEG) % SEG / SEG;
        const sc = lerp(a.s, b.s, pct), px = lerp(a.x, b.x, pct) + sc * obj.x * ROAD * kx, py = lerp(a.y, b.y, pct);
        const dw = obj.img.width * sc * CAMH * k, dh = obj.img.height * sc * CAMH * k;
        if (o.t) {
          desenharSprite(g, obj.img, sc, k, px, py, -0.5, a.clip, 1);
          if (py - dh * 0.4 > a.clip) continue;
          if (!obj.oposto && (obj.freio || tarde > 0.4)) { const al = obj.freio ? 0.8 : 0.4; luz(g, px - dw * 0.4, py - dh * 0.35, dw * 0.18, 'rgba(255,40,30,A)', al); luz(g, px + dw * 0.4, py - dh * 0.35, dw * 0.18, 'rgba(255,40,30,A)', al); }
          if (obj.oposto && tarde > 0.3) { luz(g, px - dw * 0.35, py - dh * 0.3, dw * 0.3, 'rgba(255,240,200,A)', tarde * 0.7); luz(g, px + dw * 0.35, py - dh * 0.3, dw * 0.3, 'rgba(255,240,200,A)', tarde * 0.7); }
          if (obj.pisca > 0 && Math.floor(tempoReal * 4) % 2) luz(g, px + (obj.alvoX < obj.x ? -1 : 1) * dw * 0.45, py - dh * 0.4, dw * 0.12, 'rgba(255,170,30,A)', 0.9);
        } else if (obj.fantasma) {
          g.globalAlpha = 0.42 * nvA; desenharSprite(g, obj.img, sc, k, px, py, -0.5, a.clip, 1, obj.lean * 0.42); g.globalAlpha = nvA;
        } else {
          if (obj.abast) continue;
          if (obj.crash > 0.7) { desenharSprite(g, obj.img, sc, k, px, py - dh / 2, -0.5, null, 1, obj.giro); continue; }
          if (obj.crash > 0 && Math.floor(tempoReal * 12) % 2) continue;
          desenharSprite(g, obj.img, sc, k, px, py, -0.5, a.clip, 1, obj.lean * 0.42);
          if ((obj.freando || tarde > 0.5) && py - dh * 0.45 < a.clip) luz(g, px, py - dh * 0.45, dw * 0.3, 'rgba(255,30,20,A)', obj.freando ? 0.8 : 0.35);
        }
      }
    }
  }
  g.globalAlpha = 1;
  if (neb > 0.02) { g.globalAlpha = neb * 0.2; g.fillStyle = nevCss; g.fillRect(0, 0, v.w, v.h); g.globalAlpha = 1; }
  // ---- moto do jogador
  const pc = foco.v / foco.max;
  const bxo = (foco.x * ROAD - camX) * kx / CAMH;
  const bx = v.w / 2 + bxo + (tremor[idx] > 0 ? rnd(-3, 3) : 0), by = v.h - 10 * k - foco.susp * k;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(bx, v.h - 9 * k, 48 * k, 7 * k, 0, 0, 7); g.fill();
  if (!foco.abast) {
    const pisca = foco.crash > 0 && foco.crash <= 0.7 && Math.floor(tempoReal * 12) % 2;
    if (!pisca) {
      const img = foco.img, w = img.width * k, h = img.height * k;
      g.save(); g.translate(bx, by);
      if (foco.crash > 0.7) { g.translate(0, -h / 2); g.rotate(foco.giro); g.drawImage(img, -w / 2, -h / 2, w, h); }
      else { g.rotate(foco.lean * 0.42); g.drawImage(img, -w / 2, -h, w, h); }
      g.restore();
      if (foco.freando || PAL.tarde > 0.5) luz(g, bx, by - h * 0.42, w * 0.35, 'rgba(255,40,30,A)', foco.freando ? 0.85 : 0.35);
    }
  }
  // ---- partículas
  for (const p of particulas[idx]) {
    const a = 1 - p.t / p.vida, px = bx + p.ox * k, py = by - 18 * k + p.oy * k;
    g.globalAlpha = a * (p.tipo === 'fumaca' || p.tipo === 'spray' ? 0.35 : 0.9); g.fillStyle = css(p.cor);
    if (p.tipo === 'faisca') g.fillRect(px, py, 2 * k, 2 * k); else { g.beginPath(); g.arc(px, py, p.r * k, 0, 7); g.fill(); }
  }
  g.globalAlpha = 1;
  // ---- linhas de velocidade e vácuo
  if ((pc > 0.86 || foco.vacuo) && !foco.abast) {
    g.strokeStyle = foco.vacuo ? 'rgba(150,210,255,0.5)' : 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < (foco.vacuo ? 14 : 8); i++) {
      const ang = rnd(0, Math.PI * 2), r1 = rnd(0.55, 0.75) * v.w * 0.5, r2 = r1 + rnd(30, 70) * k;
      g.beginPath(); g.moveTo(v.w / 2 + Math.cos(ang) * r1, horiz + Math.sin(ang) * r1 * 0.6); g.lineTo(v.w / 2 + Math.cos(ang) * r2, horiz + Math.sin(ang) * r2 * 0.6); g.stroke();
    }
  }
  // ---- composição com rolagem de câmera
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  const zoom = 1.08 + pc * 0.03, roll = foco.roll + (tremor[idx] > 0 ? rnd(-0.01, 0.01) : 0);
  ctx.translate(v.x + v.w / 2, v.y + v.h * 0.92); ctx.rotate(roll); ctx.scale(zoom, zoom);
  ctx.drawImage(cena, 0, 0, v.w, v.h, -v.w / 2, -v.h * 0.92, v.w, v.h);
  ctx.restore();
  // chuva caindo + relâmpago + flash do radar
  if (chv > 0.02 && !foco.abast) {
    ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
    ctx.fillStyle = 'rgba(24,34,48,' + (0.24 * chv) + ')'; ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = 'rgba(206,220,240,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
    const nG = (110 * chv) | 0, cx0 = v.x + v.w / 2;
    for (let i = 0; i < nG; i++) { const x = v.x + Math.random() * v.w, y = v.y + Math.random() * v.h, l = (6 + Math.random() * 10) * k * (1 + pc * 1.5); ctx.moveTo(x, y); ctx.lineTo(x + (x - cx0) * 0.04 * pc - l * 0.18, y + l); }
    ctx.stroke(); ctx.restore();
  }
  if (relampago > 0 && !demo) { ctx.fillStyle = 'rgba(235,240,255,' + (relampago > 0.38 || (relampago > 0.18 && relampago < 0.26) ? 0.55 : 0) + ')'; ctx.fillRect(v.x, v.y, v.w, v.h); }
  if (flashT[idx] > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, flashT[idx] * 2.4) + ')'; ctx.fillRect(v.x, v.y, v.w, v.h); }
  ctx.drawImage(ART.vinheta, 0, 0, W, H, v.x, v.y, v.w, v.h);
  if (foco.abast && !demo) cenaAbastecimento(v, foco);
  if (!demo) hud(v, foco, idx);
}

// ============================================================ CENA DO ABASTECIMENTO (vista de cima)
function cenaAbastecimento(v, c) {
  const k = v.h / H, def = c.def;
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  // posto: cobertura iluminada, loja ao fundo e piso de concreto
  const hz = v.y + v.h * 0.42;
  const gf = ctx.createLinearGradient(0, hz, 0, v.y + v.h); gf.addColorStop(0, '#77746e'); gf.addColorStop(1, '#a29f97'); ctx.fillStyle = gf; ctx.fillRect(v.x, hz, v.w, v.y + v.h - hz);
  ctx.fillStyle = '#2b2d33'; ctx.fillRect(v.x, v.y, v.w, hz - v.y);
  ctx.fillStyle = '#d9d5c8'; ctx.fillRect(v.x + v.w * 0.05, v.y + v.h * 0.2, v.w * 0.9, hz - v.y - v.h * 0.2);
  ctx.fillStyle = '#3a4a5c'; for (let i = 0; i < 6; i++) ctx.fillRect(v.x + v.w * (0.08 + i * 0.15), v.y + v.h * 0.25, v.w * 0.12, v.h * 0.13);
  ctx.fillStyle = '#ff6a00'; ctx.fillRect(v.x + v.w * 0.05, v.y + v.h * 0.18, v.w * 0.9, 4 * k);
  ctx.fillStyle = '#141414'; ctx.fillRect(v.x, v.y, v.w, v.h * 0.12);
  for (let i = 0; i < 5; i++) { const lx = v.x + v.w * (0.1 + i * 0.2); ctx.fillStyle = '#fffbe8'; ctx.fillRect(lx, v.y + v.h * 0.09, v.w * 0.1, 3 * k); luz(ctx, lx + v.w * 0.05, v.y + v.h * 0.1, 60 * k, 'rgba(255,250,220,A)', 0.25); }
  txt('POSTO BRMC', v.x + v.w / 2, v.y + v.h * 0.03, '#ff8a2a', k > 0.8 ? 16 : 8, 'c', false);
  ctx.strokeStyle = 'rgba(255,210,40,0.8)'; ctx.lineWidth = 3 * k;
  for (const f of [0.02, 0.66]) { ctx.beginPath(); ctx.moveTo(v.x + v.w * f, v.y + v.h); ctx.lineTo(v.x + v.w * (f * 0.6 + 0.2), hz); ctx.stroke(); }
  // bomba
  const px = v.x + v.w * 0.72, py = v.y + v.h * 0.22, bw = 62 * k, bh = 150 * k;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px + 6 * k, py + bh - 6 * k, bw, 10 * k);
  const gb = ctx.createLinearGradient(px, 0, px + bw, 0); gb.addColorStop(0, '#ff7a1a'); gb.addColorStop(1, '#c44a00'); ctx.fillStyle = gb; ctx.fillRect(px, py, bw, bh);
  ctx.fillStyle = '#111'; ctx.fillRect(px + 6 * k, py + 10 * k, bw - 12 * k, 34 * k);
  const litros = (c.comb - c.abast.ini) / 100 * (def.tanque || 18);
  A.numero7(ctx, String(Math.min(99, Math.floor(litros))).padStart(2, ' '), px + 14 * k, py + 15 * k, 10 * k, 18 * k, 3 * k, '#7dff6a', 'rgba(125,255,106,0.08)');
  txt('L', px + bw - 16 * k, py + 30 * k, '#7dff6a', 8, 'e', false);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(px + 8 * k, py + 54 * k, bw - 16 * k, 18 * k); txt('GASOLINA', px + bw / 2, py + 59 * k, '#c44a00', 8, 'c', false);
  ctx.fillStyle = '#222'; ctx.fillRect(px + bw - 14 * k, py + 82 * k, 10 * k, 26 * k);
  // painel
  const pw = v.w * 0.34, ph = 70 * k, pxx = v.x + v.w * 0.64, pyy = v.y + v.h - ph - 10 * k;
  ctx.fillStyle = 'rgba(6,8,12,0.88)'; ctx.fillRect(pxx, pyy, pw, ph); ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 2; ctx.strokeRect(pxx + 1, pyy + 1, pw - 2, ph - 2);
  txt('ABASTECENDO', pxx + 8 * k, pyy + 8 * k, '#ff8a2a', 8);
  txt((def.cc || '') + ' CC • TANQUE ' + (def.tanque || '?') + ' L', pxx + 8 * k, pyy + 22 * k, '#c8c8d2', 8);
  ctx.fillStyle = '#222'; ctx.fillRect(pxx + 8 * k, pyy + 36 * k, pw - 16 * k, 8 * k);
  const fr = c.comb / 100, gx = ctx.createLinearGradient(pxx, 0, pxx + pw, 0); gx.addColorStop(0, '#ff3a2a'); gx.addColorStop(0.3, '#ffc22a'); gx.addColorStop(1, '#4ef03a');
  ctx.fillStyle = gx; ctx.fillRect(pxx + 8 * k, pyy + 36 * k, (pw - 16 * k) * fr, 8 * k);
  txt(Math.floor(c.comb) + '% • ' + litros.toFixed(1) + ' L', pxx + 8 * k, pyy + 50 * k, '#fff', 8);
  if (c.humano >= 0 && c.abast.t > 0.7 && Math.floor(tempoReal * 2) % 2) txt('ACELERA = SAIR', v.x + v.w / 2, v.y + v.h * 0.14, '#ffe04a', 8, 'c');
  // moto realista + mangueira (camada de alta resolução)
  const foto = IMG[def.foto], fw = v.w * 0.58, fh = foto ? fw * foto.height / foto.width : 0, fx = v.x + v.w * 0.04, fy = v.y + v.h * 0.95 - fh;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(fx + fw / 2, fy + fh - 4 * k, fw * 0.46, 9 * k, 0, 0, 7); ctx.fill();
  ctx.restore();
  hiFoto(foto, fx, fy, fw, fh, 1, false, v);
  const tp = def.tampa || [0.42, 0.3];
  hiMangueira(px + bw - 9 * k, py + 108 * k, fx + fw * tp[0], fy + fh * tp[1], v);
}

// ============================================================ HUD
function msg(s, x, y, cor, tam) {
  ctx.font = tam + 'px ' + A.FONTE; const w = ctx.measureText(s).width;
  ctx.fillStyle = 'rgba(6,8,12,0.7)'; ctx.fillRect(x - w / 2 - 8, y - 6, w + 16, tam + 12);
  txt(s, x, y, cor, tam, 'c');
}
function hud(v, c, idx) {
  const dois = v.h < H, e = dois ? 0.62 : 1, m = dois ? 4 : 8, pos = posicao(c), tot = corredores.length;
  ctx.fillStyle = 'rgba(6,8,12,0.72)'; ctx.fillRect(v.x + m - 4, v.y + m - 4, dois ? 86 : 118, dois ? 34 : 50);
  if (MODO === 'relogio') {   // contra o relógio: diferença para o fantasma
    const tg = FANT && contagem <= 0 ? tempoFantasma(c.z) : null, df = tg != null ? tempoCorrida - tg : null;
    txt(FANT ? 'FANTASMA' : 'SEM RECORDE', v.x + m, v.y + m, '#9ad0ff', 8);
    if (df != null) txt((df > 0 ? '+' : '-') + Math.abs(df).toFixed(1), v.x + m, v.y + m + 14, df > 0 ? '#ff5a4a' : '#4ef03a', 16);
    else txt(FANT ? fmtTempo(FANT.tempo) : 'GRAVANDO', v.x + m, v.y + m + 16, '#c8c8d2', 8);
  } else {
    txt(humanos.length > 1 ? 'P' + (idx + 1) : 'POSIÇÃO', v.x + m, v.y + m, '#9ad0ff', 8);
    txt(pos + 'º', v.x + m, v.y + m + 12, pos === 1 ? '#ffd23a' : '#ffffff', dois ? 16 : 24);
    txt('/' + tot, v.x + m + (dois ? 38 : 58), v.y + m + (dois ? 20 : 28), '#c8c8d2', 8);
  }
  const rw = 150, rx = v.x + v.w - rw - m, ry = v.y + m;
  ctx.fillStyle = 'rgba(6,8,12,0.72)'; ctx.fillRect(rx - 4, ry - 4, rw + 8, dois ? 34 : 44);
  txt(fmtTempo(tempoCorrida), rx + rw, ry, '#fff', dois ? 8 : 16, 'd');
  if (c.penal > 0 && !dois) txt('+' + c.penal + 'S MULTA', rx + rw, ry + 44, '#ff5a4a', 8, 'd');
  txt('KM ' + Math.round(progresso(c.z) * VIAGEM.km), rx, ry + (dois ? 0 : 4), '#ffe04a', 8);
  const by = ry + (dois ? 16 : 24), bw = rw;
  ctx.fillStyle = '#2a2c32'; ctx.fillRect(rx, by + 3, bw, 3);
  ctx.fillStyle = '#ff6a00'; ctx.fillRect(rx, by + 3, bw * progresso(c.z), 3);
  for (const p of POSTOS) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(Math.round(rx + bw * progresso(p.z)) - 1, by, 3, 9); }
  for (const o of corredores) if (o !== c) { ctx.fillStyle = o.humano >= 0 ? '#5ab4ff' : '#ddd'; ctx.fillRect(Math.round(rx + bw * progresso(o.z)), by + 8, 2, 3); }
  ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(rx + bw * progresso(c.z)) - 2, by - 1, 4, 11);
  if (!c.abast) {   // instrumentos no alto: a parte de baixo fica livre para a moto e os botões de toque
    const te = dois ? 0.55 : 0.85;
    A.tacometro(ctx, v.x + v.w - 210 * te - m + 4, v.y + m + (dois ? 34 : 50), te, c.rpm, Math.round(c.v / KMH), c.marcha, c.vacuo, tempoReal);
    A.marcadorComb(ctx, v.x + m - 6, v.y + m + (dois ? 32 : 50), dois ? 0.55 : 0.85, c.comb / 100, tempoReal);
  }
  const cy = v.y + v.h * 0.3, cx = v.x + v.w / 2, T = dois ? 16 : 32;
  // radar à frente: placa de velocidade no alto (pisca vermelho se estiver acima)
  const RD = RADARES.find(r => !r.oculto && !c.radarOk[r.k] && r.z > c.z && r.z - c.z < 110 * SEG);
  if (RD && !c.fim) {
    const acima = c.v / KMH > RD.lim + 7, rr = dois ? 10 : 15, ry2 = v.y + (dois ? 96 : 150), cx = v.x + m + (dois ? 22 : 34);
    ctx.fillStyle = acima && Math.floor(tempoReal * 6) % 2 ? '#ff2a1a' : '#c81e1e'; ctx.beginPath(); ctx.arc(cx, ry2, rr, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, ry2, rr * 0.74, 0, 7); ctx.fill();
    txt(String(RD.lim), cx + 1, ry2 - 4, '#111', 8, 'c', false);
    txt('RADAR', cx, ry2 + rr + 3, acima ? '#ff5a4a' : '#ffd23a', 8, 'c');
  }
  if (c.multaT > 0 && c.multaInfo) msg('MULTADO! ' + c.multaInfo[0] + ' KM/H NUMA ' + c.multaInfo[1] + ' • +5 S', cx, v.y + v.h * 0.42, '#ff5a4a', 8);
  if (contagem > 0) {
    const n = Math.ceil(contagem);
    if (n <= 3) { const esc = 1 + (contagem % 1) * 0.6; ctx.save(); ctx.translate(cx, cy); ctx.scale(esc, esc); txt(String(n), 0, -T, '#ffd23a', T * 2, 'c'); ctx.restore(); }
    else txt('PREPARAR...', cx, cy, '#fff', dois ? 8 : 16, 'c');
  } else if (tempoCorrida < 1.3) txt('VAI!', cx, cy - T / 2, '#4ef03a', T * 1.5, 'c');
  const TP = PEDAGIOS.find(p => p.z > c.z - 30 && !c.pag[p.k]);
  if (TP && !c.fim) {
    const d = TP.z - 60 - c.z;
    const my = v.y + v.h * 0.55;
    if (c.pagT > 0) { msg('PAGANDO NA TAG...', cx, my, '#ffd23a', dois ? 8 : 16); ctx.fillStyle = '#222'; ctx.fillRect(cx - 60, my + 26, 120, 6); ctx.fillStyle = '#4ef03a'; ctx.fillRect(cx - 60, my + 26, 120 * Math.min(1, c.pagT / 1.3), 6); }
    else if (d < 90 * SEG && Math.floor(tempoReal * 2.5) % 2) msg('PEDÁGIO • PARE NA CANCELA', cx, my, '#ffd23a', 8);
  }
  if (c.abriu > 0) msg('CANCELA ABERTA • ACELERA!', cx, v.y + v.h * 0.55, '#4ef03a', dois ? 8 : 16);
  if (c.fim) { txt('CHEGADA!', cx, cy - T / 2, '#fff', T, 'c'); txt(pos + 'º LUGAR  ' + fmtTempo(c.tempo), cx, cy + T * 0.8, '#ffd23a', dois ? 8 : 16, 'c'); }
  else if (c.comb <= 0 && !c.abast) txt('SEM COMBUSTÍVEL!', cx, cy, '#ff3a2a', dois ? 8 : 16, 'c');
  else if (!c.abast) {
    const p = proximoPosto(c.z);
    if (p && p.z0 - c.z < 180 * SEG && p.z0 - c.z > 0 && c.comb < 80 && Math.floor(tempoReal * 2.5) % 2) txt('POSTO À FRENTE • ENCOSTE À DIREITA', cx, cy + 20, '#ffd23a', 8, 'c');
    else if (p && c.z > p.z0 && c.z < p.z1 && c.comb < 95) txt(c.x > 1 ? 'REDUZA PARA ABASTECER' : 'ENCOSTE À DIREITA →', cx, cy + 20, '#ffd23a', 8, 'c');
  }
  if (c.crash > 0.7 && !dois) txt('TOMBOU!', cx, cy, '#ff6a3a', 16, 'c');
}
function hudRadio() {
  const r = radio.atual; if (!r) return;
  const w = 300, h = 50, x = W / 2 - w / 2, y = humanos.length > 1 ? H / 2 - h / 2 : (vertical ? 8 : 40);
  const a = Math.min(Math.min(1, r.t * 6), Math.min(1, (r.dur - r.t) * 5));
  ctx.globalAlpha = Math.max(0, a);
  ctx.fillStyle = 'rgba(8,10,14,0.9)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  const d = r.quem.def, ret = d.retrato && IMG[d.retrato];
  ctx.fillStyle = '#1a2a1e'; ctx.fillRect(x + 5, y + 5, 40, 40);
  if (ret) ctx.drawImage(ret, 12, 2, 40, 40, x + 5, y + 5, 40, 40);
  else { ctx.fillStyle = css(d.cor || [120, 120, 130]); ctx.beginPath(); ctx.arc(x + 25, y + 27, 14, 0, 7); ctx.fill(); ctx.fillStyle = '#1a2a3a'; ctx.fillRect(x + 14, y + 24, 22, 7); }
  txt('RÁDIO • ' + r.quem.nome, x + 52, y + 7, '#ff8a2a', 8, 'e', false);
  const n = Math.floor(r.t * 36), lin = quebrar(r.texto.slice(0, n), 30);
  lin.slice(0, 2).forEach((l, i) => txt(l, x + 52, y + 21 + i * 12, '#fff', 8, 'e', false));
  if (Math.floor(tempoReal * 8) % 2 && n < r.texto.length) { ctx.fillStyle = '#4ef03a'; ctx.fillRect(x + w - 12, y + 8, 5, 5); }
  ctx.globalAlpha = 1;
}
function quebrar(s, n) { const p = s.split(' '), out = []; let l = ''; for (const w of p) { if ((l + ' ' + w).trim().length > n) { out.push(l.trim()); l = w; } else l += ' ' + w; } if (l.trim()) out.push(l.trim()); return out; }

// ============================================================ TELAS
let estado = {}, tempoReal = 0, fade = 0;
function irPara(e) { estado = e; alvosToque = []; fade = 1; e.entrar && e.entrar(); atualizarHTML(); }
function botao(x, y, w, h, rotulo, fn, ativo, cor) {
  alvosToque.push({ x, y, w, h, fn });
  const pulsa = ativo ? 0.5 + Math.sin(tempoReal * 6) * 0.5 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 3, y + 3, w, h);
  const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, ativo ? '#ff8a2a' : (cor || '#2a2e36')); gr.addColorStop(1, ativo ? '#c44a00' : '#15171c');
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = ativo ? 'rgba(255,230,180,' + (0.5 + pulsa * 0.5) + ')' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  txt(rotulo, x + w / 2, y + h / 2 - 4, '#fff', 8, 'c');
}
function fundoEscuro(cor1, cor2) { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, cor1 || '#0d1014'); gr.addColorStop(1, cor2 || '#040506'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
function logo(x, y, esc) {
  const e = IMG.emblema_192, s = 120 * esc, gl = 0.4 + Math.sin(tempoReal * 2) * 0.15;
  luz(ctx, x, y, s * 0.95, 'rgba(255,106,0,A)', gl);
  if (e) ctx.drawImage(e, x - s / 2, y - s / 2, s, s);
}

function telaCarregando() {
  let prog = 0;
  return { nome: 'carregando', setProg(p) { prog = p; }, render() {
    fundoEscuro(); txt('BLACK ROCK MC', W / 2, 150, '#ff6a00', 16, 'c'); txt('CARREGANDO...', W / 2, 180, '#888', 8, 'c');
    ctx.fillStyle = '#222'; ctx.fillRect(W / 2 - 120, 200, 240, 6); ctx.fillStyle = '#ff6a00'; ctx.fillRect(W / 2 - 120, 200, 240 * prog, 6);
  } };
}
function telaAbertura() {
  return {
    nome: 'abertura',
    entrar() { novaCorrida([], true); },
    toqueGeral() { SOM.iniciar(); SOM.confirma(); irPara(telaTitulo()); },
    update(dt) { atualizarCorrida(dt); if (apertou(0, 'acel')) { SOM.iniciar(); irPara(telaTitulo()); } },
    render() {
      renderVista(0, { x: 0, y: 0, w: W, h: H }, corredores[0], 0);   // estrada animada ao fundo
      const gd = ctx.createLinearGradient(0, 0, 0, H); gd.addColorStop(0, 'rgba(0,0,0,0.8)'); gd.addColorStop(0.5, 'rgba(0,0,0,0.4)'); gd.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = gd; ctx.fillRect(0, 0, W, H);
      luz(ctx, W / 2, 140, 260, 'rgba(255,106,0,A)', 0.18 + Math.sin(tempoReal * 2) * 0.06);
      logo(W / 2, 120, 1.15);
      txt('BLACK ROCK MC', W / 2, 205, '#fff', 32, 'c', '#7a2a00');
      txt('THE GAME', W / 2, 245, '#ff6a00', 16, 'c');
      if (Math.floor(tempoReal * 2) % 2) txt('TOQUE PARA COMEÇAR', W / 2, 296, '#ffd23a', 16, 'c');
      txt('MELHOR COM SOM LIGADO', W / 2, 330, '#777', 8, 'c');
    }
  };
}
const MENU = [
  ['VIAGEM COMPLETA', 'ITAÚNA → APARECIDA • 450 KM CONTRA A TURMA', () => iniciarModo('viagem')],
  ['TOMAR UM CAFEZINHO', 'PASSEIO CURTO PELA SERRA • 1 MINUTO', () => iniciarModo('cafe')],
  ['CONTRA O RELÓGIO', 'SOZINHO CONTRA O SEU FANTASMA', () => iniciarModo('relogio')],
  ['2 JOGADORES', 'TELA DIVIDIDA • O CELULAR DO AMIGO VIRA CONTROLE', () => { MODO = 'viagem'; usarViagem(VIAGENS[0]); doisJogadores(); }],
  ['RECORDES', 'RANKING E CONQUISTAS', () => irPara(telaRecordes())],
  ['OPÇÕES', 'MÚSICA, EFEITOS E VIBRAÇÃO', () => irPara(telaOpcoes())]
];
let menuSel = params.get('cafe') === '1' ? 1 : 0;
function iniciarModo(m) { MODO = m; usarViagem(m === 'cafe' ? VIAGENS[1] : VIAGENS[0]); irPara(telaSelecao(1)); }
function telaTitulo() {
  return {
    nome: 'titulo',
    entrar() { const nova = usarViagem(VIAGENS[0]); if (nova || !demo || !corredores.length) novaCorrida([], true); SOM.tocarMusica('menu'); },
    update(dt) {
      atualizarCorrida(dt);
      if (apertou(0, 'esq')) { menuSel = (menuSel + MENU.length - 1) % MENU.length; SOM.clique(); }
      if (apertou(0, 'dir')) { menuSel = (menuSel + 1) % MENU.length; SOM.clique(); }
      if (apertou(0, 'acel') || apertou(1, 'acel')) { SOM.confirma(); MENU[menuSel][2](); }
    },
    render() {
      renderVista(0, { x: 0, y: 0, w: W, h: H }, corredores[0], 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.78)'); g.addColorStop(0.5, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.88)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      logo(W / 2, 76, 0.9 + Math.sin(tempoReal * 1.5) * 0.02);
      txt('BLACK ROCK MC', W / 2, 140, '#ffffff', 32, 'c', '#7a2a00');
      txt('THE GAME', W / 2, 180, '#ff6a00', 16, 'c');
      alvosToque = [];
      MENU.forEach(([r, , fn], i) => botao(27 + (i % 3) * 198, 216 + Math.floor(i / 3) * 38, 190, 30, r, () => { menuSel = i; SOM.confirma(); fn(); }, i === menuSel, i === 1 ? '#4a2c16' : null));
      txt(p2Conectado ? 'JOGADOR 2 CONECTADO' : MENU[menuSel][1], W / 2, 304, p2Conectado ? '#4ef03a' : '#c8c8d2', 8, 'c');
      const nc = Object.keys(guardar.ler('conquistas', {})).length;
      txt('CONQUISTAS ' + nc + '/' + CONQUISTAS.length, 10, H - 14, '#8a8a92', 8, 'e', false);
      if (Math.floor(tempoReal * 1.5) % 2) txt('TOQUE EM UMA OPÇÃO', W / 2, 326, '#ffd23a', 8, 'c');
      txt('v3.0', W - 8, H - 14, '#666', 8, 'd', false);
    }
  };
}
function doisJogadores() { if (DEV2P || p2Conectado) { irPara(telaSelecao(2)); return; } abrirConvite(); }
function telaOpcoes() {
  let sel = 0;
  const ops = () => [['MÚSICA: ' + (SOM.musicaOn ? 'SIM' : 'NÃO'), () => SOM.alternarMusica()], ['EFEITOS: ' + (SOM.efeitosOn ? 'SIM' : 'NÃO'), () => SOM.alternarEfeitos()],
    ['VIBRAR: ' + (guardar.ler('vibrar', true) ? 'SIM' : 'NÃO'), () => guardar.gravar('vibrar', !guardar.ler('vibrar', true))], ['VOLTAR', () => irPara(telaTitulo())]];
  return {
    nome: 'opcoes',
    update() { const o = ops(); if (apertou(0, 'esq')) sel = (sel + o.length - 1) % o.length; if (apertou(0, 'dir')) sel = (sel + 1) % o.length; if (apertou(0, 'acel')) { SOM.confirma(); o[sel][1](); } if (apertou(0, 'freio')) irPara(telaTitulo()); },
    render() {
      fundoEscuro(); logo(W / 2, 64, 0.6); txt('OPÇÕES', W / 2, 120, '#fff', 24, 'c'); alvosToque = [];
      ops().forEach(([r, fn], i) => botao(W / 2 - 150, 162 + i * 42, 300, 32, r, () => { sel = i; SOM.confirma(); fn(); }, i === sel));
    }
  };
}
function telaSelecao(n) {
  const st = { sel: [0, Math.min(1, PERSONAGENS.length - 1)], ok: [false, false], anim: [0, 0] };
  const mudar = (j, d) => { if (st.ok[j]) return; st.sel[j] = (st.sel[j] + d + PERSONAGENS.length) % PERSONAGENS.length; st.anim[j] = 0; SOM.clique(); };
  const conf = j => { if (st.ok[j]) return; st.ok[j] = true; SOM.confirma(); };
  return {
    nome: 'selecao',
    update(dt) {
      st.anim[0] += dt; st.anim[1] += dt;
      for (let j = 0; j < n; j++) { if (apertou(j, 'esq')) mudar(j, -1); if (apertou(j, 'dir')) mudar(j, 1); if (apertou(j, 'acel')) conf(j); if (apertou(j, 'freio')) { if (st.ok[j]) st.ok[j] = false; else if (j === 0) irPara(telaTitulo()); } }
      if (st.ok.slice(0, n).every(Boolean)) irPara(telaRota(st.sel.slice(0, n)));
    },
    render() {
      alvosToque = []; fundoEscuro('#14181e', '#050608');
      for (let j = 0; j < n; j++) {
        const v = n === 1 ? { x: 0, w: W } : { x: j * W / 2, w: W / 2 }, p = PERSONAGENS[st.sel[j]], cx = v.x + v.w / 2, an = Math.min(1, st.anim[j] * 2.5);
        luz(ctx, n === 1 ? 190 : cx, 210, n === 1 ? 210 : 150, 'rgba(255,170,90,A)', 0.18);
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(v.x, 262, v.w, 98);
        const foto = IMG[p.foto], fw = n === 1 ? 330 : 236, fh = foto ? fw * foto.height / foto.width : 0;
        const fx = n === 1 ? 170 - fw / 2 + (1 - an) * -40 : cx - fw / 2, fy = (n === 1 ? 270 : 252) - fh;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(fx + fw / 2, fy + fh - 3, fw * 0.46, 7, 0, 0, 7); ctx.fill();
        hiFoto(foto, fx, fy, fw, fh, an, true);
        const ret = p.retrato && IMG[p.retrato], rx = n === 1 ? 344 : v.x + 10, ry = n === 1 ? 40 : 30, rs = n === 1 ? 128 : 64;
        ctx.fillStyle = '#ff6a00'; ctx.fillRect(rx - 3, ry - 3, rs + 6, rs + 6);
        const gr = ctx.createLinearGradient(0, ry, 0, ry + rs); gr.addColorStop(0, '#2a3a4a'); gr.addColorStop(1, '#10161e'); ctx.fillStyle = gr; ctx.fillRect(rx, ry, rs, rs);
        if (ret) ctx.drawImage(ret, rx, ry, rs, rs);
        const temOuro = guardar.ler('ouro_' + p.id, false);
        if (temOuro) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(rx + rs - 2, ry + 2, n === 1 ? 11 : 8, 0, 7); ctx.fill(); txt('★', rx + rs - 2, ry - 3, '#7a4a00', 8, 'c', false); }
        const tx = rx + rs + (n === 1 ? 8 : 10);
        txt(n === 1 ? 'PILOTO' : 'JOGADOR ' + (j + 1), tx, ry + 2, j ? '#5ab4ff' : '#ff8a2a', 8);
        txt(p.nome, tx, ry + 16, '#fff', 16);
        txt(p.moto, tx, ry + 40, '#c8c8d2', 8);
        txt(p.cc + ' CC • ' + p.tanque + ' L', tx, ry + 54, '#9a9aa4', 8);
        txt('PERFIL: ' + p.perfil, tx, ry + (n === 1 ? 70 : 66), p.perfil === 'ROIA' ? '#5ab4ff' : '#ff4a2a', 8);
        if (n === 1) txt('ABASTECE EM ' + tempoTanque(p).toFixed(1) + ' S', tx, ry + 86, '#9a9aa4', 8);
        const est = [['VELOCIDADE', (p.vel - 170) / 70], ['ACELERAÇÃO', p.acel], ['ECONOMIA', p.economia], ['CURVAS', p.curva]];
        const sx = n === 1 ? 344 : v.x + 14, sy = n === 1 ? 186 : 262, bw = n === 1 ? 284 : v.w - 28;
        est.forEach(([r, f], i) => {
          const yy = sy + i * (n === 1 ? 16 : 11);
          txt(r, sx, yy, '#9a9aa4', 8, 'e', false);
          const bx = sx + 96; ctx.fillStyle = '#1e2228'; ctx.fillRect(bx, yy + 1, bw - 96, 6);
          const gx = ctx.createLinearGradient(bx, 0, bx + bw - 96, 0); gx.addColorStop(0, '#c44a00'); gx.addColorStop(1, '#ffb02a');
          ctx.fillStyle = gx; ctx.fillRect(bx, yy + 1, (bw - 96) * f * an, 6);
        });
        if (n === 1 && temOuro) botao(344, 252, 284, 22, 'CAPACETE: ' + (usaOuro(p) ? 'DOURADO ★' : 'ORIGINAL'), () => { guardar.gravar('usarOuro_' + p.id, !usaOuro(p)); SOM.clique(); }, false, usaOuro(p) ? '#7a5a10' : null);
        if (!st.ok[j]) {
          if (j === 0) {
            const by = n === 1 ? 314 : 320;
            botao(v.x + 12, by, 44, 30, '<', () => mudar(0, -1));
            botao(v.x + v.w - 56, by, 44, 30, '>', () => mudar(0, 1));
            botao(cx - 80, by, 160, 30, 'CONFIRMAR', () => conf(0), true);
          } else txt('USE O CELULAR DO P2', cx, 332, '#9a9aa4', 8, 'c');
        } else txt('PRONTO!', cx, 326, '#4ef03a', 16, 'c');
      }
      if (n > 1) { ctx.fillStyle = '#ff6a00'; ctx.fillRect(W / 2 - 1, 26, 2, H - 34); }
      txt('ESCOLHA SEU PILOTO', W / 2, n === 1 ? 10 : 8, '#ff8a2a', n === 1 ? 16 : 8, 'c');
      if (n === 1) txt(MODO === 'cafe' ? 'TOMAR UM CAFEZINHO' : MODO === 'relogio' ? 'CONTRA O RELÓGIO' : 'VIAGEM COMPLETA', 170, 36, '#9ad0ff', 8, 'c');
      botao(8, 8, 70, 22, 'VOLTAR', () => irPara(telaTitulo()));
    }
  };
}
function iconeClima(x, y, tipo, e) {
  e = e || 1;
  if (tipo === 'sol') { luz(ctx, x, y, 22 * e, 'rgba(255,210,80,A)', 0.6); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x, y, 9 * e, 0, 7); ctx.fill(); return; }
  ctx.fillStyle = tipo === 'chuva' ? '#9aa4b4' : '#c8ccd4';
  for (const [dx, dy, r] of [[-8, 2, 7], [0, -3, 9], [9, 2, 7]]) { ctx.beginPath(); ctx.arc(x + dx * e, y + dy * e, r * e, 0, 7); ctx.fill(); }
  ctx.fillRect(x - 15 * e, y + 2 * e, 30 * e, 7 * e);
  if (tipo === 'chuva') { ctx.fillStyle = '#5ab4ff'; for (let i = 0; i < 4; i++) ctx.fillRect(x + (-12 + i * 7) * e, y + (12 + (i % 2) * 3) * e, 2 * e, 5 * e); }
  else { ctx.fillStyle = 'rgba(220,224,230,0.8)'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 16 * e, y + (12 + i * 5) * e, 32 * e, 2 * e); }
}
const TXT_CLIMA = { sol: ['SOL', 'PISTA SECA'], chuva: ['CHUVA NA SERRA', 'PISTA MOLHADA: FREIA ANTES'], neblina: ['NEBLINA NA SERRA', 'VISIBILIDADE BAIXA'] };
function telaRota(escolhas) {
  let t = 0;
  CLIMA = sortearClima();
  const v = VIAGEM, mp = v.mapa;
  // projeta o mapa na área livre (ajuste automático para qualquer viagem)
  const la = mp.map(q => q[1]), lo = mp.map(q => q[2]);
  const dLa = Math.max(0.12, Math.max(...la) - Math.min(...la)), dLo = Math.max(0.12, Math.max(...lo) - Math.min(...lo));
  const esc = Math.min(260 / dLo, 200 / dLa), cLa = (Math.max(...la) + Math.min(...la)) / 2, cLo = (Math.max(...lo) + Math.min(...lo)) / 2;
  const pts = mp.map(([nome, a, o, lado]) => [nome, 330 + (o - cLo) * esc, 200 - (a - cLa) * esc, lado]);
  const recRel = guardar.ler('recorde_' + v.id + '_relogio', null);
  const partir = () => { if (t > 1.2) { novaCorrida(escolhas, false); irPara(telaCorrida()); } };
  return {
    nome: 'rota', toqueGeral: partir,
    update(dt) { t += dt; if (apertou(0, 'acel') || apertou(1, 'acel')) partir(); if (apertou(0, 'freio')) irPara(telaSelecao(escolhas.length)); },
    render() {
      fundoEscuro('#0b1622', '#03060a');
      ctx.strokeStyle = 'rgba(90,180,255,0.07)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      txt(MODO === 'relogio' ? 'CONTRA O RELÓGIO' : v.nome, 24, 18, '#ff8a2a', 8); txt(v.titulo, 24, 32, '#fff', 16);
      txt(v.km + ' KM • ' + v.sub, 24, 56, '#9ad0ff', 8);
      txt(v.info, 24, 70, '#9a9aa4', 8);
      if (MODO === 'relogio') txt(recRel ? 'FANTASMA: ' + fmtTempo(recRel) : 'SEM RECORDE: CRIE SEU FANTASMA!', 24, 84, '#c8a0ff', 8);
      // previsão do tempo
      const tc = TXT_CLIMA[CLIMA.tipo] || TXT_CLIMA.sol;
      ctx.fillStyle = 'rgba(6,10,16,0.85)'; ctx.fillRect(24, 262, 200, 62); ctx.strokeStyle = 'rgba(90,180,255,0.4)'; ctx.strokeRect(24.5, 262.5, 199, 61);
      txt('PREVISÃO', 34, 270, '#9ad0ff', 8); iconeClima(54, 300, CLIMA.tipo); txt(tc[0], 84, 286, '#fff', 8); txt(tc[1], 84, 302, '#c8c8d2', 8);
      const prog = clamp(t / 2.4, 0, 1), nseg = (pts.length - 1) * prog;
      ctx.save(); ctx.shadowColor = '#ff6a00'; ctx.shadowBlur = 10; ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= Math.floor(nseg) && i < pts.length; i++) { const p = pts[i]; if (i === 0) ctx.moveTo(p[1], p[2]); else ctx.lineTo(p[1], p[2]); }
      const i0 = Math.floor(nseg), fr = nseg - i0; if (i0 < pts.length - 1) { const a = pts[i0], b = pts[i0 + 1]; ctx.lineTo(lerp(a[1], b[1], fr), lerp(a[2], b[2], fr)); }
      ctx.stroke(); ctx.restore();
      pts.forEach((p, i) => {
        if (i > nseg + 0.01) return;
        const fim = i === 0 || i === pts.length - 1;
        ctx.fillStyle = fim ? '#ffd23a' : '#fff'; ctx.fillRect(p[1] - (fim ? 4 : 2), p[2] - (fim ? 4 : 2), fim ? 8 : 4, fim ? 8 : 4);
        const esq = p[3][0] === 'e', dy = p[3].length > 1 ? (p[3][1] === 'b' ? 8 : -12) : -4; txt(p[0], p[1] + (esq ? -8 : 8), p[2] + dy, fim ? '#ffd23a' : '#c8c8d2', 8, esq ? 'd' : 'e');
      });
      if (prog >= 1) {
        const u = pts[pts.length - 1];
        if (v.basilica) ctx.drawImage(tingir(ART.basilica, [255, 200, 120]), u[1] - 190, u[2] - 40, 84, 44);
        else xicara(u[1] + 40, u[2] + 22, 1.4);
      }
      if (t > 1.2 && Math.floor(tempoReal * 2) % 2) txt('TOQUE PARA PARTIR', W - 20, H - 26, '#ffd23a', 16, 'd');
    }
  };
}
// xícara de café (pixel art desenhada)
function xicara(x, y, e) {
  ctx.fillStyle = '#f2ede4'; ctx.fillRect(x - 12 * e, y - 10 * e, 22 * e, 16 * e); ctx.fillRect(x - 9 * e, y + 6 * e, 16 * e, 3 * e);
  ctx.strokeStyle = '#f2ede4'; ctx.lineWidth = 3 * e; ctx.beginPath(); ctx.arc(x + 12 * e, y - 2 * e, 5 * e, -1.4, 1.4); ctx.stroke();
  ctx.fillStyle = '#5a3418'; ctx.fillRect(x - 10 * e, y - 9 * e, 18 * e, 3 * e); ctx.fillStyle = '#d8d2c6'; ctx.fillRect(x - 16 * e, y + 9 * e, 30 * e, 2 * e);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5 * e;
  for (const dx of [-5, 1]) { ctx.beginPath(); const ph = tempoReal * 3 + dx; ctx.moveTo(x + dx * e, y - 13 * e); ctx.quadraticCurveTo(x + (dx + Math.sin(ph) * 4) * e, y - 19 * e, x + dx * e, y - 25 * e); ctx.stroke(); }
}
function telaCorrida() {
  return {
    nome: 'corrida',
    entrar() { SOM.tocarMusica('jogo'); },
    update(dt) { atualizarCorrida(dt); },
    render() {
      if (humanos.length > 1) {
        renderVista(1, { x: 0, y: 0, w: W, h: H / 2 }, humanos[0], 0);
        renderVista(2, { x: 0, y: H / 2, w: W, h: H / 2 }, humanos[1], 1);
        ctx.fillStyle = '#000'; ctx.fillRect(0, H / 2 - 1, W, 2);
      } else renderVista(0, { x: 0, y: 0, w: W, h: H }, humanos[0], 0);
      hudRadio();
      alvosToque = [];
      if (pausado) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H); txt('PAUSA', W / 2, 90, '#fff', 32, 'c');
        botao(W / 2 - 110, 150, 220, 32, 'CONTINUAR', () => alternarPausa(), true);
        botao(W / 2 - 110, 192, 220, 32, 'REINICIAR VIAGEM', () => { const e = humanos.map(h => PERSONAGENS.indexOf(h.def)); novaCorrida(e, false); irPara(telaCorrida()); });
        botao(W / 2 - 110, 234, 220, 32, 'MENU PRINCIPAL', () => { SOM.silenciar(); SOM.bomba(false); irPara(telaTitulo()); });
      }
    }
  };
}
// ============================================================ CONQUISTAS
const avisos = { fila: [], atual: null };
function desbloquear(id, def) {
  const c = CONQUISTAS.find(q => q.id === id); if (!c) return;
  const feitas = guardar.ler('conquistas', {});
  if (!feitas[id]) { feitas[id] = Date.now(); guardar.gravar('conquistas', feitas); avisos.fila.push({ t1: 'CONQUISTA DESBLOQUEADA!', t2: c.nome, t: 0 }); }
  if (c.premio === 'ouro' && def && !guardar.ler('ouro_' + def.id, false)) { guardar.gravar('ouro_' + def.id, true); avisos.fila.push({ t1: 'PRÊMIO: CAPACETE DOURADO', t2: def.nome, t: 0, ouro: true }); }
}
function checarConquistas(fantasmaBatido) {
  if (demo) return;
  for (const h of humanos) {
    const pos = posicao(h), d = h.def;
    if (MODO === 'viagem') {
      desbloquear('romeiro');
      if (pos === 1) { desbloquear('mcnamara', d); guardar.gravar('venceu_' + d.id, true); if (PERSONAGENS.every(p => guardar.ler('venceu_' + p.id, false))) desbloquear('trinca'); }
      if (!h.multas) desbloquear('cidadao');
    }
    if (MODO === 'cafe' && pos === 1) desbloquear('cafe');
    if (!h.batidas) desbloquear('liso');
    if (CLIMA.tipo === 'chuva') desbloquear('pato');
    if (CLIMA.tipo === 'neblina') desbloquear('neblina');
    if (h.multas >= 3) desbloquear('cnh');
    if (h.abastecidas >= 2) desbloquear('frentista');
    if (h.buzinas >= 15) desbloquear('bibi');
    if (corredores.length > 1 && pos === corredores.length) desbloquear('roia');
  }
  if (fantasmaBatido) desbloquear('fantasma');
}
function desenharAvisos(dt) {
  if (!avisos.atual && avisos.fila.length) { avisos.atual = avisos.fila.shift(); SOM.conquista && SOM.conquista(); }
  const a = avisos.atual; if (!a) return;
  a.t += dt; if (a.t > 3.4) { avisos.atual = null; return; }
  const y = Math.min(8, -50 + a.t * 260) - Math.max(0, a.t - 3.0) * 160, w = 300, x = W / 2 - w / 2;
  ctx.fillStyle = 'rgba(10,8,4,0.94)'; ctx.fillRect(x, y, w, 42); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, 40);
  luz(ctx, x + 22, y + 21, 26, 'rgba(255,200,60,A)', 0.5); trofeu(x + 22, y + 21, a.ouro);
  txt(a.t1, x + 44, y + 8, '#ffd23a', 8, 'e', false); txt(a.t2, x + 44, y + 22, '#fff', 8, 'e', false);
}
function trofeu(x, y, capacete) {
  ctx.fillStyle = '#ffd23a';
  if (capacete) { ctx.beginPath(); ctx.arc(x, y, 10, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 10, y, 20, 6); ctx.fillStyle = '#3a2a10'; ctx.fillRect(x - 7, y - 3, 14, 4); return; }
  ctx.fillRect(x - 8, y - 10, 16, 10); ctx.fillRect(x - 3, y, 6, 6); ctx.fillRect(x - 7, y + 6, 14, 3);
  ctx.fillRect(x - 12, y - 9, 4, 6); ctx.fillRect(x + 8, y - 9, 4, 6); ctx.fillStyle = '#fff6c8'; ctx.fillRect(x - 5, y - 8, 2, 6);
}

// ============================================================ RANKING (local + online opcional)
const RANK = {
  online: !!(RANKING_ONLINE.url && RANKING_ONLINE.chave),
  local(modo) { return guardar.ler('rank_' + modo, []); },
  entra(modo, t) { const l = RANK.local(modo); return l.length < 10 || t < l[l.length - 1].t; },
  add(modo, e) { const l = RANK.local(modo); l.push(e); l.sort((a, b) => a.t - b.t); guardar.gravar('rank_' + modo, l.slice(0, 10)); RANK.enviar(modo, e); },
  cab() { return { apikey: RANKING_ONLINE.chave, Authorization: 'Bearer ' + RANKING_ONLINE.chave, 'Content-Type': 'application/json' }; },
  enviar(modo, e) {
    if (!RANK.online) return;
    fetch(RANKING_ONLINE.url + '/rest/v1/ranking', { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, RANK.cab()),
      body: JSON.stringify({ modo, nome: e.n, piloto: e.p, tempo: Math.round(e.t * 10) / 10, multas: e.m || 0 }) }).catch(() => {});
  },
  buscar(modo) {
    return fetch(RANKING_ONLINE.url + '/rest/v1/ranking?select=nome,piloto,tempo,multas&modo=eq.' + modo + '&order=tempo.asc&limit=10', { headers: RANK.cab() })
      .then(r => r.json()).then(a => a.map(x => ({ n: x.nome, p: x.piloto, t: x.tempo, m: x.multas })));
  }
};
const elNome = document.getElementById('nome-modal'), inNome = document.getElementById('nome-input');
function pedirNome(info, aoSalvar) {
  document.getElementById('nome-info').textContent = info;
  inNome.value = guardar.ler('apelido', '') || ''; elNome.classList.add('on'); setTimeout(() => { try { inNome.focus(); } catch (e) {} }, 60);
  const fechar = salvar => {
    elNome.classList.remove('on'); document.getElementById('nome-salvar').onclick = document.getElementById('nome-pular').onclick = inNome.onkeydown = null;
    if (salvar) { const n = (inNome.value || '').toUpperCase().replace(/[^A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ ._-]/g, '').trim().slice(0, 10); if (n) { guardar.gravar('apelido', n); aoSalvar(n); } }
  };
  document.getElementById('nome-salvar').onclick = () => fechar(true);
  document.getElementById('nome-pular').onclick = () => fechar(false);
  inNome.onkeydown = e => { if (e.key === 'Enter') fechar(true); e.stopPropagation(); };
}

// ============================================================ IMAGEM PARA COMPARTILHAR (WhatsApp / Instagram)
const qrCache = {};
function qrCanvas(texto, tam) {
  const k = texto + tam; if (qrCache[k]) return qrCache[k];
  if (typeof QRCode === 'undefined') return null;
  const div = document.createElement('div');
  try { new QRCode(div, { text: texto, width: tam, height: tam, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); } catch (e) { return null; }
  return (qrCache[k] = div.querySelector('canvas'));
}
// QR do link oficial já vem pronto em hd/qr_jogo.png (funciona offline); se faltar, gera na hora
const qrJogo = tam => IMG.qr_jogo && IMG.qr_jogo.width > 8 ? IMG.qr_jogo : qrCanvas(LINK_JOGO, tam);
function gerarCartao(h, pos, tit) {
  const CW = 1080, CH = 1350, [c, g] = A.mk(CW, CH), F = n => n + 'px ' + A.FONTE, d = h.def;
  const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, '#120c24'); gr.addColorStop(0.55, '#4a1e2a'); gr.addColorStop(0.8, '#ff7a3a'); gr.addColorStop(1, '#2a1018');
  g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
  const gl = g.createRadialGradient(CW / 2, 300, 20, CW / 2, 300, 520); gl.addColorStop(0, 'rgba(255,120,30,0.45)'); gl.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gl; g.fillRect(0, 0, CW, CH);
  g.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = 0; y < CH; y += 6) g.fillRect(0, y, CW, 2);
  g.imageSmoothingEnabled = false; if (IMG.emblema_192) g.drawImage(IMG.emblema_192, CW / 2 - 130, 40, 260, 260);
  const T = (s, x, y, cor, n, al) => { g.font = F(n); g.textAlign = al || 'center'; g.textBaseline = 'top'; let w = g.measureText(s).width; if (w > CW - 80) { n = Math.floor(n * (CW - 80) / w); g.font = F(n); }
    g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillText(s, x + n / 8, y + n / 8); g.fillStyle = cor; g.fillText(s, x, y); };
  T('BLACK ROCK MC', CW / 2, 320, '#ffffff', 64); T('THE GAME', CW / 2, 404, '#ff6a00', 32);
  T(tit, CW / 2, 476, '#9ad0ff', 24); T(VIAGEM.titulo, CW / 2, 516, '#ffffff', 24);
  const foto = IMG[d.foto];
  if (foto) { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; const fw = 820, fh = fw * foto.height / foto.width;
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(CW / 2 + 60, 590 + fh - 8, fw * 0.45, 22, 0, 0, 7); g.fill(); g.drawImage(foto, CW / 2 - fw / 2 + 60, 590, fw, fh); }
  const ret = IMG[d.retrato]; g.imageSmoothingEnabled = false;
  g.fillStyle = h.ouro ? '#ffd23a' : '#ff6a00'; g.fillRect(52, 572, 216, 216); g.fillStyle = '#1a2430'; g.fillRect(60, 580, 200, 200); if (ret) g.drawImage(ret, 60, 580, 200, 200);
  T(d.nome, 160, 800, '#ffffff', 32); T(d.moto, 160, 846, '#c8c8d2', 16);
  const yb = 980; g.fillStyle = 'rgba(6,8,12,0.78)'; g.fillRect(40, yb, CW - 80, 230); g.strokeStyle = '#ff6a00'; g.lineWidth = 6; g.strokeRect(43, yb + 3, CW - 86, 224);
  T(MODO === 'relogio' ? 'TEMPO' : pos + 'º LUGAR', 330, yb + 30, pos === 1 || MODO === 'relogio' ? '#ffd23a' : '#ffffff', 56);
  T(fmtTempo(h.tempo), 330, yb + 110, '#ffffff', 48);
  T(plural(h.multas, 'MULTA') + ' • ' + plural(h.batidas, 'TOMBO'), 330, yb + 178, '#ff9a6a', 16);
  const qr = qrJogo(180);
  if (qr) { g.fillStyle = '#fff'; g.fillRect(CW - 280, yb + 18, 196, 196); g.drawImage(qr, CW - 272, yb + 26, 180, 180); }
  T('JOGUE TAMBÉM! APONTE A CÂMERA', CW / 2, 1240, '#ffd23a', 16); T(LINK_JOGO.replace(/^https?:\/\//, ''), CW / 2, 1276, '#ffffff', 16);
  T('MOTO CLUBE • ITAÚNA-MG', CW / 2, 1310, '#9a9aa4', 16);
  return new Promise(ok => { try { c.toBlob(b => ok(b), 'image/png'); } catch (e) { ok(null); } });
}
function compartilhar(blob) {
  if (!blob) { avisar('PREPARANDO A IMAGEM...'); return; }
  const arq = new File([blob], 'black-rock-mc-resultado.png', { type: 'image/png' }), texto = 'Black Rock MC - The Game 🏍️ Bora correr com a gente: ' + LINK_JOGO;
  if (navigator.canShare && navigator.canShare({ files: [arq] })) { navigator.share({ files: [arq], text: texto, title: 'Black Rock MC - The Game' }).catch(() => {}); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = arq.name; document.body.appendChild(a); a.click(); a.remove(); avisar('IMAGEM SALVA!');
}

// ============================================================ RESULTADO
function telaResultado() {
  const est = c => c.fim ? c.tempo : tempoCorrida + c.penal + (FIM_Z - c.z) / (c.max * 0.8);
  const ordem = corredores.slice().sort((a, b) => est(a) - est(b));
  const chave = 'recorde_' + VIAGEM.id + '_' + MODO, rec = guardar.ler(chave, null);
  const melhor = Math.min.apply(null, humanos.filter(h => h.tempo != null).map(h => h.tempo).concat([Infinity]));
  const novo = isFinite(melhor) && (rec == null || melhor < rec); if (novo) guardar.gravar(chave, melhor);
  const h = humanos[0], pos = posicao(h), tit = MODO === 'relogio' ? 'CONTRA O RELÓGIO' : MODO === 'cafe' ? 'TOMAR UM CAFEZINHO' : humanos.length > 1 ? '2 JOGADORES' : 'VIAGEM COMPLETA';
  // fantasma: guarda a volta se for recorde
  const fantasmaBatido = MODO === 'relogio' && novo && rec != null;
  if (MODO === 'relogio' && novo && GRAV && GRAV.length > 30) guardar.gravar('fantasma_' + VIAGEM.id, { p: h.def.id, o: h.ouro, t: h.tempo, d: GRAV });
  checarConquistas(fantasmaBatido);
  let t = 0, blob = null, nomePedido = false, salvo = false;
  gerarCartao(h, pos, tit).then(b => blob = b);
  const qrCafe = MODO === 'cafe' ? qrJogo(128) : null;
  const continuar = () => { if (t > 1.2 && !elNome.classList.contains('on')) irPara(telaTitulo()); };
  return {
    nome: 'resultado',
    entrar() { SOM.silenciar(); SOM.bomba(false); },
    update(dt) {
      t += dt;
      if (!nomePedido && t > 1.4 && humanos.length === 1 && h.tempo != null && RANK.entra(MODO, h.tempo)) {
        nomePedido = true;
        pedirNome('TEMPO ' + fmtTempo(h.tempo) + ' ENTROU NO TOP 10' + (RANK.online ? ' (ONLINE)' : '') + '. DIGITE SEU NOME:', n => { RANK.add(MODO, { n, p: h.def.id, t: h.tempo, m: h.multas, d: Date.now() }); salvo = true; avisar('TEMPO SALVO NO RANKING!'); });
      }
      if (t > 1.5 && !elNome.classList.contains('on') && (apertou(0, 'acel') || apertou(1, 'acel'))) continuar();
    },
    render() {
      const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c2a6a'); gr.addColorStop(0.6, MODO === 'cafe' ? '#c87a4a' : '#ff8a4a'); gr.addColorStop(1, '#3a2030');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      luz(ctx, W / 2, 220, 200, 'rgba(255,170,80,A)', 0.4);
      if (VIAGEM.basilica) ctx.drawImage(tingir(ART.basilica, [40, 24, 48]), W / 2 - 210, 70, 420, 220);
      else camada(ctx, tingir(ART.mont2, [50, 30, 50]), { w: W }, 0.2, 300, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
      txt(MODO === 'relogio' ? 'CONTRA O RELÓGIO' : VIAGEM.fim, W / 2, 12, '#ffd23a', 16, 'c');
      if (MODO === 'relogio') {
        const ret = IMG[h.def.retrato]; ctx.fillStyle = h.ouro ? '#ffd23a' : '#ff6a00'; ctx.fillRect(W / 2 - 51, 51, 102, 102); if (ret) ctx.drawImage(ret, W / 2 - 48, 54, 96, 96);
        txt(fmtTempo(h.tempo), W / 2, 168, '#fff', 32, 'c');
        txt(novo ? (rec == null ? 'PRIMEIRO RECORDE! FANTASMA GRAVADO' : 'NOVO RECORDE! -' + (rec - h.tempo).toFixed(1) + ' S') : 'RECORDE: ' + fmtTempo(rec) + '  (+' + (h.tempo - rec).toFixed(1) + ' S)', W / 2, 210, novo ? '#4ef03a' : '#ffb0a0', 8, 'c');
        txt(plural(h.multas, 'MULTA') + ' (+' + h.penal + ' S) • ' + plural(h.batidas, 'TOMBO') + ' • ' + plural(h.buzinas, 'BUZINADA'), W / 2, 228, '#fff', 8, 'c');
      } else {
        const pod = [[1, W / 2 - 60, 120], [0, W / 2 - 180, 100], [2, W / 2 + 60, 80]];
        pod.forEach(([i, x, hgt], kk) => {
          const c = ordem[i === 1 ? 0 : i === 0 ? 1 : 2]; if (!c) return;
          const lugar = i === 1 ? 1 : i === 0 ? 2 : 3, sub = clamp(t * 2 - kk * 0.3, 0, 1), by = 290 - hgt * sub;
          ctx.fillStyle = ['#ffd23a', '#c0c0c8', '#c8804a'][lugar - 1]; ctx.fillRect(x, by, 120, 300 - by);
          txt(lugar + 'º', x + 60, by + 8, '#111', 16, 'c', false);
          const ret = c.def.retrato && IMG[c.def.retrato];
          if (ret) ctx.drawImage(ret, x + 28, by - 68, 64, 64);
          txt(c.nome, x + 60, by + 30, '#111', 8, 'c', false); txt(fmtTempo(est(c)), x + 60, by + 44, '#222', 8, 'c', false);
          if (c.multas) txt(c.multas + ' MULTA' + (c.multas > 1 ? 'S' : ''), x + 60, by + 58, '#8a1a10', 8, 'c', false);
        });
        txt((novo ? 'NOVO RECORDE! ' : 'RECORDE: ') + fmtTempo(guardar.ler(chave, null)), 14, 42, novo ? '#ffd23a' : '#ddd', 8);
        humanos.forEach((q, i) => txt((humanos.length > 1 ? 'P' + (i + 1) + ': ' : 'VOCÊ: ') + posicao(q) + 'º • ' + plural(q.batidas, 'TOMBO') + ' • ' + plural(q.multas, 'MULTA'), 14, 58 + i * 14, '#fff', 8));
      }
      if (qrCafe) {   // modo feira: QR para jogar a viagem completa no próprio celular
        ctx.fillStyle = '#fff'; ctx.fillRect(W - 112, 40, 100, 100); ctx.imageSmoothingEnabled = false; ctx.drawImage(qrCafe, W - 108, 44, 92, 92);
        txt('JOGUE A VIAGEM', W - 62, 146, '#ffd23a', 8, 'c'); txt('COMPLETA!', W - 62, 158, '#ffd23a', 8, 'c');
      }
      alvosToque = [];
      if (t > 1.2) {
        botao(20, H - 46, 190, 32, 'COMPARTILHAR', () => compartilhar(blob), false, '#1e6a3a');
        botao(225, H - 46, 190, 32, 'RANKING', () => { if (!elNome.classList.contains('on')) irPara(telaRecordes(MODO)); });
        botao(430, H - 46, 190, 32, 'CONTINUAR', continuar, true);
      }
    }
  };
}

// ============================================================ RECORDES / RANKING / CONQUISTAS
function telaRecordes(modoIni) {
  const ABAS = [['viagem', 'VIAGEM'], ['cafe', 'CAFEZINHO'], ['relogio', 'RELÓGIO'], ['conq', 'CONQUISTAS']];
  let aba = Math.max(0, ABAS.findIndex(a => a[0] === modoIni)), online = false, lista = null, carregando = false, erro = false;
  const carregar = () => { lista = null; erro = false; if (!online || ABAS[aba][0] === 'conq') return; carregando = true; const a = aba;
    RANK.buscar(ABAS[aba][0]).then(l => { if (a === aba) lista = l; }).catch(() => { erro = true; }).then(() => carregando = false); };
  const mudar = d => { aba = (aba + d + ABAS.length) % ABAS.length; SOM.clique(); carregar(); };
  const nomeP = id => (PERSONAGENS.find(p => p.id === id) || { nome: id || '' }).nome;
  return {
    nome: 'recordes',
    update() { if (apertou(0, 'esq')) mudar(-1); if (apertou(0, 'dir')) mudar(1); if (apertou(0, 'freio') || apertou(0, 'acel')) irPara(telaTitulo()); },
    render() {
      fundoEscuro('#141018', '#050406'); alvosToque = [];
      txt('RECORDES', W / 2, 12, '#ff8a2a', 16, 'c');
      botao(8, 8, 70, 22, 'VOLTAR', () => irPara(telaTitulo()));
      ABAS.forEach(([, r], i) => botao(20 + i * 152, 38, 144, 24, r, () => { aba = i; SOM.clique(); carregar(); }, i === aba));
      const id = ABAS[aba][0];
      if (id === 'conq') {
        const feitas = guardar.ler('conquistas', {});
        CONQUISTAS.forEach((c, i) => {
          const col = i % 2, lin = Math.floor(i / 2), x = 20 + col * 306, y = 72 + lin * 40, ok = !!feitas[c.id];
          ctx.fillStyle = ok ? 'rgba(255,210,58,0.12)' : 'rgba(255,255,255,0.04)'; ctx.fillRect(x, y, 296, 36);
          if (ok) trofeu(x + 18, y + 18, c.premio === 'ouro'); else { ctx.fillStyle = '#444'; ctx.fillRect(x + 11, y + 15, 14, 11); ctx.strokeStyle = '#444'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 18, y + 15, 5, Math.PI, 0); ctx.stroke(); }
          txt(c.nome, x + 38, y + 6, ok ? '#ffd23a' : '#8a8a92', 8, 'e', false);
          txt(c.desc + (c.premio ? ' ★' : ''), x + 38, y + 20, ok ? '#e8e8e8' : '#5a5a62', 8, 'e', false);
        });
        const n = Object.keys(feitas).length; txt(n + '/' + CONQUISTAS.length + ' • ★ = CAPACETE DOURADO DO PILOTO', W / 2, H - 14, '#9a9aa4', 8, 'c');
        return;
      }
      if (RANK.online) botao(W - 130, 8, 122, 22, online ? 'ONLINE' : 'NESTE CELULAR', () => { online = !online; SOM.clique(); carregar(); }, online, '#1e3a6a');
      const l = online ? lista : RANK.local(id);
      txt(online ? 'RANKING ONLINE • TOP 10' : 'TOP 10 NESTE CELULAR', W / 2, 72, '#9ad0ff', 8, 'c');
      if (online && carregando) { txt('CARREGANDO...', W / 2, 180, '#fff', 8, 'c'); return; }
      if (online && erro) { txt('SEM CONEXÃO COM O RANKING', W / 2, 180, '#ff5a4a', 8, 'c'); return; }
      if (!l || !l.length) { txt('NENHUM TEMPO AINDA. BORA ACELERAR!', W / 2, 180, '#c8c8d2', 8, 'c'); return; }
      ['#', 'NOME', 'PILOTO', 'TEMPO'].forEach((r, i) => txt(r, [60, 100, 300, 560][i], 92, '#ff8a2a', 8, i === 3 ? 'd' : 'e', false));
      l.slice(0, 10).forEach((e, i) => {
        const y = 108 + i * 20; if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(50, y - 4, 520, 18); }
        const cor = i === 0 ? '#ffd23a' : i === 1 ? '#d8d8e0' : i === 2 ? '#e0a070' : '#fff';
        txt((i + 1) + 'º', 60, y, cor, 8, 'e', false); txt(e.n || '---', 100, y, cor, 8, 'e', false); txt(nomeP(e.p), 300, y, '#c8c8d2', 8, 'e', false); txt(fmtTempo(e.t), 560, y, cor, 8, 'd', false);
      });
    }
  };
}
function alternarPausa() {
  if (estado.nome !== 'corrida') return;
  pausado = !pausado; if (pausado) { SOM.silenciar(); SOM.bomba(false); } else if (humanos.some(h => h.abast)) SOM.bomba(true);
  atualizarHTML();
}

// ============================================================ HTML / CONVITE P2
const elControles = document.getElementById('controles'), btnPausa = document.getElementById('btn-pausa');
const ehToque = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
function atualizarHTML() { const corr = estado.nome === 'corrida'; elControles.classList.toggle('on', corr && ehToque && !pausado); btnPausa.classList.toggle('on', corr && !pausado); }
btnPausa.addEventListener('click', alternarPausa);
function avisar(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(avisar.t); avisar.t = setTimeout(() => t.style.display = 'none', 3000); }
let p2Conectado = false, peerHost = null, conexaoP2 = null;
function abrirConvite() {
  const modal = document.getElementById('convite'), st = document.getElementById('convite-status');
  if (typeof Peer === 'undefined') { avisar('SEM INTERNET PARA CONVIDAR'); return; }
  modal.classList.add('on'); if (peerHost) return;
  try {
    peerHost = new Peer();
    peerHost.on('open', id => {
      const link = location.origin + location.pathname + '?sala=' + id, qr = document.getElementById('qr'); qr.innerHTML = '';
      if (typeof QRCode !== 'undefined') new QRCode(qr, { text: link, width: 172, height: 172 });
      st.textContent = 'AGUARDANDO O JOGADOR 2...';
    });
    peerHost.on('connection', con => {
      con.on('open', () => { conexaoP2 = con; p2Conectado = true; if (estado.nome === 'titulo' || estado.nome === 'selecao') { MODO = 'viagem'; usarViagem(VIAGENS[0]); } modal.classList.remove('on'); avisar('JOGADOR 2 CONECTADO!'); if (estado.nome === 'titulo' || estado.nome === 'selecao') irPara(telaSelecao(2)); });
      con.on('data', d => { if (d && d.b) { fontes.remoto[d.b] = d.s === 1; if (d.s === 1) pulso[1][d.b] = true; } });
      const caiu = () => { if (conexaoP2 !== con) return; p2Conectado = false; conexaoP2 = null; fontes.remoto = {}; avisar('JOGADOR 2 DESCONECTOU'); for (const h of humanos) if (h.humano === 1) h.auto = true; if (estado.nome === 'selecao') irPara(telaSelecao(1)); };
      con.on('close', caiu); con.on('error', caiu);
    });
    peerHost.on('error', () => { st.textContent = 'FALHA AO GERAR CONVITE. VERIFIQUE A INTERNET.'; peerHost = null; });
  } catch (e) { st.textContent = 'CONVITE INDISPONÍVEL'; }
}
document.getElementById('fechar-convite').addEventListener('click', () => document.getElementById('convite').classList.remove('on'));
function modoControle() {
  document.body.classList.add('controle');
  const status = document.getElementById('p2-status'), estBt = {}; let con = null;
  ligarBotoes(document.getElementById('p2'), estBt, (k, v) => { if (con && con.open) con.send({ b: k, s: v ? 1 : 0 }); });
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}
  if (typeof Peer === 'undefined') { status.textContent = 'SEM INTERNET'; return; }
  const p = new Peer();
  p.on('open', () => { con = p.connect(SALA, { reliable: true }); con.on('open', () => { status.textContent = 'CONECTADO - OLHE A TELA DO P1'; status.style.color = '#4ef03a'; }); con.on('close', () => { status.textContent = 'DESCONECTADO'; status.style.color = '#e33'; }); });
  p.on('error', () => { status.textContent = 'NÃO FOI POSSÍVEL CONECTAR'; status.style.color = '#e33'; });
}

// ============================================================ LAÇO
let ultimo = 0, acum = 0;
function quadro(t) {
  const dt = Math.min(0.1, (t - ultimo) / 1000 || 0); ultimo = t; acum += dt; tempoReal += dt;
  juntarEntrada();
  while (acum >= STEP) { estado.update && estado.update(STEP); guardarAnterior(); acum -= STEP; }
  ctx.imageSmoothingEnabled = false;
  hiLimpar();
  estado.render && estado.render();
  desenharAvisos(dt);
  if (fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + fade + ')'; ctx.fillRect(0, 0, W, H); fade = Math.max(0, fade - dt * 3); }
  telaCtx.imageSmoothingEnabled = false; telaCtx.drawImage(buf, 0, 0, tela.width, tela.height);
  requestAnimationFrame(quadro);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (estado.nome === 'corrida' && !pausado) alternarPausa(); if (SOM.ac) SOM.ac.suspend(); }
  else if (SOM.ac) SOM.ac.resume();
});
function iniciar() {
  if (SALA) { modoControle(); return; }
  ajustarTela();
  const car = telaCarregando(); estado = car;
  ligarBotoes(elControles, fontes.toque, (k, v) => { if (v) pulso[0][k] = true; });
  requestAnimationFrame(quadro);
  const fonte = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  Promise.all([carregar(p => car.setProg(p)), fonte]).then(() => { gerarArte(); montarViagem(VIAGENS[0]); irPara(SOM.ac ? telaTitulo() : telaAbertura()); });
}
// modo offline: guarda o jogo no aparelho (funciona sem internet depois da 1ª visita)
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
window.BRMC = { simular(s) { for (let i = 0; i < s * 60; i++) { juntarEntrada(); estado.update(STEP); guardarAnterior(); } }, get estado() { return estado; }, get corredores() { return corredores; },
  get humanos() { return humanos; }, get tempo() { return tempoCorrida; }, get radio() { return radio; }, get postos() { return POSTOS; }, get pedagios() { return PEDAGIOS; }, get radares() { return RADARES; }, get clima() { return CLIMA; }, set clima(c) { CLIMA = c; }, get modo() { return MODO; }, modoJogo: m => iniciarModo(m), cartao: () => gerarCartao(humanos[0], 1, 'TESTE').then(b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); })), buzinar: () => buzinar(humanos[0]), get trafego() { return trafego; }, get viagem() { return VIAGEM; }, desenharAvisos, dist: () => [DIST, START_I * SEG, FIM_Z, CONS()], entrada: fontes };
iniciar();
})();
