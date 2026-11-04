/* Black Rock MC - The Game  |  v2
 * Corrida de motos pseudo-3D em pixel art HD (HTML5 Canvas). Roda em Android e iPhone pelo navegador.
 */
'use strict';
(function () {
const { PERSONAGENS, RIVAIS, VIAGENS, FALAS, FALAS_PESSOAIS } = window.DADOS;
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
function fmtTempo(t) { if (t == null || !isFinite(t)) return '--:--.-'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }
const txt = (s, x, y, cor, tam, al, sombra) => A.txt(ctx, s, x, y, cor, tam, al, sombra);

// ============================================================ TELA
const tela = document.getElementById('tela'), telaCtx = tela.getContext('2d');
const [buf, ctx] = A.mk(W, H);
const cenas = [A.mk(W, H), A.mk(W, H / 2), A.mk(W, H / 2)];
function ajustarTela() {
  const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 3), e = Math.min(vw / W, vh / H);
  const cw = Math.floor(W * e), ch = Math.floor(H * e);
  tela.style.width = cw + 'px'; tela.style.height = ch + 'px'; tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr);
}
addEventListener('resize', ajustarTela); addEventListener('orientationchange', () => setTimeout(ajustarTela, 250));

// ============================================================ IMAGENS
const NOMES = ['piloto', 'piloto_leosao', 'piloto_gs1300', 'lateral_versys', 'lateral_gs', 'lateral_gs1300', 'retrato_jellison', 'retrato_leosao',
  'retrato_jefao', 'emblema_64', 'emblema_128', 'emblema_192', 'car_rear', 'car_front', 'truck_rear', 'truck_front', 'carreta_rear', 'moto_rear', 'moto_front', 'pine', 'rock'];
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
const spriteMoto = def => memo('m' + (def.sprite || 'piloto') + (def.cor || ''), () => def.cor ? trocarVerde(IMG[def.sprite || 'piloto'], def.cor) : IMG[def.sprite || 'piloto']);
const lateralDe = def => memo('l' + (def.lateral || 'lateral_versys') + (def.cor || ''), () => def.cor ? trocarVerde(IMG[def.lateral || 'lateral_versys'], def.cor) : IMG[def.lateral || 'lateral_versys']);
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
let VIAGEM = null, segs = [], START_I = 30, FIM_I = 0, FIM_Z = 0, DIST = 1, POSTOS = [], MARCOS = [];
const ART = {};
function easeIn(a, b, p) { return a + (b - a) * p * p; }
function easeInOut(a, b, p) { return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5); }
const ultimoY = () => segs.length ? segs[segs.length - 1].p2.y : 0;
function addSeg(curva, y, zona) { const n = segs.length; segs.push({ i: n, p1: { y: ultimoY(), z: n * SEG }, p2: { y, z: (n + 1) * SEG }, curva, zona, spr: [], esc: Math.floor(n / 3) % 2, faixa: Math.floor(n / 4) % 2, posto: false }); }
function addTrecho(e, s, l, curva, morro, zona) {
  const sy = ultimoY(), ey = sy + morro * SEG, t = e + s + l;
  for (let n = 0; n < e; n++) addSeg(easeIn(0, curva, n / e), easeInOut(sy, ey, n / t), zona);
  for (let n = 0; n < s; n++) addSeg(curva, easeInOut(sy, ey, (e + n) / t), zona);
  for (let n = 0; n < l; n++) addSeg(easeInOut(curva, 0, n / l), easeInOut(sy, ey, (e + s + n) / t), zona);
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
  ART.largada = A.arco('ITAÚNA', 'MINAS GERAIS', '#146e3c', E); ART.chegada = A.arco('APARECIDA', 'SANTUÁRIO NACIONAL', '#b4141e', E);
  const tag = (c, id) => { c.__id = id; return c; };
  ART.mont = tag(A.silhueta(1024, 70, 3, 3, 1), 'mont'); ART.mont2 = tag(A.silhueta(1024, 46, 9, 5, 1.4), 'mont2');
  ART.morro = tag(A.silhueta(1024, 26, 5, 8, 0.6), 'morro'); ART.sky = tag(A.skyline(1024, 90, 4), 'sky');
  ART.basilica = tag(A.basilica(), 'bas'); ART.nuvens = A.nuvens(11);
  const [v, g] = A.mk(W, H); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); ART.vinheta = v;
  ART.topos = {};
}
function montarViagem(v) {
  VIAGEM = v; segs = []; const R = A.rng(v.semente);
  addTrecho(0, 80, 0, 0, 0, 'cidade');
  for (const [len, c, h, z] of v.trechos) { const e = Math.round(len * 0.3); addTrecho(e, len - 2 * e, e, c, h, z); }
  FIM_I = segs.length + 30; addTrecho(0, 360, 0, 0, 0, 'cidade');
  FIM_Z = FIM_I * SEG; DIST = FIM_Z - START_I * SEG;
  const idx = f => Math.round(START_I + f * (FIM_I - START_I));
  // postos em trechos retos
  POSTOS = [];
  for (const f of v.postos) {
    let alvo = idx(f), ok = alvo;
    for (let d = 0; d < 500; d++) { const t = [alvo + d, alvo - d].find(k => { for (let j = k - 30; j <= k + 30; j++) if (!segs[j] || Math.abs(segs[j].curva) > 0.3) return false; return true; }); if (t) { ok = t; break; } }
    for (let j = ok - 26; j <= ok + 26; j++) segs[j].posto = true;
    POSTOS.push({ i: ok, z0: (ok - 26) * SEG, z1: (ok + 26) * SEG, z: ok * SEG });
    addSpr(ok - 6, ART.posto, 2.2, 1.6, true);
    addSpr(ok - 160, A.placaVerde(['POSTO BRMC', '1 KM', '']), 1.5, 0.9, true);
    addSpr(ok - 80, A.placaVerde(['POSTO BRMC', '500 M', '']), 1.5, 0.9, true);
  }
  MARCOS = v.marcos.map(m => Object.assign({ i: idx(m.f), z: idx(m.f) * SEG, feito: false }, m));
  for (const m of MARCOS) {
    if (m.placa) addSpr(m.i, A.placaVerde(m.placa), 1.5, 1, true);
    if (m.pedagio) { addSpr(m.i, ART.pedagio, 0, 1.25, false, { cruza: true }); for (let j = m.i - 12; j < m.i + 12; j++) segs[j].pedagio = true; }
  }
  // cenário por zona
  for (let i = 40; i < segs.length; i++) {
    const s = segs[i], z = s.zona;
    if (s.posto || s.pedagio) continue;
    if (i % 12 === 0) addSpr(i, ART.poste, -1.55, 1, false);                       // postes no canteiro
    if (i % 25 === 0) addSpr(i, A.marcoKm(Math.round((i - START_I) / (FIM_I - START_I) * v.km)), 1.42, 1, false);
    if (z === 'cidade') {
      if (i % 4 === 0) addSpr(i, ART.predios[Math.floor(R() * ART.predios.length)], 2.0 + R() * 1.6, 1.4, true);
      if (i % 5 === 2) addSpr(i, ART.predios[Math.floor(R() * ART.predios.length)], -4.4 - R() * 1.5, 1.4, false);
    } else if (z === 'eucalipto') {
      if (i % 2 === 0) addSpr(i, ART.eucs[Math.floor(R() * 3)], 1.7 + R() * 2.2, 1.3, true);
      if (i % 3 === 0) addSpr(i, ART.eucs[Math.floor(R() * 3)], -4.4 - R() * 2, 1.3, false);
    } else if (z === 'serra') {
      if (i % 3 === 0) addSpr(i, R() < 0.6 ? IMG.pine : ART.arvores[Math.floor(R() * 5)], 1.6 + R() * 1.8, R() < 0.6 ? 1.6 : 1.2, true);
      if (i % 4 === 0) addSpr(i, IMG.rock, 1.7 + R() * 2, 1.4, true);
      if (i % 4 === 2) addSpr(i, IMG.pine, -4.3 - R() * 2, 1.6, false);
    } else {
      if (i % 5 === 0 && R() < 0.8) addSpr(i, ART.arvores[Math.floor(R() * 5)], 1.8 + R() * 2.5, 1.2, true);
      if (i % 3 === 0 && R() < 0.5) addSpr(i, ART.arbustos[Math.floor(R() * 3)], 1.5 + R() * 3, 1, false);
      if (i % 6 === 0) addSpr(i, ART.cerca, 2.6, 1, false);
      if (i % 47 === 0) addSpr(i, ART.vacas[Math.floor(R() * 2)], 3.2 + R() * 2, 1, false);
      if (i % 29 === 0) addSpr(i, ART.cupim, 2.0 + R() * 2, 1, false);
      if (i % 7 === 0 && R() < 0.6) addSpr(i, ART.arvores[Math.floor(R() * 5)], -4.4 - R() * 2.5, 1.2, false);
      if (i % 160 === 80) addSpr(i, ART.outdoors[(i / 160 | 0) % 2], 2.4, 1.1, true);
    }
    if (i % 420 === 210 && Math.abs(s.curva) < 1) addSpr(i, ART.passarela, -1.45, 1.25, false, { cruza: true });
  }
  addSpr(START_I, ART.largada, 0, 1.15, false, { cruza: true });
  addSpr(FIM_I, ART.chegada, 0, 1.15, false, { cruza: true });
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
function criarVeic(z, oposto) {
  const t = sortear(), cor = CORES_VEIC[Math.floor(Math.random() * CORES_VEIC.length)];
  const usa = t.cores === true || (t.cores === 'frente' && oposto);
  const v = rnd(t.vmin, t.vmax) * KMH;
  let x;
  if (oposto) x = Math.random() < 0.5 ? -2.55 : -3.45;
  else x = t.pesado ? 0.5 : (Math.random() < 0.6 ? 0.5 : -0.5);
  return { z, x, alvoX: x, v: oposto ? -v : v, vBase: v, img: spriteVeic(oposto ? t.frente : t.tras, usa ? cor : null), hw: t.w * PX2N * 0.5, len: t.len, oposto, pesado: !!t.pesado, pisca: 0, freio: 0 };
}
function gerarTrafego() {
  trafego = [];
  for (let z = (START_I + 90) * SEG; z < FIM_Z; z += rnd(14000, 24000)) trafego.push(criarVeic(z, false));
  for (let z = (START_I + 40) * SEG; z < FIM_Z + 80 * SEG; z += rnd(9000, 16000)) trafego.push(criarVeic(z, true));
}
function atualizarTrafego(dt) {
  const fim = FIM_Z + 120 * SEG, ini = (START_I + 40) * SEG;
  for (const v of trafego) {
    if (!v.oposto) {
      // ultrapassa o mais lento à frente trocando de faixa (com seta)
      let frente = null, dmin = 1e9;
      for (const o of trafego) { if (o === v || o.oposto) continue; const dz = o.z - v.z; if (dz > 0 && dz < 2600 && Math.abs(o.x - v.x) < 0.4 && dz < dmin) { dmin = dz; frente = o; } }
      v.freio = 0;
      if (frente && frente.v < v.vBase - 5 * KMH) {
        const outra = v.x > 0 ? -0.5 : 0.5;
        const livre = !trafego.some(o => !o.oposto && o !== v && Math.abs(o.x - outra) < 0.4 && o.z > v.z - 2200 && o.z < v.z + 2200);
        if (!v.pesado && livre && v.alvoX === v.x) { v.alvoX = outra; v.pisca = 1.6; }
        else if (dmin < 1500) { v.v = Math.max(frente.v, v.v - 30 * KMH * dt); v.freio = 1; }
      } else if (v.v < v.vBase) v.v = Math.min(v.vBase, v.v + 10 * KMH * dt);
      if (!frente && v.alvoX < 0 && !trafego.some(o => !o.oposto && o !== v && o.x > 0 && o.z > v.z - 1800 && o.z < v.z + 2400)) { v.alvoX = 0.5; v.pisca = 1.4; }
      if (v.x !== v.alvoX) { const d = v.alvoX - v.x, p = 0.6 * dt; v.x = Math.abs(d) < p ? v.alvoX : v.x + Math.sign(d) * p; }
      v.pisca = Math.max(0, v.pisca - dt);
    }
    v.z += v.v * dt;
    if (v.z > fim) v.z = ini + (v.z - fim);
    if (v.z < ini) v.z = fim - (ini - v.z);
  }
}

// ============================================================ ENTRADA
const entrada = [{}, {}], anterior = [{}, {}], pulso = [{}, {}];
const fontes = { teclado: [{}, {}], toque: {}, remoto: {} };
function juntarEntrada() {
  for (const k of ['esq', 'dir', 'acel', 'freio']) {
    entrada[0][k] = !!(fontes.teclado[0][k] || fontes.toque[k] || pulso[0][k]);
    entrada[1][k] = !!(fontes.teclado[1][k] || fontes.remoto[k] || pulso[1][k]);
  }
}
const apertou = (j, k) => entrada[j][k] && !anterior[j][k];
function guardarAnterior() { for (let j = 0; j < 2; j++) { anterior[j] = Object.assign({}, entrada[j]); pulso[j] = {}; } juntarEntrada(); }
const TECLAS = { ArrowLeft: [0, 'esq'], ArrowRight: [0, 'dir'], ArrowUp: [0, 'acel'], ArrowDown: [0, 'freio'], KeyZ: [0, 'acel'], KeyX: [0, 'freio'], Space: [0, 'acel'], Enter: [0, 'acel'],
  KeyA: [1, 'esq'], KeyD: [1, 'dir'], KeyW: [1, 'acel'], KeyS: [1, 'freio'] };
addEventListener('keydown', e => {
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
    for (const k of ['esq', 'dir', 'acel', 'freio']) {
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
const CONS = () => 100 / (DIST * 0.5);
const MARCHAS = [0.2, 0.36, 0.52, 0.68, 0.84, 1.01];
const tempoTanque = def => 3 + (def.cc || 800) / 250;          // segundos para encher o tanque todo

function criarCorredor(def, humano) {
  const max = def.vel * KMH;
  return { nome: def.nome, def, img: spriteMoto(def), max, acelB: max / (7.2 - def.acel * 3.4), consumo: 1.4 - def.economia * 0.85, curva: def.curva,
    z: 0, x: 0, v: 0, lean: 0, susp: 0, suspV: 0, crash: 0, giro: 0, comb: 100, fim: false, tempo: null, humano, auto: humano < 0,
    marcha: 1, troca: 0, rpm: 0, vacuoT: 0, vacuo: false, gas: 0, freando: false, abast: null, postoLivre: true, bg: 0, cx: 0, roll: 0,
    fora: false, rasp: 0, reservaDita: false, ia: { skill: rnd(0.86, 0.95), faixa: pick([-0.5, 0.5, 0.2, 0.7]), encher: 0 } };
}
function novaCorrida(escolhas, ehDemo) {
  demo = !!ehDemo;
  const usados = escolhas.map(i => PERSONAGENS[i]);
  const outros = PERSONAGENS.filter(p => usados.indexOf(p) < 0).concat(RIVAIS);
  const lista = [];
  for (let i = 0; i < 8 - escolhas.length; i++) lista.push([outros[i], -1]);
  escolhas.forEach((c, j) => lista.push([PERSONAGENS[c], j]));
  corredores = lista.map(([d, h], i) => { const c = criarCorredor(d, h), fila = Math.floor(i / 2); c.z = (START_I - 5 - fila * 5) * SEG; c.x = i % 2 ? 0.55 : -0.35; c.cx = c.x * ROAD; return c; });
  humanos = corredores.filter(c => c.humano >= 0).sort((a, b) => a.humano - b.humano);
  gerarTrafego(); particulas = [[], []]; radio.fila = []; radio.atual = null; radio.cd = 0;
  for (const m of MARCOS) m.feito = false;
  tempoCorrida = 0; contagem = demo ? 0 : 4.0; chegada = []; fimTimer = 0; pausado = false; ranking = null; lanternaDita = false;
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
    if (d > 5000) alvoV *= 0.9; else if (d < -9000) alvoV *= 1.05;
  }
  let curvaMax = 0;
  for (let j = 0; j < 36; j += 3) curvaMax = Math.max(curvaMax, Math.abs(segs[Math.min(seg.i + j, segs.length - 1)].curva));
  if (curvaMax > 0.5) alvoV = Math.min(alvoV, c.max * clamp(0.82 / (curvaMax * 0.4 * (1.15 - 0.35 * c.curva)), 0.5, 1));
  // combustível
  const p = proximoPosto(c.z);
  if (p && !c.fim) {
    if (!ia.encher && c.z < p.z0 && c.z > p.z0 - 70 * SEG) ia.encher = precisaAbastecer(c, p);
    if (ia.encher && c.z > p.z0 - 45 * SEG) { alvoX = 1.7; if (c.z > p.z0 + 4 * SEG) alvoV = c.x > 1.3 ? 0 : c.max * 0.14; }
    if (c.z > p.z1) ia.encher = 0;
  }
  if (c.comb <= 0) alvoV = 0;
  // trânsito: troca de faixa / corredor
  if (alvoX < 1.3) {
    let obst = null, melhor = 1e9;
    for (const v of trafego) {
      if (v.oposto) continue;
      const dz = v.z - c.z, hor = Math.max(1800, (c.v - v.v) * 1.5);
      if (dz > -(v.len / 2 + 150) && dz < hor && Math.abs(v.x - c.x) < v.hw + MOTO_HW + 0.1 && dz < melhor) { melhor = dz; obst = v; }
    }
    if (obst) {
      const livre = x => {
        if (x < -0.98 || x > 1.3) return false;
        for (const v of trafego) { if (v.oposto) continue; const dz = v.z - c.z; if (dz > -(v.len / 2 + 220) && dz < Math.max(1500, (c.v - v.v) * 2.4) && Math.abs(v.x - x) < v.hw + MOTO_HW + 0.06) return false; }
        return true;
      };
      const a = obst.x + obst.hw + MOTO_HW + 0.12, b = obst.x - obst.hw - MOTO_HW - 0.12;
      const opc = [a, b, -0.5, 0.5].filter(livre).sort((m, n) => Math.abs(m - c.x) - Math.abs(n - c.x));
      if (opc.length) alvoX = opc[0];
      else { alvoV = Math.min(alvoV, obst.v * 0.95); if (melhor < obst.len / 2 + 2800) inp.freio = c.v > alvoV + 3 * KMH; }
    }
  }
  inp.esq = c.x > alvoX + 0.05; inp.dir = c.x < alvoX - 0.05;
  if (c.v > alvoV) { inp.acel = false; if (c.v > alvoV + 12 * KMH) inp.freio = true; }
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
  const seg = segEm(c.z), max = c.max * (c.vacuo ? 1.07 : 1);
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
  c.lean += (alvoLean - c.lean) * Math.min(1, (4.5 + 4 * c.curva) * dt);
  c.x += c.lean * dt * 1.9 * (0.25 + 0.75 * Math.min(1, pc * 1.4));
  c.x -= seg.curva * pc * pc * dt * 0.4 * (1.15 - 0.35 * c.curva);
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
  else if (inp.freio) c.v -= c.max * 1.1 * dt;
  else c.v -= (c.max * 0.1 + c.v * 0.12) * dt;
  c.v -= ladeira * 5200 * dt;
  // ---- vácuo atrás de veículos
  let vac = false;
  for (const o of trafego) { if (o.oposto) continue; const dz = o.z - c.z; if (dz > 250 && dz < 1900 && Math.abs(o.x - c.x) < o.hw) { vac = true; break; } }
  if (!vac) for (const o of corredores) { if (o === c) continue; const dz = o.z - c.z; if (dz > 200 && dz < 1300 && Math.abs(o.x - c.x) < 0.14) { vac = o; break; } }
  c.vacuoT = vac && pc > 0.5 ? c.vacuoT + dt : 0; c.vacuo = c.vacuoT > 0.45; c.vacuoDe = vac;
  // ---- fora da pista, defensa, posto
  const noPosto = seg.posto && c.x > 1.0 && c.x < 3.2, pedagio = seg.pedagio;
  c.fora = c.x > ACOST && !noPosto && !pedagio;
  if (c.fora) {
    if (c.v > c.max * 0.32) c.v -= c.max * 1.05 * dt;
    if (Math.random() < 0.3) c.suspV += rnd(-30, 30);
    for (const s of seg.spr) {
      if (!s.solido || s.cruza) continue;
      const cx = s.x < 0 ? s.x - s.hw : s.x + s.hw;
      if (Math.abs(cx - c.x) < s.hw + MOTO_HW) { bater(c, 0); c.x = Math.min(c.x, 1.2); break; }
    }
  }
  if (c.x < GUARD_X + 0.1) {
    c.x = GUARD_X + 0.1; if (c.lean < 0) c.lean = 0.25; c.v *= 1 - 0.9 * dt; c.rasp -= dt;
    if (c.humano >= 0 && !demo && c.v > 10 * KMH) { if (c.rasp <= 0) { SOM.raspar(); c.rasp = 0.14; } emitir(c.humano, 'faisca', -1); }
  }
  c.x = clamp(c.x, GUARD_X + 0.1, 3.0);
  c.v = clamp(c.v, 0, max);
  // ---- combustível
  const dist = c.v * dt;
  c.comb = Math.max(0, c.comb - dist * CONS() * c.consumo * (c.gas ? 1 : 0.35));
  if (!noPosto) c.postoLivre = true;
  if (noPosto && c.postoLivre && c.x > 1.1 && c.v < 22 * KMH && c.comb < 98 && !c.fim && c.crash <= 0 && ((c.humano >= 0 && !c.auto) || c.ia.encher)) {
    c.abast = { t: 0, ini: c.comb }; c.v = 0;
    if (c.humano >= 0 && !demo) { SOM.bomba(true); falarSobre('abastecendo', c); }
  }
  if (c.humano >= 0 && !demo && c.comb <= 10 && !c.reservaDita) { c.reservaDita = true; SOM.alerta(); falarSobre('reserva', c); }
  if (c.comb > 20) c.reservaDita = false;
  // ---- suspensão (crista de morro e buracos)
  const seg2 = segEm(c.z + SEG * 2), lad2 = (seg2.p2.y - seg2.p1.y) / SEG;
  c.suspV += (ladeira - lad2) * c.v * 0.012;
  c.suspV += (-c.susp * 120 - c.suspV * 9) * dt; c.susp = clamp(c.susp + c.suspV * dt, -6, 6);
  c.z += dist;
  c.bg = (c.bg + 0.0011 * seg.curva * dist / SEG + 10) % 1;
  // câmera acompanha com atraso (sensação de peso)
  c.cx = lerp(c.cx, c.x * ROAD, Math.min(1, dt * 7));
  c.roll = lerp(c.roll, clamp(-seg.curva * pc * 0.014 - c.lean * 0.03, -0.12, 0.12), Math.min(1, dt * 4));
  if (!c.fim && c.z >= FIM_Z) {
    c.fim = true; c.tempo = tempoCorrida; c.auto = true; chegada.push(c);
    if (c.humano >= 0 && !demo) { SOM.chegada(); falarSobre('chegada', c); }
  }
}

function colisoes() {
  for (const c of corredores) {
    if (c.crash > 0 || c.abast) continue;
    for (const v of trafego) {
      if (v.oposto) continue;
      const dz = v.z - c.z;
      if (Math.abs(dz) < v.len * 0.5 + 70 && Math.abs(v.x - c.x) < v.hw + MOTO_HW * 0.8) {
        if (c.v - v.v > 40 * KMH) { bater(c, v.v * 0.4); c.z = v.z - v.len * 0.5 - 90; }
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

let tremor = [0, 0], ranking = null, rankT = 0, lanternaT = 0, lanternaDita = false, liderT = 0;
function atualizarCorrida(dt) {
  if (pausado) return;
  if (contagem > 0) {
    const a = Math.ceil(contagem); contagem -= dt; const b = Math.ceil(contagem);
    if (!demo && a !== b && b <= 3) SOM.bipLargada(b === 0);
    if (!demo && contagem <= 0) falar('largada', null);
  } else tempoCorrida += dt;
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
      const h0 = humanos[0]; SOM.ambiente(h0.v / h0.max, h0.fora);
    }
  }
}

// ============================================================ INTERCOMUNICADOR
const radio = { fila: [], atual: null, cd: 0 };
function falante(excluir) {
  const ops = corredores.filter(c => c !== excluir && c.humano < 0);
  const reais = ops.filter(c => c.def.id); return pick(reais.length ? reais : ops.length ? ops : corredores);
}
function falar(tipo, alvo, quem) {
  if (demo || radio.fila.length > 2) return;
  const lst = FALAS[tipo]; if (!lst) return;
  quem = quem || falante(alvo);
  let t = pick(lst);
  if (alvo && alvo.def.id && FALAS_PESSOAIS[alvo.def.id] && Math.random() < 0.3) t = pick(FALAS_PESSOAIS[alvo.def.id].alvo);
  t = t.replace(/\{alvo\}/g, alvo ? alvo.nome : 'galera').replace(/\{eu\}/g, quem.nome);
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
    if (h0 && posicao(h0) === 1) { liderT += 0.5; if (liderT > 4 && Math.random() < 0.05) falarSobre('lider', h0); } else liderT = 0;
    if (h0 && posicao(h0) === corredores.length && tempoCorrida > 25) { lanternaT += 0.5; if (lanternaT > 8 && !lanternaDita) { lanternaDita = true; falarSobre('lanterna', h0); } } else lanternaT = 0;
    if (h0 && h0.vacuo && h0.vacuoDe && h0.vacuoDe.def && Math.random() < 0.08) falarSobre('vacuo', h0, h0.vacuoDe);
  }
  const lider = Math.max.apply(null, humanos.map(h => h.z));
  for (const m of MARCOS) if (!m.feito && lider >= m.z) {
    m.feito = true;
    if (m.pedagio) falarSobre('pedagio', pick(corredores.filter(c => c.def.id)) || humanos[0]);
    else if (m.fala) { radio.cd = 0; falarSobre(m.fala, humanos[0]); }
  }
}

// ============================================================ PARTÍCULAS (por vista, em coordenadas de tela)
let particulas = [[], []];
function emitir(j, tipo, lado) {
  const P = particulas[j]; if (!P || P.length > 160) return;
  const base = { fumaca: { vx: rnd(-10, 10), vy: rnd(-25, -10), vida: 0.9, r: rnd(3, 5), cor: [200, 200, 205] },
    poeira: { vx: rnd(-50, 50), vy: rnd(-40, -10), vida: 0.6, r: rnd(3, 7), cor: [176, 140, 96] },
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
  const pr = progresso(foco.z); PAL = paleta(pr);
  const horiz = v.h / 2, nevCss = css(PAL.nev);
  // ---- céu, sol, nuvens, montanhas
  const gr = g.createLinearGradient(0, 0, 0, horiz + 10); gr.addColorStop(0, css(PAL.topo)); gr.addColorStop(1, css(PAL.base));
  g.fillStyle = gr; g.fillRect(0, 0, v.w, horiz + 10);
  const sx = ((v.w * PAL.sol[0] - foco.bg * 600) % v.w + v.w) % v.w, sy = v.h * PAL.sol[1], sr = PAL.sol[2] * k * 2, sc = PAL.sol[3];
  luz(g, sx, sy, sr * 6, 'rgba(' + (sc[0] | 0) + ',' + (sc[1] | 0) + ',' + (sc[2] | 0) + ',A)', 0.35);
  g.fillStyle = css(sc); g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
  camada(g, ART.nuvens, v, foco.bg * 0.3 + tempoReal * 0.003, horiz * 0.75, k, 0.85 - PAL.tarde * 0.3);
  camada(g, tingir(ART.mont, mixc(PAL.mont, PAL.nev, 0.35)), v, foco.bg * 0.5, horiz + 2, k);
  camada(g, tingir(ART.mont2, PAL.mont), v, foco.bg * 0.8, horiz + 2, k);
  const cid = pseg.zona === 'cidade' || segEm(foco.z + 60 * SEG).zona === 'cidade';
  foco.cidA = lerp(foco.cidA || 0, cid ? 1 : 0, 0.02);
  if (foco.cidA > 0.02) camada(g, tingir(ART.sky, mixc(PAL.mont, [40, 40, 50], 0.4)), v, foco.bg * 1.1, horiz + 2, k, foco.cidA);
  camada(g, tingir(ART.morro, PAL.morro), v, foco.bg * 1.5, horiz + 2, k);
  if (pr > 0.88) { // Basílica surgindo no horizonte
    const a = clamp((pr - 0.88) / 0.08, 0, 1), bw = ART.basilica.width * k * 0.9, bh = ART.basilica.height * k * 0.9;
    g.globalAlpha = a; g.drawImage(tingir(ART.basilica, mixc(PAL.morro, [30, 20, 40], 0.5)), Math.round(v.w * 0.55 - bw / 2), Math.round(horiz + 2 - bh), bw, bh); g.globalAlpha = 1;
  }
  g.fillStyle = css(PAL.g2); g.fillRect(0, horiz, v.w, v.h - horiz);
  // ---- estrada
  let maxy = v.h, x = 0, dx = -(base.curva * basePct);
  const lim = Math.min(DRAW, segs.length - base.i);
  const g1 = css(PAL.g1), g2 = css(PAL.g2);
  for (let n = 0; n < lim; n++) {
    const s = segs[base.i + n], a = tmpA[n], b = tmpB[n];
    projetar(s.p1, camX - x, camY, camZ, v, kx, ky, a);
    projetar(s.p2, camX - x - dx, camY, camZ, v, kx, ky, b);
    x += dx; dx += s.curva; a.clip = maxy;
    if (a.cz <= CAMD || b.y >= a.y || b.y >= maxy) continue;
    const e = s.esc, X = (p, o) => p.x + p.w * o;
    g.fillStyle = e ? g1 : g2; g.fillRect(0, b.y, v.w, a.y - b.y + 1);
    // pista contrária (do outro lado do canteiro)
    poli(g, X(a, -4.0), a.y, X(a, -2.0), a.y, X(b, -2.0), b.y, X(b, -4.0), b.y, e ? '#57585e' : '#525359');
    if (s.faixa) { const l = 0.025; poli(g, X(a, -3 - l), a.y, X(a, -3 + l), a.y, X(b, -3 + l), b.y, X(b, -3 - l), b.y, '#d8d8d8'); }
    // nossa pista + acostamento
    const asf = e ? '#5c5d63' : '#56575d';
    if (s.posto || s.pedagio) poli(g, X(a, 1), a.y, X(a, s.posto ? 3.2 : 2.2), a.y, X(b, s.posto ? 3.2 : 2.2), b.y, X(b, 1), b.y, '#8e8e88');
    else poli(g, X(a, 1), a.y, X(a, ACOST), a.y, X(b, ACOST), b.y, X(b, 1), b.y, e ? '#4c4d52' : '#48494e');
    poli(g, X(a, GUARD_X), a.y, X(a, 1), a.y, X(b, 1), b.y, X(b, GUARD_X), b.y, asf);
    const lw = 0.022;
    poli(g, X(a, 1 - lw), a.y, X(a, 1 + lw), a.y, X(b, 1 + lw), b.y, X(b, 1 - lw), b.y, '#e8e8e8');
    poli(g, X(a, -1 - lw), a.y, X(a, -1 + lw), a.y, X(b, -1 + lw), b.y, X(b, -1 - lw), b.y, '#f0c020');
    if (s.faixa) poli(g, X(a, -lw), a.y, X(a, lw), a.y, X(b, lw), b.y, X(b, -lw), b.y, '#e8e8e8');
    if (s.i === START_I || s.i === FIM_I) for (let j = 0; j < 10; j++) { g.fillStyle = j % 2 ? '#fff' : '#111'; g.fillRect(X(a, -1 + j * 0.2), b.y, a.w * 0.2 + 1, Math.max(1, a.y - b.y)); }
    const f = n / DRAW, nev = f * f * 0.8;
    if (nev > 0.02) { g.globalAlpha = nev; g.fillStyle = nevCss; g.fillRect(0, b.y, v.w, a.y - b.y + 1); g.globalAlpha = 1; }
    maxy = b.y;
  }
  // ---- objetos de trás para frente
  const porSeg = new Map();
  const add = (z, o) => { const i = Math.floor(z / SEG) - base.i; if (i > 0 && i < lim) { let l = porSeg.get(i); if (!l) porSeg.set(i, l = []); l.push(o); } };
  for (const t of trafego) add(t.z, { t });
  for (const c of corredores) if (c !== foco) add(c.z, { c });
  const tarde = PAL.tarde;
  for (let n = lim - 1; n > 0; n--) {
    const s = segs[base.i + n], a = tmpA[n], b = tmpB[n];
    if (a.cz <= CAMD) continue;
    // defensas metálicas (canteiro)
    if (b.y < a.clip) {
      const gh = 160 * a.s * ky, gh2 = 160 * b.s * ky;
      for (const o of [GUARD_X, -1.95]) {
        const xa = a.x + a.w * o, xb = b.x + b.w * o;
        poli(g, xa, Math.min(a.y, a.clip), xa, a.y - gh, xb, b.y - gh2, xb, b.y, s.esc ? '#b4bac2' : '#9aa0a8');
        poli(g, xa, a.y - gh * 0.5, xa, a.y - gh * 0.62, xb, b.y - gh2 * 0.62, xb, b.y - gh2 * 0.5, '#6a7078');
      }
    }
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
    g.globalAlpha = a * (p.tipo === 'fumaca' ? 0.35 : 0.9); g.fillStyle = css(p.cor);
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
  ctx.drawImage(ART.vinheta, 0, 0, W, H, v.x, v.y, v.w, v.h);
  if (foco.abast && !demo) cenaAbastecimento(v, foco);
  if (!demo) hud(v, foco, idx);
}

// ============================================================ CENA DO ABASTECIMENTO (vista de cima)
function cenaAbastecimento(v, c) {
  const k = v.h / H, def = c.def;
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  ctx.fillStyle = '#8c8a84'; ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.fillStyle = '#7e7c76'; for (let y = 0; y < v.h; y += 40 * k) ctx.fillRect(v.x, v.y + y, v.w, 2);
  ctx.fillStyle = '#f0c020'; ctx.fillRect(v.x + v.w * 0.3, v.y, 6 * k, v.h); ctx.fillRect(v.x + v.w * 0.7, v.y, 6 * k, v.h);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(v.x, v.y, v.w, 30 * k);
  const chave = def.id || def.nome;
  const topo = ART.topos[chave] || (ART.topos[chave] = A.motoTopo(def.topo || { cor: css(def.cor || [80, 80, 90]), cor2: '#ddd', baus: 'plastico', bauCor: '#1a1a1e', bauTampa: css(def.cor || [80, 80, 90]), aro: '#333' }, def.capacete || '#333'));
  const mw = topo.width * k * 1.1, mh = topo.height * k * 1.1, mx = v.x + v.w / 2 - mw / 2, my = v.y + v.h / 2 - mh / 2 + 6 * k;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(mx + mw / 2 + 6, my + mh / 2 + 8, mw * 0.45, mh * 0.48, 0, 0, 7); ctx.fill();
  ctx.drawImage(topo, mx, my, mw, mh);
  // bomba e mangueira até o bocal do tanque
  const px = v.x + v.w * 0.78, py = v.y + v.h * 0.32, bw = 46 * k, bh = 70 * k;
  ctx.fillStyle = '#111'; ctx.fillRect(px - 2, py - 2, bw + 4, bh + 4); ctx.fillStyle = '#ff6a00'; ctx.fillRect(px, py, bw, bh);
  ctx.fillStyle = '#111'; ctx.fillRect(px + 6 * k, py + 8 * k, bw - 12 * k, 20 * k);
  const litros = (c.comb - c.abast.ini) / 100 * (def.tanque || 18);
  A.numero7(ctx, String(Math.min(99, Math.floor(litros))).padStart(2, ' '), px + 10 * k, py + 11 * k, 9 * k, 14 * k, 3 * k, '#7dff6a', 'rgba(125,255,106,0.08)');
  const bocalX = mx + mw / 2, bocalY = my + 96 * 1.1 * k;
  ctx.strokeStyle = '#141414'; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.moveTo(px + bw / 2, py + bh);
  ctx.bezierCurveTo(px + bw / 2, py + bh + 70 * k, bocalX + 60 * k, bocalY + 40 * k, bocalX + 6 * k, bocalY); ctx.stroke();
  ctx.fillStyle = '#c0c0c0'; ctx.fillRect(bocalX - 4 * k, bocalY - 6 * k, 14 * k, 8 * k);
  ctx.fillStyle = '#ffd24a'; for (let i = 0; i < 3; i++) { const t = (tempoReal * 2 + i / 3) % 1; ctx.globalAlpha = 1 - t; ctx.fillRect(bocalX + 2 * k, bocalY - 2 * k + t * 10 * k, 2 * k, 2 * k); } ctx.globalAlpha = 1;
  // painel
  const pw = 250 * k, ph = 84 * k, pxx = v.x + 14 * k, pyy = v.y + v.h - ph - 14 * k;
  ctx.fillStyle = 'rgba(6,8,12,0.85)'; ctx.fillRect(pxx, pyy, pw, ph); ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 2; ctx.strokeRect(pxx + 1, pyy + 1, pw - 2, ph - 2);
  txt('ABASTECENDO', pxx + 10 * k, pyy + 10 * k, '#ff8a2a', k > 0.8 ? 16 : 8);
  txt(def.moto + ' • ' + (def.cc || '') + ' CC', pxx + 10 * k, pyy + 32 * k, '#c8c8d2', 8);
  ctx.fillStyle = '#222'; ctx.fillRect(pxx + 10 * k, pyy + 46 * k, pw - 20 * k, 10 * k);
  const fr = c.comb / 100, gx = ctx.createLinearGradient(pxx, 0, pxx + pw, 0); gx.addColorStop(0, '#ff3a2a'); gx.addColorStop(0.3, '#ffc22a'); gx.addColorStop(1, '#4ef03a');
  ctx.fillStyle = gx; ctx.fillRect(pxx + 10 * k, pyy + 46 * k, (pw - 20 * k) * fr, 10 * k);
  txt(Math.floor(c.comb) + '%  •  ' + litros.toFixed(1) + ' L DE ' + (def.tanque || '?') + ' L', pxx + 10 * k, pyy + 62 * k, '#fff', 8);
  if (c.humano >= 0 && c.abast.t > 0.7 && Math.floor(tempoReal * 2) % 2) txt('ACELERA = SAIR', v.x + v.w - 14 * k, pyy + ph - 14 * k, '#ffe04a', 8, 'd');
  ctx.restore();
}

// ============================================================ HUD
function hud(v, c, idx) {
  const dois = v.h < H, e = dois ? 0.62 : 1, m = dois ? 4 : 8, pos = posicao(c), tot = corredores.length;
  ctx.fillStyle = 'rgba(6,8,12,0.72)'; ctx.fillRect(v.x + m - 4, v.y + m - 4, dois ? 86 : 118, dois ? 34 : 50);
  txt(humanos.length > 1 ? 'P' + (idx + 1) : 'POSIÇÃO', v.x + m, v.y + m, '#9ad0ff', 8);
  txt(pos + 'º', v.x + m, v.y + m + 12, pos === 1 ? '#ffd23a' : '#ffffff', dois ? 16 : 24);
  txt('/' + tot, v.x + m + (dois ? 38 : 58), v.y + m + (dois ? 20 : 28), '#c8c8d2', 8);
  const rw = 150, rx = v.x + v.w - rw - m, ry = v.y + m;
  ctx.fillStyle = 'rgba(6,8,12,0.72)'; ctx.fillRect(rx - 4, ry - 4, rw + 8, dois ? 34 : 44);
  txt(fmtTempo(tempoCorrida), rx + rw, ry, '#fff', dois ? 8 : 16, 'd');
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
  if (contagem > 0) {
    const n = Math.ceil(contagem);
    if (n <= 3) { const esc = 1 + (contagem % 1) * 0.6; ctx.save(); ctx.translate(cx, cy); ctx.scale(esc, esc); txt(String(n), 0, -T, '#ffd23a', T * 2, 'c'); ctx.restore(); }
    else txt('PREPARAR...', cx, cy, '#fff', dois ? 8 : 16, 'c');
  } else if (tempoCorrida < 1.3) txt('VAI!', cx, cy - T / 2, '#4ef03a', T * 1.5, 'c');
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
  const w = 300, h = 50, x = W / 2 - w / 2, y = humanos.length > 1 ? H / 2 - h / 2 : 8;
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
function telaTitulo() {
  let sel = 0;
  const itens = [['1 JOGADOR', () => irPara(telaSelecao(1))], ['2 JOGADORES', () => doisJogadores()], ['OPÇÕES', () => irPara(telaOpcoes())]];
  return {
    nome: 'titulo',
    entrar() { novaCorrida([], true); SOM.tocarMusica('menu'); },
    update(dt) {
      atualizarCorrida(dt);
      if (apertou(0, 'esq')) { sel = (sel + 2) % 3; SOM.clique(); }
      if (apertou(0, 'dir')) { sel = (sel + 1) % 3; SOM.clique(); }
      if (apertou(0, 'acel') || apertou(1, 'acel')) { SOM.confirma(); itens[sel][1](); }
    },
    render() {
      renderVista(0, { x: 0, y: 0, w: W, h: H }, corredores[0], 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.78)'); g.addColorStop(0.55, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      logo(W / 2, 88, 1 + Math.sin(tempoReal * 1.5) * 0.02);
      txt('BLACK ROCK MC', W / 2, 162, '#ffffff', 32, 'c', '#7a2a00');
      txt('THE GAME', W / 2, 202, '#ff6a00', 16, 'c');
      alvosToque = [];
      itens.forEach(([r, fn], i) => botao(W / 2 - 225 + i * 155, 244, 140, 34, r, () => { sel = i; SOM.confirma(); fn(); }, i === sel));
      txt(p2Conectado ? 'JOGADOR 2 CONECTADO' : 'VIAGEM 1: ITAÚNA → APARECIDA', W / 2, 300, p2Conectado ? '#4ef03a' : '#c8c8d2', 8, 'c');
      if (Math.floor(tempoReal * 1.5) % 2) txt('TOQUE EM UMA OPÇÃO', W / 2, 322, '#ffd23a', 8, 'c');
      txt('v2.0', W - 8, H - 14, '#666', 8, 'd', false);
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
        const lat = lateralDe(p), lw = n === 1 ? lat.width : Math.min(lat.width * 0.75, v.w - 20), lh = lat.height * (lw / lat.width);
        const lx = n === 1 ? 190 - lw / 2 + (1 - an) * -40 : cx - lw / 2, ly = (n === 1 ? 262 : 250) - lh;
        ctx.globalAlpha = an; ctx.drawImage(lat, lx, ly, lw, lh);
        ctx.save(); ctx.globalAlpha = 0.16 * an; ctx.translate(0, (ly + lh) * 2); ctx.scale(1, -1); ctx.drawImage(lat, lx, ly, lw, lh); ctx.restore(); ctx.globalAlpha = 1;
        const ret = p.retrato && IMG[p.retrato], rx = n === 1 ? 400 : v.x + 10, ry = n === 1 ? 44 : 30, rs = n === 1 ? 128 : 64;
        ctx.fillStyle = '#ff6a00'; ctx.fillRect(rx - 3, ry - 3, rs + 6, rs + 6);
        const gr = ctx.createLinearGradient(0, ry, 0, ry + rs); gr.addColorStop(0, '#2a3a4a'); gr.addColorStop(1, '#10161e'); ctx.fillStyle = gr; ctx.fillRect(rx, ry, rs, rs);
        if (ret) ctx.drawImage(ret, rx, ry, rs, rs);
        const tx = rx + rs + (n === 1 ? 14 : 10);
        txt(n === 1 ? 'PILOTO' : 'JOGADOR ' + (j + 1), tx, ry + 2, j ? '#5ab4ff' : '#ff8a2a', 8);
        txt(p.nome, tx, ry + 16, '#fff', 16);
        txt(p.moto, tx, ry + 40, '#c8c8d2', 8);
        txt(p.cc + ' CC • ' + p.tanque + ' L', tx, ry + 54, '#9a9aa4', 8);
        if (n === 1) txt('ABASTECE EM ' + tempoTanque(p).toFixed(1) + ' S', tx, ry + 68, '#9a9aa4', 8);
        const est = [['VELOCIDADE', (p.vel - 170) / 70], ['ACELERAÇÃO', p.acel], ['ECONOMIA', p.economia], ['CURVAS', p.curva]];
        const sx = n === 1 ? 400 : v.x + 14, sy = n === 1 ? 192 : 262, bw = n === 1 ? 220 : v.w - 28;
        est.forEach(([r, f], i) => {
          const yy = sy + i * (n === 1 ? 16 : 11);
          txt(r, sx, yy, '#9a9aa4', 8, 'e', false);
          const bx = sx + 96; ctx.fillStyle = '#1e2228'; ctx.fillRect(bx, yy + 1, bw - 96, 6);
          const gx = ctx.createLinearGradient(bx, 0, bx + bw - 96, 0); gx.addColorStop(0, '#c44a00'); gx.addColorStop(1, '#ffb02a');
          ctx.fillStyle = gx; ctx.fillRect(bx, yy + 1, (bw - 96) * f * an, 6);
        });
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
      txt('ESCOLHA SEU PILOTO', n === 1 ? 400 : W / 2, n === 1 ? 14 : 8, '#ff8a2a', n === 1 ? 16 : 8, n === 1 ? 'e' : 'c');
      botao(8, 8, 70, 22, 'VOLTAR', () => irPara(telaTitulo()));
    }
  };
}
function telaRota(escolhas) {
  let t = 0;
  const v = VIAGEM, pts = v.mapa.map(([nome, la, lo]) => [nome, 170 + (lo + 46.8) / 2.9 * 300, 90 + (-19.7 - la) / 4.0 * 240]);
  const partir = () => { if (t > 1.2) { novaCorrida(escolhas, false); irPara(telaCorrida()); } };
  return {
    nome: 'rota', toqueGeral: partir,
    update(dt) { t += dt; if (apertou(0, 'acel') || apertou(1, 'acel')) partir(); },
    render() {
      fundoEscuro('#0b1622', '#03060a');
      ctx.strokeStyle = 'rgba(90,180,255,0.07)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      txt(v.nome, 24, 18, '#ff8a2a', 8); txt(v.titulo, 24, 32, '#fff', 16);
      txt(v.km + ' KM • ' + v.sub, 24, 56, '#9ad0ff', 8);
      txt('2 POSTOS • 3 PEDÁGIOS • SERRA DA MANTIQUEIRA', 24, 70, '#9a9aa4', 8);
      const prog = clamp(t / 2.4, 0, 1), nseg = (pts.length - 1) * prog;
      ctx.save(); ctx.shadowColor = '#ff6a00'; ctx.shadowBlur = 10; ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= Math.floor(nseg) && i < pts.length; i++) { const p = pts[i]; if (i === 0) ctx.moveTo(p[1], p[2]); else ctx.lineTo(p[1], p[2]); }
      const i0 = Math.floor(nseg), fr = nseg - i0; if (i0 < pts.length - 1) { const a = pts[i0], b = pts[i0 + 1]; ctx.lineTo(lerp(a[1], b[1], fr), lerp(a[2], b[2], fr)); }
      ctx.stroke(); ctx.restore();
      pts.forEach((p, i) => {
        if (i > nseg + 0.01) return;
        const fim = i === 0 || i === pts.length - 1;
        ctx.fillStyle = fim ? '#ffd23a' : '#fff'; ctx.fillRect(p[1] - (fim ? 4 : 2), p[2] - (fim ? 4 : 2), fim ? 8 : 4, fim ? 8 : 4);
        const esq = [0, 3, 5, 7, 8].indexOf(i) >= 0; txt(p[0], p[1] + (esq ? -8 : 8), p[2] - 4, fim ? '#ffd23a' : '#c8c8d2', 8, esq ? 'd' : 'e');
      });
      if (prog >= 1) { const u = pts[pts.length - 1]; ctx.drawImage(tingir(ART.basilica, [255, 200, 120]), u[1] + 16, u[2] - 52, 84, 44); }
      if (t > 1.2 && Math.floor(tempoReal * 2) % 2) txt('TOQUE PARA PARTIR', W / 2, H - 30, '#ffd23a', 16, 'c');
    }
  };
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
function telaResultado() {
  const est = c => c.fim ? c.tempo : tempoCorrida + (FIM_Z - c.z) / (c.max * 0.8);
  const ordem = corredores.slice().sort((a, b) => est(a) - est(b));
  const chave = 'recorde_' + VIAGEM.id, rec = guardar.ler(chave, null);
  const melhor = Math.min.apply(null, humanos.filter(h => h.tempo != null).map(h => h.tempo).concat([Infinity]));
  const novo = isFinite(melhor) && (rec == null || melhor < rec); if (novo) guardar.gravar(chave, melhor);
  let t = 0;
  return {
    nome: 'resultado',
    entrar() { SOM.silenciar(); SOM.bomba(false); },
    toqueGeral() { if (t > 1.5) irPara(telaTitulo()); },
    update(dt) { t += dt; if (t > 1.5 && (apertou(0, 'acel') || apertou(1, 'acel'))) irPara(telaTitulo()); },
    render() {
      const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c2a6a'); gr.addColorStop(0.6, '#ff8a4a'); gr.addColorStop(1, '#3a2030');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      luz(ctx, W / 2, 220, 200, 'rgba(255,170,80,A)', 0.4);
      ctx.drawImage(tingir(ART.basilica, [40, 24, 48]), W / 2 - 210, 70, 420, 220);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
      txt('CHEGAMOS EM APARECIDA!', W / 2, 14, '#ffd23a', 16, 'c');
      const pod = [[1, W / 2 - 60, 120], [0, W / 2 - 180, 100], [2, W / 2 + 60, 80]];
      pod.forEach(([i, x, hgt], kk) => {
        const c = ordem[i === 1 ? 0 : i === 0 ? 1 : 2]; if (!c) return;
        const lugar = i === 1 ? 1 : i === 0 ? 2 : 3, sub = clamp(t * 2 - kk * 0.3, 0, 1), by = 300 - hgt * sub;
        ctx.fillStyle = ['#ffd23a', '#c0c0c8', '#c8804a'][lugar - 1]; ctx.fillRect(x, by, 120, H - by);
        txt(lugar + 'º', x + 60, by + 8, '#111', 16, 'c', false);
        const ret = c.def.retrato && IMG[c.def.retrato];
        if (ret) ctx.drawImage(ret, x + 28, by - 68, 64, 64); else ctx.drawImage(c.img, x + 60 - c.img.width / 4, by - c.img.height / 2, c.img.width / 2, c.img.height / 2);
        txt(c.nome, x + 60, by + 30, '#111', 8, 'c', false); txt(fmtTempo(est(c)), x + 60, by + 44, '#222', 8, 'c', false);
      });
      ordem.slice(3).forEach((c, i) => txt((i + 4) + 'º ' + c.nome + '  ' + (c.fim ? fmtTempo(c.tempo) : '+' + fmtTempo(est(c))), W - 14, 60 + i * 14, c.humano >= 0 ? '#4ef03a' : '#ddd', 8, 'd'));
      txt((novo ? 'NOVO RECORDE! ' : 'RECORDE: ') + fmtTempo(guardar.ler(chave, null)), 14, 60, novo ? '#ffd23a' : '#ddd', 8);
      humanos.forEach((h, i) => txt((humanos.length > 1 ? 'P' + (i + 1) + ': ' : 'VOCÊ: ') + posicao(h) + 'º • ' + (h.batidas || 0) + ' TOMBOS', 14, 76 + i * 14, '#fff', 8));
      if (t > 1.5 && Math.floor(tempoReal * 2) % 2) txt('TOQUE PARA CONTINUAR', W / 2, H - 22, '#fff', 8, 'c');
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
      con.on('open', () => { conexaoP2 = con; p2Conectado = true; modal.classList.remove('on'); avisar('JOGADOR 2 CONECTADO!'); if (estado.nome === 'titulo' || estado.nome === 'selecao') irPara(telaSelecao(2)); });
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
  estado.render && estado.render();
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
  Promise.all([carregar(p => car.setProg(p)), fonte]).then(() => { gerarArte(); montarViagem(VIAGENS[0]); irPara(telaTitulo()); });
}
window.BRMC = { simular(s) { for (let i = 0; i < s * 60; i++) { juntarEntrada(); estado.update(STEP); guardarAnterior(); } }, get estado() { return estado; }, get corredores() { return corredores; },
  get humanos() { return humanos; }, get tempo() { return tempoCorrida; }, get radio() { return radio; }, get postos() { return POSTOS; }, entrada: fontes };
iniciar();
})();
