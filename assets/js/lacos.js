// Utilidades + conteúdo das lixeiras (Laços Ambientais)
window.Lacos = (function () {
  // Cores no padrão CONAMA 275/2001
  // hex = cor da lixeira · linha = a mesma cor quando vira texto/ícone sobre o fundo claro
  // trama = o desenho do fio de cada lixeira (para reconhecer sem depender só da cor)
  const LIXOS = {
    papel: {
      nome: "Papel", cor: "Azul", emoji: "📰", hex: "#1f5aa8", linha: "#1f5aa8", claro: "#e4ecf7", trama: "liso",
      chamada: "Papel limpo e seco vira papel de novo.",
      pode: ["Folhas de caderno, xerox e impressões", "Jornais, revistas e folhetos", "Caixas de papelão (desmontadas)",
             "Envelopes e embalagens de papel", "Caixas de leite e suco (longa vida)"],
      naoPode: ["Papel higiênico, guardanapo e lenço usados", "Papel engordurado (caixa de pizza suja)",
                "Papel plastificado, adesivos e fotos", "Papel molhado"],
      dica: "Amasse menos, dobre mais! Papel dobrado ocupa menos espaço na lixeira e chega em melhor estado na reciclagem.",
      curiosidade: "Reciclar papel economiza árvores, água e energia — e uma folha pode ser reciclada várias vezes antes de as fibras ficarem curtas demais.",
    },
    plastico: {
      nome: "Plástico", cor: "Vermelha", emoji: "🥤", hex: "#cf3a2e", linha: "#b8322a", claro: "#f8e3e1", trama: "torcido",
      chamada: "Garrafa, copo e embalagem: aqui é o lugar.",
      pode: ["Garrafas PET (refrigerante, água, suco)", "Copos descartáveis", "Embalagens de produtos de limpeza e higiene",
             "Sacolas e sacos plásticos", "Potes e tampas plásticas"],
      naoPode: ["Embalagens com resto de comida", "Embalagens de salgadinho metalizadas (aquelas brilhantes por dentro)",
                "Esponjas e fraldas", "Cabos de panela e tomadas"],
      dica: "Dê uma enxaguada rápida antes de descartar. Embalagem suja pode contaminar o lote inteiro da reciclagem.",
      curiosidade: "Uma garrafa PET pode levar centenas de anos para se decompor na natureza — mas reciclada pode virar fio de tecido, vassoura ou outra garrafa.",
    },
    vidro: {
      nome: "Vidro", cor: "Verde", emoji: "🥛", hex: "#23804a", linha: "#1f7442", claro: "#e0efe5", trama: "duplo",
      chamada: "O vidro é o campeão: pode ser reciclado infinitas vezes.",
      pode: ["Garrafas de bebidas", "Potes de conserva, geleia e azeitona", "Frascos de perfume e de remédio (vazios)",
             "Copos de vidro"],
      naoPode: ["Espelhos", "Vidro de janela e box (vidro plano/temperado)", "Lâmpadas", "Cerâmica, porcelana e pirex",
                "Telas de celular e TV"],
      dica: "Vidro quebrado? Embrulhe em jornal antes de descartar para ninguém se machucar na coleta.",
      curiosidade: "O vidro é 100% reciclável e não perde qualidade: um pote pode virar outro pote para sempre.",
    },
    metal: {
      nome: "Metal", cor: "Amarela", emoji: "🥫", hex: "#f0b400", linha: "#8a6500", claro: "#fcf1d0", texto: "#15181b", trama: "contas",
      chamada: "Latinhas valem ouro (bom, quase).",
      pode: ["Latas de refrigerante e cerveja", "Latas de alimentos (milho, ervilha, sardinha)", "Tampas de garrafa e de pote",
             "Papel-alumínio limpo", "Clipes, grampos e pregos"],
      naoPode: ["Pilhas e baterias (vão para pontos de coleta especiais)", "Latas de tinta e de veneno",
                "Esponjas de aço", "Aerossóis com conteúdo"],
      dica: "Amassar a latinha economiza espaço — dá para caber muito mais lata na lixeira!",
      curiosidade: "O Brasil está entre os países que mais reciclam latas de alumínio no mundo, e uma lata reciclada pode voltar à prateleira em cerca de 60 dias.",
    },
    organico: {
      nome: "Orgânico", cor: "Marrom", emoji: "🍌", hex: "#7b4b27", linha: "#7b4b27", claro: "#efe5dc", trama: "nos",
      chamada: "Resto de comida também tem segunda chance.",
      pode: ["Cascas de frutas, verduras e legumes", "Restos de comida", "Borra e filtro de café", "Saquinhos de chá",
             "Cascas de ovo"],
      naoPode: ["Embalagens (mesmo sujas, elas vão para o reciclável certo)", "Guardanapos com plástico",
                "Bitucas de cigarro", "Fezes de animais"],
      dica: "Separar o orgânico é o que deixa o reciclável limpo. Uma casca de banana no papel estraga o papel!",
      curiosidade: "Quase metade do lixo das casas brasileiras é orgânico — e ele pode virar adubo pela compostagem.",
    },
  };

  const VINCULOS = ["Aluno Anhanguera", "Aprendiz Espro", "Aprendiz CIEE", "Professor(a)", "Funcionário(a)", "Visitante", "Outro"];

  function normalizar(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  }
  function exibirNome(t) {
    const p = String(t || "").trim().split(/\s+/);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return p.length > 1 ? cap(p[0]) + " " + p[p.length - 1].charAt(0).toUpperCase() + "." : cap(p[0]);
  }
  function mascaraCelular(v) {
    const d = String(v).replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const recuperar = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
  const esquecer = (k) => { try { localStorage.removeItem(k); } catch (_) {} };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mesAtual = () => new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

  // Ícones desenhados (traço único, grade 24x24)
  const ICONES = {
    papel: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    plastico: '<path d="M10 2h4v3l1.5 2.5V21a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V7.5L10 5z"/><path d="M8.5 11h7M8.5 16h7"/>',
    vidro: '<path d="M8 2h8v3H8z"/><path d="M7 5h10v2.5c1 1 1.5 2 1.5 3.5v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9c0-1.5.5-2.5 1.5-3.5z"/><path d="M9 14h6"/>',
    metal: '<path d="M7 5c0-1.1 2.2-2 5-2s5 .9 5 2-2.2 2-5 2-5-.9-5-2z"/><path d="M7 5v14c0 1.1 2.2 2 5 2s5-.9 5-2V5"/><path d="M7 11c0 1.1 2.2 2 5 2s5-.9 5-2"/>',
    organico: '<path d="M5 19C5 10 10 5 20 5c0 10-5 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>',
    trofeu: '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4"/><path d="M12 14v4M10 18h4M8 21h8"/>',
    calendario: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    ciclo: '<path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ideia: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    curioso: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    pipoca: '<path d="M6 10h12l-1.5 11h-9z"/><path d="M9.5 10l.7 11M14.5 10l-.7 11"/><path d="M6.5 10a2.5 2.5 0 0 1 1-4.6 3 3 0 0 1 5-1.2 3 3 0 0 1 4.5 2 2.5 2.5 0 0 1 .5 3.8"/>',
    impressora: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    celular: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menos: '<path d="M5 12h14"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    casa: '<path d="M4 10.5L12 4l8 6.5"/><path d="M6.5 9v10.5h4V14.5h3v5h4V9"/>',
    laco: '<path d="M12 11.5C9.6 7.8 4.6 6 3.3 8.3c-1.3 2.3 2.9 5.4 8.7 3.2z"/><path d="M12 11.5c2.4-3.7 7.4-5.5 8.7-3.2 1.3 2.3-2.9 5.4-8.7 3.2z"/><path d="M11 12.5L7.5 20M13 12.5l3.5 7.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  };
  function icone(nome, classe) {
    return '<svg class="ic' + (classe ? " " + classe : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      (ICONES[nome] || "") + "</svg>";
  }

  // Cabeçalho, rodapé e aviso de demonstração em todas as páginas
  function montarMolde() {
    const aqui = location.pathname.split("/").pop() || "index.html";
    const noInicio = aqui === "index.html" || aqui === "index";
    const topo = document.getElementById("topo");
    // fora do início, a marca vira o caminho de volta: botão com a casinha e o aviso "Ir para o início"
    if (topo) topo.innerHTML =
      (noInicio
        ? '<a class="marca" href="index.html" aria-label="Laços Ambientais — início">' + icone("laco") + '<span>Laços Ambientais</span></a>'
        : '<a class="marca para-inicio" href="index.html" aria-label="Laços Ambientais, ir para o início"><span class="marca-casa">' + icone("casa") + '</span>' +
          '<span class="marca-nome">Laços Ambientais<small>Ir para o início</small></span></a>') +
      '<a class="topo-link" href="ranking.html"' + (aqui === "ranking.html" ? ' aria-current="page"' : "") + '>' + icone("trofeu") + 'Ranking</a>';
    const rodape = document.getElementById("rodape");
    if (rodape) rodape.innerHTML =
      '<div class="rodape-no" aria-hidden="true"></div>' +
      '<p class="rodape-marca">Laços Ambientais</p>' +
      '<div class="rodape-linhas"><p>Projeto da turma de Jovem Aprendiz</p>' +
      '<p><a href="privacidade.html">Privacidade e dados (LGPD)</a></p></div>';
    document.querySelectorAll("[data-ic]").forEach((el) => el.insertAdjacentHTML("afterbegin", icone(el.dataset.ic)));
    if (window.Api && Api.DEMO) {
      const b = document.createElement("div");
      b.className = "aviso-demo";
      b.innerHTML = "Modo demonstração — os dados ficam só neste aparelho. Configure o Supabase em <code>config.js</code>.";
      document.body.prepend(b);
    }
  }
  document.addEventListener("DOMContentLoaded", montarMolde);

  return { LIXOS, VINCULOS, icone, normalizar, exibirNome, mascaraCelular, guardar, recuperar, esquecer, esc, mesAtual };
})();
