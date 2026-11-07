/* Black Rock MC - The Game | dados: pilotos, viagem e falas do intercomunicador */
'use strict';
window.DADOS = (function () {

  // vel: km/h | acel, economia, curva: 0-1 | cc: cilindrada | tanque: litros
  // perfil: ROIA (anda devagar) ou McNAMARA (acelera muito) | ritmo: o quanto a IA acelera
  // foto: recorte realista | tampa: posição do bocal do tanque na foto (fração)
  const PERSONAGENS = [
    { id: 'jellison', nome: 'JELLISON', moto: 'BRMC VRS 650 TOURER', cc: 650, tanque: 21, motor: 'twin', perfil: 'ROIA', ritmo: 0.97,
      sprite: 'piloto', foto: 'foto_versys', tampa: [0.40, 0.31], retrato: 'retrato_jellison', voz: 190,
      vel: 190, acel: 0.97, economia: 0.92, curva: 0.80, capacete: '#2a2c32' },
    { id: 'leosao', nome: 'LEOSÃO', moto: 'BRMC GS 850 RALLYE', cc: 853, tanque: 15, motor: 'twin', perfil: 'McNAMARA', ritmo: 1.0,
      sprite: 'piloto_leosao', foto: 'foto_gs850', tampa: [0.42, 0.25], retrato: 'retrato_leosao', voz: 150,
      vel: 200, acel: 0.82, economia: 0.70, curva: 0.85, capacete: '#b0b4ba' },
    { id: 'jefao', nome: 'JEFÃO', moto: 'BRMC GS 1300 TRIPLE BLACK', cc: 1300, tanque: 19, motor: 'boxer', perfil: 'ROIA', ritmo: 0.95,
      sprite: 'piloto_gs1300', foto: 'foto_gs1300', tampa: [0.37, 0.31], retrato: 'retrato_jefao', voz: 120,
      vel: 200, acel: 0.90, economia: 0.61, curva: 0.80, capacete: '#52565e' },
    { id: 'lucas', nome: 'LUCAS CHURROS', moto: 'BRMC GS 1300 RALLYE', cc: 1300, tanque: 30, motor: 'boxer', perfil: 'ROIA', ritmo: 0.95,
      sprite: 'piloto_lucas', foto: 'foto_gs1300a', tampa: [0.45, 0.30], retrato: 'retrato_lucas', voz: 200,
      vel: 210, acel: 0.86, economia: 0.80, curva: 0.80, capacete: '#e4e6e8', curto: 'LUCAS' },
    { id: 'fabinho', nome: 'FABINHO MECÂNICO', moto: 'BRMC GS 1300 RALLYE', cc: 1300, tanque: 30, motor: 'boxer', perfil: 'McNAMARA', ritmo: 1.02,
      sprite: 'piloto_fabinho', foto: 'foto_gs1300a', tampa: [0.45, 0.30], retrato: 'retrato_fabinho', voz: 135,
      vel: 225, acel: 0.95, economia: 0.50, curva: 0.88, capacete: '#cc2620', curto: 'MECÂNICO' },
    { id: 'pescoco', nome: 'FABINHO PESCOÇO', moto: 'BRMC GS 1300 TRIPLE BLACK', cc: 1300, tanque: 19, motor: 'boxer', perfil: 'McNAMARA', ritmo: 1.01,
      sprite: 'piloto_pescoco', foto: 'foto_gs1300', tampa: [0.37, 0.31], retrato: 'retrato_pescoco', voz: 140,
      vel: 222, acel: 0.92, economia: 0.54, curva: 0.84, capacete: '#1e1e22', curto: 'PESCOÇO' },
    { id: 'henrique', nome: 'HENRIQUE DO SAMUEL', moto: 'BRMC T900 RALLY PRO', cc: 888, tanque: 20, motor: 'triple', perfil: 'McNAMARA', ritmo: 1.0,
      sprite: 'piloto_henrique', foto: 'foto_tiger', tampa: [0.40, 0.30], retrato: 'retrato_henrique', voz: 165,
      vel: 210, acel: 0.86, economia: 0.68, curva: 0.92, capacete: '#b0aa98', curto: 'HENRIQUE' },
    { id: 'cezar', nome: 'CEZAR', moto: 'BRMC GS 1250 ADV TRIPLE BLACK', cc: 1254, tanque: 30, motor: 'boxer', perfil: 'McNAMARA', ritmo: 1.0,
      sprite: 'piloto_cezar', foto: 'foto_adv_prata', tampa: [0.44, 0.27], retrato: 'retrato_cezar', voz: 130,
      vel: 220, acel: 0.89, economia: 0.58, curva: 0.86, capacete: '#9ca0a8', curto: 'CEZAR' },
    { id: 'cleimar', nome: 'CLEIMAR', moto: 'BRMC GS 1250 ADV TRIPLE BLACK', cc: 1254, tanque: 30, motor: 'boxer', perfil: 'McNAMARA', ritmo: 1.0,
      sprite: 'piloto_cleimar', foto: 'foto_adv_preto', tampa: [0.44, 0.27], retrato: 'retrato_cleimar', voz: 150,
      vel: 220, acel: 0.91, economia: 0.58, curva: 0.84, capacete: '#222226', curto: 'CLEIMAR' },
    { id: 'mazinho', nome: 'MAZINHO', moto: 'BRMC GS 1250 ADV 40 ANOS', cc: 1254, tanque: 30, motor: 'boxer', perfil: 'McNAMARA', ritmo: 1.05, imprudente: true,
      sprite: 'piloto_mazinho', foto: 'foto_adv40', tampa: [0.44, 0.28], retrato: 'retrato_mazinho', voz: 175,
      vel: 226, acel: 0.95, economia: 0.52, curva: 0.60, capacete: '#1c1c20', curto: 'MAZINHO' },
    { id: 'samuca', nome: 'SAMUCA', moto: 'BRMC GS 1200 ADV RALLYE', cc: 1170, tanque: 30, motor: 'boxer', perfil: 'ROIA', ritmo: 0.95,
      sprite: 'piloto_samuca', foto: 'foto_gs1200', tampa: [0.45, 0.29], retrato: 'retrato_samuca', voz: 115,
      vel: 200, acel: 0.80, economia: 0.78, curva: 0.86, capacete: '#ee70a8', curto: 'SAMUCA' },
    { id: 'alan', nome: 'ALAN', moto: 'BRMC F 750 TRIPLE BLACK', cc: 853, tanque: 15, motor: 'twin', perfil: 'ROIA', ritmo: 0.95,
      sprite: 'piloto_alan', foto: 'foto_f750', tampa: [0.45, 0.33], retrato: 'retrato_alan', voz: 145,
      vel: 196, acel: 0.94, economia: 0.90, curva: 0.84, capacete: '#e6e8ec', curto: 'ALAN' },
    { id: 'ramon', nome: 'RAMON', moto: 'BRMC TRANSALP 700', cc: 680, tanque: 18, motor: 'twin', perfil: 'ROIA', ritmo: 0.93, novato: true,
      sprite: 'piloto_ramon', foto: 'foto_transalp', tampa: [0.47, 0.28], retrato: 'retrato_ramon', voz: 210,
      vel: 185, acel: 0.78, economia: 0.84, curva: 0.76, capacete: '#e8eaee', curto: 'RAMON' },
    { id: 'adriano', nome: 'ADRIANO RANDANDAN', moto: 'BRMC MT 09', cc: 890, tanque: 14, motor: 'cp3', perfil: 'McNAMARA', ritmo: 0.99,
      sprite: 'piloto_adriano', foto: 'foto_mt09', tampa: [0.46, 0.27], retrato: 'retrato_adriano', voz: 160,
      vel: 215, acel: 1.0, economia: 0.66, curva: 0.88, capacete: '#22242a', curto: 'ADRIANO' },
    { id: 'samuel', nome: 'SAMUEL DO HENRIQUE', moto: 'BRMC GS 1300 ADV TRIPLE BLACK', cc: 1300, tanque: 30, motor: 'boxer', perfil: 'McNAMARA', ritmo: 1.0,
      sprite: 'piloto_samuel', foto: 'foto_gs1300adv', tampa: [0.50, 0.30], retrato: 'retrato_samuel', voz: 125,
      vel: 221, acel: 0.91, economia: 0.57, curva: 0.87, capacete: '#2a2c32', curto: 'SAMUEL' }
  ];

  // ------------------------------------------------------------------ BALANCEAMENTO
  // Moto: velocidade máxima (km/h) e 0 a 100 km/h oficial (s).
  // McNAMARA usa 100% da velocidade da moto; ROIA usa 92% -> gasta menos e faz curva melhor.
  // Curva e consumo saem da velocidade que o piloto usa: quanto mais rápido, pior de curva e mais gastão.
  const MOTO = { jellison: [195, 4.4], leosao: [202, 4.1], jefao: [230, 3.4], lucas: [230, 3.4], fabinho: [232, 3.4], pescoco: [230, 3.4], henrique: [205, 4.0],
    cezar: [225, 3.6], cleimar: [225, 3.6], mazinho: [225, 3.6], samuca: [215, 3.9], alan: [190, 4.2], ramon: [185, 5.2], adriano: [215, 3.3], samuel: [230, 3.4] };
  const ROIA_FRAC = 0.92, V0 = 170, V1 = 232;
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const economiaDe = vel => { const alc = 0.82 - (vel - V0) / (V1 - V0) * 0.37; return (1.4 - 0.5 / alc) / 0.85; };   // alcance: 82% (lento) a 45% (mais rápido)
  for (const p of PERSONAGENS) {
    const [vm, t] = MOTO[p.id] || [200, 4];
    p.velMoto = vm; p.t100 = t;
    p.vel = Math.round(vm * (p.perfil === 'ROIA' ? ROIA_FRAC : 1));
    p.acel = lim((6.0 - t) / 2.8, 0, 1);                                     // só para a barra da seleção
    p.curva = lim(0.95 - (p.vel - V0) / (V1 - V0) * 0.35, 0.5, 0.97);
    p.economia = lim(economiaDe(p.vel), 0.2, 0.97);
    p.ritmo = p.perfil === 'ROIA' ? 0.99 : 1.0;
  }
  { const j = PERSONAGENS.find(p => p.id === 'jellison'), a = PERSONAGENS.find(p => p.id === 'alan'); if (j && a) j.economia = a.economia; }   // Versys = mesma economia da F 750
  { const ad = PERSONAGENS.find(p => p.id === 'adriano'); if (ad) ad.economia = lim(Math.min.apply(null, PERSONAGENS.filter(p => p !== ad).map(p => p.economia)) - 0.06, 0.2, 0.97); }   // MT-09: tanque pequeno e bem gastadeira = pior economia

  // ------------------------------------------------------------------ VIAGEM 1
  // Cada trecho: { n: segmentos, c: curva (- esq / + dir), m: subida/descida, z: zona, t: 'S' via simples | 'D' pista dupla }
  // extras: placa (3 linhas), fala (evento do rádio), pedagio, posto
  // Cidades: cidade (nome), lado ('e' esquerda | 'd' direita | 'ambos' = a estrada passa por dentro), porte ('pequena' | 'grande'),
  // marcos: sprites de pontos marcantes [arte, posição no trecho 0-1, x, escala] | horiz: marco no horizonte [arte, lado]
  const MAPA_V1 = [
    ['ITAÚNA', -20.07, -44.57, 'd'], ['ITATIAIUÇU', -20.20, -44.42, 'd'], ['ITAGUARA', -20.39, -44.49, 'd'], ['CARMÓPOLIS', -20.54, -44.63, 'e'],
    ['TRÊS CORAÇÕES', -21.69, -45.25, 'e'], ['CAMPANHA', -21.84, -45.40, 'e'], ['SÃO LOURENÇO', -22.12, -45.05, 'e'], ['POUSO ALTO', -22.20, -44.97, 'd'],
    ['PASSA QUATRO', -22.39, -44.97, 'd'], ['CRUZEIRO', -22.58, -44.96, 'd'], ['CACHOEIRA PTA.', -22.66, -45.01, 'd'], ['LORENA', -22.73, -45.12, 'd'],
    ['GUARATINGUETÁ', -22.82, -45.19, 'et'], ['APARECIDA', -22.85, -45.23, 'eb']
  ];
  const VIAGEM1 = {
    id: 'v2', nome: 'VIAGEM 1', titulo: 'ITAÚNA → APARECIDA', km: 450, semente: 2026,
    sub: 'FERNÃO DIAS • SUL DE MINAS • SERRA • DUTRA', modo: 'viagem',
    info: '5 POSTOS • 3 PEDÁGIOS • 9 RADARES • 15 CIDADES',
    largada: ['ITAÚNA', 'MINAS GERAIS', '#146e3c'], chegada: ['APARECIDA', 'SANTUÁRIO NACIONAL', '#b4141e'],
    fim: 'CHEGAMOS EM APARECIDA!', basilica: true, ceu: [0, 1], largadaPosto: true,
    trechos: [
      // Itaúna: largada no posto, dentro da cidade
      { n: 300, c: 0, m: 0, z: 'cidade', t: 'S', cidade: 'ITAÚNA', lado: 'ambos', porte: 'grande', semEntrada: true, radar: 60,
        marcos: [['matriz', 0.42, -2.3, 1.5], ['igrejas', 0.8, 2.6, 1.2]], horiz: ['capela', 'd'] },
      { n: 460, c: 2, m: 8, z: 'campo', t: 'S', placa: ['ITATIAIUÇU', '22 KM', ''] },
      { n: 440, c: -3, m: -8, z: 'campo', t: 'S' },
      { n: 460, c: 2, m: 10, z: 'eucalipto', t: 'S', radar: 80 },
      { n: 260, c: -1, m: 0, z: 'cidade', t: 'S', cidade: 'ITATIAIUÇU', lado: 'ambos', porte: 'pequena', radar: 60, horiz: ['cristo', 'e'], marcos: [['igrejas', 0.5, 2.5, 1.2]] },
      { n: 350, c: 2, m: -6, z: 'campo', t: 'S' },
      // Fernão Dias (pista dupla)
      { n: 550, c: 2, m: -10, z: 'campo', t: 'D', placa: ['BR-381', 'FERNÃO DIAS', 'SÃO PAULO'], fala: 'fernao' },
      { n: 460, c: -2, m: 14, z: 'eucalipto', t: 'D' },
      { n: 240, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'ITAGUARA', lado: 'e', porte: 'pequena', marcos: [['igreja2', 0.45, -4.6, 1.8], ['cachoeira', 0.8, -4.5, 1.9], ['placa:CACHOEIRA|DA PATACA', 0.62, 1.6, 0.9], ['placa:MATRIZ N. SRA.|DAS DORES', 0.3, 1.6, 0.9]] },
      { n: 160, c: 0, m: 0, z: 'pedagio', t: 'D', pedagio: true },
      { n: 550, c: 2, m: -14, z: 'campo', t: 'D', radar: 110 },
      { n: 530, c: -2, m: 10, z: 'eucalipto', t: 'D', posto: true },
      { n: 580, c: 3, m: -12, z: 'campo', t: 'D' },
      { n: 240, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'CARMÓPOLIS DE MINAS', lado: 'd', porte: 'pequena', marcos: [['igreja3', 0.5, 2.8, 1.3], ['placa:IGREJA N. SRA.|DO CARMO', 0.3, 1.6, 0.9]] },
      { n: 600, c: -3, m: 18, z: 'campo', t: 'D' },
      { n: 160, c: 0, m: 0, z: 'pedagio', t: 'D', pedagio: true },
      { n: 580, c: 2, m: -16, z: 'eucalipto', t: 'D', radar: 110 },
      { n: 600, c: -2, m: 8, z: 'campo', t: 'D' },
      { n: 550, c: 0, m: 0, z: 'campo', t: 'D', posto: true },
      { n: 580, c: 3, m: -10, z: 'eucalipto', t: 'D' },
      { n: 600, c: -2, m: 12, z: 'campo', t: 'D' },
      { n: 160, c: 0, m: 0, z: 'pedagio', t: 'D', pedagio: true },
      { n: 550, c: 2, m: -8, z: 'campo', t: 'D', placa: ['TRÊS CORAÇÕES', '5 KM', ''] },
      { n: 320, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'TRÊS CORAÇÕES', lado: 'ambos', porte: 'grande', radar: 60, marcos: [['futebol', 0.5, 2.5, 1.5]] },
      // Sul de Minas (via simples)
      { n: 530, c: 3, m: 10, z: 'campo', t: 'S', fala: 'simples' },
      { n: 460, c: -4, m: -10, z: 'campo', t: 'S' },
      { n: 240, c: 0, m: 0, z: 'cidade', t: 'S', cidade: 'CAMPANHA', lado: 'd', porte: 'pequena', marcos: [['catedralColonial', 0.5, 2.6, 1.4], ['casaroes', 0.75, 2.9, 1.4], ['casaroes', 0.25, 2.9, 1.4], ['placa:CIDADE HISTÓRICA|CATEDRAL 1787', 0.12, 1.55, 0.9]] },
      { n: 530, c: 4, m: 14, z: 'eucalipto', t: 'S', posto: true },
      { n: 500, c: -3, m: -8, z: 'campo', t: 'S', radar: 80 },
      { n: 320, c: 0, m: 0, z: 'cidade', t: 'S', cidade: 'SÃO LOURENÇO', lado: 'ambos', porte: 'grande', radar: 60, marcos: [['parque', 0.5, -3.0, 1.5]] },
      { n: 500, c: 3, m: 10, z: 'campo', t: 'S' },
      { n: 220, c: 0, m: 0, z: 'cidade', t: 'S', cidade: 'POUSO ALTO', lado: 'e', porte: 'pequena', horiz: ['hotel', 'e'], marcos: [['igrejas', 0.5, -2.4, 1.3], ['placa:POUSO DOS|BANDEIRANTES', 0.3, 1.55, 0.9]] },
      { n: 500, c: -4, m: -10, z: 'campo', t: 'S', posto: true },
      { n: 440, c: 3, m: 8, z: 'eucalipto', t: 'S' },
      { n: 300, c: 0, m: 0, z: 'cidade', t: 'S', cidade: 'PASSA QUATRO', lado: 'ambos', porte: 'pequena', marcos: [['estacao', 0.5, 3.0, 1.4]] },
      // Serra da Mantiqueira (via simples, curvas fechadas)
      { n: 180, c: -5, m: 24, z: 'serra', t: 'S', placa: ['SERRA DA', 'MANTIQUEIRA', 'CURVAS'], fala: 'serra' },
      { n: 160, c: 6, m: 20, z: 'serra', t: 'S' },
      { n: 180, c: -6, m: 18, z: 'serra', t: 'S' },
      { n: 160, c: 5, m: -24, z: 'serra', t: 'S', placa: ['DIVISA', 'SÃO PAULO', ''], fala: 'divisa' },
      { n: 180, c: -6, m: -22, z: 'serra', t: 'S' },
      { n: 160, c: 4, m: -16, z: 'serra', t: 'S' },
      // Via Dutra (pista dupla)
      { n: 280, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'CRUZEIRO', lado: 'ambos', porte: 'grande', placa: ['CRUZEIRO', 'BR-116 DUTRA', ''], fala: 'dutra', horiz: ['santa', 'd'], marcos: [['basilicaRelogios', 0.5, 2.8, 1.4], ['placa:CAPITAL DA|REVOLUÇÃO DE 1932', 0.3, 1.6, 0.9]] },
      { n: 550, c: 2, m: 0, z: 'campo', t: 'D', posto: true },
      { n: 280, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'CACHOEIRA PAULISTA', lado: 'd', porte: 'pequena', marcos: [['santuario', 0.5, 3.2, 1.6]] },
      { n: 580, c: -2, m: 0, z: 'campo', t: 'D', radar: 110 },
      { n: 260, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'LORENA', lado: 'e', porte: 'grande', marcos: [['palmeiras', 0.35, -4.5, 1.9], ['igreja2', 0.65, -4.6, 1.9], ['placa:BASÍLICA DE|SÃO BENEDITO', 0.5, 1.6, 0.9]] },
      { n: 550, c: 2, m: 0, z: 'campo', t: 'D' },
      { n: 280, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'GUARATINGUETÁ', lado: 'd', porte: 'grande', marcos: [['catedral', 0.55, 3.0, 1.4], ['freigalvao', 0.25, 1.6, 0.9]] },
      { n: 440, c: -1, m: 0, z: 'campo', t: 'D' },
      { n: 260, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'APARECIDA', lado: 'ambos', porte: 'grande', placa: ['APARECIDA', 'SANTUÁRIO', 'NACIONAL'], fala: 'aparecida', marcos: [['placa:SANTUÁRIO|NACIONAL', 0.4, 1.6, 0.9]] }
    ],
    mapa: MAPA_V1
  };
  // ------------------------------------------------------------------ CONTRA O RELÓGIO (~3 min): trecho da Fernão Dias
  const RELOGIO = {
    id: 'rel2', nome: 'CONTRA O RELÓGIO', titulo: 'FERNÃO DIAS', km: 160, semente: 4242, modo: 'relogio',
    sub: 'ITAGUARA → TRÊS CORAÇÕES • PISTA DUPLA', info: '1 POSTO • 1 PEDÁGIO • 3 RADARES • 3 CIDADES',
    largada: ['ITAGUARA', 'FERNÃO DIAS', '#146e3c'], chegada: ['TRÊS CORAÇÕES', 'FIM DO TRECHO', '#b4141e'], fim: 'TRECHO CONCLUÍDO!', ceu: [0, 1],
    trechos: [
      { n: 200, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'ITAGUARA', lado: 'e', porte: 'pequena', semEntrada: true, marcos: [['igreja2', 0.45, -4.6, 1.8], ['cachoeira', 0.8, -4.5, 1.9]] },
      { n: 840, c: 2, m: -12, z: 'campo', t: 'D', radar: 110 },
      { n: 800, c: -2, m: 10, z: 'eucalipto', t: 'D' },
      { n: 240, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'CARMÓPOLIS DE MINAS', lado: 'd', porte: 'pequena', marcos: [['igreja3', 0.5, 2.8, 1.3], ['placa:IGREJA N. SRA.|DO CARMO', 0.3, 1.6, 0.9]] },
      { n: 880, c: -3, m: 18, z: 'campo', t: 'D' },
      { n: 160, c: 0, m: 0, z: 'pedagio', t: 'D', pedagio: true },
      { n: 840, c: 2, m: -16, z: 'eucalipto', t: 'D', radar: 110 },
      { n: 800, c: 0, m: 0, z: 'campo', t: 'D', posto: true },
      { n: 880, c: 3, m: -10, z: 'eucalipto', t: 'D' },
      { n: 840, c: -2, m: 12, z: 'campo', t: 'D', placa: ['TRÊS CORAÇÕES', '5 KM', ''] },
      { n: 300, c: 0, m: 0, z: 'cidade', t: 'D', cidade: 'TRÊS CORAÇÕES', lado: 'ambos', porte: 'grande', radar: 60, marcos: [['futebol', 0.5, 2.5, 1.5]] }
    ],
    mapa: [['ITAGUARA', -20.39, -44.49, 'd'], ['CARMÓPOLIS', -20.54, -44.63, 'e'], ['TRÊS CORAÇÕES', -21.69, -45.25, 'e']]
  };

  // ------------------------------------------------------------------ TOMAR UM CAFEZINHO (passeio curto: ~1 min)
  // Passa Quatro -> Serra da Mantiqueira -> Cruzeiro. Sem posto: o tanque já sai cheio.
  const CAFEZINHO = {
    id: 'cafe1', nome: 'TOMAR UM CAFEZINHO', titulo: 'PASSA QUATRO → CRUZEIRO', km: 45, semente: 777, modo: 'cafe',
    sub: 'SERRA DA MANTIQUEIRA • DESCIDA PARA O VALE', info: 'PASSEIO CURTO • SEM POSTO • 2 RADARES • SERRA',
    largada: ['PASSA QUATRO', 'MINAS GERAIS', '#146e3c'], chegada: ['CRUZEIRO', 'PARADA DO CAFÉ', '#6a3a1a'],
    fim: 'HORA DO CAFEZINHO!', semCombustivel: true, ceu: [0.42, 0.62],
    falas: { largada: 'cafe_largada', chegada: 'cafe_chegada' },
    trechos: [
      { n: 140, c: 0, m: 0, z: 'cidade', t: 'S', placa: ['PASSA QUATRO', '', ''], radar: 60 },
      { n: 200, c: 3, m: 10, z: 'campo', t: 'S' },
      { n: 160, c: -3, m: -6, z: 'eucalipto', t: 'S' },
      { n: 130, c: -5, m: 24, z: 'serra', t: 'S', placa: ['SERRA DA', 'MANTIQUEIRA', 'CURVAS'], fala: 'serra' },
      { n: 110, c: 6, m: 20, z: 'serra', t: 'S' },
      { n: 120, c: -6, m: 18, z: 'serra', t: 'S' },
      { n: 120, c: 4, m: 14, z: 'serra', t: 'S' },
      { n: 110, c: 5, m: -24, z: 'serra', t: 'S', placa: ['DIVISA', 'SÃO PAULO', ''], fala: 'divisa' },
      { n: 120, c: -6, m: -22, z: 'serra', t: 'S' },
      { n: 110, c: 4, m: -16, z: 'serra', t: 'S' },
      { n: 120, c: -5, m: -14, z: 'serra', t: 'S' },
      { n: 160, c: 2, m: -6, z: 'campo', t: 'S' },
      { n: 160, c: 0, m: 0, z: 'cidade', t: 'D', placa: ['CRUZEIRO', 'BR-116 DUTRA', ''], fala: 'dutra', radar: 110, oculto: true },
      { n: 200, c: 2, m: 0, z: 'campo', t: 'D' },
      { n: 160, c: 0, m: 0, z: 'cidade', t: 'D', placa: ['CRUZEIRO', 'CAFÉ DO BRMC', '500 M'] }
    ],
    mapa: [['PASSA QUATRO', -22.39, -44.97, 'd'], ['DIVISA MG/SP', -22.47, -44.99, 'e'], ['CRUZEIRO', -22.58, -44.96, 'd']]
  };

  // ------------------------------------------------------------------ CONQUISTAS
  // premio: 'ouro' = libera o CAPACETE DOURADO do piloto usado
  const CONQUISTAS = [
    { id: 'romeiro', nome: 'ROMEIRO', desc: 'CHEGUE EM APARECIDA' },
    { id: 'mcnamara', nome: 'McNAMARA DE VERDADE', desc: '1º LUGAR NA VIAGEM COMPLETA', premio: 'ouro' },
    { id: 'liso', nome: 'PILOTO LISO', desc: 'TERMINE SEM TOMBAR' },
    { id: 'cidadao', nome: 'CIDADÃO DE BEM', desc: 'VIAGEM COMPLETA SEM MULTA' },
    { id: 'cafe', nome: 'CAFÉ PASSADO NA HORA', desc: 'VENÇA O CAFEZINHO' },
    { id: 'pato', nome: 'PATO NA CHUVA', desc: 'TERMINE COM CHUVA NA SERRA' },
    { id: 'neblina', nome: 'FAROL DE MILHA', desc: 'TERMINE COM NEBLINA' },
    { id: 'fantasma', nome: 'VENCI MEU FANTASMA', desc: 'BATA SEU RECORDE NO RELÓGIO' },
    { id: 'roia', nome: 'ROIA RAIZ', desc: 'CHEGUE EM ÚLTIMO' },
    { id: 'cnh', nome: 'CNH EM RISCO', desc: 'LEVE 3 MULTAS NUMA CORRIDA' },
    { id: 'frentista', nome: 'AMIGO DO FRENTISTA', desc: 'ABASTEÇA 2 VEZES' },
    { id: 'bibi', nome: 'BI-BI!', desc: 'BUZINE 15 VEZES NUMA CORRIDA' },
    { id: 'patrocinador', nome: 'PATROCINADOR OFICIAL', desc: 'PAGUE 2 PEDÁGIOS NA MESMA VIAGEM' },
    { id: 'trinca', nome: 'TODO MUNDO VENCEU', desc: 'VENÇA A VIAGEM COM TODOS OS PILOTOS' }
  ];

  // ------------------------------------------------------------------ INTERCOMUNICADOR
  // {alvo} = de quem se fala. ROIA = anda devagar | McNAMARA = acelera demais
  const FALAS = {
    largada: ['Bora, Black Rock! Destino: Aparecida!', 'Capacete afivelado? Então acelera, rapaziada!', 'Quem chegar por último paga o almoço!', 'Nossa Senhora, protege essa turma doida!'],
    ultrapassou: ['Passou porque eu deixei, {alvo}!', 'Ô {alvo}, vai devagar que o radar tá ali!', 'Aproveita, {alvo}, que daqui a pouco eu te pego!', 'Tá com pressa de quê, {alvo}? A Santa não sai do lugar!', 'Virou McNamara agora, {alvo}?'],
    passou_voce: ['Tchau, {alvo}! Te espero no posto!', 'Fica com a poeira, {alvo}!', 'Olha o retrovisor, {alvo}... ah, não dá mais pra me ver!', '{alvo}, quer que eu chame o guincho?', 'Roia detectado: {alvo}!'],
    batida: ['Levanta, {alvo}! Asfalto não é cama!', 'Kkkk {alvo} foi beijar o chão!', 'Ô {alvo}, a estrada é reta e você acha a curva!', 'Calma, {alvo}, é viagem, não é rali!'],
    reserva: ['Ih, acendeu a luz da reserva do {alvo}!', '{alvo} vai empurrar até Aparecida!'],
    abastecendo: ['Enche o tanque e traz um café, {alvo}!', 'Pit stop do {alvo}! Cronometra aí!'],
    lider: ['{alvo} na frente! Avisa que isso não é MotoGP!', 'Alguém segura o McNamara {alvo}!'],
    lanterna: ['{alvo}, tá vindo de bicicleta?', '{alvo}, a gente te espera em Aparecida, viu?', 'Roia do dia: {alvo}!'],
    vacuo: ['Tá colado no meu vácuo, {alvo}? Paga o pedágio então!', 'Desgruda, {alvo}!'],
    pedagio: ['Pedágio! Quem paga hoje é o {alvo}!', 'Passa na tag, {alvo}, que eu tô sem moeda!', 'Para na cancela, {alvo}! Não é pra arrancar ela não!'],
    cancela: ['{alvo} levou a cancela junto! Kkkk', 'Quebrou a cancela, {alvo}? Vai pagar o pedágio e a cancela!'],
    fernao: ['Entramos na Fernão Dias! Pista dupla, bora!', 'Fernão Dias, a casa da gente!'],
    simples: ['Acabou a pista dupla! Agora é mão e contramão, olho vivo!', 'Via simples! Ultrapassa só com visibilidade, rapaziada!'],
    serra: ['Serra da Mantiqueira! Agora quero ver quem é McNamara!', 'Curva, curva, curva... Cuidado aí, {alvo}!'],
    divisa: ['Bem-vindos a São Paulo! O pão de queijo acabou!', 'Divisa! Agora é Cruzeiro e Dutra!'],
    dutra: ['Via Dutra! Olho nas carretas, turma!', 'Dutra! Já dá pra sentir o cheiro de Aparecida!'],
    aparecida: ['Tô vendo a Basílica! Chegamos, Nossa Senhora!', 'Aparecida à vista! Que viagem, irmãos!'],
    chegada: ['Chegamos! Bênção dada, motor quente!', 'Valeu, Black Rock! Agora é foto na frente da Basílica!'],
    cafe_largada: ['Bora tomar um cafezinho em Cruzeiro?', 'Cafezinho rápido: desce a serra e volta pro almoço!', 'Quem chegar por último paga o pão de queijo!'],
    cafe_chegada: ['Chegamos! Cafezinho e pão de queijo por conta do último!', 'Café passado na hora! Valeu, Black Rock!'],
    multa: ['Flash! {alvo} foi multado!', 'Sorria, {alvo}, você foi fotografado!', '{alvo} levou multa! Vai pagar o café de todo mundo!'],
    radar: ['Radar à frente! Segura o McNamara aí!', 'Olha o radar, turma! Respeita a placa!'],
    radar_oculto: ['Radar escondido atrás da árvore! Isso é covardia!', 'Tinha radar escondido! Quem passou voando já era!'],
    buzina: ['Bi-bi! Abre caminho que o Black Rock vem aí!', 'Que buzina é essa, {alvo}? Parece pato!'],
    fechado: ['O caminhoneiro FECHOU o {alvo}! Buzinou, levou!', 'Eita! A carreta jogou pra cima do {alvo}! Segura, peão!', '{alvo} buzinou e o caminhão fechou a ultrapassagem! Paciência, irmão!'],
    xingado: ['O caminhoneiro xingou o {alvo}! Carreta não sai da frente, não!', '{alvo}, buzinar pra carreta é pedir pra ser xingado!', 'Kkkk o caminhoneiro mandou o {alvo} buzinar pra mãe dele!', 'Paciência, {alvo}! Caminhão não abre, ultrapassa com cuidado!'],
    abre_passagem: ['Calma, {alvo}! Já tô saindo da frente!', 'Tá bom, tá bom, {alvo}! Passa aí, apressado!', 'Abri o corredor pro {alvo}! Vai com Deus!', 'Opa, {alvo}! Pode passar, a estrada é sua!'],
    chuva: ['Começou a chover na serra! Devagar nas curvas!', 'Chuva! Quem esqueceu a capa levanta a mão!', 'Asfalto molhado, freia com carinho, rapaziada!'],
    neblina: ['Neblina na Mantiqueira! Liga o farol e reza!', 'Não tô vendo nem o para-lama, que neblina!'],
    galao: ['{alvo} ficou sem gasolina! Lá vem o galão de socorro!', 'Galão de 5 litros pro {alvo}! Planejamento zero!', 'Empurra não, {alvo}! O galão chegou!'],
    pagador: ['Sorteio do pedágio: hoje quem paga é o {alvo}!', 'O pedágio é por conta do {alvo}! Ninguém passa sem ele!', 'Sorteado! {alvo} paga o pedágio da turma!'],
    pagador_espera: ['{alvo} chegou primeiro, mas é o pagador: vai esperar a turma toda!', 'Senta aí, {alvo}! Pagador só passa com todo mundo junto!', 'Pagador adiantado, {alvo}? Agora espera os Roias!'],
    esperando_pagador: ['Todo mundo na cancela esperando o pagador {alvo}!', 'Cadê o {alvo}? A carteira dele que paga o pedágio!', 'Anda, {alvo}! O moto clube inteiro tá parado te esperando!'],
    pedagio_pago: ['Pedágio pago! Valeu, {alvo}! Bora, Black Rock!', 'Cancela aberta! Obrigado pelo patrocínio, {alvo}!', 'Todos juntos! Passa a turma, {alvo} pagou!'],
    fantasma: ['Seu fantasma tá na frente, {alvo}! Até ele é mais rápido!', 'Olha o fantasma do {alvo}! Que medo!']
  };
  // falas SOBRE cada membro (quando ele é o alvo)
  const SOBRE = {
    leosao: {
      geral: ['Calma, Pastor! Respira e solta o acelerador!', 'Leosão marcou 8h e às 7h59 já tava em cima da moto buzinando!', 'O Pastor tá pregando no rádio de novo...',
        'Leosão, o McNamara oficial do Black Rock!', 'Leosão tem planilha até pra parar pra ir ao banheiro!', 'Pastor, a missa em Aparecida é só amanhã, pra que essa pressa?'],
      lider: ['O McNamara disparou! Leosão, isso é passeio, irmão!', 'Leosão na frente, óbvio. Ele saiu 7h59!'],
      ultrapassou: ['O McNamara passou! Segura o Pastor, gente!', 'Leosão ultrapassando? Novidade nenhuma...'],
      batida: ['Até o Pastor caiu! Aleluia, levanta irmão!', 'Leosão caiu e já tá reclamando que atrasou o cronograma!'],
      reserva: ['Reserva? O Leosão? Impossível, ele planeja tudo no Excel!'],
      abastecendo: ['Leosão abastecendo com cronômetro na mão!', 'Pastor, abastece rápido que o cronograma tá atrasando!'],
      pedagio: ['O Leosão já tava com o dinheiro trocado desde Itaúna!'],
      lanterna: ['Leosão em último?! Chama a ambulância que o Pastor tá passando mal!'],
      multa: ['O Pastor foi multado! Vai ter que dizimar pro DETRAN!', 'Leosão multado! Isso não tava na planilha!', 'McNamara multado! Bem feito, Pastor!'],
      buzina: ['Leosão buzinando: é o sino chamando pra missa!', 'Calma, Pastor, buzina não faz a estrada andar!'],
      chuva: ['Leosão, chuva não tava no cronograma, né?'],
      pagador: ['O Pastor paga! É o dízimo da estrada!', 'Leosão é o pagador: já tava com o dinheiro trocado desde Itaúna!'],
      pagador_espera: ['Leosão chegou 7h59 no pedágio e agora vai esperar todo mundo!', 'Pastor, respira! Pagador tem que esperar a turma!'],
      esperando_pagador: ['Leosão atrasado pro pedágio? O cronograma explodiu!']
    },
    jefao: {
      geral: ['Jefão, 1300 cilindradas pra andar a 80 por hora? Roia demais!', 'A GS 1300 do Jefão tá pedindo socorro no modo passeio!',
        'Jefão, a moto tem 145 cavalos e você usa uns 3!', 'Jefão, presidente do clube dos Roias!', 'Jefão pagou moto de foguete pra andar de carroça!'],
      lanterna: ['Cadê o Jefão? Parou pra ver vaquinha de novo?', 'Jefão vem aí... semana que vem!', 'Jefão tá tão devagar que o GPS acha que ele estacionou!'],
      lider: ['Jefão na frente? Alguém confere se a gente não tá parado!', 'Milagre! O Roia acordou!'],
      ultrapassou: ['O Jefão ultrapassando? Anota a data!', 'Jefão passou alguém! Foi o vento que empurrou?'],
      batida: ['Jefão caiu a 40 por hora, foi quase em câmera lenta!', 'O Jefão caiu tão devagar que deu tempo de tirar foto!'],
      reserva: ['Jefão na reserva! Gastou tudo andando a 80?'],
      abastecendo: ['Jefão abastecendo... vai demorar mais que a viagem!', 'Jefão, o tanque da 1300 enche devagar igual você pilota!'],
      pedagio: ['Jefão, nesse pedágio dava pra ter passado andando!'],
      multa: ['Jefão multado?! Como? A 81 por hora?', 'Até o Jefão tomou multa! O radar ficou surpreso!'],
      buzina: ['Jefão buzinou! Acordou, finalmente!', 'Buzina da 1300 é mais rápida que o Jefão!'],
      chuva: ['Jefão na chuva: agora ele tem desculpa pra andar devagar!'],
      pagador: ['Jefão é o pagador... a gente vai esperar até amanhã!', 'Pagador Jefão! Galera, pode pedir um lanche que vai demorar!'],
      pagador_espera: ['Milagre! O Jefão chegou primeiro no pedágio! Agora espera, né?'],
      esperando_pagador: ['Esperando o Jefão no pedágio... alguém trouxe barraca?', 'Jefão vem aí com a carteira... na velocidade dele, chega semana que vem!']
    },
    lucas: {
      geral: ['Lucas Churros: a moto é 1300, mas o ritmo é de carrinho de churros!', 'Lucas, trouxe churros pra galera ou só o apelido?', 'Roia com doce de leite: Lucas Churros!',
        'Lucas tá devagar porque tá equilibrando a bandeja de churros!', 'A GS do Lucas é tão econômica que roda com o cheiro da gasolina!'],
      lanterna: ['Lucas parou pra vender churros no acostamento!', 'Cadê o Lucas? Deve ter montado a barraquinha no pedágio!'],
      lider: ['Lucas na frente? O cheiro de churros puxou ele!', 'Um Roia na liderança? O Lucas comeu açúcar demais!'],
      ultrapassou: ['Lucas Churros ultrapassando! Recheado de coragem hoje!', 'O Lucas passou! Foi no embalo do doce de leite!'],
      batida: ['Lucas caiu! Salvem os churros!', 'Levanta, Lucas! Churros no chão não conta!'],
      reserva: ['Lucas na reserva? Vai trocar churros por gasolina!'],
      abastecendo: ['Lucas abastecendo... trinta litros! Dá pra fritar muito churros com isso!', 'Lucas, aproveita o posto e vende uns churros pros frentistas!'],
      pedagio: ['Lucas quer pagar o pedágio em churros!'],
      multa: ['Lucas multado?! Um Roia levando multa? O radar tava parado!', 'Lucas, a multa vai sair mais cara que mil churros!'],
      buzina: ['Lucas buzinando: parece o carrinho de churros chegando!'],
      chuva: ['Lucas, cuidado pra não molhar os churros!'],
      pagador: ['Lucas Churros paga o pedágio... será que aceita churros?', 'O pagador é o Lucas! Hoje o pedágio sai com doce de leite!'],
      pagador_espera: ['Lucas chegou primeiro no pedágio! Até deu tempo de fritar uns churros!'],
      esperando_pagador: ['Esperando o Lucas... alguém liga pra ele largar a barraquinha!']
    },
    fabinho: {
      geral: ['Fabinho Mecânico acelera porque sabe que, se quebrar, ele mesmo conserta!', 'Fabinho, pisa leve que essa GS bebe mais que a turma no bar!',
        'O Fabinho acelera tanto que o posto já guarda a bomba pra ele!', 'Fabinho regulou a moto pra 225 e o consumo pro infinito!', 'Fabinho tem mais ferramenta no baú do que roupa!'],
      lanterna: ['Fabinho em último? Deve ter parado pra consertar a moto de alguém!', 'Fabinho atrás? Tá no posto de novo!'],
      lider: ['Fabinho na frente, óbvio: McNamara com chave de boca no bolso!', 'Lá vai o Fabinho! Ninguém segura o McNamara mecânico!'],
      ultrapassou: ['Fabinho passou voando! 225 no talo!', 'O mecânico passou! Essa moto tá regulada demais!'],
      batida: ['Fabinho caiu! Pelo menos o mecânico já tá no local!', 'Fabinho, levanta e aperta os parafusos aí!'],
      reserva: ['Fabinho na reserva... de novo! Mecânico que não calcula consumo!', 'A GS do Fabinho bebeu tudo! Alguém tem um galão?'],
      abastecendo: ['Fabinho no posto de novo? Essa GS é movida a gasolina ou a dinheiro?', 'Fabinho abastecendo! O frentista já sabe o nome dele!'],
      pedagio: ['Fabinho chegou no pedágio xingando a cancela!'],
      multa: ['Fabinho multado! Vai ter que consertar o radar pra apagar a foto!', 'McNamara mecânico multado! Bem feito, Fabinho!'],
      buzina: ['Fabinho buzina e acelera ao mesmo tempo, que McNamara!'],
      chuva: ['Fabinho na chuva: pra ele, freio é só um detalhe!'],
      pagador: ['Fabinho paga! Depois cobra na revisão da moto de todo mundo!', 'O pagador é o Fabinho! Vai sair caro igual peça original!'],
      pagador_espera: ['Fabinho chegou voando no pedágio e agora vai ter que esperar os Roias!', 'Senta aí, Fabinho! McNamara pagador espera a turma toda!'],
      esperando_pagador: ['Esperando o Fabinho... deve ter parado no posto pela décima vez!']
    },
    pescoco: {
      geral: ['Fabinho Pescoço ganhou o apelido de tanto virar o pescoço pra ver se os Roias tão vindo!', 'Pescoço, olha pra frente que a estrada não tá no retrovisor!',
        'Dois Fabinhos no clube: um conserta a moto, o outro torce o pescoço olhando paisagem!', 'Fabinho Pescoço de Triple Black: até a camiseta combina com a moto!',
        'Pescoço, esse cabelo aí dentro do capacete é aerodinâmico?'],
      lanterna: ['Fabinho Pescoço lá atrás? Travou o pescoço olhando o retrovisor!', 'Pescoço em último? Parou pra arrumar o cabelo!'],
      lider: ['Fabinho Pescoço na frente! Vira o pescoço pra ver a gente comendo poeira!', 'McNamara de Triple Black na liderança: Pescoço disparou!'],
      ultrapassou: ['Lá vai o Pescoço! Nem olhou pro lado!', 'Fabinho Pescoço passou que nem um vulto preto!'],
      batida: ['Pescoço caiu! Alguém confere se o pescoço tá no lugar!', 'Levanta, Pescoço! O cabelo nem desarrumou!'],
      reserva: ['Fabinho Pescoço na reserva! A Triple Black bebe que nem McNamara!'],
      abastecendo: ['Pescoço abastecendo... e tirando foto da moto pro Instagram!', 'Fabinho Pescoço no posto: enche o tanque e dá um tapa no visual!'],
      pedagio: ['Pescoço chegou no pedágio olhando pra todo lado procurando a tag!'],
      multa: ['Fabinho Pescoço multado! Tava virando o pescoço e esqueceu do radar!', 'Pescoço, sorria! O radar pegou seu melhor ângulo!'],
      buzina: ['Pescoço buzinando e virando o pescoço pra ver se assustou alguém!'],
      chuva: ['Pescoço, a chuva vai acabar com esse topete!'],
      pagador: ['Fabinho Pescoço paga o pedágio! Até a carteira é Triple Black!', 'Sorteio: o Pescoço paga! Pode esticar o pescoço pra procurar a tag!'],
      pagador_espera: ['Pescoço chegou primeiro e tá esticando o pescoço pra ver a turma chegando!'],
      esperando_pagador: ['Cadê o Pescoço? A gente vai torcer o pescoço de tanto olhar pra trás!']
    },
    henrique: {
      geral: ['Henrique do Samuel... o Samuel sabe que você tá aqui?', 'Manda um abraço pro Samuel, Henrique!', 'Henrique é o único de três cilindros: dá pra reconhecer pelo ronco!',
        'Henrique veio de tigre: cuidado que ele morde nas curvas!', 'Henrique, o único que não anda de BMW e ainda passa todo mundo!', 'A moto do Henrique é cor de areia: perfeita pra se esconder na estrada de terra!',
        'Henrique é o mais caprichoso do clube: moto limpinha, óculos limpinho, cabelo no lugar!', 'Henrique pilota com elegância: até a curva ele faz com classe!',
        'Henrique, para de arrumar o cabelo no retrovisor que o capacete vai bagunçar tudo de novo!'],
      lanterna: ['Henrique lá atrás? Deve ter parado pra ligar pro Samuel!', 'Cadê o Henrique? O tigre dormiu!'],
      lider: ['Henrique na frente! O tigre soltou a fera!', 'Henrique do Samuel liderando: o Samuel vai ficar orgulhoso!'],
      ultrapassou: ['Henrique passou rugindo! Três cilindros não perdoam!', 'Lá vai o Henrique! Ninguém segura o tigre nas curvas!'],
      batida: ['Henrique caiu! Levantou, ajeitou o cabelo e seguiu com classe!', 'Henrique caiu! Alguém avisa o Samuel!', 'O tigre tropeçou! Levanta, Henrique!'],
      reserva: ['Henrique na reserva! O tigre tá com fome!'],
      abastecendo: ['Henrique abastecendo e já limpando a moto com lencinho umedecido!', 'Henrique abastecendo: tigre também precisa comer!', 'Henrique, tira foto da moto no posto pro Samuel ver!'],
      pedagio: ['Henrique, o pedágio é na conta do Samuel?'],
      multa: ['Henrique multado! A multa vai pro endereço do Samuel?', 'O radar pegou o tigre! Sorria, Henrique!'],
      buzina: ['Henrique buzinou! Parece um tigre rosnando!'],
      chuva: ['Henrique, tigre não gosta de água, cuidado aí!', 'Chuva? O Henrique vai reclamar que molhou a moto que ele acabou de lavar!'],
      pagador: ['Henrique paga o pedágio! Ou melhor, o Samuel paga!', 'Sorteado: Henrique do Samuel! Liga pro Samuel mandar o Pix!'],
      pagador_espera: ['Henrique chegou rugindo no pedágio e agora vai esperar a turma toda!'],
      esperando_pagador: ['Esperando o Henrique... deve tá explicando pro Samuel onde tá!']
    },
    cezar: {
      geral: ['Cezar com essa cara de bravo, até o radar fica com medo de multar!', 'Os baús prata do Cezar brilham tanto que dá pra usar de espelho!',
        'Cezar não sorri nem na foto: é concentração de McNamara!', 'Cezar, essa barba grisalha é de experiência ou de susto na estrada?', 'Cezar carrega três baús de alumínio e ainda passa todo mundo!'],
      lider: ['Cezar na frente, sério como sempre!', 'O Cezar disparou e nem mudou a expressão!'],
      lanterna: ['Cezar lá atrás? Parou pra polir os baús prata!', 'Cadê o Cezar? Tá olhando a moto de cara fechada!'],
      ultrapassou: ['Cezar passou com cara de quem não quer conversa!', 'Lá vai o Cezar, os baús prata refletindo o sol na cara da gente!'],
      batida: ['Cezar caiu! E levantou com a mesma cara séria!', 'Cezar, confere se os baús não amassaram!'],
      reserva: ['Cezar na reserva! Os baús pesaram, hein?'],
      abastecendo: ['Cezar abastecendo: trinta litros e nenhum sorriso!', 'Cezar no posto, aproveitando pra lustrar os baús!'],
      pedagio: ['Cezar no pedágio: o cobrador nem teve coragem de cobrar!'],
      multa: ['Cezar multado! O radar teve coragem!', 'Cezar levou multa e fez a mesma cara de sempre!'],
      buzina: ['Cezar buzinou! Todo mundo saiu da frente por medo!'],
      chuva: ['Cezar na chuva: baú prata molhado brilha mais ainda!'],
      pagador: ['Cezar é o pagador! Ninguém reclama, ele tá de cara fechada!', 'Sorteio: o Cezar paga! Sorri, Cezar, é só um pedágio!'],
      pagador_espera: ['Cezar chegou primeiro no pedágio e tá esperando de braço cruzado!'],
      esperando_pagador: ['Esperando o Cezar... ninguém tem coragem de ligar pra cobrar!']
    },
    cleimar: {
      geral: ['Cleimar, o rei do joinha! Até no rádio dá pra ouvir o polegar pra cima!', 'Cleimar tá sempre de boa: joinha pra tudo!',
        'Os baús pretos do Cleimar combinam com a moto e com a camiseta!', 'Cleimar acelera com uma mão e faz joinha com a outra!', 'Cleimar e Cezar com a mesma moto: só muda a cor dos baús e o humor!'],
      lider: ['Cleimar na frente! Joinha pra quem ficou pra trás!', 'O Cleimar disparou rindo!'],
      lanterna: ['Cleimar em último? Parou pra fazer joinha pros caminhoneiros!', 'Cadê o Cleimar? Tirando foto com a moto!'],
      ultrapassou: ['Cleimar passou e ainda mandou um joinha!', 'Lá vai o Cleimar, Triple Black voando!'],
      batida: ['Cleimar caiu! Mas já levantou fazendo joinha!', 'Levanta, Cleimar! Tá tudo bem? ...ele fez joinha, tá tudo bem!'],
      reserva: ['Cleimar na reserva! Joinha não enche tanque, irmão!'],
      abastecendo: ['Cleimar abastecendo e fazendo joinha pro frentista!', 'Cleimar no posto: trinta litros de joinha!'],
      pedagio: ['Cleimar passou no pedágio fazendo joinha pra cancela!'],
      multa: ['Cleimar multado! E fez joinha pro radar!', 'O radar fotografou o Cleimar... fazendo joinha!'],
      buzina: ['Cleimar buzinou e fez joinha ao mesmo tempo!'],
      chuva: ['Cleimar na chuva: de boa, joinha molhado!'],
      pagador: ['Cleimar paga o pedágio! Joinha pra ele!', 'Sorteio: o Cleimar é o pagador! Ele fez joinha, tá aceito!'],
      pagador_espera: ['Cleimar chegou primeiro no pedágio e tá fazendo joinha pra cada um que chega!'],
      esperando_pagador: ['Esperando o Cleimar... alguém viu um joinha vindo lá atrás?']
    },
    mazinho: {
      geral: ['Mazinho pilota igual dirige carrinho de bate-bate!', 'Mazinho, curva não é reta, irmão! Freia!', 'Mazinho de óculos escuro: não enxerga a curva, mas fica bonito na foto!',
        'O Mazinho acelera em tudo, menos na hora de pagar a conta!', 'Mazinho é o único que faz a curva por fora... do asfalto!', 'Mazinho, para de puxar o saco do Fabinho e olha a estrada!'],
      lider: ['Mazinho na frente! Alguém reza por ele!', 'O Mazinho disparou... olha a curva, Mazinho!'],
      lanterna: ['Mazinho lá atrás? Errou a curva de novo!', 'Cadê o Mazinho? Foi parar no pasto!'],
      ultrapassou: ['Mazinho passou raspando! Que susto!', 'Lá vai o Mazinho sem freio nenhum!'],
      batida: ['Mazinho caiu! Novidade nenhuma!', 'De novo, Mazinho?! Essa moto já conhece o asfalto de perto!', 'Mazinho caiu e já tá chamando o Fabinho Mecânico!'],
      reserva: ['Mazinho na reserva! Acelerando desse jeito, o tanque nem sabe o que é cheio!'],
      abastecendo: ['Mazinho abastecendo... de novo! A Adventure 40 anos bebe que nem ele!', 'Mazinho no posto, contando piada pro frentista!'],
      pedagio: ['Mazinho, freia que a cancela é de ferro!'],
      multa: ['Mazinho multado! Já é o cliente VIP do radar!', 'Mazinho tomou mais uma! Essa CNH tá por um fio!', 'Flash no Mazinho! Ele fez pose de óculos escuro!'],
      buzina: ['Mazinho buzinando sem parar! Parece criança com brinquedo novo!'],
      chuva: ['Chuva e Mazinho no mesmo lugar? Socorro!'],
      pagador: ['Mazinho paga o pedágio! Milagre, ele nunca paga nada!', 'Sorteio: Mazinho é o pagador! Já tá pedindo pro Fabinho Mecânico pagar pra ele!'],
      pagador_espera: ['Mazinho chegou voando no pedágio, quase levou a cancela, e agora espera a turma!'],
      esperando_pagador: ['Esperando o Mazinho... deve ter errado a curva!']
    },
    samuca: {
      geral: ['Samuca, quanto é a corrida até Aparecida? Aceita cartão?', 'Olha o capacete rosa do Samuca! Dá pra ver lá de Itaúna!', 'Samuca tá devagar porque tá esperando o passageiro descer!',
        'Samuca, cuidado que o aplicativo vai te dar nota baixa por demora!', 'Samuca trabalha a semana inteira de moto e no fim de semana... anda de moto!', 'Capacete rosa, GS de mototáxi: o Samuca tem estilo!'],
      lider: ['Samuca na frente! Tem entrega com hora marcada!', 'Samuca liderando? Deve ter pegado uma corrida de última hora!'],
      lanterna: ['Samuca lá atrás? Parou pra fazer uma entrega!', 'Cadê o Samuca? Deve ter aceitado uma corrida no caminho!', 'Samuca tá na última posição esperando a gorjeta!'],
      ultrapassou: ['Samuca passou costurando igual no horário de pico!', 'Lá vai o capacete rosa ultrapassando!'],
      batida: ['Samuca caiu! Alguém confere se a encomenda tá inteira!', 'Levanta, Samuca! Cliente esperando!'],
      reserva: ['Samuca na reserva! Esqueceu de cobrar a última corrida?'],
      abastecendo: ['Samuca abastecendo: vai pedir nota pra descontar no imposto!', 'Samuca no posto, aproveitando pra ver se tem entrega no app!'],
      pedagio: ['Samuca, mototáxi paga pedágio ou é isento?'],
      multa: ['Samuca multado! Vai descontar das corridas da semana!', 'Radar pegou o capacete rosa! Impossível não ver!'],
      buzina: ['Samuca buzina igual no trânsito do centro: bi-bi, sai da frente!'],
      chuva: ['Samuca na chuva? Pra ele é só mais um dia de entrega!'],
      pagador: ['Samuca paga o pedágio! Depois ele cobra a corrida de cada um!', 'Sorteio: o Samuca é o pagador! Vai passar a maquininha?'],
      pagador_espera: ['Samuca chegou primeiro no pedágio, pontual igual entrega de pizza!'],
      esperando_pagador: ['Esperando o Samuca... deve tá fazendo uma entrega no caminho!']
    },
    alan: {
      geral: ['Alan com essa cara de galã de novela, até parece que tá gravando comercial de moto!', 'Alan, a F 750 é pequena mas é econômica: dá pra ir até Aparecida com meio tanque!',
        'Alan olha pro horizonte igual capa de revista!', 'Alan, capacete branco, moto preta: combinação de filme!', 'Alan anda devagar pra não desarrumar o cabelo grisalho!'],
      lider: ['Alan na frente! Roia que acelera na saída é perigoso!', 'Olha o Alan liderando com a menor moto do grupo!'],
      lanterna: ['Alan lá atrás? Parou pra fazer pose pra foto!', 'Cadê o Alan? Tá admirando a paisagem com aquela cara séria!'],
      ultrapassou: ['Alan arrancou e passou! Essa F 750 sai rápido!', 'Lá vai o Alan, discreto e eficiente!'],
      batida: ['Alan caiu! Mas caiu com classe, de jaqueta de couro!', 'Levanta, Alan! O cabelo nem saiu do lugar!'],
      reserva: ['Alan na reserva? Impossível, essa moto bebe que nem passarinho!'],
      abastecendo: ['Alan abastecendo... quinze litros e pronto, mais rápido que todo mundo!'],
      pedagio: ['Alan no pedágio fazendo cara de modelo pra câmera!'],
      multa: ['Alan multado! Pelo menos o radar pegou o lado bom!', 'Até o Alan, Roia, levou multa? Essa F 750 é traiçoeira!'],
      buzina: ['Alan buzinou! Primeira vez que alguém ouviu ele fazer barulho!'],
      chuva: ['Alan na chuva, molhado e sério: cena de filme de ação!'],
      pagador: ['Alan paga o pedágio! Ele economizou na gasolina, pode pagar!', 'Sorteio: Alan é o pagador! A F 750 economiza pra isso!'],
      pagador_espera: ['Alan chegou primeiro no pedágio, sério, de braço cruzado, esperando a turma!'],
      esperando_pagador: ['Esperando o Alan... deve tá olhando a paisagem!']
    },
    ramon: {
      geral: ['Ramon, o novato! Já pagou o café de boas-vindas?', 'Ramon, lava a moto do Jellison quando chegar? Cobra desconto de membro!', 'Novato tem que ir atrás, Ramon, pra aprender o caminho!',
        'A Transalp do Ramon é a mais limpa do clube: o cara lava moto o dia inteiro!', 'Ramon, a gente vai sujar a moto toda na serra só pra você ter serviço segunda-feira!', 'Ramon, cuidado pra não lavar a moto com o pano de prato da sua mãe!'],
      lider: ['O novato na frente? Ramon, desacelera que você nem sabe o caminho!', 'Ramon liderando! Os veteranos tão passando vergonha!'],
      lanterna: ['Ramon lá atrás, como todo bom novato!', 'Cadê o Ramon? Parou pra lavar a moto num lava-jato da estrada!', 'Ramon tá devagar pra não sujar a Transalp!'],
      ultrapassou: ['Ramon ultrapassando! O novato tá ousado hoje!', 'Olha o Ramon passando! Moto lavadinha brilhando no sol!'],
      batida: ['O novato caiu! Faz parte do batismo, Ramon!', 'Ramon caiu! Pelo menos ele sabe lavar a moto depois!', 'Levanta, Ramon! Novato no chão é tradição!'],
      reserva: ['Ramon na reserva! Novato não sabe calcular o tanque!'],
      abastecendo: ['Ramon no posto: aproveita e dá uma lavadinha na moto, né?', 'Ramon abastecendo e passando paninho no tanque!'],
      pedagio: ['Ramon, novato não paga pedágio: paga o pedágio de todo mundo!'],
      multa: ['O novato tomou multa! Batismo completo, Ramon!', 'Ramon multado! Vai ter que lavar muita moto pra pagar!'],
      buzina: ['Ramon buzinando! O novato tá se achando!'],
      chuva: ['Chuva! Ramon tá feliz: segunda-feira vai ter muita moto suja pra lavar!'],
      pagador: ['Sorteio... ah, nem precisava: novato paga! Valeu, Ramon!', 'Ramon é o pagador! O dinheiro das lavagens tá rendendo!'],
      pagador_espera: ['Ramon chegou primeiro no pedágio: novato esperto, já foi pagando!'],
      esperando_pagador: ['Esperando o novato... Ramon, se perdeu?', 'Cadê o Ramon? Deve tá lavando a moto no meio da estrada!']
    },
    adriano: {
      geral: ['Randandan! Dá pra ouvir o Adriano chegando lá de Itaúna!', 'Adriano, esse escapamento acorda até defunto!', 'O Adriano não precisa de buzina: o escape já avisa todo mundo!',
        'Randandandan! Lá vem o Adriano espantando as vacas do pasto!', 'Adriano, a MT 09 é pelada, mas o barulho é de foguete!', 'O vizinho do Adriano já fez abaixo-assinado contra esse escape!'],
      lider: ['Adriano na frente! Ninguém sai mais rápido que essa MT 09!', 'Só se ouve RANDANDAN lá na frente: é o Adriano!'],
      lanterna: ['Adriano lá atrás? Parou pra mostrar o ronco pra alguém!', 'Cadê o Adriano? Tô sem ouvir o randandan!'],
      ultrapassou: ['RANDANDANDAN! O Adriano passou rasgando!', 'Adriano arrancou e quase estourou meu tímpano!', 'Passou o Adriano: até o asfalto tremeu!'],
      batida: ['Adriano caiu! Pelo menos agora tá em silêncio!', 'O Randandan virou randandom! Levanta, Adriano!'],
      reserva: ['Adriano na reserva! Tanque pequeno e mão pesada não combinam!', 'A MT 09 do Adriano bebe gasolina igual faz barulho: muito!'],
      abastecendo: ['Adriano no posto: o frentista tapou o ouvido!', 'Adriano abastecendo: catorze litros, que tanque pequeno!'],
      pedagio: ['Adriano chegou no pedágio e a cancela abriu de susto com o ronco!'],
      multa: ['Adriano multado! O radar pegou pelo barulho!', 'Adriano tomou multa por excesso de velocidade E de decibéis!'],
      buzina: ['Adriano buzinou? Ninguém ouviu, o escape é mais alto!'],
      chuva: ['Adriano na chuva: o randandan fica até mais grave!'],
      pagador: ['Adriano é o pagador! Bora, Randandan, solta o dinheiro!', 'Sorteio: Adriano paga! O cobrador vai ficar surdo!'],
      pagador_espera: ['Adriano chegou primeiro no pedágio, acelerando parado pra apressar a turma!'],
      esperando_pagador: ['Esperando o Adriano... é só ficar quieto que dá pra ouvir ele chegando!']
    },
    samuel: {
      geral: ['Samuel do Henrique e Henrique do Samuel: o casal mais lindo do Black Rock!', 'Samuel, cadê seu amor? O Henrique tá te procurando no rádio!',
        'Samuel é o único que lê o manual da moto inteiro... duas vezes!', 'Samuel, explica de novo esse negócio de suspensão semiativa que ninguém entendeu!', 'Samuel sério desse jeito? É só o Henrique chegar que ele fica vermelho!'],
      lider: ['Samuel na frente! Tá fugindo do Henrique?', 'O Samuel disparou! Henrique, vai atrás do seu amor!'],
      lanterna: ['Samuel lá atrás? Tá esperando o Henrique, que fofo!', 'Cadê o Samuel? Configurando o modo de pilotagem pela décima vez!'],
      ultrapassou: ['Samuel passou! Controle de tração trabalhando bonito!', 'Lá vai o Samuel com a Triple Black, sério igual engenheiro!'],
      batida: ['Samuel caiu! Henrique, corre lá socorrer seu amor!', 'Samuel, o sensor de inclinação não te avisou não?'],
      reserva: ['Samuel na reserva? O computador de bordo tava avisando há 50 km!'],
      abastecendo: ['Samuel abastecendo e conferindo o consumo médio no painel!', 'Samuel no posto, calibrando pneu com manômetro digital!'],
      pedagio: ['Samuel no pedágio explicando como funciona a tag pro cobrador!'],
      multa: ['Samuel multado! O piloto automático adaptativo não viu o radar?', 'O casal foi multado? Não, só o Samuel! Henrique, paga pra ele!'],
      buzina: ['Samuel buzinou! Deve ser o Henrique na frente!'],
      chuva: ['Samuel na chuva: já colocou no modo Rain antes da primeira gota!'],
      pagador: ['Samuel paga o pedágio! Henrique, seu amor tá bancando hoje!', 'Sorteio: Samuel é o pagador! Conta conjunta com o Henrique, né?'],
      pagador_espera: ['Samuel chegou primeiro no pedágio e já tá lendo o manual da cancela!'],
      esperando_pagador: ['Esperando o Samuel... o Henrique já tá com saudade!']
    },
    jellison: {
      geral: ['Jellison, a patroa liberou até que horas?', 'Milagre! Jellison tirou a moto da garagem!', 'Jellison, manda foto pra esposa provando que tá vivo!',
        'A moto do Jellison ainda tem cheiro de nova de tão pouco que anda!', 'Jellison, esses três baús são pra levar a feira inteira?', 'Jellison trouxe a autorização da esposa assinada?'],
      lanterna: ['Jellison tá devagar pra não explicar multa pra esposa!', 'Roia nível Jellison: anda pouco e devagar!'],
      lider: ['Jellison na frente?! A esposa sabe disso?', 'Jellison acelerando? Deve tá com hora marcada pra voltar!'],
      ultrapassou: ['Jellison ultrapassando? Tá com pressa de voltar pra casa!', 'Olha o Jellison! A patroa deixou até ultrapassar hoje!'],
      batida: ['Jellison caiu! Agora a patroa não deixa sair por um ano!', 'Levanta, Jellison! Se a esposa vê, acabou o passeio!'],
      reserva: ['Jellison na reserva... a esposa só liberou meio tanque!'],
      abastecendo: ['Jellison, abastece e liga pra esposa avisando!', 'Jellison, guarda a nota do posto pra prestar contas em casa!'],
      pedagio: ['Jellison, pede o reembolso do pedágio pra patroa!'],
      multa: ['Jellison multado! A patroa vai saber!', 'Jellison, a multa chega no endereço de casa... boa sorte!', 'Multa pro Jellison! Acabou a liberação do ano!'],
      buzina: ['Buzina baixo, Jellison, senão a patroa escuta lá de Itaúna!', 'Jellison buzinando de alegria: hoje tá liberado!'],
      chuva: ['Jellison, se molhar a roupa a patroa vai perguntar onde você tava!'],
      pagador: ['Jellison é o pagador! Vai ter que pedir o cartão da patroa!', 'Jellison pagando? A patroa vai ver no extrato!'],
      pagador_espera: ['Jellison chegou primeiro e tá ligando pra patroa liberar o Pix!'],
      esperando_pagador: ['Jellison, a patroa liberou o dinheiro do pedágio ou não?', 'Esperando o Jellison: deve tá pedindo autorização pra pagar!']
    }
  };
  // falas DITAS por cada membro
  // MAZINHO puxando o saco do FABINHO MECÂNICO (aparece quando o Fabinho é o assunto)
  const PUXA = {
    geral: ['Fabinho Mecânico é o maior piloto de Minas Gerais! Do Brasil! Do mundo!', 'Fabinho, quando eu crescer quero ser igual a você!'],
    ultrapassou: ['Isso, Fabinho! Mostra pra esses Roias quem manda!', 'Que pilotagem, Fabinho! Parece MotoGP!', 'Passa por cima, Fabinho! Kkkk'],
    passou_voce: ['Pode passar, Fabinho, você merece! Abre espaço pro mestre!'],
    lider: ['Fabinho na frente, como sempre! Ninguém chega aos pés do mestre!', 'Esse é o meu ídolo! Vai, Fabinho!'],
    batida: ['O Fabinho não caiu, ele fez uma parada técnica!', 'Ninguém viu nada! O Fabinho só deitou a moto pra testar o pneu!'],
    abastecendo: ['Fabinho abastecendo com estilo! Até a bomba fica mais bonita!'],
    multa: ['O radar tá errado! O Fabinho nunca passa do limite... muito!'],
    pagador: ['Deixa que eu pago o do Fabinho! ...brincadeira, paga aí, Fabinho!'],
    chegada: ['Fabinho chegou! Palmas pro mestre!']
  };
  // ZOA[quem][alvo]: implicâncias preferidas de cada membro (peso = chance relativa)
  const ZOA = {
    adriano: {
      fabinho: ['Fabinho Mecânico, regula meu escape pra ficar mais alto ainda?', 'Fabinho, sua moto é linda, mas o ronco da minha ninguém bate!', 'Ô Fabinho, enquanto você conserta a moto dos outros eu já tô lá na frente!'],
      leosao: ['Pastor, meu escape é o sino da sua igreja! Randandan, hora da missa!', 'Leosão, chegou 7h59? Eu cheguei 7h58 e acordei a cidade inteira!', 'Pastor, reza por mim que hoje eu vou acelerar!'],
      jellison: ['Jellison, quando eu passar na sua rua a patroa vai saber que você saiu!', 'Jellison, quer que eu passe na sua casa acelerando pra avisar a patroa?', 'Ô Jellison, ouviu o randandan? Era a patroa ligando!']
    },
    leosao: { ramon: ['Ramon, novato tem que chegar 7h50! Amanhã eu quero você na porta!', 'Ramon, no clube a regra é: novato não reclama, novato acompanha!'] },
    jefao: { ramon: ['Ramon, finalmente alguém mais devagar que eu!', 'Calma, Ramon, eu sou Roia há anos, depois te dou umas aulas!'] },
    jellison: { ramon: ['Ramon, lava minha moto antes da patroa ver a sujeira?', 'Ramon, se a patroa perguntar, eu tava com o novato aprendendo, tá?'] },
    mazinho: { ramon: ['Ô Ramon, novato! Vai buscar um café pro Fabinho!', 'Ramon, essa Transalp é seu primeiro carro, digo, sua primeira moto? Kkkk', 'Filmei o novato errando a marcha! Já tá no grupo!'] },
    fabinho: { ramon: ['Ramon, depois passa na oficina que eu dou um jeito nessa Transalp!', 'Ramon, você lava, eu conserto: vamos abrir uma sociedade!'] },
    samuca: {
      jellison: ['Jellison, quer que eu leve um recado pra patroa? Faço entrega expressa!', 'Jellison, se a patroa ligar, eu digo que você tá na minha garupa!',
        'Ô Jellison, se precisar voltar cedo eu te levo de mototáxi!', 'Jellison, a patroa já te deu a senha do Pix pro pedágio?'],
      jefao: ['Jefão, nesse ritmo eu faço três entregas e volto pra te buscar!', 'Jefão, quer que eu reboque essa 1300? Cobro por quilômetro!',
        'Ô Jefão, até minha entrega de marmita chega antes de você!', 'Jefão, 1300 cilindradas e meu capacete rosa ainda te passa!']
    },
    alan: {
      ramon: ['Ramon, quando você lavar minha moto, capricha no baú preto!'],
      cleimar: ['Cleimar, abaixa esse joinha e segura o guidão com as duas mãos!', 'Cleimar, se joinha desse gasolina, você tava com tanque cheio até o Natal!',
        'Ô Cleimar, sua moto tem 1250 e mesmo assim eu te vejo no retrovisor!', 'Cleimar, tira a mão do joinha e põe no freio, irmão!'],
      samuca: ['Samuca, capacete rosa combina com o meu branco: a gente é a dupla da moda!', 'Ô Samuca, liga o aplicativo que eu pago a corrida até o posto!',
        'Samuca, cadê a maquininha? Vou pagar o café com cartão!', 'Samuca, se perder a entrega a culpa é minha, eu te distraí!'],
      jefao: ['Jefão, minha F 750 tem metade da sua cilindrada e o dobro da sua coragem!', 'Jefão, quer trocar de moto? Pelo menos aí a sua 1300 ia ter uso!'],
      fabinho: ['Fabinho Mecânico, enquanto você para no posto eu já tô no café!', 'Fabinho, eu sei que você é mecânico, mas conserta esse consumo aí!'],
      pescoco: ['Pescoço, vira o pescoço pra trás: tô colado em você com a menor moto!', 'Fabinho Pescoço, esse cabelo tá mais bagunçado que meu baú!']
    }
  };
  const ZOA_PESO = { alan: { cleimar: 3, samuca: 3, jefao: 1, fabinho: 1, pescoco: 1 } };
  // HENRIQUE x SAMUEL: o "casal" do clube. Pares [provocação do Henrique, resposta do Samuel]
  const CASAL = [
    ['Samuel, meu amor, tá lindo nessa jaqueta hoje!', 'Henrique... o rádio tá aberto pra todo mundo, viu? Vai tomar naquele lugar!'],
    ['Meu amor, encosta aqui do lado que eu quero ver essa 1300 de pertinho!', 'Ó o respeito, Henrique! Vai tomar naquele lugar, rapaz!'],
    ['Samuel, essa sua moto tem marcha ré? Porque você sempre vem por trás de mim!', 'Kkkk vai tomar naquele lugar, Henrique!'],
    ['Amor, me espera no posto que eu te pago um café... e o resto a gente vê!', 'Henrique, o grupo inteiro tá ouvindo... vai tomar naquele lugar!'],
    ['Samuel, meu amor, sua suspensão é semiativa? A minha é totalmente ativa!', 'Ai, Henrique, para... vai tomar naquele lugar!'],
    ['Meu amor, quando chegar em Aparecida vamos acender uma vela juntos?', 'Henrique, eu vou acender é uma vela pra você parar de falar besteira! Kkkk'],
    ['Samuel, você no retrovisor fica ainda mais bonito!', 'Olha pra frente e vai tomar naquele lugar, Henrique!'],
    ['Amor, empresta seu capacete? Quero sentir seu cheiro na estrada!', 'Não empresto nada! Vai tomar naquele lugar, Henrique! Kkkk'],
    ['Samuel, vamos fazer a curva juntinhos, de mãos dadas?', 'Mão no guidão, Henrique! E vai tomar naquele lugar!']
  ];
  const ZOA_CASAL = ['Lá vai o casal Henrique e Samuel! Quando sai o casamento?', 'Henrique do Samuel e Samuel do Henrique: até o nome é aliança!',
    'Olha os pombinhos andando juntinhos na estrada!', 'Arranjem um quarto, vocês dois! Kkkk', 'O casal tá brigando no rádio de novo, que amor!'];
  const DE = {
    leosao: {
      largada: ['Combinado era 8h! Já são 8h01, tá todo mundo atrasado!', 'Oremos... e acelera!'],
      passou_voce: ['Sai da frente, Roia! Eu tenho horário!', 'Isso é velocidade de procissão, {alvo}!'],
      ultrapassou: ['Passou nada, {alvo}! Eu tô seguindo o cronograma!'],
      batida: ['{alvo}, isso aconteceu porque saiu atrasado!'],
      lanterna: ['{alvo}, em nome de Jesus, acelera essa moto!'],
      geral: ['Estamos 3 minutos atrasados em relação ao planejado!']
    },
    jefao: {
      largada: ['Calma, gente, viagem é pra curtir a paisagem...'],
      passou_voce: ['Passei devagarinho, {alvo}, igual ninja!'],
      ultrapassou: ['Pode ir, {alvo}. Roia, mas chego!'],
      batida: ['{alvo}, por isso que eu ando devagar!'],
      geral: ['Tô no modo econômico, galera.']
    },
    lucas: {
      largada: ['Bora, rapaziada! Quem chegar primeiro ganha um churros!'],
      passou_voce: ['Passei, {alvo}! Devagar, mas recheado!'],
      ultrapassou: ['Vai lá, {alvo}! Roia que é Roia não briga!'],
      batida: ['{alvo}, quer um churros pra adoçar o tombo?'],
      geral: ['Tô de boa, aproveitando a viagem e o doce de leite.']
    },
    fabinho: {
      largada: ['Moto revisada, pneu calibrado, bora acelerar!'],
      passou_voce: ['Sai da frente, {alvo}! 225 no talo!'],
      ultrapassou: ['Aproveita, {alvo}, que daqui a pouco eu paro no posto!'],
      batida: ['{alvo}, depois passa na oficina que eu dou um jeito!'],
      lanterna: ['Calma, {alvo}, já já eu volto pra te ajudar a empurrar!'],
      geral: ['Essa GS tá redondinha, fui eu que regulei!', 'Alguém sabe onde é o próximo posto? Pergunto por nada...']
    },
    pescoco: {
      largada: ['Triple Black aquecida! Segura que eu vou de McNamara!'],
      passou_voce: ['Passei, {alvo}! Nem precisei virar o pescoço!'],
      ultrapassou: ['Vai, {alvo}, aproveita que eu tô olhando a paisagem!'],
      batida: ['{alvo}, cuidado com o pescoço aí!'],
      geral: ['Alguém viu como a Triple Black brilha no sol?']
    },
    henrique: {
      largada: ['O tigre tá acordado! Bora, Black Rock!', 'Ai, gente, que dia lindo pra rodar! Bora!'],
      passou_voce: ['Passei, {alvo}! Três cilindros, irmão!'],
      ultrapassou: ['Vai, {alvo}, aproveita que o tigre tá de boa!'],
      batida: ['{alvo}, quer que eu chame o Samuel pra te buscar?'],
      geral: ['Essa moto faz curva que é uma beleza, viu?', 'Ai, gente, olha essa paisagem! Que coisa mais linda!', 'Alguém viu meu amor? Samuel, cadê você?', 'Gente, alguém tem um paninho? Minha viseira tá um horror!']
    },
    cezar: {
      largada: ['Bora. Sem conversa. Acelera.'],
      passou_voce: ['Licença, {alvo}.'],
      ultrapassou: ['Aproveita, {alvo}. Por pouco tempo.'],
      batida: ['{alvo}, presta atenção na estrada!'],
      geral: ['Baú prata é outra coisa, né?']
    },
    cleimar: {
      largada: ['Joinha, rapaziada! Bora pra Aparecida!'],
      passou_voce: ['Passei, {alvo}! Joinha!'],
      ultrapassou: ['Vai lá, {alvo}! Joinha pra você!'],
      batida: ['{alvo}, tá tudo bem? Faz um joinha aí!'],
      geral: ['Tá tudo joinha por aí, galera?']
    },
    mazinho: {
      largada: ['Sai da frente que o Mazinho chegou! Bora, Fabinho, mostra pra eles!', 'Freio é pra quem tem medo! Bora!'],
      passou_voce: ['Tchau, {alvo}! Vai de bicicleta da próxima vez!', 'Passei por dentro, {alvo}! Ou por fora, sei lá!', 'Roia! Roia! Roia! Kkkkk'],
      ultrapassou: ['Passou porque eu deixei, {alvo}! Só o Fabinho pode me passar!', 'Aproveita, {alvo}, que eu tô brincando!'],
      batida: ['Kkkkk {alvo} beijou o chão! Isso nem eu faço... tá, eu faço sempre!', 'Filmei, {alvo}! Já mandei no grupo!'],
      lanterna: ['{alvo}, quer que eu volte pra te rebocar?'],
      reserva: ['Alguém tem gasolina pra emprestar? Prometo que pago... um dia!'],
      geral: ['Fabinho Mecânico é o melhor piloto desse clube, o resto é Roia!', 'Fabinho, depois dá uma olhada na minha moto? Tá fazendo um barulho... é o motor gritando!',
        'Galera, viram o grupo? Mandei meme de todo mundo!']
    },
    samuca: {
      largada: ['Bora, rapaziada! Hoje eu desliguei o aplicativo!', 'Corrida liberada! Quem vai na garupa?'],
      passou_voce: ['Com licença, {alvo}! Entrega urgente!', 'Passei, {alvo}! Isso aqui eu faço todo dia no centro!'],
      ultrapassou: ['Vai, {alvo}, eu tô no modo passeio, sem passageiro!'],
      batida: ['{alvo}, quer uma corrida até o hospital? Faço preço de amigo!'],
      reserva: ['Alguém aí paga uma corrida adiantada? Preciso abastecer!'],
      geral: ['Gente, mototáxi não tira férias, isso aqui é treino!', 'Meu capacete é rosa, mas a moto é de macho, viu?', 'Se alguém quebrar, eu faço o resgate. Cobro barato!']
    },
    alan: {
      largada: ['Bora, rapaziada. Com calma, que a viagem é longa.', 'Tanque cheio até Aparecida. Quem mais pode dizer isso?'],
      passou_voce: ['Com licença, {alvo}. Arranque de F 750!'],
      ultrapassou: ['Vai, {alvo}. Te encontro no posto... ah não, eu nem preciso parar!'],
      batida: ['{alvo}, tá inteiro? Levanta que a gente espera.'],
      geral: ['Quem gasta menos gasolina? Eu. De nada.', 'Moto pequena, coração grande.']
    },
    ramon: {
      largada: ['Bora, galera! Primeira viagem grande com vocês!', 'Tô nervoso, mas bora! Me esperem, hein!'],
      passou_voce: ['Desculpa, {alvo}! Com todo respeito aos veteranos!', 'Passei, {alvo}! O novato tá aprendendo!'],
      ultrapassou: ['Pode passar, {alvo}, tô aprendendo com os mestres!'],
      batida: ['{alvo}, depois passa lá que eu lavo a moto de graça!'],
      reserva: ['Gente, alguém sabe quanto essa moto faz por litro? Esqueci de calcular...'],
      geral: ['Quem quiser lavar a moto depois da viagem, faço preço de membro!', 'Gente, é normal a moto fazer esse barulho? Primeira viagem longa!', 'Já tô aprendendo: Roia vai atrás, McNamara vai na frente!']
    },
    adriano: {
      largada: ['RANDANDANDAN! Bora, Black Rock!', 'Escuta esse ronco, rapaziada! Bora!'],
      passou_voce: ['Randandan, {alvo}! Tchau!', 'Ouviu esse barulho, {alvo}? Era eu passando!'],
      ultrapassou: ['Aproveita, {alvo}, que na saída da próxima curva eu te pego!'],
      batida: ['{alvo}, caiu de susto com meu escape? Kkkk'],
      geral: ['Quer ouvir o ronco? Escuta: RANDANDANDAN!', 'Escape original? Isso é coisa de Roia!']
    },
    samuel: {
      largada: ['Modo Dynamic Pro ativado. Bora.', 'Pneus na pressão certa, software atualizado. Podemos ir.'],
      passou_voce: ['Com licença, {alvo}. O quickshifter faz toda a diferença.', 'Passei, {alvo}. Controle de tração, meu amigo.'],
      ultrapassou: ['Pode ir, {alvo}. Tô monitorando a temperatura do motor.'],
      batida: ['{alvo}, liga o ABS de curva, pelo amor de Deus.'],
      reserva: ['O computador de bordo calculou errado. Isso não acontece com a 1300.'],
      geral: ['A suspensão semiativa da 1300 lê o asfalto mil vezes por segundo, sabia?', 'Esse motor boxer novo tem comando variável. Muito mais torque embaixo.',
        'O radar adaptativo da 1300 mantém distância sozinho. Tecnologia, rapaziada.', 'Alguém aí já atualizou o software da moto? Saiu versão nova.', 'O farol adaptativo acompanha a curva. Na serra é outra coisa.']
    },
    jellison: {
      largada: ['Amor, tô saindo! ... ops, canal errado.', 'Consegui a liberação! Bora!'],
      passou_voce: ['Passei, {alvo}! Preciso voltar cedo!'],
      ultrapassou: ['Vai, {alvo}, eu não posso arriscar, a patroa tá de olho!'],
      batida: ['{alvo}, se a minha esposa vê isso, nunca mais saio de casa!']
    }
  };

  return { PERSONAGENS, VIAGENS: [VIAGEM1, CAFEZINHO, RELOGIO], CONQUISTAS, FALAS, SOBRE, DE, PUXA, ZOA, ZOA_PESO, CASAL, ZOA_CASAL };
})();
