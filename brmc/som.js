/* Black Rock MC - The Game | áudio: trilha de rock épico original, motores e efeitos (Web Audio) */
'use strict';
window.SOM = (function () {
  const ler = (k, d) => { try { const v = localStorage.getItem('brmc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem('brmc_' + k, JSON.stringify(v)); } catch (e) {} };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  const S = {
    ac: null, musicaOn: ler('musica', true), efeitosOn: ler('efeitos', true),
    tocando: false, secao: 0, passo: 0, prox: 0, motores: [], modo: 'menu'
  };

  S.iniciar = function () {
    if (S.ac) { if (S.ac.state === 'suspended') S.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = S.ac = new AC();
    // desbloqueio iOS
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0);
    S.comp = ac.createDynamicsCompressor(); S.comp.threshold.value = -14; S.comp.ratio.value = 4; S.comp.attack.value = 0.005; S.comp.release.value = 0.2;
    S.comp.connect(ac.destination);
    S.mus = ac.createGain(); S.mus.gain.value = S.musicaOn ? 0.55 : 0; S.mus.connect(S.comp);
    S.fx = ac.createGain(); S.fx.gain.value = S.efeitosOn ? 0.9 : 0; S.fx.connect(S.comp);
    // reverb (impulso gerado)
    const len = ac.sampleRate * 2.4, imp = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    S.rev = ac.createConvolver(); S.rev.buffer = imp;
    S.revIn = ac.createGain(); S.revIn.gain.value = 0.32; S.revIn.connect(S.rev); S.rev.connect(S.mus);
    // delay para o solo
    S.dly = ac.createDelay(1); S.dly.delayTime.value = 60 / BPM * 0.75; S.dlyFb = ac.createGain(); S.dlyFb.gain.value = 0.32;
    S.dlyOut = ac.createGain(); S.dlyOut.gain.value = 0.3;
    S.dly.connect(S.dlyFb); S.dlyFb.connect(S.dly); S.dly.connect(S.dlyOut); S.dlyOut.connect(S.mus); S.dlyOut.connect(S.revIn);
    // distorção da guitarra
    S.dist = ac.createWaveShaper(); const k = 260, n = 2048, curva = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curva[i] = (3 + k) * x * 20 * Math.PI / 180 / (Math.PI + k * Math.abs(x)); }
    S.dist.curve = curva; S.dist.oversample = '4x';
    S.cab = ac.createBiquadFilter(); S.cab.type = 'lowpass'; S.cab.frequency.value = 3600; S.cab.Q.value = 0.8;
    S.mid = ac.createBiquadFilter(); S.mid.type = 'peaking'; S.mid.frequency.value = 900; S.mid.gain.value = 4;
    S.gtr = ac.createGain(); S.gtr.gain.value = 0.16;
    S.dist.connect(S.cab); S.cab.connect(S.mid); S.mid.connect(S.gtr); S.gtr.connect(S.mus); S.gtr.connect(S.revIn);
    // ruído
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    S.ruido = nb;
    // vento e cascalho (contínuos)
    S.vento = loopRuido('bandpass', 700, 0.6); S.cascalho = loopRuido('lowpass', 500, 1); S.chuvaL = loopRuido('highpass', 2600, 0.4);
    // motores (até 2 jogadores)
    for (let j = 0; j < 2; j++) S.motores.push(criarMotor());
    setInterval(agendar, 25);
    if (S.pedido) { const m = S.pedido; S.pedido = null; S.tocarMusica(m); }
  };
  function loopRuido(tipo, f, q) {
    const ac = S.ac, src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = S.ruido; src.loop = true; fl.type = tipo; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0;
    src.connect(fl); fl.connect(g); g.connect(S.fx); src.start(); return { g, fl };
  }
  function criarMotor() {
    const ac = S.ac, o1 = ac.createOscillator(), o2 = ac.createOscillator(), o3 = ac.createOscillator();
    const sh = ac.createWaveShaper(), f = ac.createBiquadFilter(), g = ac.createGain(), am = ac.createGain(), lfo = ac.createOscillator(), lfoG = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'sawtooth'; o3.detune.value = 9;
    const c = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 256 - 1; c[i] = Math.tanh(x * 2.4); } sh.curve = c;
    f.type = 'lowpass'; f.frequency.value = 800; f.Q.value = 2.2; g.gain.value = 0;
    lfo.type = 'square'; lfoG.gain.value = 0.35; am.gain.value = 0.65;
    lfo.connect(lfoG); lfoG.connect(am.gain);
    o1.connect(sh); o2.connect(sh); o3.connect(sh); sh.connect(am); am.connect(f); f.connect(g); g.connect(S.fx);
    [o1, o2, o3, lfo].forEach(o => o.start());
    return { o1, o2, o3, f, g, lfo };
  }

  S.alternarMusica = function () { S.musicaOn = !S.musicaOn; gravar('musica', S.musicaOn); if (S.mus) S.mus.gain.setTargetAtTime(S.musicaOn ? 0.55 : 0, S.ac.currentTime, 0.1); };
  S.alternarEfeitos = function () { S.efeitosOn = !S.efeitosOn; gravar('efeitos', S.efeitosOn); if (S.fx) S.fx.gain.setTargetAtTime(S.efeitosOn ? 0.9 : 0, S.ac.currentTime, 0.1); };

  // ------------------------------------------------------------ motor / ambiente
  // rpm 0-1, gas 0/1, tipo: twin | boxer
  S.motor = function (j, rpm, gas, vol, tipo) {
    const m = S.motores[j]; if (!m) return;
    const cp3 = tipo === 'cp3', tri = tipo === 'triple' || cp3;   // cp3 = tricilíndrico com escape esportivo (o "Randandan" do Adriano)
    const t = S.ac.currentTime, base = tipo === 'boxer' ? 30 : tri ? 44 : 36, f = base + rpm * (tipo === 'boxer' ? 105 : tri ? 165 : 130);
    m.o1.frequency.setTargetAtTime(f, t, 0.03); m.o2.frequency.setTargetAtTime(f / 2, t, 0.03); m.o3.frequency.setTargetAtTime(f * 1.5, t, 0.03);
    m.lfo.frequency.setTargetAtTime(f / (tipo === 'boxer' ? 2 : tri ? 3 : 4), t, 0.03);
    m.f.frequency.setTargetAtTime((cp3 ? 900 : 500) + rpm * 1600 + gas * (cp3 ? 1500 : 900), t, 0.05);
    m.g.gain.setTargetAtTime(vol * (0.035 + gas * 0.05 + rpm * 0.02) * (cp3 ? 1.9 : 1), t, 0.06);
    // escape modificado: estalos (pipocos) quando solta o acelerador em giro alto
    if (cp3 && m.gasAnt && !gas && m.rpmAnt > 0.55) estalos(vol);
    m.gasAnt = gas; m.rpmAnt = rpm;
  };
  function estalos(vol) {
    const t0 = S.ac.currentTime, n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) { const t = t0 + 0.05 + i * (0.06 + Math.random() * 0.07); ruido(0.05, 'bandpass', 600 + Math.random() * 500, 0.5 * vol, null, t, 1.5); tom(70 + Math.random() * 40, 0.05, 'square', 0.12 * vol, null, t, 40); }
  }
  S.ambiente = function (vel, terra) {
    if (!S.ac) return; const t = S.ac.currentTime;
    S.vento.g.gain.setTargetAtTime(Math.pow(vel, 2) * 0.12, t, 0.2); S.vento.fl.frequency.setTargetAtTime(400 + vel * 900, t, 0.2);
    S.cascalho.g.gain.setTargetAtTime(terra ? 0.18 * Math.min(1, vel * 2) : 0, t, 0.08);
  };
  S.silenciar = function () { if (!S.ac) return; const t = S.ac.currentTime; S.motores.forEach(m => m.g.gain.setTargetAtTime(0, t, 0.05)); S.ambiente(0, false); S.chuva(0); };
  S.chuva = function (i) { if (!S.ac) return; S.chuvaL.g.gain.setTargetAtTime(i * 0.16, S.ac.currentTime, 0.4); };

  // ------------------------------------------------------------ efeitos
  function env(node, t, a, d, v) { node.gain.setValueAtTime(0.0001, t); node.gain.linearRampToValueAtTime(v, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tom(freq, dur, tipo, vol, saida, t0, glide) {
    if (!S.ac) return; const ac = S.ac, t = t0 || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo || 'square'; o.frequency.setValueAtTime(freq, t); if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    env(g, t, 0.005, dur, vol || 0.2); o.connect(g); g.connect(saida || S.fx); o.start(t); o.stop(t + dur + 0.05);
  }
  function ruido(dur, tipo, f, vol, saida, t0, q) {
    if (!S.ac) return; const ac = S.ac, t = t0 || ac.currentTime, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = S.ruido; fl.type = tipo; fl.frequency.value = f; fl.Q.value = q || 1; env(g, t, 0.003, dur, vol);
    s.connect(fl); fl.connect(g); g.connect(saida || S.fx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  S.clique = () => tom(1200, 0.05, 'square', 0.08);
  S.confirma = () => { tom(660, 0.08, 'square', 0.12); setTimeout(() => tom(990, 0.18, 'square', 0.12), 70); ruido(0.4, 'highpass', 3000, 0.08); };
  S.bipLargada = (final) => tom(final ? 880 : 440, final ? 0.6 : 0.22, 'square', 0.22);
  S.batida = () => { ruido(0.7, 'lowpass', 1800, 0.9); tom(160, 0.3, 'square', 0.25, null, null, 60); tom(1300, 0.15, 'square', 0.08, null, null, 400); };
  S.raspar = () => ruido(0.12, 'bandpass', 3500, 0.18, null, null, 3);
  S.troca = () => tom(220, 0.06, 'sawtooth', 0.05, null, null, 120);
  S.alerta = () => { tom(1046, 0.1, 'square', 0.12); setTimeout(() => tom(1046, 0.1, 'square', 0.12), 160); };
  S.radio = () => { ruido(0.18, 'bandpass', 1900, 0.22, null, null, 2); tom(1400, 0.06, 'sine', 0.1); };
  S.voz = (freq) => tom(freq * (0.85 + Math.random() * 0.35), 0.045, 'square', 0.035);
  S.bomba = (on) => {
    if (!S.ac) return;
    if (on && !S._bomba) { const o = S.ac.createOscillator(), g = S.ac.createGain(); o.type = 'triangle'; o.frequency.value = 118; g.gain.value = 0.06; o.connect(g); g.connect(S.fx); o.start(); S._bomba = { o, g }; }
    if (!on && S._bomba) { S._bomba.g.gain.setTargetAtTime(0, S.ac.currentTime, 0.05); S._bomba.o.stop(S.ac.currentTime + 0.3); S._bomba = null; tom(700, 0.06, 'square', 0.1); setTimeout(() => tom(500, 0.08, 'square', 0.1), 90); }
  };
  S.cancela = () => { tom(1500, 0.08, 'sine', 0.15); setTimeout(() => tom(260, 0.3, 'sawtooth', 0.05, null, null, 520), 120); };
  // buzina de moto (duas notas desafinadas, levemente distorcidas)
  S.buzina = (grave) => {
    if (!S.ac) return; const ac = S.ac, t = ac.currentTime, f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7; env(g, t, 0.01, 0.42, 0.22); f.connect(g); g.connect(S.fx);
    [grave ? 340 : 410, grave ? 425 : 512].forEach(fr => { const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + 0.45); });
  };
  S.flash = () => { tom(2400, 0.04, 'square', 0.12); ruido(0.12, 'highpass', 6000, 0.25); setTimeout(() => tom(1800, 0.05, 'sine', 0.1), 60); };
  S.multa = () => { [784, 659, 523].forEach((f, i) => setTimeout(() => tom(f, 0.14, 'square', 0.1), i * 120)); };
  S.trovao = () => { ruido(2.6, 'lowpass', 160, 0.9, null, null, 0.7); setTimeout(() => ruido(1.8, 'lowpass', 260, 0.5), 200); };
  S.conquista = () => { [659, 784, 988, 1319].forEach((f, i) => setTimeout(() => tom(f, 0.22, 'square', 0.1), i * 90)); };
  S.chegada = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tom(f, 0.4, 'square', 0.14), i * 140)); };

  // ------------------------------------------------------------ TRILHA: rock épico original (Mi menor, 148 bpm)
  const BPM = 148, SEMI = 60 / BPM / 4;
  // seções (cada uma = 1 compasso de 16 semicolcheias)
  const ROTEIRO = ['intro', 'intro', 'intro2', 'intro2', 'riff', 'riff', 'riff', 'riff2',
    'refrao', 'refrao', 'refrao', 'refrao', 'refrao', 'refrao', 'refrao', 'refrao',
    'ponte', 'ponte', 'ponte', 'ponte2', 'riff', 'riff', 'riff', 'riff2',
    'refrao', 'refrao', 'refrao', 'refrao', 'refrao', 'refrao', 'refrao', 'final'];
  const VOLTA = 4; // ao fim do roteiro volta para o primeiro 'riff'
  const RIFF = [40, 40, 0, 40, 40, 43, 40, 0, 40, 40, 0, 40, 45, 0, 43, 0];
  const RIFF2 = [40, 40, 0, 40, 40, 43, 40, 0, 47, 0, 45, 0, 43, 0, 42, 0];
  const ACORDES_REF = [40, 36, 43, 38, 40, 36, 43, 38]; // Em C G D
  const TERCA = { 40: 3, 36: 4, 43: 4, 38: 4, 45: 3 };
  const PONTE = [45, 36, 38, 38];
  // melodia do refrão em colcheias (8 por compasso, 8 compassos); null = pausa, '-' = segura
  const MEL = [71, '-', 76, '-', 78, 79, '-', 78, 76, '-', '-', '-', 74, 76, 79, '-', 74, '-', '-', 71, '-', 74, 76, '-', 78, '-', '-', '-', 81, '-', 79, 78,
               79, '-', 78, 76, '-', 71, 76, '-', 79, '-', 81, 83, '-', '-', 81, 79, 78, '-', 79, 81, '-', 74, '-', '-', 78, '-', '-', '-', '-', '-', '-', '-'];
  // estilos: pista dupla = rock épico | via simples = groove tranquilo | serra = tenso
  const ESTILOS = {
    menu: { sec: ROTEIRO, volta: VOLTA, ini: 0 },
    pista: { sec: ROTEIRO, volta: VOLTA, ini: 4 },
    simples: { sec: ['calmo', 'calmo', 'calmo', 'calmo2', 'calmo', 'calmo', 'calmo3', 'calmo2'], volta: 0, ini: 0 },
    serra: { sec: ['tenso', 'tenso', 'tenso', 'tenso2', 'tenso', 'tenso', 'tenso3', 'tenso2'], volta: 0, ini: 0 }
  };
  const CALMO = [40, 36, 43, 38], TENSO = [40, 40, 41, 40, 43, 42, 41, 40];
  const MEL_CALMO = [64, '-', 67, 69, 71, '-', 69, 67, 64, '-', '-', 62, 64, '-', '-', '-', 67, '-', 69, 71, 74, '-', 71, 69, 71, '-', '-', 69, 67, '-', '-', '-'];
  let compasso = 0, refCont = 0, ponteCont = 0, estilo = ESTILOS.menu, pedidoEstilo = null, secCont = 0;

  S.tocarMusica = function (modo) {
    S.modo = modo || 'jogo';
    if (!S.ac) { S.pedido = S.modo; return; }
    const e = S.modo === 'menu' ? 'menu' : 'pista';
    if (!S.tocando) { S.tocando = true; S.prox = S.ac.currentTime + 0.1; S.passo = 0; estilo = ESTILOS[e]; compasso = estilo.ini; refCont = 0; S.estilo = e; }
    else S.estiloMusica(e);
  };
  S.pararMusica = function () { S.tocando = false; };
  // troca de estilo no próximo compasso (sem cortar a música)
  S.estiloMusica = function (e) { if (S.estilo === e || !ESTILOS[e]) return; S.estilo = e; pedidoEstilo = e; };

  function agendar() {
    if (!S.ac || !S.tocando) return;
    while (S.prox < S.ac.currentTime + 0.15) {
      tocarPasso(estilo.sec[compasso], S.passo, S.prox);
      S.passo++; S.prox += SEMI;
      if (S.passo >= 16) {
        S.passo = 0; const sec = estilo.sec[compasso]; secCont++;
        if (sec === 'refrao') refCont++; if (sec === 'ponte' || sec === 'ponte2') ponteCont++;
        compasso++; if (compasso >= estilo.sec.length) { compasso = estilo.volta; refCont = 0; ponteCont = 0; }
        if (pedidoEstilo && (compasso % 2 === 0 || estilo === ESTILOS.menu)) { estilo = ESTILOS[pedidoEstilo]; compasso = estilo.ini; pedidoEstilo = null; refCont = 0; ponteCont = 0; secCont = 0; S.virada = true; }
        if (estilo.sec[compasso] === 'refrao' && estilo.sec[compasso - 1] !== 'refrao') refCont = 0;
        if (estilo.sec[compasso] === 'ponte' && estilo.sec[compasso - 1] !== 'ponte') ponteCont = 0;
      }
    }
  }
  function tocarPasso(sec, p, t) {
    if (S.virada && p === 0) { prato(t, 0.4); S.virada = false; }
    if (sec.indexOf('calmo') === 0) return passoCalmo(sec, p, t);
    if (sec.indexOf('tenso') === 0) return passoTenso(sec, p, t);
    const forte = sec === 'refrao' || sec === 'final';
    // ---------- bateria
    if (sec === 'intro') { if (p === 0) prato(t, 0.5); if (p % 4 === 0) chimbal(t, 0.05); if (p === 12 || p === 14) surdo(t, 110); }
    else if (sec === 'intro2') {
      if (p % 2 === 0) chimbal(t, p % 4 ? 0.04 : 0.07);
      if (p === 0 || p === 8) bumbo(t); if (p >= 8 && p % 2 === 0) caixa(t, 0.12 + p * 0.01);
      if (p >= 12) surdo(t, 140 - p * 4);
    } else if (sec === 'ponte' || sec === 'ponte2') {
      if (p === 0) { bumbo(t); prato(t, 0.25); } if (p === 8) caixa(t, 0.3); if (p % 4 === 0) chimbal(t, 0.05);
      if (sec === 'ponte2' && p >= 8) { if (p % 2 === 0) caixa(t, 0.15 + (p - 8) * 0.03); }
    } else {
      if (p === 0 && (forte || compasso % 4 === 0)) prato(t, forte ? 0.4 : 0.25);
      const bumbos = forte ? [0, 3, 6, 8, 10, 14] : [0, 6, 8, 11, 14];
      if (bumbos.indexOf(p) >= 0) bumbo(t);
      if (p === 4 || p === 12) caixa(t, 0.36);
      if (p % 2 === 0) chimbal(t, forte ? (p % 4 === 2 ? 0.09 : 0.05) : 0.05, forte && p % 4 === 2);
      if (sec === 'riff2' && p >= 12) surdo(t, 160 - (p - 12) * 22);
    }
    // ---------- guitarras + baixo
    if (sec === 'intro') { if (p === 0) acorde(40, t, SEMI * 16, true, 0.9); }
    else if (sec === 'intro2') { if (p % 2 === 0) abafado(40, t); if (p === 0) baixo(28, t, SEMI * 8); if (p === 8) baixo(28, t, SEMI * 8); }
    else if (sec === 'riff' || sec === 'riff2') {
      const r = (sec === 'riff' ? RIFF : RIFF2)[p];
      if (r) { if (r === 40) abafado(40, t); else acorde(r, t, SEMI * 2, false, 1); baixo(r - 12, t, SEMI * 0.9); }
    } else if (sec === 'refrao' || sec === 'final') {
      const raiz = sec === 'final' ? 40 : ACORDES_REF[refCont % 8];
      if (p % 2 === 0) acorde(raiz, t, SEMI * 2.1, false, p === 0 ? 1 : 0.8);
      if (p % 2 === 0) baixo(raiz - 12, t, SEMI * 1.8);
      if (p === 0) cordas(raiz, t, SEMI * 16);
      if (sec === 'refrao' && p % 2 === 0) {
        const i = (refCont % 8) * 8 + p / 2, n = MEL[i];
        if (typeof n === 'number') { let d = 1; while (MEL[i + d] === '-') d++; solo(n, t, SEMI * 2 * d * 0.96); }
      }
      if (sec === 'final' && p === 0) solo(76, t, SEMI * 16);
    } else if (sec === 'ponte' || sec === 'ponte2') {
      const raiz = PONTE[ponteCont % 4];
      if (p === 0) { acorde(raiz, t, SEMI * 16, true, 0.8); cordas(raiz, t, SEMI * 16); baixo(raiz - 12, t, SEMI * 16); }
      if (p % 4 === 2) solo(raiz + 36 + (p % 8 === 2 ? 7 : 12), t, SEMI * 1.6, 0.04);
    }
  }
  // via simples: groove tranquilo com guitarra limpa dedilhada
  function passoCalmo(sec, p, t) {
    const raiz = CALMO[compasso % 4];
    if (p === 0 || p === 10) bumbo(t); if (p === 4 || p === 12) aro(t); if (p % 2 === 0) chimbal(t, 0.03);
    if (p === 0) { baixo(raiz - 12, t, SEMI * 6); cordas(raiz, t, SEMI * 16, 0.025); }
    if (p === 8) baixo(raiz - 5, t, SEMI * 6);
    const arp = [0, 7, 12, 16, 19, 16, 12, 7], iv = arp[(p / 2) | 0];
    if (p % 2 === 0) limpa(raiz + 12 + (iv === 16 ? (TERCA[raiz] === 3 ? 15 : 16) : iv), t, SEMI * 3);
    if (sec !== 'calmo' && p % 2 === 0) {
      const i = (sec === 'calmo2' ? 0 : 16) + p / 2, n = MEL_CALMO[i];
      if (typeof n === 'number') { let d = 1; while (MEL_CALMO[i + d] === '-') d++; solo(n, t, SEMI * 2 * d * 0.95, 0.05); }
    }
  }
  // serra: palhetada abafada, cromatismo e tambores
  function passoTenso(sec, p, t) {
    const raiz = TENSO[(secCont % 8)];
    abafado(raiz, t); if (p % 4 === 0) baixo(raiz - 12, t, SEMI * 3);
    if (p === 0 || p === 3 || p === 8 || p === 11) bumbo(t); if (p === 4 || p === 12) caixa(t, 0.3);
    chimbal(t, p % 4 === 0 ? 0.07 : 0.04);
    if (sec === 'tenso2' && p >= 8) surdo(t, 180 - (p - 8) * 12);
    if (p === 0) { cordas(raiz + 1, t, SEMI * 16, 0.03); if (sec === 'tenso3') prato(t, 0.3); }
    if (sec === 'tenso3' && p % 4 === 2) solo(raiz + 36 + (p === 6 || p === 14 ? 1 : 0), t, SEMI * 1.5, 0.045);
  }
  function limpa(m, t, dur) { const ac = S.ac, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(700, t + dur);
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m); o2.detune.value = 6;
    env(g, t, 0.004, dur, 0.06); o.connect(f); o2.connect(f); f.connect(g); g.connect(S.mus); g.connect(S.revIn); g.connect(S.dly);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); }
  function aro(t) { ruido(0.05, 'bandpass', 3200, 0.18, S.mus, t, 2); }
  // instrumentos
  function osc(tipo, f, t, dur, dest, vol, det) {
    const ac = S.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.value = f; if (det) o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02); return o;
  }
  function acorde(raiz, t, dur, longo, vol) {
    [0, 7, 12].forEach(iv => { osc('sawtooth', mtof(raiz + iv), t, dur, S.dist, 0.3 * vol, -7); osc('sawtooth', mtof(raiz + iv), t, dur, S.dist, 0.3 * vol, 7); });
  }
  function abafado(raiz, t) {
    const ac = S.ac, f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1000; f.connect(S.dist);
    [0, 7].forEach(iv => osc('sawtooth', mtof(raiz + iv), t, SEMI * 0.7, f, 0.32));
  }
  function baixo(m, t, dur) { osc('square', mtof(m), t, dur, S.mus, 0.07); osc('sine', mtof(m), t, dur, S.mus, 0.16); }
  function cordas(raiz, t, dur, vol) {
    vol = vol || 0.05;
    const ac = S.ac, f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.35); g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(S.mus); g.connect(S.revIn);
    [12, 19, 24, 24 + (TERCA[raiz] || 3)].forEach(iv => { [-10, 10].forEach(d => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(raiz + iv); o.detune.value = d; o.connect(f); o.start(t); o.stop(t + dur + 0.05); }); });
  }
  function solo(m, t, dur, vol) {
    const ac = S.ac, f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    f.type = 'lowpass'; f.frequency.value = 4200; vol = vol || 0.075;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.setValueAtTime(vol, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(14, t + Math.min(0.3, dur));
    lfo.connect(lg); f.connect(g); g.connect(S.mus); g.connect(S.dly); g.connect(S.revIn);
    [-12, 0, 12].forEach(d => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = d; lg.connect(o.detune); o.connect(f); o.start(t); o.stop(t + dur + 0.1); });
    lfo.start(t); lfo.stop(t + dur + 0.1);
  }
  function bumbo(t) { const ac = S.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); env(g, t, 0.002, 0.2, 0.9); o.connect(g); g.connect(S.mus); o.start(t); o.stop(t + 0.25); ruido(0.02, 'highpass', 4000, 0.15, S.mus, t); }
  function caixa(t, v) { ruido(0.16, 'bandpass', 1900, v * 1.4, S.mus, t, 0.8); ruido(0.16, 'bandpass', 1900, v * 0.6, S.revIn, t, 0.8); const ac = S.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08); env(g, t, 0.002, 0.1, v); o.connect(g); g.connect(S.mus); o.start(t); o.stop(t + 0.15); }
  function chimbal(t, v, aberto) { ruido(aberto ? 0.16 : 0.035, 'highpass', 8000, v, S.mus, t); }
  function prato(t, v) { ruido(1.6, 'highpass', 5500, v * 0.5, S.mus, t); ruido(1.6, 'highpass', 5500, v * 0.35, S.revIn, t); }
  function surdo(t, f) { const ac = S.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.25); env(g, t, 0.003, 0.3, 0.5); o.connect(g); g.connect(S.mus); g.connect(S.revIn); o.start(t); o.stop(t + 0.35); }

  return S;
})();
