/* BRMC Racing - Black Rock MC  |  Fase 1
 * Jogo de corrida de motos pseudo-3D (estilo 16 bits) em HTML5 Canvas.
 * Roda no navegador de Android e iPhone, sem instalar nada.
 */
'use strict';
(function () {

// ============================================================ CONSTANTES
const W = 384, H = 216, STEP = 1 / 60;
const SEG = 200, RUMBLE = 3, ROAD = 800, CAMH = 1000, DRAW = 170;
const CAMD = 1 / Math.tan(50 * Math.PI / 180);   // FOV 100°
const PZ = CAMH * CAMD;                           // distância câmera -> moto
const KMH = 60;                                   // unidades/s por km/h
const CENTRIF = 0.25;
const PX2N = 5.21 / ROAD / 2;                     // pixel do sprite -> meia-largura normalizada
const MOTO_HW = 40 * PX2N;

const params = new URLSearchParams(location.search);
const SALA = params.get('sala');
const DEV2P = params.get('dev2p') === '1';

// ============================================================ UTIL
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const guardar = {
  ler(k, d) { try { const v = localStorage.getItem('brmc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  gravar(k, v) { try { localStorage.setItem('brmc_' + k, JSON.stringify(v)); } catch (e) {} }
};
function fmtTempo(t) { if (t == null || !isFinite(t)) return '--:--.-'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }

// ============================================================ TELA
const tela = document.getElementById('tela');
const telaCtx = tela.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const ctx = buf.getContext('2d');
let escalaTela = 1;
function ajustarTela() {
  const vw = window.innerWidth, vh = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
  escalaTela = Math.min(vw / W, vh / H);
  const cw = Math.floor(W * escalaTela), ch = Math.floor(H * escalaTela);
  tela.style.width = cw + 'px'; tela.style.height = ch + 'px';
  tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr);
}
window.addEventListener('resize', ajustarTela);
window.addEventListener('orientationchange', () => setTimeout(ajustarTela, 200));

// ============================================================ FONTE 3x5
const FONTE = {
  A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',
  G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',
  M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',
  S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
  Y:'101101010010010',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110',
  '4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
  ' ':'000000000000000','.':'000000000000010',':':'000010000010000','-':'000000111000000','/':'001001010100100','!':'010010010000010',
  '?':'110001010000010','%':'101001010100101','+':'000010111010000',',':'000000000010100','<':'001010100010001','>':'100010001010100',
  '(':'010100100100010',')':'010001001001010',"'":'010010000000000','=':'000111000111000','#':'101111101111101','º':'010101010000000'
};
function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
function largTxt(s, e) { return norm(s).length * 4 * e - e; }
function txt(s, x, y, cor, e, al, sombra) {
  e = e || 1; s = norm(s);
  const w = s.length * 4 * e - e;
  if (al === 'c') x -= Math.floor(w / 2); else if (al === 'd') x -= w;
  x = Math.round(x); y = Math.round(y);
  const passes = sombra === false ? [[cor, 0]] : [[sombra || '#000', e], [cor, 0]];
  for (const [c, o] of passes) {
    ctx.fillStyle = c;
    let cx = x;
    for (const ch of s) {
      const g = FONTE[ch] || FONTE[' '];
      for (let i = 0; i < 15; i++) if (g.charCodeAt(i) === 49) ctx.fillRect(cx + (i % 3) * e + o, y + ((i / 3) | 0) * e + o, e, e);
      cx += 4 * e;
    }
  }
  return w;
}

// ============================================================ IMAGENS
const NOMES = ['piloto', 'lateral_versys', 'piloto_leosao', 'lateral_gs', 'retrato_jellison', 'retrato_jellison_p', 'retrato_leosao', 'retrato_leosao_p', 'emblema_64', 'emblema_96', 'car_rear', 'car_front', 'truck_rear', 'truck_front',
  'carreta_rear', 'moto_rear', 'moto_front', 'tree', 'pine', 'bush', 'rock', 'placa_posto', 'placa_posto2', 'seta_e', 'seta_d',
  'posto', 'arco_largada', 'arco_chegada'];
const IMG = {};
function carregarImagens() {
  return Promise.all(NOMES.map(n => new Promise(ok => {
    const i = new Image();
    i.onload = () => { IMG[n] = i; ok(); };
    i.onerror = () => { const c = document.createElement('canvas'); c.width = c.height = 8; IMG[n] = c; ok(); };
    i.src = 'assets/' + n + '.png';
  })));
}
function paraCanvas(img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; }
function mexerPixels(img, fn) {
  const c = paraCanvas(img), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) if (p[i + 3]) fn(p, i);
  g.putImageData(d, 0, 0); return c;
}
// troca as cores-chave magenta (B1/B2/B3) pela cor do veículo
function pintarChave(img, cor) {
  return mexerPixels(img, (p, i) => {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (g < 10 && r === 255 && b === 255) { p[i] = cor[0]; p[i + 1] = cor[1]; p[i + 2] = cor[2]; }
    else if (g < 10 && r === 170 && b === 170) { p[i] = cor[0] * .62; p[i + 1] = cor[1] * .62; p[i + 2] = cor[2] * .62; }
    else if (r === 255 && g === 140 && b === 255) { p[i] = (cor[0] + 255) / 2; p[i + 1] = (cor[1] + 255) / 2; p[i + 2] = (cor[2] + 255) / 2; }
  });
}
// troca o verde da moto por outra cor (pilotos provisórios)
function trocarVerde(img, cor) {
  return mexerPixels(img, (p, i) => {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (g > r + 28 && g > b + 18) {
      const f = g / 196;
      for (let k = 0; k < 3; k++) p[i + k] = f <= 1 ? cor[k] * f : cor[k] + (255 - cor[k]) * Math.min(1, (f - 1) * 1.6);
    }
  });
}
// inclinação nas curvas: desloca cada linha (mantém o pixel nítido)
function inclinar(cnv, k) {
  const h = cnv.height, pad = Math.ceil(Math.abs(k) * h) + 1;
  const c = document.createElement('canvas'); c.width = cnv.width + pad * 2; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) g.drawImage(cnv, 0, y, cnv.width, 1, pad + Math.round(k * (h - 1 - y)), y, cnv.width, 1);
  return c;
}
const cacheMotos = {};
function quadrosMoto(def) {
  const cor = def.cor, spr = def.sprite || 'piloto';
  const chave = spr + (cor ? cor.join(',') : '');
  if (cacheMotos[chave]) return cacheMotos[chave];
  const base = cor ? trocarVerde(IMG[spr], cor) : paraCanvas(IMG[spr]);
  return (cacheMotos[chave] = [-0.13, -0.065, 0, 0.065, 0.13].map(k => k ? inclinar(base, k) : base));
}
const cacheLateral = {};
function lateral(def) {
  const cor = def.cor, spr = def.lateral || 'lateral_versys';
  const chave = spr + (cor ? cor.join(',') : '');
  return cacheLateral[chave] || (cacheLateral[chave] = cor ? trocarVerde(IMG[spr], cor) : IMG[spr]);
}
const cacheVeic = {};
function spriteVeic(nome, cor) {
  const k = nome + (cor ? cor.join(',') : '');
  return cacheVeic[k] || (cacheVeic[k] = cor ? pintarChave(IMG[nome], cor) : IMG[nome]);
}

// ============================================================ PILOTOS
// Atributos: vel = velocidade final (km/h), acel/economia/curva de 0 a 1.
const PERSONAGENS = [
  { id: 'jellison', nome: 'JELLISON', moto: 'BRMC VRS 650 TOURER', estilo: 'TRAIL TOURING', cor: null, sprite: 'piloto', lateral: 'lateral_versys', retrato: 'retrato_jellison', vel: 205, acel: 0.70, economia: 0.80, curva: 0.80 },
  { id: 'leosao', nome: 'LEOSÃO', moto: 'BRMC GS 850 RALLYE', estilo: 'BIG TRAIL', cor: null, sprite: 'piloto_leosao', lateral: 'lateral_gs', retrato: 'retrato_leosao', vel: 215, acel: 0.82, economia: 0.70, curva: 0.85 }
];
const RIVAIS = [
  { nome: 'MEMBRO 3', cor: [40, 96, 226], vel: 212, acel: 0.75, economia: 0.6, curva: 0.7 },
  { nome: 'MEMBRO 4', cor: [240, 200, 30], vel: 200, acel: 0.8, economia: 0.7, curva: 0.8 },
  { nome: 'MEMBRO 5', cor: [244, 124, 20], vel: 218, acel: 0.7, economia: 0.5, curva: 0.6 },
  { nome: 'MEMBRO 6', cor: [236, 236, 236], vel: 196, acel: 0.65, economia: 0.85, curva: 0.85 },
  { nome: 'MEMBRO 7', cor: [150, 70, 210], vel: 208, acel: 0.8, economia: 0.6, curva: 0.75 },
  { nome: 'MEMBRO 8', cor: [150, 154, 164], vel: 215, acel: 0.6, economia: 0.65, curva: 0.7 },
  { nome: 'MEMBRO 9', cor: [30, 190, 200], vel: 204, acel: 0.75, economia: 0.7, curva: 0.7 }
];

// ============================================================ PISTAS
// Cada trecho: [comprimento em segmentos, curva (- esquerda / + direita), subida/descida]
const PISTAS = [{
  nome: 'PASSEIO 01', sub: 'SERRA', semente: 1977, tema: 'serra', postos: [0.40, 0.72],
  trechos: [
    [160, 0, 0], [200, 3, 10], [120, 0, -10], [160, -4, 20], [160, 4, 0], [200, 0, -20], [180, -6, 10], [140, 0, 30],
    [220, 3, -30], [120, -3, 0], [280, 0, 0], [180, 5, 20], [180, -5, -10], [150, 0, -20], [200, 6, 20], [120, 0, 0],
    [160, -2, -20], [240, -4, 10], [140, 4, 0], [220, 0, 30], [160, -6, -30], [160, 6, 0], [280, 0, -10], [180, 3, 20],
    [180, -3, -20], [200, 0, 0], [200, 4, 10], [160, -5, 0], [200, 0, -10], [150, 2, 0], [240, 0, 0]
  ]
}];
const TEMAS = {
  serra: {
    ceu: ['#4682dc', '#a8cdf0'], nevoa: [168, 205, 240], montanha: '#56709a', montanha2: '#6c86ae', morro: '#346840',
    grama: ['#48a034', '#3c8c2c'], pista: ['#68686e', '#606066'], zebra: ['#dc1e1e', '#f0f0f0'], faixa: '#fad228',
    acost: '#9a9a92', arvores: ['pine', 'pine', 'tree', 'bush', 'rock']
  }
};

let segs = [], PISTA = null, TEMA = null, START_I = 26, FIM_I = 0, FIM_Z = 0, DIST = 1, POSTOS = [];
function easeIn(a, b, p) { return a + (b - a) * p * p; }
function easeInOut(a, b, p) { return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5); }
function ultimoY() { return segs.length ? segs[segs.length - 1].p2.y : 0; }
function addSeg(curva, y) {
  const n = segs.length;
  segs.push({ i: n, p1: { y: ultimoY(), z: n * SEG }, p2: { y, z: (n + 1) * SEG }, curva, spr: [], esc: Math.floor(n / RUMBLE) % 2, posto: false });
}
function addTrecho(ent, seg, sai, curva, morro) {
  const sy = ultimoY(), ey = sy + morro * SEG, tot = ent + seg + sai;
  for (let n = 0; n < ent; n++) addSeg(easeIn(0, curva, n / ent), easeInOut(sy, ey, n / tot));
  for (let n = 0; n < seg; n++) addSeg(curva, easeInOut(sy, ey, (ent + n) / tot));
  for (let n = 0; n < sai; n++) addSeg(easeInOut(curva, 0, n / sai), easeInOut(sy, ey, (ent + seg + n) / tot));
}
const ESC_CENARIO = { tree: 3, pine: 3, bush: 2.2, rock: 2.2, placa_posto: 2, placa_posto2: 2, seta_e: 2, seta_d: 2, posto: 2.4 };
function addSprite(i, nome, x, solido) {
  if (!segs[i]) return;
  const img = IMG[nome], esc = ESC_CENARIO[nome] || 1;
  segs[i].spr.push({ img, x, esc, solido: !!solido, hw: img.width * esc * PX2N * (nome === 'tree' || nome === 'pine' ? 0.35 : 0.8) });
}
function montarPista(p) {
  PISTA = p; TEMA = TEMAS[p.tema]; segs = [];
  const R = rng(p.semente);
  addTrecho(0, 70, 0, 0, 0);
  for (const [len, c, h] of p.trechos) { const e = Math.round(len * 0.3); addTrecho(e, len - 2 * e, e, c, h); }
  FIM_I = segs.length + 20;
  addTrecho(0, 320, 0, 0, 0);
  FIM_Z = FIM_I * SEG; DIST = FIM_Z - START_I * SEG;
  // postos de combustível (em trechos retos)
  POSTOS = [];
  for (const f of p.postos) {
    let alvo = Math.round(START_I + f * (FIM_I - START_I)), ok = alvo;
    for (let d = 0; d < 400; d++) {
      const t = [alvo + d, alvo - d].find(k => { for (let j = k - 26; j <= k + 26; j++) if (!segs[j] || Math.abs(segs[j].curva) > 0.3) return false; return true; });
      if (t) { ok = t; break; }
    }
    for (let j = ok - 22; j <= ok + 22; j++) segs[j].posto = true;
    POSTOS.push({ i: ok, z0: (ok - 22) * SEG, z1: (ok + 22) * SEG, z: ok * SEG });
    addSprite(ok - 4, 'posto', 1.75, true);
    addSprite(ok - 150, 'placa_posto', 1.3, true);
    addSprite(ok - 75, 'placa_posto2', 1.3, true);
  }
  // cenário
  for (let i = 30; i < segs.length; i++) {
    const s = segs[i];
    if (i % 5 === 0) {
      for (const lado of [-1, 1]) {
        if (lado > 0 && (s.posto || (segs[i + 6] && segs[i + 6].posto))) continue;
        if (R() < 0.72) { const n = TEMA.arvores[Math.floor(R() * TEMA.arvores.length)]; addSprite(i, n, lado * (1.45 + R() * 1.8), n !== 'bush'); }
      }
    }
    if (i % 3 === 0 && R() < 0.25) addSprite(i, 'bush', (R() < 0.5 ? -1 : 1) * (3.2 + R() * 2), false);
    if (Math.abs(s.curva) > 3.5 && i % 9 === 0) addSprite(i, s.curva > 0 ? 'seta_d' : 'seta_e', s.curva > 0 ? -1.25 : 1.25, true);
  }
  addSprite(START_I, 'arco_largada', 0, false);
  addSprite(FIM_I, 'arco_chegada', 0, false);
}
const segEm = z => segs[clamp(Math.floor(z / SEG), 0, segs.length - 1)];

// ============================================================ TRÂNSITO
const TIPOS = [
  { tras: 'car_rear', frente: 'car_front', w: 60, len: 420, vmin: 72, vmax: 108, p: 0.5, cores: true },
  { tras: 'moto_rear', frente: 'moto_front', w: 26, len: 220, vmin: 80, vmax: 115, p: 0.13, cores: true },
  { tras: 'truck_rear', frente: 'truck_front', w: 84, len: 820, vmin: 55, vmax: 80, p: 0.2, cores: 'frente' },
  { tras: 'carreta_rear', frente: 'truck_front', w: 92, len: 1500, vmin: 48, vmax: 72, p: 0.17, cores: 'frente' }
];
const CORES_VEIC = [[200, 30, 30], [30, 80, 200], [228, 228, 228], [34, 34, 38], [240, 200, 40], [120, 120, 132], [20, 120, 60], [150, 60, 30], [90, 140, 200]];
let trafego = [];
function sortearTipo() { let r = Math.random(); for (const t of TIPOS) { if ((r -= t.p) < 0) return t; } return TIPOS[0]; }
function criarVeiculo(z, oposto) {
  const t = sortearTipo(), cor = CORES_VEIC[Math.floor(Math.random() * CORES_VEIC.length)];
  const nome = oposto ? t.frente : t.tras;
  const usaCor = t.cores === true || (t.cores === 'frente' && oposto);
  const v = rnd(t.vmin, t.vmax) * KMH;
  const faixa = oposto ? -0.5 : 0.5, jit = t.w < 30 ? rnd(-0.22, 0.22) : rnd(-0.06, 0.06);
  return { z, x: faixa + jit, v: oposto ? -v : v, img: spriteVeic(nome, usaCor ? cor : null), hw: t.w * PX2N, len: t.len, oposto };
}
function gerarTrafego() {
  trafego = [];
  for (let z = (START_I + 70) * SEG; z < FIM_Z; z += rnd(8500, 15000)) trafego.push(criarVeiculo(z, false));
  for (let z = (START_I + 40) * SEG; z < FIM_Z + 60 * SEG; z += rnd(9000, 16000)) trafego.push(criarVeiculo(z, true));
}
function atualizarTrafego(dt) {
  const fim = FIM_Z + 100 * SEG, ini = (START_I + 40) * SEG;
  for (const v of trafego) {
    v.z += v.v * dt;
    if (v.z > fim) v.z = ini + (v.z - fim);
    if (v.z < ini) v.z = fim - (ini - v.z);
  }
}

// ============================================================ ENTRADA
const entrada = [{ esq: false, dir: false, acel: false, freio: false }, { esq: false, dir: false, acel: false, freio: false }];
const anterior = [{}, {}];
const fontes = { teclado: [{}, {}], toque: {}, remoto: {} };
const pulso = [{}, {}];
function juntarEntrada() {
  for (const k of ['esq', 'dir', 'acel', 'freio']) {
    entrada[0][k] = !!(fontes.teclado[0][k] || fontes.toque[k] || pulso[0][k]);
    entrada[1][k] = !!(fontes.teclado[1][k] || fontes.remoto[k] || pulso[1][k]);
  }
}
function apertou(j, k) { return entrada[j][k] && !anterior[j][k]; }
function guardarAnterior() { for (let j = 0; j < 2; j++) { anterior[j] = Object.assign({}, entrada[j]); pulso[j] = {}; } juntarEntrada(); }
const TECLAS = {
  ArrowLeft: [0, 'esq'], ArrowRight: [0, 'dir'], ArrowUp: [0, 'acel'], ArrowDown: [0, 'freio'], KeyZ: [0, 'acel'], KeyX: [0, 'freio'],
  Space: [0, 'acel'], Enter: [0, 'acel'],
  KeyA: [1, 'esq'], KeyD: [1, 'dir'], KeyW: [1, 'acel'], KeyS: [1, 'freio']
};
window.addEventListener('keydown', e => {
  Som.iniciar();
  const t = TECLAS[e.code]; if (!t) { if (e.code === 'Escape' || e.code === 'KeyP') alternarPausa(); return; }
  if (t[0] === 1 && !DEV2P && !p2Conectado) return;
  if (!e.repeat) pulso[t[0]][t[1]] = true;
  fontes.teclado[t[0]][t[1]] = true; e.preventDefault();
});
window.addEventListener('keyup', e => { const t = TECLAS[e.code]; if (t) fontes.teclado[t[0]][t[1]] = false; });

function ligarBotoes(container, alvo, aoMudar) {
  const ativos = new Map();
  const atualizar = () => {
    const novo = {};
    for (const k of ativos.values()) novo[k] = true;
    for (const k of ['esq', 'dir', 'acel', 'freio']) {
      const v = !!novo[k];
      if (alvo[k] !== v) { alvo[k] = v; aoMudar && aoMudar(k, v); }
      const el = container.querySelector('[data-k="' + k + '"]'); if (el) el.classList.toggle('press', v);
    }
  };
  container.querySelectorAll('.bt').forEach(el => {
    const k = el.dataset.k;
    el.addEventListener('pointerdown', e => { e.preventDefault(); Som.iniciar(); try { el.setPointerCapture(e.pointerId); } catch (x) {} ativos.set(e.pointerId, k); atualizar(); if (navigator.vibrate) navigator.vibrate(8); });
    const solta = e => { if (ativos.get(e.pointerId) === k) { ativos.delete(e.pointerId); atualizar(); } };
    el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta); el.addEventListener('lostpointercapture', solta);
  });
  window.addEventListener('blur', () => { ativos.clear(); atualizar(); });
}

