/* Black Rock MC - The Game | arte procedural HD: cenário, placas, prédios, pedágio, Basílica, motos vistas de cima, HUD */
'use strict';
window.ARTE = (function () {
  const FONTE = '"Press Start 2P", "Courier New", monospace';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const norm = s => String(s);

  // texto em fonte pixel (tamanhos múltiplos de 8 ficam nítidos)
  function txt(g, s, x, y, cor, tam, al, sombra) {
    tam = tam || 8; s = norm(s);
    const teste = window.FONTE_TESTE;
    const fonte = t => { g.font = t + 'px ' + (teste ? 'monospace' : FONTE); if ('letterSpacing' in g) g.letterSpacing = teste ? (t * 0.4) + 'px' : '0px'; };
    fonte(tam); g.textBaseline = 'top'; g.textAlign = al === 'c' ? 'center' : al === 'd' ? 'right' : 'left';
    // nunca deixa o texto sair da tela: reduz a fonte se precisar
    const W = g.canvas.width; let w = g.measureText(s).width;
    const livre = al === 'c' ? Math.min(x, W - x) * 2 - 4 : al === 'd' ? x - 2 : W - x - 2;
    if (w > livre && livre > 20) { const t2 = Math.max(5, Math.floor(tam * livre / w)); fonte(t2); w = g.measureText(s).width; tam = t2; }
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
    arco, pedagio, passarela, posto, silhueta, skyline, basilica, nuvens, motoTopo, seg7, numero7, tacometro, marcadorComb };
})();
