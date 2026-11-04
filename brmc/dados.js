/* Black Rock MC - The Game | dados: pilotos, viagem e falas do intercomunicador */
'use strict';
window.DADOS = (function () {

  // vel: km/h | acel, economia, curva: 0-1 | cc: cilindrada | tanque: litros
  // topo: aparência vista de cima (cena do abastecimento)
  const PERSONAGENS = [
    { id: 'jellison', nome: 'JELLISON', moto: 'BRMC VRS 650 TOURER', cc: 650, tanque: 21, motor: 'twin',
      sprite: 'piloto', lateral: 'lateral_versys', retrato: 'retrato_jellison', voz: 190,
      vel: 205, acel: 0.70, economia: 0.80, curva: 0.80, capacete: '#2a2c32',
      topo: { cor: '#4ec41e', cor2: '#16171b', baus: 'plastico', bauCor: '#18191d', bauTampa: '#4ec41e', aro: '#4ec41e' } },
    { id: 'leosao', nome: 'LEOSÃO', moto: 'BRMC GS 850 RALLYE', cc: 853, tanque: 15, motor: 'twin',
      sprite: 'piloto_leosao', lateral: 'lateral_gs', retrato: 'retrato_leosao', voz: 150,
      vel: 215, acel: 0.82, economia: 0.70, curva: 0.85, capacete: '#b0b4ba',
      topo: { cor: '#2264d6', cor2: '#e8e8ec', baus: 'grade', bauCor: '#c4cad2', aro: '#d6a62c' } },
    { id: 'jefao', nome: 'JEFÃO', moto: 'BRMC GS 1300', cc: 1300, tanque: 19, motor: 'boxer',
      sprite: 'piloto_gs1300', lateral: 'lateral_gs1300', retrato: 'retrato_jefao', voz: 120,
      vel: 225, acel: 0.90, economia: 0.60, curva: 0.80, capacete: '#52565e',
      topo: { cor: '#1b1c20', cor2: '#9aa0aa', baus: 'aluminio', bauCor: '#1d1e22', bauTampa: '#c4cad2', aro: '#3a3c42' } }
  ];

  // adversários provisórios (até chegarem as motos dos outros membros)
  const RIVAIS = [
    { nome: 'MEMBRO 4', cor: [40, 96, 226], vel: 210, acel: 0.75, economia: 0.65, curva: 0.75, cc: 900, tanque: 18 },
    { nome: 'MEMBRO 5', cor: [240, 200, 30], vel: 200, acel: 0.80, economia: 0.70, curva: 0.80, cc: 750, tanque: 17 },
    { nome: 'MEMBRO 6', cor: [244, 124, 20], vel: 218, acel: 0.72, economia: 0.55, curva: 0.65, cc: 1200, tanque: 20 },
    { nome: 'MEMBRO 7', cor: [236, 236, 236], vel: 198, acel: 0.66, economia: 0.85, curva: 0.85, cc: 700, tanque: 17 },
    { nome: 'MEMBRO 8', cor: [170, 60, 210], vel: 208, acel: 0.80, economia: 0.60, curva: 0.75, cc: 1000, tanque: 19 },
    { nome: 'MEMBRO 9', cor: [210, 40, 40], vel: 212, acel: 0.74, economia: 0.62, curva: 0.70, cc: 1100, tanque: 20 }
  ];

  // ------------------------------------------------------------------ VIAGEM 1
  // Trechos: [comprimento (segmentos), curva (- esq / + dir), morro, zona]
  // zonas: cidade | campo | eucalipto | serra | pedagio
  const VIAGEM1 = {
    id: 'v1', nome: 'VIAGEM 1', titulo: 'ITAÚNA → APARECIDA', sub: 'FERNÃO DIAS + VIA DUTRA', km: 560, semente: 2026,
    origem: 'ITAÚNA - MG', destino: 'APARECIDA - SP',
    trechos: [
      [140, 0, 0, 'cidade'], [160, 2, 6, 'cidade'], [180, -2, -6, 'campo'], [220, 0, 10, 'campo'], [200, 3, -10, 'eucalipto'],
      [160, 0, 0, 'pedagio'], [240, -2, 14, 'campo'], [200, 2, -14, 'campo'], [260, 0, 0, 'eucalipto'], [200, -3, 18, 'campo'],
      [200, 3, -18, 'campo'], [280, 0, 0, 'campo'], [180, 2, 8, 'eucalipto'], [200, -2, -8, 'campo'], [240, 0, 0, 'campo'],
      [160, 0, 0, 'pedagio'], [220, 3, 12, 'campo'], [200, 0, -12, 'cidade'], [160, -4, 20, 'serra'], [140, 5, 10, 'serra'],
      [140, -5, 16, 'serra'], [160, 4, -12, 'serra'], [140, -6, -20, 'serra'], [180, 3, -14, 'serra'], [240, 0, 0, 'campo'],
      [200, -2, 8, 'eucalipto'], [260, 0, -8, 'campo'], [160, 0, 0, 'cidade'], [220, 2, 0, 'cidade'], [260, 0, 6, 'campo'],
      [200, -3, -6, 'campo'], [160, 0, 0, 'pedagio'], [240, 2, 10, 'campo'], [220, -2, -10, 'eucalipto'], [260, 0, 0, 'campo'],
      [200, 2, 0, 'cidade'], [240, 0, 0, 'cidade']
    ],
    // marcos ao longo da viagem (fração do percurso)
    marcos: [
      { f: 0.03, placa: ['MG-050', 'BETIM', '62 KM'] },
      { f: 0.09, placa: ['BR-381', 'FERNÃO DIAS', 'SÃO PAULO'], fala: 'fernao' },
      { f: 0.17, pedagio: true },
      { f: 0.22, placa: ['OLIVEIRA', 'BR-381', ''] },
      { f: 0.30, placa: ['LAVRAS', 'PERDÕES', ''] },
      { f: 0.36, placa: ['TRÊS CORAÇÕES', '18 KM', ''] },
      { f: 0.45, pedagio: true },
      { f: 0.49, placa: ['POUSO ALEGRE', '', ''] },
      { f: 0.55, placa: ['SERRA DA', 'MANTIQUEIRA', 'CURVAS'], fala: 'serra' },
      { f: 0.66, placa: ['DIVISA', 'SÃO PAULO', 'ATIBAIA'], fala: 'divisa' },
      { f: 0.76, placa: ['BR-116', 'VIA DUTRA', 'RIO DE JANEIRO'], fala: 'dutra' },
      { f: 0.79, pedagio: true },
      { f: 0.84, placa: ['SÃO JOSÉ', 'DOS CAMPOS', ''] },
      { f: 0.91, placa: ['TAUBATÉ', 'PINDAMONHANGABA', ''] },
      { f: 0.96, placa: ['APARECIDA', 'SANTUÁRIO', 'NACIONAL'], fala: 'aparecida' }
    ],
    postos: [0.40, 0.72],
    // cidades para o mapa da tela de rota (lat, lon aproximados)
    mapa: [
      ['ITAÚNA', -20.07, -44.57], ['BETIM', -19.97, -44.20], ['OLIVEIRA', -20.70, -44.83], ['LAVRAS', -21.24, -45.00],
      ['TRÊS CORAÇÕES', -21.69, -45.25], ['POUSO ALEGRE', -22.23, -45.94], ['EXTREMA', -22.85, -46.32], ['ATIBAIA', -23.12, -46.55],
      ['GUARULHOS', -23.46, -46.53], ['S. J. CAMPOS', -23.18, -45.88], ['TAUBATÉ', -23.03, -45.55], ['APARECIDA', -22.85, -45.23]
    ]
  };

  // ------------------------------------------------------------------ INTERCOMUNICADOR
  // {eu} = quem fala, {alvo} = de quem se fala
  const FALAS = {
    largada: [
      'Bora, BRMC! Próxima parada: Aparecida!', 'Capacete afivelado? Então acelera, rapaziada!',
      'Quem chegar por último paga o pão de queijo!', 'Nossa Senhora, protege essa turma doida!'
    ],
    ultrapassou: [ // {eu} foi ultrapassado por {alvo}
      'Passou porque eu deixei, {alvo}!', 'Ô {alvo}, vai devagar que o radar tá ali!', 'Aproveita, {alvo}, que daqui a pouco eu te pego!',
      'Isso aí é moto ou foguete, {alvo}?', 'Tá com pressa de quê, {alvo}? A Santa não sai do lugar!'
    ],
    passou_voce: [ // {eu} ultrapassou {alvo}
      'Tchau, {alvo}! Te espero no posto!', 'Fica com a poeira, {alvo}!', 'Olha o retrovisor, {alvo}... ah, não dá mais pra me ver!',
      '{alvo}, quer que eu chame o guincho?', 'Segura esse vácuo, {alvo}!'
    ],
    batida: [
      'Levanta, {alvo}! Asfalto não é cama!', 'Kkkk {alvo} foi beijar o chão!', '{alvo}, tá tudo bem? A moto tá?',
      'Ô {alvo}, a estrada é reta e você acha a curva!', 'Calma, {alvo}, é viagem, não é rali!'
    ],
    reserva: [
      'Ih, acendeu a luz da reserva do {alvo}!', '{alvo} vai empurrar até Aparecida!', 'Economiza aí, {alvo}, desliga o rádio!'
    ],
    abastecendo: [
      'Enche o tanque e traz um café, {alvo}!', '{alvo}, aproveita e calibra os pneus!', 'Pit stop do {alvo}! Cronometra aí!'
    ],
    lider: [
      '{alvo} na frente! Avisa que isso não é MotoGP!', 'Alguém segura o {alvo}, pelo amor de Deus!', 'O {alvo} esqueceu que é passeio!'
    ],
    lanterna: [
      '{alvo}, tá vindo de bicicleta?', 'Cadê o {alvo}? Parou pra tirar foto de novo?', '{alvo}, a gente te espera em Aparecida, viu?'
    ],
    vacuo: ['Tá colado no meu vácuo, {alvo}? Paga o pedágio então!', 'Desgruda, {alvo}!'],
    fernao: ['Entramos na Fernão Dias! Pista dupla, bora!', 'Fernão Dias, a casa da gente!'],
    pedagio: ['Pedágio! Quem paga hoje é o {alvo}!', 'Passa na tag, {alvo}, que eu tô sem moeda!'],
    serra: ['Serra da Mantiqueira! Agora quero ver quem é piloto!', 'Curva, curva, curva... Cuidado aí, {alvo}!'],
    divisa: ['Bem-vindos a São Paulo! O pão de queijo acabou!', 'Divisa! Agora é Atibaia e Dutra!'],
    dutra: ['Via Dutra! Olho nas carretas, turma!', 'Dutra lotada de caminhão. Paciência!'],
    aparecida: ['Tô vendo a Basílica! Chegamos, Nossa Senhora!', 'Aparecida à vista! Que viagem, irmãos!'],
    chegada: ['Chegamos! Bênção dada, motor quente!', 'Valeu, BRMC! Agora é foto na frente da Basílica!']
  };
  // falas próprias de cada membro (aparecem às vezes no lugar das genéricas)
  const FALAS_PESSOAIS = {
    jellison: { alvo: ['Jellison, esses três baús são pra levar a feira inteira?', 'O Jellison trouxe até cadeira de praia no baú!'] },
    leosao: { alvo: ['Leosão, segura esse sombrero que o vento leva!', 'Leosão, cuidado que a GS é de rali, não de cantina!'] },
    jefao: { alvo: ['Jefão, essa GS 1300 é moto ou nave espacial?', 'Jefão gastou mais no painel da moto do que eu na casa!'] }
  };

  return { PERSONAGENS, RIVAIS, VIAGENS: [VIAGEM1], FALAS, FALAS_PESSOAIS };
})();