// toques na própria tela (menus)
let alvosToque = [];
tela.addEventListener('pointerdown', e => {
  Som.iniciar();
  const r = tela.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  for (const a of alvosToque) if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) { a.fn(); return; }
  if (estado.toqueGeral) estado.toqueGeral();
});

// ============================================================ SOM (Web Audio, sintetizado)
const Som = {
  ac: null, ligado: guardar.ler('som', true), motores: [], musicaOn: false, prox: 0, passo: 0,
  iniciar() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    this.mestre = ac.createGain(); this.mestre.gain.value = this.ligado ? 0.8 : 0; this.mestre.connect(ac.destination);
    this.musGain = ac.createGain(); this.musGain.gain.value = 0.32; this.musGain.connect(this.mestre);
    this.sfx = ac.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.mestre);
    // desbloqueio do iOS: toca um buffer mudo dentro do gesto
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0);
    const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.ruido = n;
    for (let j = 0; j < 2; j++) {
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o1.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = -1200 + 8; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx); o1.start(); o2.start();
      this.motores.push({ o1, o2, f, g });
    }
    setInterval(() => this.agendar(), 25);
  },
  alternar() {
    this.ligado = !this.ligado; guardar.gravar('som', this.ligado);
    if (this.mestre) this.mestre.gain.setTargetAtTime(this.ligado ? 0.8 : 0, this.ac.currentTime, 0.05);
  },
  motor(j, rpm, gas, vol) {
    const m = this.motores[j]; if (!m) return;
    const t = this.ac.currentTime, f = 38 + rpm * 120;
    m.o1.frequency.setTargetAtTime(f, t, 0.05); m.o2.frequency.setTargetAtTime(f, t, 0.05);
    m.f.frequency.setTargetAtTime(400 + rpm * 900 + gas * 500, t, 0.05);
    m.g.gain.setTargetAtTime(vol * (0.05 + gas * 0.05), t, 0.08);
  },
  silenciarMotores() { for (const m of this.motores) m.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); },
  bip(freq, dur, tipo, vol) {
    if (!this.ac) return; const t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = tipo || 'square'; o.frequency.value = freq; g.gain.setValueAtTime(vol || 0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  batida() {
    if (!this.ac) return; const t = this.ac.currentTime, s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    s.buffer = this.ruido; f.type = 'lowpass'; f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t); s.stop(t + 0.65);
  },
  // ---------------- música original (rock 16 bits, Lá menor, 152 bpm)
  tocarMusica(on) { this.musicaOn = on; if (on && this.ac) { this.prox = this.ac.currentTime + 0.1; this.passo = 0; } },
  agendar() {
    if (!this.ac || !this.musicaOn) return;
    const dur = 60 / 152 / 2; // colcheia
    while (this.prox < this.ac.currentTime + 0.12) { this.nota(this.passo, this.prox, dur); this.passo = (this.passo + 1) % 64; this.prox += dur; }
  },
  nota(p, t, dur) {
    const comp = Math.floor(p / 8), pos = p % 8;
    const raiz = [45, 41, 48, 43, 45, 41, 48, 43][comp];
    const baixo = [0, 0, 12, 0, 0, 12, 0, 7][pos];
    this.inst('sawtooth', raiz + baixo - 12, t, dur * 0.9, 0.16, 900);
    const mel = MELODIA[p];
    if (mel) this.inst('square', mel[0], t, dur * mel[1] * 0.95, 0.09, 3000);
    if (pos === 0 || pos === 4) this.bumbo(t);
    if (pos === 2 || pos === 6) this.caixa(t);
    this.chimbal(t, pos % 2 ? 0.03 : 0.06);
  },
  inst(tipo, midi, t, dur, vol, corte) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = tipo; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12); f.type = 'lowpass'; f.frequency.value = corte;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.musGain); o.start(t); o.stop(t + dur + 0.02);
  },
  bumbo(t) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g); g.connect(this.musGain); o.start(t); o.stop(t + 0.16);
  },
  caixa(t) {
    const ac = this.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.ruido; f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    s.connect(f); f.connect(g); g.connect(this.musGain); s.start(t, Math.random() * 0.5); s.stop(t + 0.15);
  },
  chimbal(t, v) {
    const ac = this.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.ruido; f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    s.connect(f); f.connect(g); g.connect(this.musGain); s.start(t, Math.random() * 0.5); s.stop(t + 0.05);
  }
};
// melodia: [nota MIDI, duração em colcheias] por colcheia (64 = 8 compassos)
const MELODIA = (function () {
  const N = { 'F4': 65, 'G4': 67, 'A4': 69, 'B4': 71, 'C5': 72, 'D5': 74, 'E5': 76, 'F5': 77, 'G5': 79, 'A5': 81 };
  const s = 'A4 _ C5 E5 _ D5 C5 A4 | C5 _ A4 F4 _ A4 C5 D5 | E5 _ G5 E5 _ D5 C5 D5 | B4 _ D5 G5 F5 E5 D5 _ | ' +
            'A5 _ G5 E5 _ D5 E5 _ | F5 _ E5 C5 _ A4 C5 _ | G5 _ E5 C5 _ E5 G5 A5 | G5 _ _ D5 _ B4 D5 _';
  const t = s.replace(/\|/g, ' ').trim().split(/\s+/), out = new Array(64).fill(null);
  for (let i = 0; i < t.length; i++) if (N[t[i]]) { let d = 1; while (t[i + d] === '_') d++; out[i] = [N[t[i]], d]; }
  return out;
})();

