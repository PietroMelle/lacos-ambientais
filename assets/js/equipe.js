// Área da equipe: login pelo Supabase Auth e funções que só a equipe consegue chamar.
// Nenhuma senha fica no código: quem confere a senha é o Supabase, e quem confere
// se a pessoa é da equipe é o banco (tabela "equipe").
window.Equipe = (function () {
  const cfg = window.LACOS_CONFIG || {};
  const BASE = (cfg.SUPABASE_URL || "").replace(/\/+$/, "");
  const KEY = cfg.SUPABASE_KEY || "";
  const CHAVE = "lacos_equipe_sessao";
  const configurado = !!(BASE && KEY);

  const MENSAGENS = {
    LOGIN: "E-mail ou senha incorretos.",
    NAO_CONFIRMADO: "Esse login ainda não foi confirmado no Supabase. Peça para quem cuida do banco marcar \"Auto Confirm User\".",
    SEM_ACESSO: "Esse login não está na lista da equipe. Peça para incluírem seu e-mail na tabela \"equipe\".",
    SESSAO: "Sua sessão acabou. Entre de novo.",
    JA_ENTREGUE: "Essa pipoca já foi entregue.",
    NAO_ENCONTRADA: "Não achei esse resgate. Atualize a lista.",
    REDE: "Não consegui falar com o servidor. Confira a internet e tente de novo.",
  };
  const erro = (codigo, extra) => Object.assign(new Error(MENSAGENS[codigo] || "Algo deu errado. Tente de novo."), { codigo }, extra || {});

  // A sessão fica só nesta aba (sessionStorage): fechou a aba, saiu.
  const ler = () => { try { return JSON.parse(sessionStorage.getItem(CHAVE)); } catch (_) { return null; } };
  const gravar = (s) => { try { s ? sessionStorage.setItem(CHAVE, JSON.stringify(s)) : sessionStorage.removeItem(CHAVE); } catch (_) {} };

  async function auth(caminho, corpo, token) {
    const headers = { "Content-Type": "application/json", apikey: KEY };
    if (token) headers.Authorization = "Bearer " + token;
    let r;
    try { r = await fetch(BASE + "/auth/v1/" + caminho, { method: "POST", headers, body: JSON.stringify(corpo || {}) }); }
    catch (_) { throw erro("REDE"); }
    const dados = await r.json().catch(() => ({}));
    return { ok: r.ok, dados };
  }

  function guardarSessao(d) {
    const s = { access: d.access_token, refresh: d.refresh_token, expira: Date.now() + (d.expires_in || 3600) * 1000, email: d.user && d.user.email };
    gravar(s);
    return s;
  }

  async function entrar(email, senha) {
    const { ok, dados } = await auth("token?grant_type=password", { email, password: senha });
    if (!ok) {
      const c = String(dados.error_code || dados.code || dados.error || "");
      throw erro(/not_confirmed/.test(c) ? "NAO_CONFIRMADO" : "LOGIN");
    }
    return guardarSessao(dados);
  }

  // Renova o acesso antes de expirar (o token do Supabase dura 1 hora)
  async function token() {
    let s = ler();
    if (!s) throw erro("SESSAO");
    if (Date.now() > s.expira - 60000) {
      const { ok, dados } = await auth("token?grant_type=refresh_token", { refresh_token: s.refresh });
      if (!ok) { gravar(null); throw erro("SESSAO"); }
      s = guardarSessao(dados);
    }
    return s.access;
  }

  async function rpc(fn, args) {
    const t = await token();
    let r;
    try {
      r = await fetch(BASE + "/rest/v1/rpc/" + fn, {
        method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + t }, body: JSON.stringify(args || {}),
      });
    } catch (_) { throw erro("REDE"); }
    const txt = await r.text();
    let d = null;
    try { d = txt ? JSON.parse(txt) : null; } catch (_) {}
    if (r.status === 401) { gravar(null); throw erro("SESSAO"); }
    if (!r.ok) {
      const codigo = (d && d.message) || "";
      let extra;
      if (codigo === "JA_ENTREGUE") { try { extra = JSON.parse(d.details); } catch (_) {} }
      if (codigo === "SEM_ACESSO") gravar(null);
      throw erro(codigo, extra);
    }
    return d;
  }

  async function sair() {
    const s = ler();
    gravar(null);
    if (s) { try { await auth("logout", {}, s.access); } catch (_) {} }
  }

  return {
    configurado,
    sessao: ler,
    entrar,
    sair,
    pipocas: () => rpc("equipe_pipocas"),
    entregar: (id) => rpc("equipe_entregar", { p_id: id }),
    desfazer: (id) => rpc("equipe_desfazer", { p_id: id }),
  };
})();
