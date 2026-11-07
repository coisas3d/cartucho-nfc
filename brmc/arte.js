/* Black Rock MC - The Game | arte procedural HD: cenário, placas, prédios, pedágio, Basílica, motos vistas de cima, HUD */
'use strict';
window.ARTE = (function () {
  const FONTE = '"Press Start 2P", "Courier New", monospace';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const norm = s => String(s);

  // texto em fonte pixel (tamanhos múltiplos de 8 ficam nítidos)
  function txt(g, s, x, y, cor, tam, al, sombra, maxW) {
    tam = tam || 8; s = norm(s);
    const teste = window.FONTE_TESTE;
    const fonte = t => { g.font = t + 'px ' + (teste ? 'monospace' : FONTE); if ('letterSpacing' in g) g.letterSpacing = teste ? (t * 0.4) + 'px' : '0px'; };
    fonte(tam); g.textBaseline = 'top'; g.textAlign = al === 'c' ? 'center' : al === 'd' ? 'right' : 'left';
    // nunca deixa o texto sair da tela: reduz a fonte se precisar
    const W = g.canvas.width; let w = g.measureText(s).width;
    let livre = al === 'c' ? Math.min(x, W - x) * 2 - 4 : al === 'd' ? x - 2 : W - x - 2;
    if (maxW) livre = Math.min(livre, maxW);   // não deixa o texto sair da caixa
    if (w > livre && livre > 10) { const t2 = Math.max(5, Math.floor(tam * livre / w)); fonte(t2); w = g.measureText(s).width; tam = t2; }
    if (sombra !== false) { g.fillStyle = sombra || 'rgba(0,0,0,0.85)'; g.fillText(s, Math.round(x) + Math.max(1, tam / 8), Math.round(y) + Math.max(1, tam / 8)); }
    g.fillStyle = cor; g.fillText(s, Math.round(x), Math.round(y));
    return w;
  }

  // ------------------------------------------------------------ vegetação e objetos de beira de estrada
  function arvore(seed) {
    const R = rng(seed), [c, g] = mk(90, 120);
    g.fillStyle = '#5a3a1e'; g.fillRect(41, 70, 8, 50); g.fillStyle = '#7a5230'; g.fillRect(42, 70, 3, 50);
    const folhas = ['#1f5a2a', '#2a7036', '#3a8a40', '#55a64e'];
    for (let i = 0; i < 26; i++) {
      const x = 15 + R() * 60, y = 8 + R() * 62, r = 10 + R() * 16, k = Math.min(3, Math.floor((1 - y / 80) * 2 + R() * 2));
      g.fillStyle = folhas[Math.max(0, k - (x > 55 ? 1 : 0))]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    return c;
  }
  function eucalipto(seed) {
    const R = rng(seed), [c, g] = mk(46, 170);
    g.fillStyle = '#c8c0b0'; g.fillRect(20, 50, 5, 120); g.fillStyle = '#8a8070'; g.fillRect(23, 50, 2, 120);
    for (let i = 0; i < 18; i++) {
      const y = 4 + R() * 90, x = 23 + (R() - 0.5) * 30, r = 6 + R() * 9;
      g.fillStyle = ['#3d6a48', '#4f7d55', '#628f62'][Math.floor(R() * 3)]; g.beginPath(); g.ellipse(x, y, r, r * 1.5, 0, 0, 7); g.fill();
    }
    return c;
  }
  function arbusto(seed) {
    const R = rng(seed), [c, g] = mk(70, 34);
    for (let i = 0; i < 10; i++) { const x = 10 + R() * 50, y = 14 + R() * 12, r = 8 + R() * 8; g.fillStyle = ['#2a6a30', '#357a38', '#4a9244'][Math.floor(R() * 3)]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    return c;
  }
  function cupim() { const [c, g] = mk(30, 22); g.fillStyle = '#9a6a3c'; g.beginPath(); g.ellipse(15, 22, 14, 20, 0, Math.PI, 0); g.fill(); g.fillStyle = '#b8844e'; g.fillRect(9, 6, 4, 10); return c; }
  function poste() {
    const [c, g] = mk(60, 200);
    g.fillStyle = '#8a9098'; g.fillRect(8, 20, 5, 180); g.fillRect(8, 18, 40, 4); g.fillStyle = '#5a6068'; g.fillRect(40, 16, 16, 8);
    g.fillStyle = '#fff6c8'; g.fillRect(42, 23, 12, 2); return c;
  }
  function marcoKm(km) {
    const [c, g] = mk(26, 46); g.fillStyle = '#e8e8e4'; g.fillRect(3, 6, 20, 40); g.fillStyle = '#1a6a3a'; g.fillRect(3, 6, 20, 16);
    txt(g, String(km), 13, 11, '#fff', 8, 'c', false); g.fillStyle = '#222'; g.fillRect(3, 6, 20, 1); return c;
  }
  // placa verde de rodovia (até 3 linhas)
  function placaVerde(linhas, largura) {
    const w = largura || 300, h = 110, [c, g] = mk(w, h + 90);
    g.fillStyle = '#7a8088'; g.fillRect(20, h - 4, 10, 94); g.fillRect(w - 30, h - 4, 10, 94);
    g.fillStyle = '#0e5a2e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0f0f0'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    const ls = linhas.filter(Boolean);
    ls.forEach((l, i) => txt(g, l.toUpperCase(), w / 2, h / 2 - ls.length * 13 + i * 26 + 2, i === ls.length - 1 && ls.length > 1 && /KM|CURVAS|NACIONAL/.test(l) ? '#ffe04a' : '#ffffff', 16, 'c', false));
    return c;
  }
  // outdoor (propagandas dos parceiros)
  function outdoor(tipo, emb) {
    const [c, g] = mk(260, 170);
    g.fillStyle = '#5a5e66'; g.fillRect(40, 110, 10, 60); g.fillRect(210, 110, 10, 60);
    g.fillStyle = '#e8e4da'; g.fillRect(0, 0, 260, 116); g.fillStyle = '#111'; g.fillRect(6, 6, 248, 104);
    if (tipo === 0) { if (emb) g.drawImage(emb, 12, 22, 72, 72); txt(g, 'BLACK ROCK', 90, 26, '#fff', 16); txt(g, 'MOTO CLUBE', 90, 50, '#9a9a9a', 8); txt(g, 'ITAÚNA-MG', 90, 74, '#ff6a00', 16); }
    else { g.fillStyle = '#ff6a00'; g.fillRect(6, 6, 248, 104); txt(g, 'COISAS 3D', 130, 30, '#111', 24, 'c', false); txt(g, 'CHAVEIROS COM JOGOS', 130, 66, '#111', 8, 'c', false); txt(g, 'ENCOSTE O CELULAR!', 130, 84, '#fff', 8, 'c', false); }
    return c;
  }
  function predio(seed, alto) {
    const R = rng(seed), w = 70 + Math.floor(R() * 60), h = (alto ? 160 : 70) + Math.floor(R() * (alto ? 160 : 70)), [c, g] = mk(w, h);
    const cores = ['#c8b8a0', '#a8b0b8', '#d8d0c0', '#8890a0', '#b89878', '#e0dcd0'];
    g.fillStyle = cores[Math.floor(R() * cores.length)]; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(w - 10, 0, 10, h);
    for (let y = 10; y < h - 16; y += 16) for (let x = 8; x < w - 14; x += 14) { g.fillStyle = R() < 0.3 ? '#ffe7a0' : '#3a4a5c'; g.fillRect(x, y, 8, 10); }
    g.fillStyle = '#5a4a3a'; g.fillRect(w / 2 - 8, h - 18, 16, 18);
    return c;
  }
  function cerca() { const [c, g] = mk(120, 30); g.fillStyle = '#7a5a3a'; for (let x = 0; x < 120; x += 30) g.fillRect(x, 4, 5, 26); g.fillStyle = '#9a9a9a'; g.fillRect(0, 9, 120, 1); g.fillRect(0, 17, 120, 1); return c; }
  function vaca(seed) {
    const R = rng(seed), [c, g] = mk(56, 36);
    g.fillStyle = '#f2f0ea'; g.fillRect(8, 8, 36, 18); g.fillStyle = '#222'; g.fillRect(14, 10, 10, 8); g.fillRect(30, 16, 8, 6);
    g.fillStyle = '#f2f0ea'; g.fillRect(42, 4, 12, 12); g.fillStyle = '#e8a8a0'; g.fillRect(50, 10, 4, 5);
    g.fillStyle = '#ddd'; [10, 18, 32, 40].forEach(x => g.fillRect(x, 26, 4, 10)); return c;
  }

  // ------------------------------------------------------------ estruturas que cruzam a pista (largura = pista toda)
  function arco(titulo, sub, cor, emb) {
    const w = 640, h = 230, [c, g] = mk(w, h);
    g.fillStyle = '#2a2c30'; g.fillRect(0, 40, 28, h - 40); g.fillRect(w - 28, 40, 28, h - 40);
    g.fillStyle = '#4a4e56'; g.fillRect(4, 40, 8, h - 40); g.fillRect(w - 24, 40, 8, h - 40);
    g.fillStyle = '#111'; g.fillRect(0, 0, w, 76); g.fillStyle = cor; g.fillRect(4, 4, w - 8, 68);
    for (let x = 4; x < w - 4; x += 16) { g.fillStyle = '#fff'; g.fillRect(x, 4, 8, 6); g.fillRect(x + 8, 66, 8, 6); g.fillStyle = '#111'; g.fillRect(x + 8, 4, 8, 6); g.fillRect(x, 66, 8, 6); }
    txt(g, titulo, w / 4, 22, '#fff', 24, 'c'); txt(g, sub, w / 4, 50, '#ffe04a', 8, 'c');
    txt(g, 'BLACK ROCK MC', w * 0.75, 30, '#fff', 16, 'c');
    if (emb) g.drawImage(emb, w / 2 - 40, -2, 80, 80);
    return c;
  }
  // PRAÇA DE PEDÁGIO PREMIUM: cobertura de aço com faixa de LED, painel iluminado, sinaleiros por faixa e pilares com zebrado
  function pedagioPremium(emb) {
    const w = 1500, h = 520, [c, g] = mk(w, h), col = x => Math.round(750 + x / 2.8 * w);
    // pilares (bordas e ilha central)
    for (const x of [-1.15, 0, 1.15]) {
      const px = col(x), pw = 36;
      const gp = g.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0); gp.addColorStop(0, '#5a616c'); gp.addColorStop(0.4, '#c9ced6'); gp.addColorStop(1, '#4a5058');
      g.fillStyle = gp; g.fillRect(px - pw / 2, 120, pw, h - 120);
      for (let y = h - 90; y < h; y += 18) { g.fillStyle = '#f0c020'; g.fillRect(px - pw / 2, y, pw, 9); g.fillStyle = '#141414'; g.fillRect(px - pw / 2, y + 9, pw, 9); }
    }
    // laje da cobertura
    const gl = g.createLinearGradient(0, 0, 0, 120); gl.addColorStop(0, '#3a414c'); gl.addColorStop(0.55, '#262b33'); gl.addColorStop(1, '#16191e');
    g.fillStyle = gl; g.fillRect(0, 8, w, 112);
    g.fillStyle = '#4d5562'; g.fillRect(0, 0, w, 10);                                 // borda superior
    g.fillStyle = '#ff7a1a'; g.fillRect(0, 104, w, 8);                                // faixa de LED laranja
    g.fillStyle = 'rgba(255,200,120,0.9)'; g.fillRect(0, 106, w, 3);
    // luzes sob a cobertura
    g.fillStyle = '#0e1013'; g.fillRect(0, 112, w, 14);
    for (let x = 40; x < w; x += 110) { g.fillStyle = '#fff6dc'; g.fillRect(x, 115, 60, 7); }
    // painel central "PEDÁGIO"
    const pw = 520, px = w / 2 - pw / 2;
    g.fillStyle = '#0b2a5a'; g.fillRect(px, 18, pw, 78); g.strokeStyle = '#e8edf5'; g.lineWidth = 4; g.strokeRect(px + 4, 22, pw - 8, 70);
    if (emb) g.drawImage(emb, px + 14, 26, 62, 62);
    txt(g, 'PEDÁGIO', px + pw / 2 + 30, 30, '#ffffff', 40, 'c', false);
    txt(g, 'RODOVIAS BRMC', px + pw / 2 + 30, 74, '#9ad0ff', 16, 'c', false);
    // tarifas
    g.fillStyle = '#f0c020'; g.fillRect(70, 28, 300, 60); g.fillStyle = '#141414'; g.fillRect(74, 32, 292, 52);
    txt(g, 'MOTO', 90, 40, '#f0c020', 16, 'e', false); txt(g, 'R$ 4,50', 350, 40, '#ffffff', 16, 'd', false);
    txt(g, 'CARRO', 90, 62, '#9a9aa4', 8, 'e', false); txt(g, 'R$ 9,00', 350, 62, '#9a9aa4', 8, 'd', false);
    g.fillStyle = '#1e7a3a'; g.fillRect(w - 370, 28, 300, 60); g.strokeStyle = '#e8f5ea'; g.lineWidth = 3; g.strokeRect(w - 366, 32, 292, 52);
    txt(g, 'TAG', w - 220, 38, '#ffffff', 24, 'c', false); txt(g, 'PASSAGEM AUTOMÁTICA', w - 220, 68, '#c8f0d0', 8, 'c', false);
    // sinaleiros sobre cada faixa (seta verde)
    for (const x of [-0.5, 0.5]) {
      const cx = col(x);
      g.fillStyle = '#0a0a0c'; g.fillRect(cx - 50, 126, 100, 70); g.fillStyle = '#2a2d33'; g.fillRect(cx - 50, 126, 100, 6);
      g.fillStyle = '#1aff5a'; g.beginPath(); g.moveTo(cx - 22, 146); g.lineTo(cx + 22, 146); g.lineTo(cx + 22, 160); g.lineTo(cx + 34, 160); g.lineTo(cx, 190); g.lineTo(cx - 34, 160); g.lineTo(cx - 22, 160); g.closePath(); g.fill();
      g.fillStyle = 'rgba(26,255,90,0.25)'; g.fillRect(cx - 46, 134, 92, 58);
      g.fillStyle = '#2a2d33'; g.fillRect(cx - 4, 120, 8, 8);
    }
    return c;
  }
  // cabine de cobrança: ilha com zebrado, vidro azulado com reflexo, cobrador e luz de TAG
  function cabine() {
    const w = 150, h = 250, [c, g] = mk(w, h);
    g.fillStyle = '#8a8f96'; g.fillRect(4, h - 42, w - 8, 42);
    for (let x = 4; x < w - 4; x += 16) { g.fillStyle = '#f0c020'; g.fillRect(x, h - 38, 8, 34); g.fillStyle = '#151515'; g.fillRect(x + 8, h - 38, 8, 34); }
    const gb = g.createLinearGradient(16, 0, w - 16, 0); gb.addColorStop(0, '#d9dde3'); gb.addColorStop(0.5, '#f4f6f8'); gb.addColorStop(1, '#b8bec6');
    g.fillStyle = gb; g.fillRect(16, 60, w - 32, h - 102);
    g.fillStyle = '#1b3c66'; g.fillRect(24, 76, w - 48, 80);                            // vidro
    g.fillStyle = '#2a2f36'; g.beginPath(); g.arc(w / 2, 128, 16, 0, 7); g.fill(); g.fillRect(w / 2 - 22, 140, 44, 16);   // cobrador
    g.fillStyle = '#f0c020'; g.fillRect(w / 2 - 22, 146, 44, 4);
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(30, 76); g.lineTo(62, 76); g.lineTo(34, 156); g.lineTo(26, 156); g.closePath(); g.fill();
    g.fillStyle = '#c42a2a'; g.fillRect(16, 168, w - 32, 6);
    g.fillStyle = '#2b3038'; g.fillRect(8, 48, w - 16, 14); g.fillStyle = '#ff7a1a'; g.fillRect(8, 58, w - 16, 3);   // telhado
    g.fillStyle = '#111'; g.fillRect(w / 2 - 20, 22, 40, 26); g.fillStyle = '#1aff5a'; g.beginPath(); g.arc(w / 2, 35, 9, 0, 7); g.fill();   // luz da TAG
    return c;
  }
  function pedagio(emb) {
    const w = 700, h = 260, [c, g] = mk(w, h);
    g.fillStyle = '#e8e8ea'; g.fillRect(0, 0, w, 60); g.fillStyle = '#c42a2a'; g.fillRect(0, 50, w, 10);
    txt(g, 'PEDÁGIO', w / 2, 14, '#1a1a1a', 24, 'c', false);
    g.fillStyle = '#1e7a3a'; g.fillRect(40, 10, 120, 34); txt(g, 'TAG', 100, 20, '#fff', 16, 'c', false);
    g.fillStyle = '#1e7a3a'; g.fillRect(w - 160, 10, 120, 34); txt(g, 'TAG', w - 100, 20, '#fff', 16, 'c', false);
    [10, 230, 450, 670].forEach(x => { g.fillStyle = '#9aa0a8'; g.fillRect(x, 60, 20, h - 60); });
    [70, 290, 510].forEach(x => { g.fillStyle = '#d8d4cc'; g.fillRect(x + 50, 150, 60, 110); g.fillStyle = '#3a4a5c'; g.fillRect(x + 56, 160, 48, 34); g.fillStyle = '#1e7a3a'; g.fillRect(x + 50, 144, 60, 8); });
    return c;
  }
  function passarela() {
    const w = 760, h = 200, [c, g] = mk(w, h);
    g.fillStyle = '#9a9690'; g.fillRect(0, 30, w, 34); g.fillStyle = '#7a7670'; g.fillRect(0, 56, w, 8);
    g.fillStyle = '#c4c0b8'; for (let x = 0; x < w; x += 20) g.fillRect(x, 14, 3, 18); g.fillRect(0, 12, w, 4);
    g.fillStyle = '#8a8680'; g.fillRect(40, 64, 30, h - 64); g.fillRect(w - 70, 64, 30, h - 64);
    g.fillStyle = '#0e5a2e'; g.fillRect(w / 2 - 110, 34, 220, 26); txt(g, 'BOA VIAGEM!', w / 2, 43, '#fff', 8, 'c', false);
    return c;
  }
  function posto(emb) {
    const w = 330, h = 170, [c, g] = mk(w, h);
    g.fillStyle = '#d8d4c8'; g.fillRect(180, 54, 150, 116); g.fillStyle = '#3a4a5c'; g.fillRect(196, 96, 116, 50);
    g.fillStyle = '#ff6a00'; g.fillRect(180, 54, 150, 18); txt(g, 'CONVENIÊNCIA', 255, 59, '#111', 8, 'c', false);
    g.fillStyle = '#141414'; g.fillRect(0, 14, 250, 28); g.fillStyle = '#ff6a00'; g.fillRect(0, 38, 250, 6);
    txt(g, 'POSTO BRMC', 125, 22, '#fff', 16, 'c', false);
    [30, 200].forEach(x => { g.fillStyle = '#e8e8e8'; g.fillRect(x, 44, 10, 126); });
    [80, 140].forEach(x => { g.fillStyle = '#111'; g.fillRect(x, 110, 26, 60); g.fillStyle = '#ff6a00'; g.fillRect(x + 2, 112, 22, 56); g.fillStyle = '#111'; g.fillRect(x + 5, 118, 16, 10); g.fillStyle = '#7dff7d'; g.fillRect(x + 7, 121, 10, 3); });
    g.fillStyle = '#141414'; g.fillRect(286, 0, 30, 54); if (emb) g.drawImage(emb, 287, 2, 28, 28); txt(g, '6,29', 301, 36, '#ffe04a', 8, 'c', false);
    return c;
  }


  // ============================================================ CIDADES DA VIAGEM (marcos de cada cidade)
  const ret = (g, cor, x, y, w, h) => { g.fillStyle = cor; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const tri = (g, cor, x1, y1, x2, y2, x3, y3) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath(); g.fill(); };
  const janelas = (g, x, y, w, h, R, cor) => { for (let yy = y; yy < y + h - 10; yy += 14) for (let xx = x; xx < x + w - 8; xx += 12) ret(g, R() < 0.25 ? '#ffe7a0' : (cor || '#3a4a5c'), xx, yy, 7, 9); };
  // placa azul de entrada/saída da cidade ("BEM-VINDO A" / "VOLTE SEMPRE")
  function portalCidade(t1, nome, saida) {
    const w = 300, h = 96, [c, g] = mk(w, h + 86);
    ret(g, '#7a8088', 24, h - 4, 10, 90); ret(g, '#7a8088', w - 34, h - 4, 10, 90);
    ret(g, saida ? '#5a2a7a' : '#0b3d91', 0, 0, w, h); g.strokeStyle = '#f0f0f0'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    txt(g, t1, w / 2, 16, '#ffe04a', 8, 'c', false);
    txt(g, nome, w / 2, 40, '#ffffff', nome.length > 14 ? 16 : 24, 'c', false);
    txt(g, saida ? 'BOA VIAGEM!' : 'MINAS GERAIS', w / 2, 74, '#cfe0ff', 8, 'c', false);
    return c;
  }
  // placa marrom de atrativo turístico
  function placaMarrom(linhas) {
    const w = 300, h = 100, [c, g] = mk(w, h + 86);
    ret(g, '#7a8088', 24, h - 4, 10, 90); ret(g, '#7a8088', w - 34, h - 4, 10, 90);
    ret(g, '#6b3a1e', 0, 0, w, h); g.strokeStyle = '#f0f0f0'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    const ls = linhas.filter(Boolean); ls.forEach((l, i) => txt(g, l, w / 2, h / 2 - ls.length * 12 + i * 24 + 2, '#fff', 16, 'c', false));
    return c;
  }
  // casinhas coloridas de cidade do interior
  function casa(seed) {
    const R = rng(seed), w = 70 + Math.floor(R() * 40), h = 46 + Math.floor(R() * 20), [c, g] = mk(w, h + 30);
    const cores = ['#f2e6c8', '#e8b8a0', '#a8d0e0', '#f0d070', '#c8e0b0', '#f4f0e8', '#e0a8c0'];
    ret(g, cores[Math.floor(R() * cores.length)], 0, 30, w, h); ret(g, 'rgba(0,0,0,0.15)', w - 8, 30, 8, h);
    tri(g, '#a84a2a', -6, 32, w / 2, 0, w + 6, 32); tri(g, '#c25a34', 4, 30, w / 2, 6, w - 4, 30);
    ret(g, '#6a4a2a', w / 2 - 7, 30 + h - 26, 14, 26);
    for (const x of [8, w - 24]) { ret(g, '#3a5a8a', x, 44, 16, 14); ret(g, '#fff', x + 7, 44, 2, 14); }
    return c;
  }
  // igreja matriz mineira genérica (fachada branca, duas torres, frontão)
  function igreja(seed, cor) {
    const R = rng(seed), w = 170, h = 230, [c, g] = mk(w, h); const fx = cor || '#f4f0e6', tr = ['#2a6aa0', '#c08a2a', '#2a7a4a'][Math.floor(R() * 3)];
    ret(g, fx, 30, 90, 110, 140); ret(g, fx, 0, 60, 40, 170); ret(g, fx, 130, 60, 40, 170);
    ret(g, 'rgba(0,0,0,0.12)', 130, 60, 6, 170);
    for (const x of [0, 130]) { ret(g, tr, x - 3, 56, 46, 6); tri(g, tr, x - 2, 58, x + 20, 18, x + 42, 58); ret(g, '#222', x + 13, 74, 14, 22); g.fillStyle = '#e8c860'; g.beginPath(); g.arc(x + 20, 82, 4, 0, 7); g.fill(); ret(g, '#ddd', x + 19, 8, 2, 12); ret(g, '#ddd', x + 15, 12, 10, 2); }
    tri(g, fx, 26, 92, 85, 44, 144, 92); g.strokeStyle = tr; g.lineWidth = 4; g.beginPath(); g.moveTo(26, 92); g.lineTo(85, 44); g.lineTo(144, 92); g.stroke();
    ret(g, '#ddd', 83, 24, 4, 22); ret(g, '#ddd', 77, 30, 16, 3);
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(66, 230); g.lineTo(66, 170); g.arc(85, 170, 19, Math.PI, 0); g.lineTo(104, 230); g.fill();
    for (const x of [44, 112]) { ret(g, '#3a5a8a', x, 120, 14, 24); }
    g.fillStyle = '#3a5a8a'; g.beginPath(); g.arc(85, 112, 9, 0, 7); g.fill();
    ret(g, tr, 30, 226, 110, 4);
    return c;
  }
  // ITAÚNA: Matriz de Sant'Ana (maior, torres com cúpula, escadaria e adro)
  function matrizSantana() {
    const w = 260, h = 300, [c, g] = mk(w, h); const fx = '#f6f2e8', tr = '#3a6aa8', ou = '#d8b048';
    ret(g, '#bdb6a8', 0, 268, w, 32); for (let i = 0; i < 4; i++) ret(g, i % 2 ? '#cfc8ba' : '#e2dccf', 40 + i * 8, 268 + i * 8, 180 - i * 16, 8);
    ret(g, fx, 70, 110, 120, 160); ret(g, fx, 20, 70, 54, 200); ret(g, fx, 186, 70, 54, 200); ret(g, 'rgba(0,0,0,0.12)', 232, 70, 8, 200);
    for (const x of [20, 186]) {
      ret(g, tr, x - 4, 66, 62, 7); ret(g, fx, x + 6, 40, 42, 28); ret(g, '#222', x + 18, 46, 18, 20);
      g.fillStyle = tr; g.beginPath(); g.ellipse(x + 27, 40, 24, 22, 0, Math.PI, 0); g.fill(); ret(g, ou, x + 25, 6, 4, 14); ret(g, ou, x + 20, 10, 14, 3);
      for (let y = 90; y < 250; y += 46) ret(g, '#3a5a8a', x + 19, y, 16, 26);
    }
    tri(g, fx, 66, 112, 130, 58, 194, 112); g.strokeStyle = ou; g.lineWidth = 5; g.beginPath(); g.moveTo(66, 112); g.lineTo(130, 58); g.lineTo(194, 112); g.stroke();
    ret(g, ou, 128, 30, 5, 30); ret(g, ou, 120, 38, 21, 4);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(130, 92, 12, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 2; g.stroke(); ret(g, '#333', 129, 84, 2, 9); ret(g, '#333', 129, 91, 7, 2);
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(108, 268); g.lineTo(108, 200); g.arc(130, 200, 22, Math.PI, 0); g.lineTo(152, 268); g.fill();
    for (const x of [82, 166]) { ret(g, '#3a5a8a', x - 6, 150, 14, 30); }
    ret(g, ou, 66, 112, 128, 4); ret(g, ou, 20, 262, 220, 6);
    return c;
  }
  // morro com capela no alto (Capela do Rosário) - vai no horizonte
  function capelaMorro() {
    const w = 260, h = 130, [c, g] = mk(w, h);
    g.fillStyle = '#4a7a3a'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(130, -10, w, h); g.fill();
    g.fillStyle = '#3a6a2e'; g.beginPath(); g.moveTo(40, h); g.quadraticCurveTo(170, 20, w, h); g.fill();
    ret(g, '#f6f2e8', 112, 36, 36, 26); tri(g, '#b04a2a', 108, 38, 130, 22, 152, 38); ret(g, '#f6f2e8', 140, 18, 12, 44); tri(g, '#b04a2a', 138, 20, 146, 6, 154, 20);
    ret(g, '#5a3a1e', 124, 48, 10, 14); ret(g, '#ddd', 145, 0, 2, 7);
    return c;
  }
  // ITATIAIUÇU: serra com o Cristo de braços abertos no alto - vai no horizonte
  function cristoSerra() {
    const w = 380, h = 210, [c, g] = mk(w, h);
    g.translate(0, 28); g.fillStyle = '#3e6a3a'; g.beginPath(); g.moveTo(0, h); g.lineTo(70, 90); g.lineTo(150, 60); g.lineTo(200, 52); g.lineTo(250, 70); g.lineTo(320, 110); g.lineTo(w, h); g.fill();
    g.fillStyle = '#4e7c44'; g.beginPath(); g.moveTo(30, h); g.lineTo(120, 100); g.lineTo(200, 74); g.lineTo(290, 120); g.lineTo(w, h); g.fill();
    g.fillStyle = '#6a8a50'; for (let i = 0; i < 40; i++) { const x = 40 + (i * 37) % 300, y = 110 + (i * 23) % 70; g.fillRect(x, y, 6, 3); }
    const cx = 200, base = 54; ret(g, '#d8d4cc', cx - 12, base - 16, 24, 16);          // pedestal
    ret(g, '#f4f2ee', cx - 6, base - 66, 12, 50); ret(g, '#f4f2ee', cx - 34, base - 60, 68, 7); g.fillStyle = '#f4f2ee'; g.beginPath(); g.arc(cx, base - 72, 6, 0, 7); g.fill();
    ret(g, '#cfccc4', cx + 2, base - 66, 4, 50); tri(g, '#f4f2ee', cx - 8, base - 16, cx, base - 40, cx + 8, base - 16);
    return c;
  }
  // TRÊS CORAÇÕES: monumento ao Rei do Futebol (bola gigante com coroa)
  function monumentoFutebol() {
    const w = 200, h = 250, [c, g] = mk(w, h);
    ret(g, '#9a9488', 30, 190, 140, 60); ret(g, '#b8b2a4', 40, 180, 120, 14); ret(g, '#7a7468', 160, 190, 10, 60);
    ret(g, '#2a2a2a', 52, 206, 96, 28); txt(g, 'TERRA DO REI', 100, 210, '#e8c860', 8, 'c', false); txt(g, 'DO FUTEBOL', 100, 222, '#e8c860', 8, 'c', false);
    const bx = 100, by = 128, r = 50; g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; const pent = (x, y, rr) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
    pent(bx, by, 14); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; pent(bx + Math.cos(a) * 36, by + Math.sin(a) * 36, 10); }
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.arc(bx + 10, by + 6, r, -0.6, 2.2); g.fill();
    g.fillStyle = '#e8c048'; g.beginPath(); g.moveTo(66, 78); g.lineTo(70, 46); g.lineTo(84, 62); g.lineTo(100, 36); g.lineTo(116, 62); g.lineTo(130, 46); g.lineTo(134, 78); g.fill();
    ret(g, '#c89a28', 66, 74, 68, 8); for (const x of [70, 100, 130]) { g.fillStyle = '#d02a2a'; g.beginPath(); g.arc(x, 48 + (x === 100 ? -12 : 0), 4, 0, 7); g.fill(); }
    return c;
  }
  // SÃO LOURENÇO: Parque das Águas (lago, chafariz, balneário e palmeiras)
  function parqueAguas() {
    const w = 420, h = 230, [c, g] = mk(w, h);
    g.fillStyle = '#3a8a4a'; g.fillRect(0, 150, w, 80);
    g.fillStyle = '#3a7ab8'; g.beginPath(); g.ellipse(150, 190, 140, 32, 0, 0, 7); g.fill(); g.fillStyle = '#6aaee0'; g.beginPath(); g.ellipse(130, 184, 90, 14, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.ellipse(150 + i * 6, 160 - (3 - Math.abs(i)) * 8, 3, 18 - Math.abs(i) * 3, i * 0.2, 0, 7); g.fill(); }
    // balneário
    ret(g, '#f2d8d0', 270, 70, 140, 90); ret(g, '#e8c4b8', 270, 60, 140, 12); tri(g, '#f2d8d0', 300, 62, 340, 30, 380, 62);
    for (let x = 280; x < 404; x += 18) ret(g, '#fff', x, 80, 8, 70); ret(g, '#5a7aa0', 330, 120, 20, 40); ret(g, '#c0a090', 270, 156, 140, 6);
    // palmeiras
    for (const x of [20, 250, 412]) { ret(g, '#8a6a40', x - 3, 70, 6, 90); g.fillStyle = '#2a7a3a'; for (let a = 0; a < 7; a++) { g.beginPath(); g.ellipse(x + Math.cos(a) * 16, 68 + Math.sin(a) * 6, 18, 5, a, 0, 7); g.fill(); } }
    ret(g, '#6b3a1e', 40, 120, 90, 26); txt(g, 'PARQUE', 85, 124, '#fff', 8, 'c', false); txt(g, 'DAS ÁGUAS', 85, 134, '#fff', 8, 'c', false); ret(g, '#7a8088', 82, 146, 6, 14);
    return c;
  }
  // PASSA QUATRO: estação ferroviária com a Maria Fumaça
  function estacaoTrem() {
    const w = 460, h = 220, [c, g] = mk(w, h);
    ret(g, '#7a6a5a', 0, 204, w, 6); ret(g, '#5a4a3a', 0, 212, w, 4); for (let x = 0; x < w; x += 14) ret(g, '#6a4a2a', x, 210, 8, 8);
    // estação amarela colonial
    ret(g, '#f0d070', 250, 90, 200, 100); ret(g, '#c8a040', 250, 186, 200, 8); tri(g, '#a84a2a', 236, 94, 350, 50, 464, 94);
    for (let x = 262; x < 440; x += 34) { ret(g, '#3a6a3a', x, 120, 18, 40); ret(g, '#fff', x - 2, 118, 22, 3); }
    ret(g, '#3a3a3a', 300, 72, 100, 16); txt(g, 'PASSA QUATRO', 350, 76, '#fff', 8, 'c', false);
    // locomotiva
    ret(g, '#1a1a1a', 30, 130, 150, 60); g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(105, 132, 76, 20, 0, Math.PI, 0); g.fill();
    ret(g, '#222', 150, 90, 50, 100); ret(g, '#3a5a8a', 160, 100, 30, 26); ret(g, '#c02a2a', 146, 86, 58, 8);
    ret(g, '#222', 50, 92, 18, 40); ret(g, '#c02a2a', 46, 88, 26, 6); ret(g, '#c8a040', 90, 108, 14, 22);
    ret(g, '#c02a2a', 20, 176, 190, 6); for (const x of [56, 96, 136, 176]) { g.fillStyle = '#c02a2a'; g.beginPath(); g.arc(x, 192, 15, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(x, 192, 6, 0, 7); g.fill(); }
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(26, 140, 7, 0, 7); g.fill();
    // fumaça
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(235,235,235,' + (0.85 - i * 0.12) + ')'; g.beginPath(); g.arc(60 + i * 16, 78 - i * 12, 12 + i * 4, 0, 7); g.fill(); }
    return c;
  }
  // CACHOEIRA PAULISTA: grande santuário moderno com cruz alta
  function santuario() {
    const w = 360, h = 260, [c, g] = mk(w, h);
    ret(g, '#d8d4cc', 0, 230, w, 30);
    tri(g, '#e8e6e0', 20, 232, 180, 70, 340, 232); tri(g, '#cfccc4', 180, 70, 340, 232, 260, 232);
    g.fillStyle = '#7ab0d8'; g.beginPath(); g.moveTo(120, 232); g.lineTo(180, 120); g.lineTo(240, 232); g.fill();
    for (let y = 140; y < 232; y += 16) ret(g, 'rgba(255,255,255,0.35)', 150 - (y - 140) * 0.3, y, 60 + (y - 140) * 0.6, 2);
    ret(g, '#f4f2ee', 172, 0, 16, 110); ret(g, '#f4f2ee', 146, 26, 68, 14); ret(g, '#d8d4cc', 184, 0, 4, 110);
    return c;
  }
  // GUARATINGUETÁ: catedral com torre única (Terra de Frei Galvão)
  function catedral() {
    const w = 200, h = 280, [c, g] = mk(w, h); const fx = '#efe6d2', tr = '#8a4a2a';
    ret(g, fx, 20, 130, 160, 150); tri(g, fx, 14, 134, 100, 84, 186, 134); g.strokeStyle = tr; g.lineWidth = 4; g.beginPath(); g.moveTo(14, 134); g.lineTo(100, 84); g.lineTo(186, 134); g.stroke();
    ret(g, fx, 78, 30, 44, 110); tri(g, tr, 74, 34, 100, 0, 126, 34); ret(g, '#222', 90, 50, 20, 26); ret(g, '#ddd', 99, -4, 3, 10);
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(84, 280); g.lineTo(84, 220); g.arc(100, 220, 16, Math.PI, 0); g.lineTo(116, 280); g.fill();
    for (const x of [40, 146]) { ret(g, '#3a5a8a', x, 170, 14, 30); } g.fillStyle = '#3a5a8a'; g.beginPath(); g.arc(100, 160, 10, 0, 7); g.fill();
    return c;
  }
  // POSTO DE LARGADA (Itaúna): cobertura larga, 3 ilhas de bombas e conveniência
  function postoLargada(emb) {
    const w = 520, h = 220, [c, g] = mk(w, h);
    ret(g, '#d8d4c8', 330, 90, 190, 130); ret(g, '#3a4a5c', 346, 130, 156, 60); ret(g, '#ff6a00', 330, 90, 190, 20); txt(g, 'CONVENIÊNCIA', 425, 96, '#111', 8, 'c', false);
    ret(g, '#141414', 0, 20, 360, 34); ret(g, '#ff6a00', 0, 50, 360, 8); txt(g, 'POSTO BRMC • ITAÚNA', 180, 30, '#fff', 16, 'c', false);
    for (const x of [24, 176, 330]) ret(g, '#e8e8e8', x, 58, 12, 162);
    for (const x of [70, 150, 230]) { ret(g, '#111', x, 150, 30, 70); ret(g, '#ff6a00', x + 2, 152, 26, 66); ret(g, '#111', x + 6, 160, 18, 12); ret(g, '#7dff7d', x + 8, 164, 14, 4); }
    ret(g, '#141414', 470, 0, 40, 90); if (emb) g.drawImage(emb, 472, 4, 36, 36); txt(g, 'BRMC', 490, 48, '#ffe04a', 8, 'c', false);
    return c;
  }


  // ------------------------------------------------------------ CIDADES (etapa 2)
  // ITAGUARA: Cachoeira da Pataca (queda d'água entre pedras e mata)
  function cachoeira() {
    const w = 260, h = 220, [c, g] = mk(w, h);
    g.fillStyle = '#2f5a2a'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 60); g.quadraticCurveTo(60, 10, 120, 30); g.lineTo(140, 30); g.quadraticCurveTo(200, 0, w, 50); g.lineTo(w, h); g.fill();
    ret(g, '#6a6a62', 96, 30, 22, 150); ret(g, '#7a7a70', 142, 30, 26, 150);
    const agua = g.createLinearGradient(0, 30, 0, 190); agua.addColorStop(0, '#d8f0ff'); agua.addColorStop(1, '#8ac8f0'); g.fillStyle = agua; g.fillRect(116, 28, 28, 160);
    for (let y = 34; y < 186; y += 10) ret(g, 'rgba(255,255,255,0.7)', 120 + (y % 20 ? 4 : 12), y, 3, 7);
    g.fillStyle = '#5aa0d8'; g.beginPath(); g.ellipse(130, 196, 90, 18, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(130, 188, 30, 8, 0, 0, 7); g.fill();
    for (const [x, y, r] of [[40, 120, 26], [210, 110, 30], [70, 160, 20], [200, 170, 22]]) { g.fillStyle = '#3a7a34'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    return c;
  }
  // CAMPANHA: casarões coloniais de dois andares (cidade histórica)
  function casaroes() {
    const w = 320, h = 150, [c, g] = mk(w, h); const cores = ['#f4efe2', '#e8c8a0', '#c8dce8', '#f0e0a0'];
    for (let i = 0; i < 4; i++) {
      const x = i * 80, cor = cores[i], tr = ['#2a5a8a', '#7a3a2a', '#2a6a3a', '#5a3a7a'][i];
      ret(g, cor, x, 40, 78, 110); ret(g, '#a84a2a', x - 2, 28, 82, 14); ret(g, 'rgba(0,0,0,0.12)', x + 72, 40, 6, 110);
      for (const wx of [x + 8, x + 30, x + 52]) { ret(g, tr, wx, 52, 16, 26); ret(g, '#fff', wx - 2, 50, 20, 3); ret(g, '#333', wx - 2, 78, 20, 3); }
      ret(g, tr, x + 30, 104, 18, 46); ret(g, tr, x + 8, 108, 14, 22); ret(g, tr, x + 56, 108, 14, 22);
    }
    return c;
  }
  // catedral colonial grande de duas torres (Campanha: Catedral de Santo Antônio, 1787)
  function catedralColonial() {
    const w = 240, h = 300, [c, g] = mk(w, h); const fx = '#f2ece0', tr = '#6a4a2a';
    ret(g, fx, 60, 110, 120, 190); ret(g, fx, 10, 60, 56, 240); ret(g, fx, 174, 60, 56, 240); ret(g, 'rgba(0,0,0,0.12)', 224, 60, 6, 240);
    for (const x of [10, 174]) { ret(g, tr, x - 4, 56, 64, 8); ret(g, fx, x + 8, 28, 40, 30); ret(g, '#222', x + 18, 34, 20, 20); tri(g, tr, x + 4, 30, x + 28, 0, x + 52, 30); for (let y = 90; y < 280; y += 50) ret(g, '#3a3a3a', x + 20, y, 16, 26); }
    tri(g, fx, 56, 112, 120, 54, 184, 112); g.strokeStyle = tr; g.lineWidth = 5; g.beginPath(); g.moveTo(56, 112); g.lineTo(120, 54); g.lineTo(184, 112); g.stroke();
    ret(g, '#ddd', 118, 26, 4, 30); ret(g, '#ddd', 110, 34, 20, 4);
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(100, 300); g.lineTo(100, 230); g.arc(120, 230, 20, Math.PI, 0); g.lineTo(140, 300); g.fill();
    for (const x of [74, 152]) ret(g, '#3a3a3a', x, 150, 14, 34); g.fillStyle = '#3a3a3a'; g.beginPath(); g.arc(120, 140, 11, 0, 7); g.fill();
    ret(g, tr, 10, 292, 220, 8);
    return c;
  }
  // POUSO ALTO: morro com o hotel antigo no alto (horizonte)
  function morroHotel() {
    const w = 300, h = 140, [c, g] = mk(w, h);
    g.fillStyle = '#4a7a3a'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(150, -6, w, h); g.fill();
    g.fillStyle = '#3e6c32'; g.beginPath(); g.moveTo(60, h); g.quadraticCurveTo(200, 30, w, h); g.fill();
    ret(g, '#f4f0e6', 110, 42, 80, 30); ret(g, '#a84a2a', 106, 34, 88, 10); for (let x = 116; x < 186; x += 12) ret(g, '#3a5a8a', x, 48, 6, 8); ret(g, '#3a5a8a', 116, 60, 68, 2);
    for (const [x, y] of [[96, 74], [204, 74], [66, 96], [236, 96]]) { g.fillStyle = '#2a5a2a'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
    return c;
  }
  // CRUZEIRO: basílica neocolonial com duas torres e relógios (a 2ª maior igreja do Vale)
  function basilicaRelogios() {
    const w = 260, h = 320, [c, g] = mk(w, h); const fx = '#f0e8d8', tr = '#3a5a7a', ou = '#d8b048';
    ret(g, fx, 64, 120, 132, 200); ret(g, fx, 14, 70, 56, 250); ret(g, fx, 190, 70, 56, 250); ret(g, 'rgba(0,0,0,0.12)', 240, 70, 6, 250);
    for (const x of [14, 190]) {
      ret(g, tr, x - 4, 66, 64, 8); ret(g, fx, x + 6, 20, 44, 48); tri(g, tr, x + 2, 22, x + 28, -6, x + 54, 22); ret(g, ou, x + 26, -10, 4, 12);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 28, 42, 13, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 2; g.stroke(); ret(g, '#333', x + 27, 33, 2, 10); ret(g, '#333', x + 27, 41, 8, 2);
      for (let y = 100; y < 300; y += 52) ret(g, '#3a5a8a', x + 20, y, 16, 28);
    }
    tri(g, fx, 60, 122, 130, 64, 200, 122); g.strokeStyle = ou; g.lineWidth = 5; g.beginPath(); g.moveTo(60, 122); g.lineTo(130, 64); g.lineTo(200, 122); g.stroke();
    ret(g, ou, 128, 36, 4, 30); ret(g, ou, 120, 44, 20, 4);
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(106, 320); g.lineTo(106, 246); g.arc(130, 246, 24, Math.PI, 0); g.lineTo(154, 320); g.fill();
    g.fillStyle = '#7ab0d8'; g.beginPath(); g.arc(130, 160, 18, 0, 7); g.fill(); g.strokeStyle = ou; g.lineWidth = 3; g.stroke();
    return c;
  }
  // CRUZEIRO: mirante "A Santa" no alto da serra (imagem de Nossa Senhora) - horizonte
  function santaMorro() {
    const w = 320, h = 190, [c, g] = mk(w, h);
    g.fillStyle = '#3a6236'; g.beginPath(); g.moveTo(0, h); g.lineTo(80, 100); g.lineTo(160, 70); g.lineTo(230, 90); g.lineTo(w, h); g.fill();
    g.fillStyle = '#4a7440'; g.beginPath(); g.moveTo(40, h); g.lineTo(150, 100); g.lineTo(260, 120); g.lineTo(w, h); g.fill();
    const cx = 160, b = 72; ret(g, '#d8d4cc', cx - 10, b - 10, 20, 10);
    g.fillStyle = '#2a4a9a'; g.beginPath(); g.moveTo(cx - 16, b - 10); g.lineTo(cx, b - 66); g.lineTo(cx + 16, b - 10); g.fill();    // manto azul
    g.fillStyle = '#f4f2ee'; g.beginPath(); g.moveTo(cx - 8, b - 12); g.lineTo(cx, b - 52); g.lineTo(cx + 8, b - 12); g.fill();
    g.fillStyle = '#f0d8b8'; g.beginPath(); g.arc(cx, b - 60, 5, 0, 7); g.fill(); ret(g, '#e8c048', cx - 6, b - 70, 12, 4);   // rosto e coroa
    return c;
  }
  // LORENA: Rua das Palmeiras (palmeiras imperiais)
  function palmeiras() {
    const w = 360, h = 240, [c, g] = mk(w, h);
    for (let i = 0; i < 5; i++) {
      const x = 30 + i * 75; ret(g, '#b8b0a0', x - 4, 40, 8, 200); ret(g, '#9a9284', x + 1, 40, 3, 200); ret(g, '#6a9a4a', x - 5, 34, 10, 12);
      g.fillStyle = '#2a7a3a'; for (let a = 0; a < 9; a++) { const an = -Math.PI + a * Math.PI / 8; g.beginPath(); g.ellipse(x + Math.cos(an) * 22, 30 + Math.sin(an) * 10 + 6, 26, 5, an, 0, 7); g.fill(); }
    }
    return c;
  }

  // ------------------------------------------------------------ camadas de fundo (máscaras em branco; o jogo tinge com a cor da hora)
  function silhueta(w, h, seed, picos, rug) {
    // cordilheira: picos triangulares sobrepostos (parece montanha, não nuvem)
    const R = rng(seed), [c, g] = mk(w, h), alt = new Float32Array(w + 1).fill(h);
    const n = Math.round(picos * 4);
    for (let k = 0; k < n; k++) {
      const cx = R() * w, ph = h * (0.25 + R() * 0.6), lw = w / n * (0.8 + R() * 1.4);
      for (let dx = -lw; dx <= lw; dx++) {
        const x = Math.round(cx + dx), xx = ((x % w) + w) % w;
        const y = h - ph * (1 - Math.abs(dx) / lw) - (R() - 0.5) * rug * 2;
        if (y < alt[xx]) alt[xx] = y;
      }
    }
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x++) g.lineTo(x, Math.min(h, alt[x % w]));
    g.lineTo(w, h); g.closePath(); g.fill();
    return c;
  }
  function skyline(w, h, seed) {
    const R = rng(seed), [c, g] = mk(w, h); g.fillStyle = '#fff';
    for (let x = 0; x < w;) { const bw = 14 + R() * 40, bh = h * (0.2 + R() * 0.75); g.fillRect(x, h - bh, bw, bh); if (R() < 0.2) g.fillRect(x + bw / 2 - 1, h - bh - 12, 2, 12); x += bw + R() * 6; }
    return c;
  }
  // Basílica (Santuário Nacional): cúpula grande, corpo em cruz e torre alta
  function basilica() {
    const [c, g] = mk(420, 220); const p = '#fff';
    g.fillStyle = p;
    g.fillRect(40, 150, 340, 70);                 // nave
    g.fillRect(150, 110, 120, 50);                // tambor
    g.beginPath(); g.ellipse(210, 112, 64, 58, 0, Math.PI, 0); g.fill(); // cúpula
    g.fillRect(205, 30, 10, 26); g.fillRect(199, 40, 22, 4);   // lanterna e cruz
    g.fillRect(300, 40, 34, 120);                 // torre
    g.beginPath(); g.moveTo(296, 42); g.lineTo(317, 0); g.lineTo(338, 42); g.fill();
    g.fillRect(315, -4, 4, 12);
    g.fillRect(20, 170, 380, 50);
    return c;
  }
  function nuvens(seed) {
    const R = rng(seed), [c, g] = mk(1024, 120);
    for (let i = 0; i < 9; i++) {
      const cx = R() * 1024, cy = 30 + R() * 60, w = 60 + R() * 110;
      for (let k = 0; k < 9; k++) {
        const x = cx + (R() - 0.5) * w, y = cy + (R() - 0.5) * 16, r = 12 + R() * 18;
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(x, y, r * 1.5, r, 0, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(160,170,190,0.35)'; g.fillRect(cx - w * 0.6, cy + 8, w * 1.2, 6);
    }
    return c;
  }

  // ------------------------------------------------------------ moto vista de cima (cena do abastecimento)
  function motoTopo(t, cap) {
    const [c, g] = mk(120, 220); const cx = 60;
    const rr = (x, y, w, h, r, cor) => { g.fillStyle = cor; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); g.fill(); };
    rr(cx - 8, 6, 16, 44, 6, '#141414'); rr(cx - 8, 170, 16, 46, 6, '#141414');                   // pneus
    g.fillStyle = t.aro; g.fillRect(cx - 2, 10, 4, 36); g.fillRect(cx - 2, 174, 4, 38);
    if (t.baus === 'plastico' || t.baus === 'aluminio') {                                           // baús laterais
      rr(cx - 50, 128, 26, 62, 5, t.bauCor); rr(cx + 24, 128, 26, 62, 5, t.bauCor);
      g.fillStyle = t.bauTampa; g.fillRect(cx - 50, 132, 6, 54); g.fillRect(cx + 44, 132, 6, 54);
      rr(cx - 26, 178, 52, 40, 6, t.bauCor); g.fillStyle = t.bauTampa; g.fillRect(cx - 20, 182, 40, t.baus === 'aluminio' ? 3 : 8);
    } else if (t.baus === 'grade') {
      g.strokeStyle = t.bauCor; g.lineWidth = 3; g.strokeRect(cx - 44, 132, 18, 56); g.strokeRect(cx + 26, 132, 18, 56); g.strokeRect(cx - 18, 172, 36, 26);
    }
    rr(cx - 22, 40, 44, 30, 10, t.cor);                                                           // carenagem frontal
    g.fillStyle = 'rgba(200,220,235,0.55)'; g.fillRect(cx - 16, 34, 32, 12);                     // para-brisa
    g.fillStyle = '#222'; g.fillRect(cx - 44, 72, 88, 5);                                          // guidão
    g.fillStyle = '#111'; g.fillRect(cx - 50, 66, 12, 16); g.fillRect(cx + 38, 66, 12, 16);       // protetores de mão
    g.fillStyle = '#333'; g.fillRect(cx - 40, 60, 10, 6); g.fillRect(cx + 30, 60, 10, 6);          // retrovisores
    rr(cx - 26, 80, 52, 50, 16, t.cor); g.fillStyle = t.cor2; g.fillRect(cx - 24, 92, 6, 26); g.fillRect(cx + 18, 92, 6, 26);   // tanque
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(cx, 96, 7, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(cx, 96, 4, 0, 7); g.fill(); // bocal
    rr(cx - 18, 126, 36, 50, 10, '#1c1c1e');                                                      // banco
    g.fillStyle = cap; g.beginPath(); g.arc(cx, 150, 13, 0, 7); g.fill();                          // capacete apoiado no banco
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(cx - 4, 146, 4, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,50,60,0.9)'; g.fillRect(cx - 9, 152, 18, 5);
    return c;
  }

  // ------------------------------------------------------------ HUD
  // dígito de 7 segmentos
  const SEGS = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcfgd', '-': 'g', ' ': '' };
  function seg7(g, ch, x, y, w, h, on, off) {
    const t = Math.max(2, Math.round(w / 5)), m = h / 2;
    const P = { a: [x + t, y, w - 2 * t, t], d: [x + t, y + h - t, w - 2 * t, t], g: [x + t, y + m - t / 2, w - 2 * t, t], f: [x, y + t, t, m - t], b: [x + w - t, y + t, t, m - t], e: [x, y + m, t, m - t], c: [x + w - t, y + m, t, m - t] };
    const lit = SEGS[ch] || '';
    for (const k in P) { g.fillStyle = lit.indexOf(k) >= 0 ? on : off; const r = P[k]; g.fillRect(Math.round(r[0]), Math.round(r[1]), Math.round(r[2]), Math.round(r[3])); }
  }
  function numero7(g, str, x, y, w, h, esp, on, off, glow) {
    if (glow) { g.save(); g.shadowColor = glow; g.shadowBlur = 8; }
    for (let i = 0; i < str.length; i++) seg7(g, str[i], x + i * (w + esp), y, w, h, on, off);
    if (glow) g.restore();
  }
  // tacômetro em rampa (barras crescentes) estilo jogos de corrida 16 bits
  function tacometro(g, x, y, esc, rpm, kmh, marcha, vacuo, tempo) {
    const n = 22, W = 210 * esc, H = 84 * esc;
    g.fillStyle = 'rgba(6,8,12,0.78)'; g.beginPath(); g.moveTo(x, y + H); g.lineTo(x + W, y + H); g.lineTo(x + W, y); g.lineTo(x + W * 0.25, y + H * 0.55); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.stroke();
    const ativos = Math.round(rpm * n);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), bx = x + W * 0.28 + f * W * 0.68, bw = W * 0.68 / n - 2 * esc;
      const top = y + H * 0.52 - Math.pow(f, 1.6) * H * 0.48, bot = y + H * 0.6 - f * H * 0.05;
      const cor = f < 0.6 ? '#4ef03a' : f < 0.82 ? '#ffd23a' : '#ff3a2a';
      g.fillStyle = i < ativos ? cor : 'rgba(255,255,255,0.08)';
      g.fillRect(Math.round(bx), Math.round(top), Math.max(1, Math.round(bw)), Math.round(bot - top));
    }
    const s = String(Math.min(999, kmh)).padStart(3, ' ');
    numero7(g, s, x + W * 0.36, y + H * 0.64, 15 * esc, 24 * esc, 4 * esc, '#ffffff', 'rgba(255,255,255,0.07)', 'rgba(120,200,255,0.8)');
    txt(g, 'KM/H', x + W * 0.36 + 3 * 19 * esc + 4, y + H * 0.82, '#9ad0ff', 8 * Math.max(1, Math.floor(esc)), 'e');
    g.fillStyle = '#111'; g.fillRect(x + W * 0.08, y + H * 0.66, 28 * esc, 26 * esc); g.strokeStyle = '#4ec41e'; g.strokeRect(x + W * 0.08 + 0.5, y + H * 0.66 + 0.5, 28 * esc - 1, 26 * esc - 1);
    txt(g, String(marcha), x + W * 0.08 + 14 * esc, y + H * 0.66 + 5 * esc, '#4ef03a', 16 * Math.max(1, Math.floor(esc)), 'c', false);
    if (vacuo && Math.floor(tempo * 6) % 2) txt(g, 'VÁCUO', x + W * 0.97, y - 12, '#7ad0ff', 8, 'd');
  }
  // marcador de combustível analógico (E - 1/2 - F) com luz de reserva
  function marcadorComb(g, x, y, esc, frac, tempo) {
    const r = 38 * esc, cx = x + r + 8, cy = y + r + 6;
    g.fillStyle = 'rgba(6,8,12,0.8)'; g.beginPath(); g.arc(cx, cy, r + 6, Math.PI, 0); g.lineTo(cx + r + 6, cy + 18 * esc); g.lineTo(cx - r - 6, cy + 18 * esc); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 1; g.stroke();
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI, r1 = r - (i % 4 === 0 ? 9 : 5) * esc;
      g.strokeStyle = i <= 1 ? '#ff4a3a' : '#e8e8e8'; g.lineWidth = i % 4 === 0 ? 2 : 1;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1)); g.stroke();
    }
    txt(g, 'E', cx - r + 10 * esc, cy - 10 * esc, '#ff6a5a', 8, 'c', false);
    txt(g, '½', cx, cy - r + 12 * esc, '#e8e8e8', 8, 'c', false);
    txt(g, 'F', cx + r - 10 * esc, cy - 10 * esc, '#e8e8e8', 8, 'c', false);
    const a = Math.PI + Math.max(0, Math.min(1, frac)) * Math.PI;
    g.strokeStyle = '#ff2a1a'; g.lineWidth = 2 * esc; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (r - 8 * esc), cy + Math.sin(a) * (r - 8 * esc)); g.stroke();
    g.fillStyle = '#ddd'; g.beginPath(); g.arc(cx, cy, 4 * esc, 0, 7); g.fill();
    // luz de reserva (bomba de combustível) acende com 10%
    const ligada = frac <= 0.1 && Math.floor(tempo * 2.5) % 2 === 0;
    const lx = cx - 7 * esc, ly = cy + 4 * esc;
    if (ligada) { g.save(); g.shadowColor = '#ffa500'; g.shadowBlur = 14; }
    g.fillStyle = frac <= 0.1 ? (ligada ? '#ffb020' : '#5a3a10') : '#2a2a2a';
    g.fillRect(lx, ly, 9 * esc, 11 * esc); g.fillRect(lx + 9 * esc, ly + 2 * esc, 3 * esc, 2 * esc); g.fillRect(lx + 11 * esc, ly + 2 * esc, 2 * esc, 8 * esc);
    g.fillStyle = '#111'; g.fillRect(lx + 2 * esc, ly + 2 * esc, 5 * esc, 3 * esc);
    if (ligada) g.restore();
  }

  return { FONTE, mk, rng, txt, arvore, eucalipto, arbusto, cupim, poste, marcoKm, placaVerde, outdoor, predio, cerca, vaca,
    arco, pedagio, passarela, posto, silhueta, skyline, basilica, nuvens, motoTopo, seg7, numero7, tacometro, marcadorComb, pedagioPremium, cabine,
    portalCidade, placaMarrom, casa, igreja, matrizSantana, capelaMorro, cristoSerra, monumentoFutebol, parqueAguas, estacaoTrem, santuario, catedral, postoLargada,
    cachoeira, casaroes, catedralColonial, morroHotel, basilicaRelogios, santaMorro, palmeiras };
})();