// ============================================================ CORRIDA
let corredores = [], humanos = [], tempoCorrida = 0, contagem = 0, chegada = [], fimTimer = 0, demo = false, pausado = false;
const CONS_BASE = () => 100 / (DIST * 0.52);
let tremor = [0, 0];

function criarCorredor(def, i, humano) {
  const max = def.vel * KMH;
  return {
    nome: def.nome, def, cor: def.cor, quadros: quadrosMoto(def), max, acel: max / (6.4 - def.acel * 3.2),
    consumo: 1.45 - def.economia * 0.9, curva: def.curva, z: 0, x: 0, v: 0, comb: 100, crash: 0, fim: false, tempo: null,
    humano, auto: humano < 0, steer: 0, bg: 0, abastecendo: false, msgPosto: 0,
    ia: { skill: rnd(0.86, 0.95), faixa: rnd(0.25, 0.75), encher: 0 }
  };
}
function novaCorrida(escolhas, ehDemo) {
  demo = !!ehDemo;
  if (!PISTA) montarPista(PISTAS[0]);
  const usados = escolhas.map(i => PERSONAGENS[i]);
  const outros = PERSONAGENS.filter(p => usados.indexOf(p) < 0).concat(RIVAIS);
  const lista = [];
  const nIA = 8 - escolhas.length;
  for (let i = 0; i < nIA; i++) lista.push([outros[i], -1]);
  escolhas.forEach((c, j) => lista.push([PERSONAGENS[c], j]));
  corredores = lista.map(([d, h], i) => {
    const c = criarCorredor(d, i, h), fila = Math.floor(i / 2);
    c.z = (START_I - 4 - fila * 4) * SEG;   // grid: humanos largam no fim do pelotão
    c.x = i % 2 ? 0.62 : 0.18;
    return c;
  });
  humanos = corredores.filter(c => c.humano >= 0).sort((a, b) => a.humano - b.humano);
  gerarTrafego();
  tempoCorrida = 0; contagem = demo ? 0 : 3.6; chegada = []; fimTimer = 0; pausado = false;
}

