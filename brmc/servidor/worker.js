/* Black Rock MC - The Game | RANKING GLOBAL (Cloudflare Worker, grátis)
 *
 * O que faz: recebe o tempo de cada corrida terminada e grava no arquivo brmc/ranking.json
 * do repositório (um commit por recorde). O jogo lê o ranking por aqui (sempre atualizado)
 * e, se o Worker estiver fora do ar, lê o próprio brmc/ranking.json do site.
 *
 * Este arquivo NÃO tem senha nenhuma: o token do GitHub fica guardado na Cloudflare
 * (Settings > Variables and Secrets > GITHUB_TOKEN, tipo "Secret").
 *
 * Variáveis (opcionais, já têm padrão):
 *   REPO    = coisas3d/cartucho-nfc
 *   ARQUIVO = brmc/ranking.json
 *   BRANCH  = main
 */
const PILOTOS = ['jellison', 'leosao', 'jefao', 'lucas', 'fabinho', 'pescoco', 'henrique', 'cezar', 'cleimar', 'mazinho', 'samuca', 'alan', 'ramon', 'adriano', 'samuel'];
const MODOS = ['viagem', 'cafe', 'relogio'];
const MAX_POR_MODO = 100;
const ORIGENS = [/^https:\/\/coisas3d\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];

let cache = null, cacheT = 0;              // ranking em memória por alguns segundos
const ultimoEnvio = new Map();             // freio simples contra spam (por IP)

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGENS.some(r => r.test(o)) ? o : 'https://coisas3d.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
const json = (req, obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors(req)) });

const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
const b64enc = s => { const b = new TextEncoder().encode(s); let r = ''; for (let i = 0; i < b.length; i += 0x8000) r += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(r); };

function cfg(env) { return { repo: env.REPO || 'coisas3d/cartucho-nfc', arq: env.ARQUIVO || 'brmc/ranking.json', branch: env.BRANCH || 'main', token: env.GITHUB_TOKEN }; }
function gh(env, caminho, opt = {}) {
  const c = cfg(env);
  return fetch('https://api.github.com/repos/' + c.repo + caminho, Object.assign({}, opt, {
    headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'User-Agent': 'brmc-ranking', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }
  }));
}
const vazio = () => ({ atualizado: null, viagem: [], cafe: [], relogio: [] });

async function lerArquivo(env) {
  const c = cfg(env);
  const r = await gh(env, '/contents/' + c.arq + '?ref=' + encodeURIComponent(c.branch));
  if (r.status === 404) return { dados: vazio(), sha: null };
  if (!r.ok) throw new Error('GitHub GET ' + r.status);
  const j = await r.json();
  let dados; try { dados = JSON.parse(b64dec(j.content)); } catch (e) { dados = vazio(); }
  for (const m of MODOS) if (!Array.isArray(dados[m])) dados[m] = [];
  return { dados, sha: j.sha };
}
async function gravarArquivo(env, dados, sha, msg) {
  const c = cfg(env);
  const corpo = { message: msg, content: b64enc(JSON.stringify(dados, null, 1) + '\n'), branch: c.branch,
    committer: { name: 'BRMC Ranking', email: 'ranking@brmc.invalid' } };
  if (sha) corpo.sha = sha;
  return gh(env, '/contents/' + c.arq, { method: 'PUT', body: JSON.stringify(corpo) });
}

const limparNome = n => String(n || '').toUpperCase().normalize('NFC').replace(/[^A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ ._-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
const chave = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '');
const fmt = t => { const m = Math.floor(t / 60), s = (t % 60).toFixed(1); return m + ':' + (s < 10 ? '0' : '') + s; };

async function receber(req, env) {
  let e; try { e = await req.json(); } catch (x) { return json(req, { ok: false, erro: 'json' }, 400); }
  const modo = e.modo, nome = limparNome(e.nome), p = e.piloto, t = Math.round(Number(e.tempo) * 10) / 10, m = Math.max(0, Math.min(99, parseInt(e.multas, 10) || 0));
  if (!MODOS.includes(modo) || !PILOTOS.includes(p) || !nome || !chave(nome) || !(t >= 20 && t <= 4 * 3600)) return json(req, { ok: false, erro: 'dados' }, 400);
  const ip = req.headers.get('CF-Connecting-IP') || '?', agora = Date.now();
  if (agora - (ultimoEnvio.get(ip) || 0) < 15000) return json(req, { ok: false, erro: 'calma' }, 429);
  ultimoEnvio.set(ip, agora); if (ultimoEnvio.size > 5000) ultimoEnvio.clear();

  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const { dados, sha } = await lerArquivo(env);
    const lista = dados[modo], k = chave(nome), i = lista.findIndex(x => chave(x.n) === k);
    if (i >= 0 && lista[i].t <= t) { cache = dados; cacheT = Date.now(); return json(req, { ok: true, recorde: false, pos: posicao(lista, k), melhor: lista[i].t }); }
    const reg = { n: nome, p, t, m, d: new Date().toISOString().slice(0, 10) };
    if (i >= 0) lista[i] = reg; else lista.push(reg);
    lista.sort((a, b) => a.t - b.t); dados[modo] = lista.slice(0, MAX_POR_MODO); dados.atualizado = new Date().toISOString();
    const pos = posicao(dados[modo], k);
    if (!pos) return json(req, { ok: true, recorde: false, pos: null });
    const r = await gravarArquivo(env, dados, sha, 'ranking ' + modo + ': ' + nome + ' ' + fmt(t) + ' (' + pos + 'º)');
    if (r.ok) { cache = dados; cacheT = Date.now(); return json(req, { ok: true, recorde: true, pos }); }
    if (r.status !== 409 && r.status !== 422) return json(req, { ok: false, erro: 'github ' + r.status }, 502);
    await new Promise(z => setTimeout(z, 300 + Math.random() * 700));   // alguém gravou ao mesmo tempo: tenta de novo
  }
  return json(req, { ok: false, erro: 'conflito' }, 503);
}
const posicao = (lista, k) => { const i = lista.findIndex(x => chave(x.n) === k); return i >= 0 ? i + 1 : null; };

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (!env.GITHUB_TOKEN) return json(req, { ok: false, erro: 'GITHUB_TOKEN não configurado' }, 500);
    const u = new URL(req.url);
    try {
      if (req.method === 'POST' && u.pathname === '/enviar') return await receber(req, env);
      if (req.method === 'GET' && (u.pathname === '/ranking' || u.pathname === '/')) {
        if (!cache || Date.now() - cacheT > 15000) { cache = (await lerArquivo(env)).dados; cacheT = Date.now(); }
        return json(req, cache);
      }
      return json(req, { ok: false, erro: 'rota' }, 404);
    } catch (x) { return json(req, { ok: false, erro: String(x.message || x) }, 500); }
  }
};
