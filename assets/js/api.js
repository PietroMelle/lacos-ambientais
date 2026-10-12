// Conexão com o Supabase 
(function () {
  const cfg = window.LACOS_CONFIG || {};
  const DEMO = !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY;

  const MENSAGENS = {
    SEM_CONSENTIMENTO: "Para participar, marque a caixinha de consentimento.",
    NOME_INVALIDO: "Digite seu nome e sobrenome.",
    CELULAR_INVALIDO: "Confira o celular: DDD + número (10 ou 11 dígitos).",
    VINCULO_INVALIDO: "Escolha o que você faz na faculdade.",
    TIPO_INVALIDO: "Lixeira desconhecida. Leia o QR Code novamente.",
    QUANTIDADE_INVALIDA: "A quantidade vai de 1 a 10 itens por registro.",
    LIMITE_DIARIO: "Você já fez 5 registros hoje. Volte amanhã — dias seguidos também contam pontos! 😉",
    AGUARDE: "Calma, campeão! Espere 1 minutinho entre um registro e outro. ⏳",
    NOME_JA_USADO: "Esse nome já resgatou a pipoca. Uma por pessoa! 🍿",
    REDE: "Não consegui falar com o servidor. Confira sua internet e tente de novo.",
  };

  function erro(codigo) {
    const e = new Error(MENSAGENS[codigo] || "Algo deu errado. Tente de novo.");
    e.codigo = codigo;
    return e;
  }

  async function rpc(fn, args) {
    if (DEMO) return Demo[fn](args);
    const headers = { "Content-Type": "application/json", apikey: cfg.SUPABASE_KEY };
    // Chaves antigas ("anon", em formato JWT) também vão no Authorization
    if (cfg.SUPABASE_KEY.startsWith("eyJ")) headers.Authorization = "Bearer " + cfg.SUPABASE_KEY;
    let resp;
    try {
      resp = await fetch(cfg.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, {
        method: "POST", headers, body: JSON.stringify(args),
      });
    } catch (_) { throw erro("REDE"); }
    const txt = await resp.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (_) {}
    if (!resp.ok) throw erro((data && data.message) || "DESCONHECIDO");
    return data;
  }

  // ---------- Modo demonstração: imita o banco usando o navegador ----------
  const Demo = (() => {
    const KEY = "lacos_demo_db";
    const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { p: [], d: [], pip: [] }; } catch (_) { return { p: [], d: [], pip: [] }; } };
    const salvar = (db) => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {} };
    const hoje = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const mes = () => hoje().slice(0, 7);

    function placar(db) {
      const m = mes();
      const base = db.p.map((p) => {
        const ds = db.d.filter((d) => d.pid === p.id && d.dia.startsWith(m));
        return { ...p, total_itens: ds.reduce((s, d) => s + d.q, 0), dias: new Set(ds.map((d) => d.dia)).size,
                 primeiro: Math.min(...ds.map((d) => d.ts)) };
      }).filter((x) => x.total_itens > 0);
      const porItens = [...base].sort((a, b) => b.total_itens - a.total_itens || b.dias - a.dias || a.primeiro - b.primeiro);
      const porDias = [...base].sort((a, b) => b.dias - a.dias || b.total_itens - a.total_itens || a.primeiro - b.primeiro);
      base.forEach((x) => { x.pos_itens = porItens.indexOf(x) + 1; x.pos_dias = porDias.indexOf(x) + 1; });
      return base;
    }

    return {
      registrar_descarte(a) {
        const cel = String(a.p_celular || "").replace(/\D/g, "");
        const nome = String(a.p_nome || "").trim().replace(/\s+/g, " ");
        if (a.p_consentimento !== true) throw erro("SEM_CONSENTIMENTO");
        if (nome.length < 3) throw erro("NOME_INVALIDO");
        if (cel.length !== 10 && cel.length !== 11) throw erro("CELULAR_INVALIDO");
        if (!(a.p_quantidade >= 1 && a.p_quantidade <= 10)) throw erro("QUANTIDADE_INVALIDA");
        const db = ler();
        let p = db.p.find((x) => x.cel === cel);
        if (!p) { p = { id: db.p.length + 1, cel }; db.p.push(p); }
        p.nome = nome; p.vinculo = a.p_vinculo;
        const meus = db.d.filter((d) => d.pid === p.id);
        if (meus.filter((d) => d.dia === hoje()).length >= 5) throw erro("LIMITE_DIARIO");
        if (meus.length && Date.now() - Math.max(...meus.map((d) => d.ts)) < 60000) throw erro("AGUARDE");
        db.d.push({ pid: p.id, tipo: a.p_tipo, q: a.p_quantidade, dia: hoje(), ts: Date.now() });
        salvar(db);
        const r = placar(db).find((x) => x.id === p.id);
        return { nome: Lacos.exibirNome(nome), total_itens: r.total_itens, dias: r.dias, pos_itens: r.pos_itens, pos_dias: r.pos_dias };
      },
      ranking_mes(a) {
        const campo = a.p_criterio === "dias" ? "pos_dias" : "pos_itens";
        return placar(ler()).sort((x, y) => x[campo] - y[campo]).slice(0, 10)
          .map((x) => ({ posicao: x[campo], nome: Lacos.exibirNome(x.nome), vinculo: x.vinculo, total_itens: x.total_itens, dias: x.dias }));
      },
      resgatar_pipoca(a) {
        const nome = String(a.p_nome || "").trim().replace(/\s+/g, " ");
        const norm = Lacos.normalizar(nome);
        if (norm.length < 5 || !norm.includes(" ")) throw erro("NOME_INVALIDO");
        const db = ler();
        if (db.pip.some((x) => x.norm === norm)) throw erro("NOME_JA_USADO");
        const codigo = "PIP-" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
        db.pip.push({ nome, norm, codigo }); salvar(db);
        return { codigo, nome: nome.split(" ")[0] };
      },
    };
  })();

  window.Api = {
    DEMO,
    registrarDescarte: (dados) => rpc("registrar_descarte", dados),
    ranking: (criterio) => rpc("ranking_mes", { p_criterio: criterio }),
    resgatarPipoca: (nome) => rpc("resgatar_pipoca", { p_nome: nome }),
    limparDemo: () => { try { localStorage.removeItem("lacos_demo_db"); } catch (_) {} },
  };
})();