function proximoPosto(z) { return POSTOS.find(p => p.z1 > z) || null; }
function precisaAbastecer(c, p) {
  const taxa = CONS_BASE() * c.consumo;
  const proximo = POSTOS.find(q => q.z > p.z + SEG);
  const alvo = proximo ? proximo.z : FIM_Z;
  const naChegada = c.comb - (p.z - c.z) * taxa * 0.9;
  return naChegada < (alvo - p.z) * taxa * 1.08 ? Math.min(100, (alvo - p.z) * taxa * 1.15 + 6) : 0;
}

function pilotoIA(c, seg) {
  const ia = c.ia, inp = { acel: true, esq: false, dir: false, freio: false };
  let alvoV = c.max * ia.skill, alvoX = ia.faixa;
  if (c.fim) { alvoV = c.max * 0.35; }
  else if (!demo && humanos.length) {
    const lider = Math.max.apply(null, humanos.map(h => h.z)), d = c.z - lider;
    if (d > 4000) alvoV *= 0.9; else if (d < -9000) alvoV *= 1.05;
  }
  // combustível
  const p = proximoPosto(c.z);
  if (p && !c.fim) {
    if (!ia.encher && c.z < p.z0 && c.z > p.z0 - 60 * SEG) ia.encher = precisaAbastecer(c, p);
    if (ia.encher && c.z > p.z0 - 40 * SEG) {
      alvoX = 1.55;
      if (c.z > p.z0 + 4 * SEG && c.comb < ia.encher) alvoV = c.x > 1.2 ? 0 : c.max * 0.15;
      if (c.comb >= ia.encher) ia.encher = 0;
    }
    if (c.z > p.z1) ia.encher = 0;
  }
  if (c.comb <= 0) alvoV = 0;
  // desviar do trânsito
  if (alvoX < 1.1) {
    const fecha = v => Math.max(0, c.v - v.v);
    let obst = null, melhor = 1e9;
    for (const v of trafego) {
      const dz = v.z - c.z, hor = Math.max(1800, fecha(v) * 1.4);
      if (dz > -(v.len / 2 + 150) && dz < hor && Math.abs(v.x - c.x) < v.hw + MOTO_HW + 0.12 && dz < melhor) { melhor = dz; obst = v; }
    }
    if (obst) {
      const livre = x => {
        if (x < -0.95 || x > 1.06) return false;
        for (const v of trafego) {
          const dz = v.z - c.z;
          if (dz > -(v.len / 2 + 220) && dz < Math.max(1500, fecha(v) * 2.4) && Math.abs(v.x - x) < v.hw + MOTO_HW + 0.08) return false;
        }
        return true;
      };
      const a = obst.x + obst.hw + MOTO_HW + 0.14, b = obst.x - obst.hw - MOTO_HW - 0.14;
      const opc = obst.oposto ? [Math.max(0.35, a)].filter(livre) : [a, b].filter(livre).sort((m, n) => Math.abs(m - c.x) - Math.abs(n - c.x));
      if (opc.length) alvoX = opc[0];
      else if (!obst.oposto) { alvoV = Math.min(alvoV, obst.v * 0.95); if (melhor < obst.len / 2 + 3000) inp.freio = c.v > alvoV + 3 * KMH; }
      else alvoX = 0.6;
    }
  }
  // curvas: limita a velocidade para conseguir contornar
  let curvaMax = 0;
  for (let j = 0; j < 30; j += 3) curvaMax = Math.max(curvaMax, Math.abs(segs[Math.min(seg.i + j, segs.length - 1)].curva));
  if (curvaMax > 0.5) alvoV = Math.min(alvoV, c.max * clamp(0.8 / (curvaMax * CENTRIF * (1.2 - 0.4 * c.curva)), 0.45, 1));
  if (c.x < alvoX - 0.03) inp.dir = true; else if (c.x > alvoX + 0.03) inp.esq = true;
  if (c.v > alvoV) { inp.acel = false; if (c.v > alvoV + 12 * KMH) inp.freio = true; }
  return inp;
}

function bater(c, novaV, causa) {
  if (c.crash > 0) return;
  c.causas = c.causas || {}; c.causas[causa] = (c.causas[causa] || 0) + 1;
  c.crash = 1.3; c.v = Math.max(0, novaV); c.batidas = (c.batidas || 0) + 1;
  if (c.humano >= 0 && !demo) { Som.batida(); tremor[c.humano] = 0.35; if (navigator.vibrate) navigator.vibrate(120); }
}

function atualizarCorredor(c, dt) {
  const seg = segEm(c.z), pc = c.v / c.max;
  let inp;
  if (contagem > 0) inp = c.humano >= 0 ? { acel: entrada[c.humano].acel } : { acel: Math.random() < 0.5 };
  else if (c.humano >= 0 && !c.auto) inp = entrada[c.humano];
  else inp = pilotoIA(c, seg);
  if (contagem > 0) { c.gas = inp.acel ? 1 : 0; c.steer = 0; return; }
  if (c.crash > 0) { c.crash -= dt; c.v = Math.max(0, c.v - c.max * 1.6 * dt); inp = {}; }
  c.gas = inp.acel && c.comb > 0 ? 1 : 0;
  const dx = dt * 2.2 * Math.max(pc, 0.12) * (0.85 + 0.3 * c.curva);
  c.steer = 0;
  if (inp.esq) { c.x -= dx; c.steer = -1; }
  if (inp.dir) { c.x += dx; c.steer = 1; }
  c.x -= dx * pc * seg.curva * CENTRIF * (1.2 - 0.4 * c.curva);
  if (c.gas) c.v += c.acel * dt * (1 - 0.45 * pc);
  else if (inp.freio) c.v -= c.max * 0.95 * dt;
  else c.v -= c.max * 0.16 * dt;
  const noPosto = seg.posto && c.x > 1.0 && c.x < 2.6;
  if (Math.abs(c.x) > 1.12 && !noPosto) {
    if (c.v > c.max * 0.3) c.v -= c.max * 0.9 * dt;
    for (const s of seg.spr) {
      if (!s.solido) continue;
      const cx = s.x < 0 ? s.x - s.hw : s.x + s.hw;
      if (Math.abs(cx - c.x) < s.hw + MOTO_HW) { bater(c, 0, 'cenario'); c.x = c.x > 0 ? Math.min(c.x, 1.0) : Math.max(c.x, -1.0); break; }
    }
  }
  c.x = clamp(c.x, -2.8, 2.8);
  c.v = clamp(c.v, 0, c.max);
  const dist = c.v * dt;
  c.comb = Math.max(0, c.comb - dist * CONS_BASE() * c.consumo * (c.gas ? 1 : 0.35));
  c.abastecendo = noPosto && c.v < c.max * 0.2 && !c.fim;
  if (c.abastecendo) c.comb = Math.min(100, c.comb + 30 * dt);
  c.z += dist;
  c.bg = (c.bg + 0.0011 * seg.curva * dist / SEG + 10) % 1;
  if (!c.fim && c.z >= FIM_Z) {
    c.fim = true; c.tempo = tempoCorrida; c.auto = true; chegada.push(c);
    if (c.humano >= 0 && !demo) { Som.bip(880, 0.5, 'square', 0.3); setTimeout(() => Som.bip(1320, 0.6, 'square', 0.3), 180); }
  }
}

