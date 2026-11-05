/* Black Rock MC - The Game | aviso inicial, COMO JOGAR, NOVIDADES (versões) e SOBRE (créditos Coisas 3D) */
'use strict';
window.INFO = (function () {
  const INSTAGRAM = 'https://www.instagram.com/coisas3doficial/';
  const WHATSAPP = 'https://tr.ee/Ar5sQCXBQp';

  // ===== HISTÓRICO DE VERSÕES (a primeira da lista é a versão atual do jogo) =====
  const VERSOES = [
    ['5.4', ['Emblema da Coisas 3D no aviso de abertura, na tela SOBRE e no rodapé da tela inicial.']],
    ['5.3', ['Novo botão COMO JOGAR com o manual completo do jogo.', 'Novo menu NOVIDADES com o histórico de versões.', 'Novo menu SOBRE com os créditos da Coisas 3D, Instagram e WhatsApp.', 'Aviso de abertura: projeto sem fins lucrativos, uma homenagem ao Black Rock MC.']],
    ['5.2', ['Versão do jogo visível nas telas de abertura e inicial.']],
    ['5.1', ['Ranking global ligado: cada corrida terminada vai para o ranking de todos os celulares.']],
    ['5.0', ['Ranking global com o melhor tempo de cada piloto, gravado no arquivo ranking.json do projeto.', 'Tela de Recordes abre no ranking GLOBAL, com botão para ver o TOP 10 do celular.', 'Removidas as dicas "não estica / vai no talo" da seleção.']],
    ['4.9', ['Caminhões e carretas não saem da frente quando você buzina: o motorista xinga e responde com a buzina a ar.', 'Membros do moto clube abrem passagem quando você buzina atrás deles.', 'Novas falas no rádio sobre buzinadas.']],
    ['4.8', ['Buzina nova e realista, de dois tons, que toca enquanto o botão estiver apertado.']],
    ['4.7', ['Nome dos pilotos aparece em cima das motos durante a corrida.', 'Caixa do rádio maior e mensagens mais tempo na tela.', 'Tela de seleção premium, sem barras zeradas.', 'Novo balanceamento: Roias andam a 92% da máxima da moto e ganham em curva e economia; McNamaras vão a 100%.', 'Radares mais visíveis, com 3 placas de velocidade antes de cada um.', 'Praça de pedágio premium, com cabines e lombadas.', 'Modo de gráficos LEVE automático para celulares mais simples.']],
    ['4.0 – 4.6', ['Pedágio com sorteio: um membro paga para a turma toda, e todos esperam o grupo chegar.', 'Galão de socorro quando alguém fica sem gasolina.', '2 jogadores pela internet, cada um vendo a corrida no próprio celular.', 'Chegada de novos membros até completar os 15 pilotos do clube, com falas, zoeiras e "casais" no rádio.']],
    ['1.0 – 3.x', ['Primeiras versões: corrida em pixel art de Itaúna até Aparecida, postos de gasolina, chuva e neblina na serra, radares, modos Cafezinho e Contra o Relógio, conquistas e capacete dourado.']]
  ];

  const sec = (t, html) => '<section><h3>' + t + '</h3>' + html + '</section>';
  const lista = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';

  const COMO_JOGAR =
    sec('🎯 Objetivo', '<p>Pilotar com a turma do <b>Black Rock MC</b> de <b>Itaúna até Aparecida</b> e chegar na frente. Na estrada tem trânsito, postos, pedágios, radares, chuva e neblina na serra. O tempo final é o tempo da corrida <b>mais as multas</b>.</p>') +
    sec('🎮 Controles', lista([
      '<b>Celular:</b> setas ◀ ▶ para desviar, <b>ACELERA</b>, <b>FREIO</b> e <b>BUZINA</b>. O botão <b>II</b> pausa.',
      '<b>Teclado (P1):</b> ← → desviar, ↑ / Z / Espaço acelerar, ↓ / X frear, H ou B buzinar, P ou Esc pausar.',
      '<b>Teclado (P2 no mesmo computador):</b> A / D desviar, W acelerar, S frear, E buzinar.'
    ])) +
    sec('🏁 Modos de jogo', lista([
      '<b>Viagem completa:</b> Itaúna → Aparecida, 450 km contra os 15 membros do clube.',
      '<b>Tomar um cafezinho:</b> passeio curto pela serra, ótimo para uma partida rápida.',
      '<b>Contra o relógio:</b> sozinho contra o seu "fantasma" (a sua melhor volta).',
      '<b>2 jogadores:</b> você e um amigo na mesma corrida (veja abaixo).'
    ])) +
    sec('🏍️ Pilotos: Roias e McNamaras', '<p>Cada membro tem a sua moto, com velocidade, aceleração (0-100), economia e curvas diferentes.</p>' + lista([
      '<b>ROIA:</b> não estica a moto (anda a 92% da máxima), gasta menos gasolina e faz curva melhor.',
      '<b>McNAMARA:</b> vai no talo (100% da máxima), mas bebe mais e precisa parar mais vezes.'
    ])) +
    sec('⛽ Combustível e postos', lista([
      'Fique de olho no marcador de gasolina (E–F) no canto da tela.',
      'Para abastecer, entre na <b>faixa do posto</b> (lado direito) devagar, abaixo de 22 km/h. A bomba enche sozinha.',
      'Ficou seco? Depois de alguns segundos chega o <b>galão de socorro</b>… e a turma vai zoar no rádio!'
    ])) +
    sec('🚧 Pedágios', lista([
      'As placas avisam: reduza para <b>40 km/h</b> e passe pelas lombadas.',
      'Antes de cada praça é feito um <b>sorteio</b>: um membro paga o pedágio da turma toda.',
      'A cancela só abre quando <b>todo o grupo chegar</b> e o pagador pagar. Pare antes dela!',
      'Bater na cancela fechada acima de 18 km/h = <b>tombo</b>.',
      'No modo Contra o relógio cada um paga o seu.'
    ])) +
    sec('📸 Radares', lista([
      'Antes de cada radar aparecem <b>3 placas</b> com a velocidade máxima, e o ícone de radar mostra a distância no painel.',
      'Passou acima do limite: <b>flash</b> e <b>+5 segundos</b> de multa no seu tempo.',
      'Os McNamaras às vezes ignoram a placa… e pagam por isso.'
    ])) +
    sec('📯 Buzina', lista([
      'Toque rápido = "bi". Segure para buzinar mais tempo.',
      '<b>Carros, motos e membros do clube</b> na sua frente abrem passagem.',
      '<b>Caminhões e carretas não saem da frente:</b> o motorista xinga e responde com a buzina a ar. Ultrapasse com cuidado!'
    ])) +
    sec('💨 Dicas de pilotagem', lista([
      '<b>Vácuo:</b> andar colado atrás de outra moto dá mais aceleração.',
      'Freie <b>antes</b> das curvas fechadas. Sair da pista ou bater no trânsito derruba a moto.',
      'Na <b>chuva</b> o asfalto fica liso. Na <b>neblina</b>, devagar e atenção ao trânsito.',
      'Ouça o <b>rádio</b>: a turma avisa sobre radar, pedágio, chuva e quem está ficando para trás.'
    ])) +
    sec('📱 Como conectar o Jogador 2', lista([
      'No menu, toque em <b>2 JOGADORES</b>. Aparece um <b>QR code</b> e um <b>código de 6 letras</b>.',
      'O amigo aponta a <b>câmera do celular</b> para o QR code e abre o link.',
      '<b>Mantenha a tela do convite aberta</b> até aparecer "JOGADOR 2 CONECTADO". Os dois escolhem os pilotos e a corrida começa.',
      'Em <b>OPÇÕES → 2 JOGADORES</b> você escolhe: <b>cada um no seu celular</b> (cada um vê a própria corrida) ou <b>tela dividida</b> (o celular do amigo vira controle).',
      'Funciona em redes diferentes (Wi-Fi ou 4G/5G). Se demorar, feche o convite e gere outro. Internet fraca pode deixar a conexão instável.'
    ])) +
    sec('🏆 Ranking global', lista([
      'Toda corrida <b>solo</b> terminada (Viagem, Cafezinho ou Contra o relógio) vai para o <b>ranking global</b>.',
      'O jogo pede o seu nome uma vez e guarda no celular.',
      'Cada pessoa aparece <b>uma vez</b>, com o <b>melhor tempo</b>. Um tempo pior não apaga o seu recorde.',
      'Veja em <b>RECORDES → GLOBAL</b>. O botão "NESTE CELULAR" mostra o TOP 10 só do seu aparelho.',
      'Precisa de internet para enviar. As multas entram no tempo!'
    ])) +
    sec('🎖️ Conquistas e capacete dourado', '<p>São 14 desafios, como <b>Romeiro</b> (chegar em Aparecida), <b>Cidadão de bem</b> (viagem sem multa), <b>Pato na chuva</b> e <b>Patrocinador oficial</b> (pagar os 2 pedágios). Algumas conquistas dão o <b>capacete dourado</b> para o piloto usado. Veja em <b>RECORDES → CONQUISTAS</b>.</p>') +
    sec('⚙️ Opções', lista([
      'Música, efeitos e vibração.',
      '<b>Gráficos:</b> Automático, Alta ou Leve. Celular travando? Use <b>Leve</b>.',
      'iPhone em tela cheia: Compartilhar → <b>Adicionar à Tela de Início</b>.'
    ]));

  const NOVIDADES = VERSOES.map(([v, itens], i) => '<section class="versao' + (i === 0 ? ' atual' : '') + '"><h3>VERSÃO ' + v + (i === 0 ? ' <em>ATUAL</em>' : '') + '</h3>' + lista(itens) + '</section>').join('');

  const SOBRE =
    '<div class="sobre-topo"><img src="hd/emblema_128.png" alt=""><div><b>BLACK ROCK MC</b><span>THE GAME • VERSÃO ' + VERSOES[0][0] + '</span></div></div>' +
    sec('Desenvolvido por', '<div class="empresa-logo"><img src="hd/coisas3d_256.png" alt="Coisas 3D"><p class="empresa">COISAS 3D</p></div><p>Jogo criado pela <b>Coisas 3D</b> como um presente para os membros do <b>Black Rock Moto Clube – Itaúna – MG</b>.</p>') +
    '<div class="links"><a class="link insta" href="' + INSTAGRAM + '" target="_blank" rel="noopener">📷 INSTAGRAM<small>@coisas3doficial</small></a>' +
    '<a class="link zap" href="' + WHATSAPP + '" target="_blank" rel="noopener">💬 WHATSAPP<small>Fale com a Coisas 3D</small></a></div>' +
    sec('Aviso', '<p>Projeto <b>sem fins lucrativos</b>, uma homenagem divertida aos membros do clube. A arte em pixel e as músicas foram feitas especialmente para o jogo.</p>');

  const PAINEIS = { jogar: ['COMO JOGAR', COMO_JOGAR], novidades: ['NOVIDADES', NOVIDADES], sobre: ['SOBRE', SOBRE] };
  const el = document.getElementById('painel'), corpo = document.getElementById('painel-corpo'), titulo = document.getElementById('painel-titulo');
  function abrir(tipo) {
    const p = PAINEIS[tipo]; if (!p) return;
    titulo.textContent = p[0]; corpo.innerHTML = p[1]; corpo.scrollTop = 0; el.classList.add('on');
  }
  function fechar() { el.classList.remove('on'); }
  document.getElementById('painel-fechar').addEventListener('click', fechar);
  el.addEventListener('click', e => { if (e.target === el) fechar(); });

  // ===== aviso antes de abrir o jogo =====
  const aviso = document.getElementById('aviso');
  document.getElementById('aviso-ok').addEventListener('click', () => { aviso.classList.remove('on'); try { window.SOM && SOM.iniciar(); } catch (e) {} });
  if (navigator.webdriver || new URLSearchParams(location.search).get('semaviso') === '1') aviso.classList.remove('on');

  return {
    versao: VERSOES[0][0], abrir, fechar,
    aberto: () => el.classList.contains('on') || aviso.classList.contains('on')
  };
})();
