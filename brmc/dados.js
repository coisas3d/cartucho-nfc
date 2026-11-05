/* Black Rock MC - The Game | dados: pilotos, viagem e falas do intercomunicador */
'use strict';
window.DADOS = (function () {

  // vel: km/h | acel, economia, curva: 0-1 | cc: cilindrada | tanque: litros
  // perfil: ROIA (anda devagar) ou McNAMARA (acelera muito) | ritmo: o quanto a IA acelera
  // foto: recorte realista | tampa: posição do bocal do tanque na foto (fração)
  const PERSONAGENS = [
    { id: 'jellison', nome: 'JELLISON', moto: 'BRMC VRS 650 TOURER', cc: 650, tanque: 21, motor: 'twin', perfil: 'ROIA', ritmo: 0.97,
      sprite: 'piloto', foto: 'foto_versys', tampa: [0.40, 0.31], retrato: 'retrato_jellison', voz: 190,
      vel: 190, acel: 0.70, economia: 0.80, curva: 0.80, capacete: '#2a2c32' },
    { id: 'leosao', nome: 'LEOSÃO', moto: 'BRMC GS 850 RALLYE', cc: 853, tanque: 15, motor: 'twin', perfil: 'McNAMARA', ritmo: 1.0,
      sprite: 'piloto_leosao', foto: 'foto_gs850', tampa: [0.42, 0.25], retrato: 'retrato_leosao', voz: 150,
      vel: 200, acel: 0.82, economia: 0.70, curva: 0.85, capacete: '#b0b4ba' },
    { id: 'jefao', nome: 'JEFÃO', moto: 'BRMC GS 1300', cc: 1300, tanque: 19, motor: 'boxer', perfil: 'ROIA', ritmo: 0.95,
      sprite: 'piloto_gs1300', foto: 'foto_gs1300', tampa: [0.37, 0.33], retrato: 'retrato_jefao', voz: 120,
      vel: 200, acel: 0.90, economia: 0.61, curva: 0.80, capacete: '#52565e' }
  ];

  // ------------------------------------------------------------------ VIAGEM 1
  // Cada trecho: { n: segmentos, c: curva (- esq / + dir), m: subida/descida, z: zona, t: 'S' via simples | 'D' pista dupla }
  // extras: placa (3 linhas), fala (evento do rádio), pedagio, posto
  const VIAGEM1 = {
    id: 'v1b', nome: 'VIAGEM 1', titulo: 'ITAÚNA → APARECIDA', km: 450, semente: 2026,
    sub: 'FERNÃO DIAS • SUL DE MINAS • SERRA • DUTRA', modo: 'viagem',
    info: '2 POSTOS • 2 PEDÁGIOS • 4 RADARES • VIA SIMPLES E DUPLA',
    largada: ['ITAÚNA', 'MINAS GERAIS', '#146e3c'], chegada: ['APARECIDA', 'SANTUÁRIO NACIONAL', '#b4141e'],
    fim: 'CHEGAMOS EM APARECIDA!', basilica: true, ceu: [0, 1],
    trechos: [
      // Itaúna -> Itatiaiuçu (via simples)
      { n: 120, c: 0, m: 0, z: 'cidade', t: 'S' },
      { n: 180, c: 2, m: 8, z: 'campo', t: 'S', placa: ['ITATIAIUÇU', '22 KM', ''] },
      { n: 160, c: -3, m: -8, z: 'campo', t: 'S' },
      { n: 200, c: 0, m: 10, z: 'eucalipto', t: 'S', radar: 80, oculto: true },
      // Fernão Dias (pista dupla)
      { n: 200, c: 2, m: -10, z: 'campo', t: 'D', placa: ['BR-381', 'FERNÃO DIAS', 'SÃO PAULO'], fala: 'fernao' },
      { n: 240, c: -2, m: 14, z: 'campo', t: 'D', placa: ['ITAGUARA', '', ''] },
      { n: 160, c: 0, m: 0, z: 'pedagio', t: 'D', pedagio: true },
      { n: 220, c: 2, m: -14, z: 'eucalipto', t: 'D' },
      { n: 240, c: 0, m: 0, z: 'campo', t: 'D', placa: ['CARMÓPOLIS', 'DE MINAS', ''], radar: 110 },
      { n: 200, c: -3, m: 18, z: 'campo', t: 'D' },
      { n: 280, c: 0, m: 0, z: 'eucalipto', t: 'D', posto: true },
      { n: 240, c: 3, m: -18, z: 'campo', t: 'D' },
      { n: 160, c: 0, m: 0, z: 'pedagio', t: 'D', pedagio: true },
      { n: 200, c: -2, m: 8, z: 'campo', t: 'D' },
      { n: 200, c: 0, m: 0, z: 'cidade', t: 'D', placa: ['TRÊS CORAÇÕES', '', ''] },
      // Sul de Minas (via simples)
      { n: 180, c: 3, m: 10, z: 'campo', t: 'S', placa: ['CAMPANHA', '', ''], fala: 'simples' },
      { n: 160, c: -4, m: -10, z: 'campo', t: 'S' },
      { n: 180, c: 4, m: 14, z: 'eucalipto', t: 'S' },
      { n: 160, c: 0, m: 0, z: 'cidade', t: 'S', placa: ['SÃO LOURENÇO', '', ''], radar: 60 },
      { n: 200, c: 3, m: 10, z: 'campo', t: 'S', placa: ['POUSO ALTO', '', ''] },
      { n: 180, c: -4, m: -10, z: 'campo', t: 'S' },
      { n: 200, c: 0, m: 0, z: 'cidade', t: 'S', placa: ['PASSA QUATRO', '', ''], posto: true },
      // Serra da Mantiqueira (via simples, curvas fechadas)
      { n: 140, c: -5, m: 24, z: 'serra', t: 'S', placa: ['SERRA DA', 'MANTIQUEIRA', 'CURVAS'], fala: 'serra' },
      { n: 120, c: 6, m: 20, z: 'serra', t: 'S' },
      { n: 140, c: -6, m: 18, z: 'serra', t: 'S' },
      { n: 120, c: 5, m: -24, z: 'serra', t: 'S', placa: ['DIVISA', 'SÃO PAULO', ''], fala: 'divisa' },
      { n: 140, c: -6, m: -22, z: 'serra', t: 'S' },
      { n: 120, c: 4, m: -16, z: 'serra', t: 'S' },
      // Via Dutra (pista dupla)
      { n: 160, c: 0, m: 0, z: 'cidade', t: 'D', placa: ['CRUZEIRO', 'BR-116 DUTRA', ''], fala: 'dutra' },
      { n: 220, c: 2, m: 0, z: 'campo', t: 'D', placa: ['CACHOEIRA', 'PAULISTA', ''] },
      { n: 200, c: -2, m: 0, z: 'campo', t: 'D', placa: ['LORENA', '', ''], radar: 110 },
      { n: 200, c: 0, m: 0, z: 'cidade', t: 'D', placa: ['GUARATINGUETÁ', '', ''] },
      { n: 200, c: 0, m: 0, z: 'cidade', t: 'D', placa: ['APARECIDA', 'SANTUÁRIO', 'NACIONAL'], fala: 'aparecida' }
    ],
    // mapa da tela de rota: [nome, lat, lon, lado do rótulo]
    mapa: [
      ['ITAÚNA', -20.07, -44.57, 'd'], ['ITATIAIUÇU', -20.20, -44.42, 'd'], ['ITAGUARA', -20.39, -44.49, 'd'], ['CARMÓPOLIS', -20.54, -44.63, 'e'],
      ['TRÊS CORAÇÕES', -21.69, -45.25, 'e'], ['CAMPANHA', -21.84, -45.40, 'e'], ['SÃO LOURENÇO', -22.12, -45.05, 'e'], ['POUSO ALTO', -22.20, -44.97, 'd'],
      ['PASSA QUATRO', -22.39, -44.97, 'd'], ['CRUZEIRO', -22.58, -44.96, 'd'], ['CACHOEIRA PTA.', -22.66, -45.01, 'd'], ['LORENA', -22.73, -45.12, 'd'],
      ['GUARATINGUETÁ', -22.82, -45.19, 'et'], ['APARECIDA', -22.85, -45.23, 'eb']
    ]
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
    { id: 'trinca', nome: 'TRINCA DE OURO', desc: 'VENÇA A VIAGEM COM OS 3 PILOTOS' }
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
    chuva: ['Começou a chover na serra! Devagar nas curvas!', 'Chuva! Quem esqueceu a capa levanta a mão!', 'Asfalto molhado, freia com carinho, rapaziada!'],
    neblina: ['Neblina na Mantiqueira! Liga o farol e reza!', 'Não tô vendo nem o para-lama, que neblina!'],
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
      chuva: ['Leosão, chuva não tava no cronograma, né?']
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
      chuva: ['Jefão na chuva: agora ele tem desculpa pra andar devagar!']
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
      chuva: ['Jellison, se molhar a roupa a patroa vai perguntar onde você tava!']
    }
  };
  // falas DITAS por cada membro
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
    jellison: {
      largada: ['Amor, tô saindo! ... ops, canal errado.', 'Consegui a liberação! Bora!'],
      passou_voce: ['Passei, {alvo}! Preciso voltar cedo!'],
      ultrapassou: ['Vai, {alvo}, eu não posso arriscar, a patroa tá de olho!'],
      batida: ['{alvo}, se a minha esposa vê isso, nunca mais saio de casa!']
    }
  };

  return { PERSONAGENS, VIAGENS: [VIAGEM1, CAFEZINHO], CONQUISTAS, FALAS, SOBRE, DE };
})();