function colisoes() {
  for (const c of corredores) {
    if (c.crash > 0) continue;
    for (const v of trafego) {
      const dz = v.z - c.z;
      if (Math.abs(dz) < v.len * 0.5 + 70 && Math.abs(v.x - c.x) < v.hw + MOTO_HW * 0.85) {
        if (v.oposto) { bater(c, 0, 'contramao'); c.z = v.z - v.len * 0.5 - 80; }
        else if (c.v - v.v > 45 * KMH) { bater(c, v.v * 0.4, 'traseira'); c.z = v.z - v.len * 0.5 - 80; }
        else { c.v = Math.min(c.v, v.v * 0.92); c.z = Math.min(c.z, v.z - v.len * 0.5 - 70); }
      }
    }
  }
  for (let i = 0; i < corredores.length; i++) for (let j = i + 1; j < corredores.length; j++) {
    const a = corredores[i], b = corredores[j], dz = b.z - a.z, dx = b.x - a.x;
    if (Math.abs(dz) < 110 && Math.abs(dx) < MOTO_HW * 1.8) {
      const tras = dz > 0 ? a : b, frente = dz > 0 ? b : a;
      tras.v = Math.min(tras.v, frente.v * 0.97);
      const emp = (MOTO_HW * 1.8 - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
      a.x -= emp; b.x += emp;
    }
  }
}
function posicao(c) {
  let p = 1;
  for (const o of corredores) {
    if (o === c) continue;
    if (o.fim && c.fim) { if (o.tempo < c.tempo) p++; }
    else if (o.fim) p++;
    else if (!c.fim && o.z > c.z) p++;
  }
  return p;
}

function atualizarCorrida(dt) {
  if (pausado) return;
  if (contagem > 0) {
    const antes = Math.ceil(contagem); contagem -= dt; const depois = Math.ceil(contagem);
    if (!demo && antes !== depois) Som.bip(depois > 0 ? 440 : 880, depois > 0 ? 0.2 : 0.5, 'square', 0.3);
  } else tempoCorrida += dt;
  atualizarTrafego(dt);
  for (const c of corredores) atualizarCorredor(c, dt);
  colisoes();
  for (let j = 0; j < 2; j++) tremor[j] = Math.max(0, tremor[j] - dt);
  if (!demo && humanos.length && humanos.every(h => h.fim)) {
    fimTimer += dt;
    if (fimTimer > 3.5) irPara(telaResultado());
  }
  if (demo && corredores.length && corredores[0].z > FIM_Z - 40 * SEG) novaCorrida([], true);
  // som do motor
  if (Som.ac) {
    if (demo) Som.silenciarMotores();
    else humanos.forEach((h, j) => {
      const rpm = (h.v / h.max * 4.2) % 1.05 * 0.7 + h.v / h.max * 0.45;
      Som.motor(j, rpm, h.gas, j === 0 ? 1 : 0.6);
    });
  }
}

// ============================================================ RENDER
const fundo = {};
function gerarFundo() {
  const t = TEMA;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ceu = mk(1, 110), g = ceu.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 110);
  gr.addColorStop(0, t.ceu[0]); gr.addColorStop(1, t.ceu[1]); g.fillStyle = gr; g.fillRect(0, 0, 1, 110);
  fundo.ceu = ceu;
  const nuv = mk(768, 60), gn = nuv.getContext('2d'), R = rng(7);
  for (let i = 0; i < 9; i++) {
    const x = R() * 768, y = 6 + R() * 34, w = 30 + R() * 50;
    gn.fillStyle = '#eef4fb'; gn.fillRect(x, y, w, 6); gn.fillRect(x + w * 0.2, y - 4, w * 0.5, 5); gn.fillStyle = '#ffffff'; gn.fillRect(x + w * 0.25, y - 3, w * 0.3, 2);
  }
  fundo.nuvens = nuv;
  const camada = (cor, cor2, alt, f1, f2, a1, a2, sem) => {
    const c = mk(768, alt), gc = c.getContext('2d'), R2 = rng(sem);
    gc.fillStyle = cor;
    const ph = R2() * 10;
    for (let x = 0; x < 768; x++) {
      const yy = alt - (alt * 0.55 + a1 * Math.sin(x / 768 * Math.PI * 2 * f1 + ph) + a2 * Math.sin(x / 768 * Math.PI * 2 * f2 + ph * 2));
      gc.fillRect(x, Math.round(yy), 1, alt);
      if (cor2 && (x % 7 < 3)) { gc.fillStyle = cor2; gc.fillRect(x, Math.round(yy), 1, 2); gc.fillStyle = cor; }
    }
    return c;
  };
  fundo.montanhas = camada(t.montanha, t.montanha2, 64, 3, 7, 16, 7, 3);
  fundo.morros = camada(t.morro, null, 34, 5, 13, 8, 4, 5);
}
function desenharCamada(img, v, desloc, base, k) {
  const w = img.width * k, h = img.height * k;
  let x = -((desloc % 1 + 1) % 1) * w;
  for (; x < v.w; x += w) ctx.drawImage(img, Math.round(v.x + x), Math.round(base - h), Math.ceil(w) + 1, Math.round(h));
}
function cor(c, nev, f) { return f >= 0.999 ? c : c; }

function poligono(x1, y1, x2, y2, x3, y3, x4, y4, c) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
}
function projetar(p, cx, cy, cz, v, kx, ky, out) {
  const camZ = p.z - cz, s = CAMD / camZ;
  out.cz = camZ; out.s = s;
  out.x = Math.round(v.x + v.w / 2 + s * (0 - cx) * kx);
  out.y = Math.round(v.y + v.h / 2 - s * (p.y - cy) * ky);
  out.w = Math.round(s * ROAD * kx);
}
const tmp1 = [], tmp2 = [];
for (let i = 0; i < DRAW; i++) { tmp1.push({}); tmp2.push({}); }

function desenharSprite(img, s, k, sx, sy, offX, clipY, esc) {
  esc = esc || 1;
  const dw = img.width * s * CAMH * k * esc, dh = img.height * s * CAMH * k * esc;
  if (dw < 0.5 || dh < 0.5) return;
  const dx = sx + dw * offX, dy = sy - dh;
  const corte = clipY != null ? Math.max(0, dy + dh - clipY) : 0;
  if (corte >= dh) return;
  const srcH = img.height - img.height * corte / dh;
  if (srcH < 1) return;
  ctx.drawImage(img, 0, 0, img.width, srcH, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh - corte));
}
function quadroInclinado(c) {
  const lean = c.crash > 0 ? 0 : clamp(Math.round(c.steer * 1.4 * Math.min(1, c.v / c.max * 1.6) + segEm(c.z).curva * 0.18 * (c.v / c.max)), -2, 2);
  return c.quadros[lean + 2];
}

function renderVista(v, foco, idx) {
  const k = v.h / H, kx = v.h * 0.8889, ky = v.h / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  const camZ = foco.z - PZ;
  const base = segEm(camZ), basePct = (camZ % SEG) / SEG;
  const pseg = segEm(foco.z), ppct = (foco.z % SEG) / SEG;
  const playerY = lerp(pseg.p1.y, pseg.p2.y, ppct);
  const camY = playerY + CAMH, camX = foco.x * ROAD;
  const horiz = v.y + v.h / 2;
  // fundo
  ctx.drawImage(fundo.ceu, v.x, v.y, v.w, v.h / 2 + 2);
  desenharCamada(fundo.nuvens, v, foco.bg * 0.5 + tempoReal * 0.004, v.y + 60 * k, k);
  desenharCamada(fundo.montanhas, v, foco.bg, horiz + 1, k);
  desenharCamada(fundo.morros, v, foco.bg * 1.8, horiz + 1, k);
  ctx.fillStyle = TEMA.grama[1]; ctx.fillRect(v.x, horiz, v.w, v.h / 2);
  // estrada
  let maxy = v.y + v.h, x = 0, dx = -(base.curva * basePct);
  const lim = Math.min(DRAW, segs.length - base.i);
  const nv = TEMA.nevoa;
  for (let n = 0; n < lim; n++) {
    const s = segs[base.i + n], a = tmp1[n], b = tmp2[n];
    projetar(s.p1, camX - x, camY, camZ, v, kx, ky, a);
    projetar(s.p2, camX - x - dx, camY, camZ, v, kx, ky, b);
    x += dx; dx += s.curva;
    a.clip = maxy;
    if (a.cz <= CAMD || b.y >= a.y || b.y >= maxy) continue;
    const e = s.esc;
    ctx.fillStyle = TEMA.grama[e]; ctx.fillRect(v.x, b.y, v.w, a.y - b.y);
    const r1 = a.w / 7, r2 = b.w / 7;
    poligono(a.x - a.w - r1, a.y, a.x - a.w, a.y, b.x - b.w, b.y, b.x - b.w - r2, b.y, TEMA.zebra[e]);
    poligono(a.x + a.w + r1, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x + b.w + r2, b.y, TEMA.zebra[e]);
    if (s.posto) poligono(a.x + a.w + r1, a.y, a.x + a.w * 2.7, a.y, b.x + b.w * 2.7, b.y, b.x + b.w + r2, b.y, TEMA.acost);
    poligono(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y, TEMA.pista[e]);
    if (e) { const l1 = Math.max(1, a.w / 50), l2 = Math.max(1, b.w / 50); poligono(a.x - l1, a.y, a.x + l1, a.y, b.x + l2, b.y, b.x - l2, b.y, TEMA.faixa); }
    if (s.i === FIM_I || s.i === START_I) { // faixa quadriculada
      const q = 8; for (let j = 0; j < q; j++) { ctx.fillStyle = j % 2 ? '#fff' : '#111'; const xa = a.x - a.w + (2 * a.w) * j / q; ctx.fillRect(xa, b.y, 2 * a.w / q + 1, Math.max(1, a.y - b.y)); }
    }
    const f = n / DRAW, nev = f * f * 0.85;
    if (nev > 0.02) { ctx.fillStyle = `rgba(${nv[0]},${nv[1]},${nv[2]},${nev})`; ctx.fillRect(v.x, b.y, v.w, a.y - b.y); }
    maxy = b.y;
  }
  // objetos (de trás para frente)
  const porSeg = new Map();
  const add = (z, o) => { const i = Math.floor(z / SEG) - base.i; if (i > 0 && i < lim) { if (!porSeg.has(i)) porSeg.set(i, []); porSeg.get(i).push(o); } };
  for (const t of trafego) add(t.z, { t });
  for (const c of corredores) if (c !== foco) add(c.z, { c });
  for (let n = lim - 1; n > 0; n--) {
    const s = segs[base.i + n], a = tmp1[n];
    if (a.cz <= CAMD) continue;
    for (const sp of s.spr) {
      const off = sp.x === 0 ? -0.5 : sp.x < 0 ? -1 : 0;
      desenharSprite(sp.img, a.s, k, a.x + a.s * sp.x * ROAD * kx, a.y, off, a.clip, sp.esc);
    }
    const lst = porSeg.get(n);
    if (lst) {
      const b = tmp2[n];
      for (const o of lst) {
        const obj = o.t || o.c, pct = ((obj.z % SEG) + SEG) % SEG / SEG;
        const sc = lerp(a.s, b.s, pct), sx = lerp(a.x, b.x, pct), sy = lerp(a.y, b.y, pct);
        const img = o.t ? obj.img : quadroInclinado(obj);
        if (o.c && obj.crash > 0 && Math.floor(tempoReal * 12) % 2) continue;
        desenharSprite(img, sc, k, sx + sc * obj.x * ROAD * kx, sy, -0.5, a.clip);
      }
    }
  }
  // moto do jogador
  const img = quadroInclinado(foco);
  const pisca = foco.crash > 0 && Math.floor(tempoReal * 12) % 2;
  const tre = tremor[idx] > 0 ? Math.round(rnd(-2, 2)) : 0;
  const quica = foco.v > 0 && (Math.abs(foco.x) > 1.12 && !(pseg.posto && foco.x > 1)) ? Math.round(rnd(0, 2)) : (foco.v > 0 && Math.random() < 0.15 ? 1 : 0);
  const bw = Math.round(img.width * k), bh = Math.round(img.height * k);
  const bx = Math.round(v.x + v.w / 2 - bw / 2 + tre), by = Math.round(v.y + v.h - bh - 4 * k - quica * k);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(v.x + v.w / 2, v.y + v.h - 4 * k, 24 * k, 4 * k, 0, 0, Math.PI * 2); ctx.fill();
  if (!pisca) ctx.drawImage(img, bx, by, bw, bh);
  if (!demo) hud(v, foco, idx, k);
  ctx.restore();
}

function barra(x, y, w, h, frac, corCheia, corFundo) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = corFundo || '#222'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = corCheia; ctx.fillRect(x, y, Math.round(w * clamp(frac, 0, 1)), h);
}
function hud(v, c, idx, k) {
  const dois = v.h < H, e = dois ? 1 : 2, m = dois ? 3 : 6;
  const pos = posicao(c);
  // posição
  ctx.fillStyle = '#0b0d10'; ctx.fillRect(v.x + m - 2, v.y + m - 2, dois ? 52 : 74, dois ? 24 : 38);
  txt(humanos.length > 1 ? 'P' + (idx + 1) + ' POS' : 'POS', v.x + m, v.y + m, '#c8c8d2', 1);
  txt(pos + '/' + corredores.length, v.x + m, v.y + m + 8, '#ffdc28', dois ? 2 : 3);
  // tempo e progresso
  const pw = dois ? 110 : 150, px = v.x + v.w - pw - m;
  barra(px, v.y + m, pw, dois ? 3 : 4, (c.z - START_I * SEG) / DIST, '#4ec41e');
  for (const p of POSTOS) { ctx.fillStyle = '#fad228'; ctx.fillRect(Math.round(px + pw * (p.z - START_I * SEG) / DIST), v.y + m - 2, 2, dois ? 7 : 8); }
  for (const o of corredores) if (o !== c) { ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(px + pw * clamp((o.z - START_I * SEG) / DIST, 0, 1)), v.y + m + (dois ? 4 : 6), 1, 2); }
  txt('TEMPO ' + fmtTempo(tempoCorrida), v.x + v.w - m, v.y + m + (dois ? 6 : 9), '#fff', 1, 'd');
  // velocímetro e combustível
  const kmh = Math.round(c.v / KMH);
  const bx = v.x + v.w - (dois ? 78 : 98) - m, byy = v.y + m + (dois ? 16 : 22);
  ctx.fillStyle = '#0b0d10'; ctx.fillRect(bx - 3, byy - 3, (dois ? 78 : 98) + 4, (dois ? 22 : 36) + 4);
  txt(String(kmh), bx + (dois ? 30 : 42), byy, '#fff', dois ? 2 : 3, 'd');
  txt('KM/H', bx + (dois ? 34 : 48), byy + (dois ? 4 : 8), '#c8c8d2', 1);
  const fr = c.comb / 100, corC = fr > 0.4 ? '#4ec41e' : fr > 0.18 ? '#f0aa1e' : '#e02020';
  txt('COMB', bx, byy + (dois ? 13 : 23), '#c8c8d2', 1);
  barra(bx + 19, byy + (dois ? 13 : 23), dois ? 54 : 74, dois ? 4 : 6, fr, (fr < 0.18 && Math.floor(tempoReal * 4) % 2) ? '#600' : corC);
  // mensagens
  const cy = v.y + v.h * 0.32;
  if (contagem > 0) {
    const n = Math.ceil(contagem);
    if (n <= 3) txt(String(n), v.x + v.w / 2, cy - 6 * e, '#ffdc28', e * 5, 'c');
    else txt('PREPARAR', v.x + v.w / 2, cy, '#fff', e * 2, 'c');
  } else if (tempoCorrida < 1.2) txt('VAI!', v.x + v.w / 2, cy - 4 * e, '#4ec41e', e * 4, 'c');
  if (c.fim) {
    txt('CHEGADA!', v.x + v.w / 2, cy - 4 * e, '#fff', e * 3, 'c');
    txt(pos + 'º LUGAR  ' + fmtTempo(c.tempo), v.x + v.w / 2, cy + 12 * e, '#ffdc28', e, 'c');
  } else if (c.abastecendo) {
    txt('ABASTECENDO ' + Math.floor(c.comb) + '%', v.x + v.w / 2, cy, '#fad228', e, 'c');
  } else if (c.comb <= 0) {
    txt('SEM COMBUSTIVEL!', v.x + v.w / 2, cy, '#e02020', e, 'c');
  } else {
    const p = proximoPosto(c.z);
    if (p && p.z0 - c.z < 160 * SEG && p.z0 - c.z > 0 && c.comb < 85 && Math.floor(tempoReal * 2.5) % 2)
      txt('POSTO A FRENTE - ENCOSTE A DIREITA', v.x + v.w / 2, cy, '#fad228', 1, 'c');
    else if (p && c.z > p.z0 && c.z < p.z1 && c.comb < 95 && !c.abastecendo)
      txt(c.x > 1 ? 'PARE PARA ABASTECER' : 'ENCOSTE A DIREITA', v.x + v.w / 2, cy, '#fad228', e, 'c');
    else if (c.comb < 18 && Math.floor(tempoReal * 3) % 2) txt('RESERVA!', v.x + v.w / 2, cy, '#e02020', e, 'c');
  }
}

// ============================================================ TELAS
let estado = {}, tempoReal = 0;
function irPara(e) { estado = e; alvosToque = []; e.entrar && e.entrar(); atualizarHTML(); }
function botao(x, y, w, h, rotulo, fn, cor) {
  alvosToque.push({ x, y, w, h, fn });
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = cor || '#146e3c'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w, 1);
  txt(rotulo, x + w / 2, y + h / 2 - 2, '#fff', 1, 'c');
}

function telaTitulo() {
  return {
    nome: 'titulo',
    entrar() { novaCorrida([], true); Som.tocarMusica(true); },
    toqueGeral() { irPara(telaSelecao()); },
    update(dt) { atualizarCorrida(dt); if (apertou(0, 'acel') || apertou(1, 'acel')) irPara(telaSelecao()); },
    render() {
      renderVista({ x: 0, y: 0, w: W, h: H }, corredores[0], 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.6, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(IMG.emblema_96, W / 2 - 48, 14);
      txt('BRMC RACING', W / 2, 118, '#4ec41e', 4, 'c');
      txt('BLACK ROCK MOTO CLUBE - ITAUNA MG', W / 2, 142, '#fff', 1, 'c');
      if (Math.floor(tempoReal * 2) % 2) txt('TOQUE PARA COMECAR', W / 2, 166, '#ffdc28', 2, 'c');
      txt(p2Conectado ? 'JOGADOR 2 CONECTADO' : 'FASE 1 - VERSAO DE TESTE', W / 2, 200, p2Conectado ? '#4ec41e' : '#777', 1, 'c');
    }
  };
}

function telaSelecao() {
  const st = { sel: [0, Math.min(1, PERSONAGENS.length - 1)], ok: [false, false] };
  const nJog = () => (p2Conectado || DEV2P) ? 2 : 1;
  const mudar = (j, d) => { if (st.ok[j]) return; st.sel[j] = (st.sel[j] + d + PERSONAGENS.length) % PERSONAGENS.length; Som.bip(660, 0.06, 'square', 0.15); };
  const confirmar = j => { if (st.ok[j]) return; st.ok[j] = true; Som.bip(990, 0.12, 'square', 0.2); };
  const voltar = j => { if (st.ok[j]) st.ok[j] = false; else if (j === 0) irPara(telaTitulo()); };
  return {
    nome: 'selecao',
    update() {
      for (let j = 0; j < nJog(); j++) {
        if (apertou(j, 'esq')) mudar(j, -1);
        if (apertou(j, 'dir')) mudar(j, 1);
        if (apertou(j, 'acel')) confirmar(j);
        if (apertou(j, 'freio')) voltar(j);
      }
      const n = nJog();
      if (st.ok.slice(0, n).every(Boolean)) {
        const escolhas = st.sel.slice(0, n);
        novaCorrida(escolhas, false); irPara(telaCorrida());
      }
    },
    render() {
      alvosToque = [];
      ctx.fillStyle = '#07090b'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0f1a12'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
      if (nJog() === 1) txt('ESCOLHA SEU PILOTO', W - 8, 8, '#4ec41e', 2, 'd'); else txt('ESCOLHA SEU PILOTO', W / 2, 8, '#4ec41e', 2, 'c');
      const n = nJog();
      for (let j = 0; j < n; j++) {
        const v = n === 1 ? { x: 0, w: W } : { x: j * W / 2, w: W / 2 };
        const p = PERSONAGENS[st.sel[j]], lat = lateral(p), cx = v.x + v.w / 2;
        if (n > 1) txt('JOGADOR ' + (j + 1), cx, 22, j ? '#5ab4ff' : '#ffdc28', 1, 'c');
        const esc = n === 1 ? 2 : 1;
        const lx = n === 1 ? 140 - lat.width : v.x + v.w - lat.width - 4, ly = n === 1 ? 192 - lat.height * 2 : 110 - lat.height;
        ctx.drawImage(lat, lx, ly, lat.width * esc, lat.height * esc);
        const ret = p.retrato && IMG[p.retrato + (n === 1 ? '' : '_p')];
        if (ret) {
          const rx = n === 1 ? 299 : v.x + 6, ry = n === 1 ? 22 : 30;
          ctx.fillStyle = '#4ec41e'; ctx.fillRect(rx - 2, ry - 2, ret.width + 4, ret.height + 4);
          ctx.fillStyle = '#0f1a12'; ctx.fillRect(rx - 1, ry - 1, ret.width + 2, ret.height + 2);
          ctx.drawImage(ret, rx, ry);
        }
        const sx = n === 1 ? 286 : v.x + 12, sy = n === 1 ? 98 : 116;
        txt(p.nome, n === 1 ? sx : cx, sy, '#fff', 2, n === 1 ? 'e' : 'c');
        txt(p.moto, n === 1 ? sx : cx, sy + 14, '#c8c8d2', 1, n === 1 ? 'e' : 'c');
        const est = [['VELOCIDADE', (p.vel - 170) / 70], ['ACELERACAO', p.acel], ['ECONOMIA', p.economia], ['CURVAS', p.curva]];
        const bx = n === 1 ? sx : v.x + 14, bw = n === 1 ? 88 : v.w - 70;
        est.forEach(([r, f], i) => {
          const yy = sy + (n === 1 ? 26 : 24) + i * (n === 1 ? 12 : 10);
          txt(r, bx, yy, '#9a9aa4', 1, 'e', false);
          barra(n === 1 ? bx : bx + 44, n === 1 ? yy + 7 : yy, n === 1 ? bw : bw, 3, f, '#4ec41e');
        });
        // controles
        if (!st.ok[j]) {
          const by = n === 1 ? 196 : 190;
          if (j === 0) {
            botao(v.x + 8, by, 34, 16, '<', () => mudar(0, -1));
            botao(v.x + v.w - 42, by, 34, 16, '>', () => mudar(0, 1));
            botao(cx - 40, by, 80, 16, 'CONFIRMAR', () => confirmar(0), '#2a8a1a');
          } else txt('USE O CELULAR DO P2', cx, by + 7, '#9a9aa4', 1, 'c');
        } else txt('PRONTO!', cx, n === 1 ? 190 : 194, '#4ec41e', 2, 'c');
        txt('<  ' + (st.sel[j] + 1) + '/' + PERSONAGENS.length + '  >', n === 1 ? 330 : cx, n === 1 ? 180 : 176, '#777', 1, 'c');
      }
      if (n > 1) { ctx.fillStyle = '#4ec41e'; ctx.fillRect(W / 2, 20, 1, H - 24); }
      botao(4, 4, 34, 14, 'VOLTAR', () => irPara(telaTitulo()), '#333');
    }
  };
}

function telaCorrida() {
  return {
    nome: 'corrida',
    entrar() { Som.tocarMusica(true); },
    update(dt) { atualizarCorrida(dt); },
    render() {
      if (humanos.length > 1) {
        renderVista({ x: 0, y: 0, w: W, h: H / 2 }, humanos[0], 0);
        renderVista({ x: 0, y: H / 2, w: W, h: H / 2 }, humanos[1], 1);
        ctx.fillStyle = '#000'; ctx.fillRect(0, H / 2 - 1, W, 2);
      } else renderVista({ x: 0, y: 0, w: W, h: H }, humanos[0], 0);
      if (pausado) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
        txt('PAUSA', W / 2, 60, '#fff', 4, 'c');
        alvosToque = [];
        botao(W / 2 - 60, 100, 120, 22, 'CONTINUAR', () => alternarPausa(), '#2a8a1a');
        botao(W / 2 - 60, 130, 120, 22, 'REINICIAR CORRIDA', () => { const e = humanos.map(h => PERSONAGENS.indexOf(h.def)); novaCorrida(e, false); irPara(telaCorrida()); });
        botao(W / 2 - 60, 160, 120, 22, 'SAIR', () => { Som.silenciarMotores && Som.ac && Som.silenciarMotores(); irPara(telaTitulo()); }, '#5a1a1a');
      } else alvosToque = [];
    }
  };
}

function telaResultado() {
  const ordem = corredores.slice().sort((a, b) => {
    const ta = a.fim ? a.tempo : tempoCorrida + (FIM_Z - a.z) / (a.max * 0.8);
    const tb = b.fim ? b.tempo : tempoCorrida + (FIM_Z - b.z) / (b.max * 0.8);
    a._t = ta; b._t = tb; return ta - tb;
  });
  const chaveRec = 'recorde_' + PISTA.nome, rec = guardar.ler(chaveRec, null);
  const melhor = Math.min.apply(null, humanos.filter(h => h.tempo != null).map(h => h.tempo).concat([Infinity]));
  const novoRec = isFinite(melhor) && (rec == null || melhor < rec);
  if (novoRec) guardar.gravar(chaveRec, melhor);
  let t0 = 0;
  return {
    nome: 'resultado',
    entrar() { Som.silenciarMotores && Som.ac && Som.silenciarMotores(); },
    toqueGeral() { if (t0 > 1) irPara(telaSelecao()); },
    update(dt) { t0 += dt; if (t0 > 1 && (apertou(0, 'acel') || apertou(1, 'acel'))) irPara(telaSelecao()); },
    render() {
      ctx.fillStyle = '#07090b'; ctx.fillRect(0, 0, W, H);
      txt('RESULTADO - ' + PISTA.nome + ' ' + PISTA.sub, W / 2, 8, '#4ec41e', 2, 'c');
      ordem.forEach((c, i) => {
        const y = 30 + i * 16, h = c.humano >= 0;
        if (h) { ctx.fillStyle = 'rgba(78,196,30,0.18)'; ctx.fillRect(40, y - 3, W - 80, 14); }
        txt((i + 1) + 'º', 50, y, i === 0 ? '#ffdc28' : '#fff', 2);
        { const q = c.quadros[2], hq = 15, wq = Math.round(q.width * hq / q.height); ctx.drawImage(q, 0, 0, q.width, q.height, 84 - (wq >> 1), y - 4, wq, hq); }
        txt(c.nome + (h ? (humanos.length > 1 ? ' (P' + (c.humano + 1) + ')' : ' (VOCE)') : ''), 94, y, h ? '#4ec41e' : '#fff', 2);
        txt(c.fim ? fmtTempo(c.tempo) : '+' + fmtTempo(c._t), W - 50, y, '#c8c8d2', 2, 'd');
      });
      const r = guardar.ler('recorde_' + PISTA.nome, null);
      txt((novoRec ? 'NOVO RECORDE! ' : 'RECORDE: ') + fmtTempo(r), W / 2, 164, novoRec ? '#ffdc28' : '#9a9aa4', 1, 'c');
      if (t0 > 1 && Math.floor(tempoReal * 2) % 2) txt('TOQUE PARA CONTINUAR', W / 2, 196, '#fff', 1, 'c');
    }
  };
}

function alternarPausa() {
  if (estado.nome !== 'corrida') return;
  pausado = !pausado;
  if (pausado && Som.ac) Som.silenciarMotores();
  atualizarHTML();
}

// ============================================================ HTML (botões, convite, P2)
const elControles = document.getElementById('controles');
const btnConvidar = document.getElementById('btn-convidar');
const btnPausa = document.getElementById('btn-pausa');
const btnSom = document.getElementById('btn-som');
const toque = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
function atualizarHTML() {
  const corrida = estado.nome === 'corrida';
  elControles.classList.toggle('on', corrida && toque && !pausado);
  btnPausa.classList.toggle('on', corrida && !pausado);
  btnSom.classList.toggle('on', estado.nome === 'titulo');
  btnSom.textContent = 'SOM: ' + (Som.ligado ? 'LIGADO' : 'DESLIGADO');
  btnConvidar.classList.toggle('on', (estado.nome === 'titulo' || estado.nome === 'selecao') && !p2Conectado && typeof Peer !== 'undefined');
}
btnPausa.addEventListener('click', alternarPausa);
btnSom.addEventListener('click', () => { Som.iniciar(); Som.alternar(); atualizarHTML(); });
function avisar(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(avisar.t); avisar.t = setTimeout(() => t.style.display = 'none', 3000); }

let p2Conectado = false, peerHost = null, conexaoP2 = null;
btnConvidar.addEventListener('click', () => {
  Som.iniciar();
  document.getElementById('convite').classList.add('on');
  if (peerHost) return;
  const st = document.getElementById('convite-status');
  try {
    peerHost = new Peer();
    peerHost.on('open', id => {
      const link = location.origin + location.pathname + '?sala=' + id;
      const qr = document.getElementById('qr'); qr.innerHTML = '';
      if (typeof QRCode !== 'undefined') new QRCode(qr, { text: link, width: 172, height: 172 });
      st.textContent = 'AGUARDANDO O JOGADOR 2...';
    });
    peerHost.on('connection', con => {
      con.on('open', () => {
        conexaoP2 = con; p2Conectado = true;
        document.getElementById('convite').classList.remove('on');
        avisar('JOGADOR 2 CONECTADO!');
        if (estado.nome === 'titulo') irPara(telaSelecao()); else if (estado.nome === 'selecao') irPara(telaSelecao());
        atualizarHTML();
      });
      con.on('data', d => { if (d && d.b) { fontes.remoto[d.b] = d.s === 1; if (d.s === 1) pulso[1][d.b] = true; } });
      const caiu = () => {
        if (conexaoP2 !== con) return;
        p2Conectado = false; conexaoP2 = null; fontes.remoto = {};
        avisar('JOGADOR 2 DESCONECTOU');
        for (const h of humanos) if (h.humano === 1) h.auto = true;
        if (estado.nome === 'selecao') irPara(telaSelecao());
        atualizarHTML();
      };
      con.on('close', caiu); con.on('error', caiu);
    });
    peerHost.on('error', () => { st.textContent = 'FALHA AO GERAR CONVITE. VERIFIQUE A INTERNET.'; peerHost = null; });
  } catch (e) { st.textContent = 'CONVITE INDISPONIVEL'; }
});
document.getElementById('fechar-convite').addEventListener('click', () => document.getElementById('convite').classList.remove('on'));

// ---------- celular do Jogador 2 (vira controle)
function modoControle() {
  document.body.classList.add('controle');
  const status = document.getElementById('p2-status');
  const estadoBt = {};
  let con = null;
  ligarBotoes(document.getElementById('p2'), estadoBt, (k, v) => { if (con && con.open) con.send({ b: k, s: v ? 1 : 0 }); });
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}
  const conectar = () => {
    if (typeof Peer === 'undefined') { status.textContent = 'SEM INTERNET'; return; }
    const p = new Peer();
    p.on('open', () => {
      con = p.connect(SALA, { reliable: true });
      con.on('open', () => { status.textContent = 'CONECTADO - OLHE A TELA DO P1'; status.style.color = '#4ec41e'; });
      con.on('close', () => { status.textContent = 'DESCONECTADO'; status.style.color = '#e33'; });
    });
    p.on('error', () => { status.textContent = 'NAO FOI POSSIVEL CONECTAR'; status.style.color = '#e33'; });
  };
  conectar();
}

// ============================================================ LAÇO PRINCIPAL
let ultimo = 0, acum = 0;
function quadro(t) {
  const dt = Math.min(0.1, (t - ultimo) / 1000 || 0); ultimo = t; acum += dt; tempoReal += dt;
  juntarEntrada();
  while (acum >= STEP) { estado.update && estado.update(STEP); guardarAnterior(); acum -= STEP; }
  ctx.imageSmoothingEnabled = false;
  estado.render && estado.render();
  telaCtx.imageSmoothingEnabled = false;
  telaCtx.drawImage(buf, 0, 0, tela.width, tela.height);
  requestAnimationFrame(quadro);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (estado.nome === 'corrida' && !pausado) alternarPausa(); if (Som.ac) Som.ac.suspend(); }
  else if (Som.ac) Som.ac.resume();
});

function iniciar() {
  if (SALA) { modoControle(); return; }
  ajustarTela();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); txt('CARREGANDO...', W / 2, H / 2, '#4ec41e', 2, 'c');
  telaCtx.drawImage(buf, 0, 0, tela.width, tela.height);
  ligarBotoes(elControles, fontes.toque, (k, v) => { if (v) pulso[0][k] = true; });
  carregarImagens().then(() => {
    montarPista(PISTAS[0]); gerarFundo();
    irPara(telaTitulo());
    requestAnimationFrame(quadro);
  });
}
window.BRMC = { simular(seg) { for (let i = 0; i < seg * 60; i++) { juntarEntrada(); estado.update(STEP); guardarAnterior(); } }, get chegada() { return chegada; }, get tempo() { return tempoCorrida; }, get postos() { return POSTOS; }, fimZ: () => FIM_Z, get estado() { return estado; }, get corredores() { return corredores; }, get humanos() { return humanos; }, entrada: fontes };
iniciar();
})();
