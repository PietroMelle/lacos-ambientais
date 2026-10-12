// Utilidades + conteúdo das lixeiras (Laços Ambientais)
window.Lacos = (function () {
  // Cores no padrão CONAMA 275/2001
  const LIXOS = {
    papel: {
      nome: "Papel", cor: "Azul", emoji: "📰", hex: "#1f6fd1", claro: "#e3eefc",
      chamada: "Papel limpo e seco vira papel de novo.",
      pode: ["Folhas de caderno, xerox e impressões", "Jornais, revistas e folhetos", "Caixas de papelão (desmontadas)",
             "Envelopes e embalagens de papel", "Caixas de leite e suco (longa vida)"],
      naoPode: ["Papel higiênico, guardanapo e lenço usados", "Papel engordurado (caixa de pizza suja)",
                "Papel plastificado, adesivos e fotos", "Papel molhado"],
      dica: "Amasse menos, dobre mais! Papel dobrado ocupa menos espaço na lixeira e chega em melhor estado na reciclagem.",
      curiosidade: "Reciclar papel economiza árvores, água e energia — e uma folha pode ser reciclada várias vezes antes de as fibras ficarem curtas demais.",
    },
    plastico: {
      nome: "Plástico", cor: "Vermelha", emoji: "🥤", hex: "#d6333f", claro: "#fde6e8",
      chamada: "Garrafa, copo e embalagem: aqui é o lugar.",
      pode: ["Garrafas PET (refrigerante, água, suco)", "Copos descartáveis", "Embalagens de produtos de limpeza e higiene",
             "Sacolas e sacos plásticos", "Potes e tampas plásticas"],
      naoPode: ["Embalagens com resto de comida", "Embalagens de salgadinho metalizadas (aquelas brilhantes por dentro)",
                "Esponjas e fraldas", "Cabos de panela e tomadas"],
      dica: "Dê uma enxaguada rápida antes de descartar. Embalagem suja pode contaminar o lote inteiro da reciclagem.",
      curiosidade: "Uma garrafa PET pode levar centenas de anos para se decompor na natureza — mas reciclada pode virar fio de tecido, vassoura ou outra garrafa.",
    },
    vidro: {
      nome: "Vidro", cor: "Verde", emoji: "🥛", hex: "#1f9d55", claro: "#e2f5ea",
      chamada: "O vidro é o campeão: pode ser reciclado infinitas vezes.",
      pode: ["Garrafas de bebidas", "Potes de conserva, geleia e azeitona", "Frascos de perfume e de remédio (vazios)",
             "Copos de vidro"],
      naoPode: ["Espelhos", "Vidro de janela e box (vidro plano/temperado)", "Lâmpadas", "Cerâmica, porcelana e pirex",
                "Telas de celular e TV"],
      dica: "Vidro quebrado? Embrulhe em jornal antes de descartar para ninguém se machucar na coleta.",
      curiosidade: "O vidro é 100% reciclável e não perde qualidade: um pote pode virar outro pote para sempre.",
    },
    metal: {
      nome: "Metal", cor: "Amarela", emoji: "🥫", hex: "#f2b705", claro: "#fdf3d2", texto: "#3b2c00",
      chamada: "Latinhas valem ouro (bom, quase).",
      pode: ["Latas de refrigerante e cerveja", "Latas de alimentos (milho, ervilha, sardinha)", "Tampas de garrafa e de pote",
             "Papel-alumínio limpo", "Clipes, grampos e pregos"],
      naoPode: ["Pilhas e baterias (vão para pontos de coleta especiais)", "Latas de tinta e de veneno",
                "Esponjas de aço", "Aerossóis com conteúdo"],
      dica: "Amassar a latinha economiza espaço — dá para caber muito mais lata na lixeira!",
      curiosidade: "O Brasil está entre os países que mais reciclam latas de alumínio no mundo, e uma lata reciclada pode voltar à prateleira em cerca de 60 dias.",
    },
    organico: {
      nome: "Orgânico", cor: "Marrom", emoji: "🍌", hex: "#8a5a2b", claro: "#f3e9df",
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

  // Cabeçalho, rodapé e aviso de demonstração em todas as páginas
  function montarMolde() {
    const topo = document.getElementById("topo");
    if (topo) topo.innerHTML =
      '<a class="marca" href="index.html" aria-label="Laços Ambientais — início">' +
      '<span class="marca-icone" aria-hidden="true">♻</span><span>Laços <b>Ambientais</b></span></a>' +
      '<a class="topo-link" href="ranking.html">🏆 Ranking</a>';
    const rodape = document.getElementById("rodape");
    if (rodape) rodape.innerHTML =
      '<p>Laços Ambientais · projeto da turma de Jovem Aprendiz</p>' +
      '<p><a href="privacidade.html">Privacidade e dados (LGPD)</a></p>';
    if (window.Api && Api.DEMO) {
      const b = document.createElement("div");
      b.className = "aviso-demo";
      b.innerHTML = "🧪 Modo demonstração — os dados ficam só neste aparelho. Configure o Supabase em <code>config.js</code>.";
      document.body.prepend(b);
    }
  }
  document.addEventListener("DOMContentLoaded", montarMolde);

  return { LIXOS, VINCULOS, normalizar, exibirNome, mascaraCelular, guardar, recuperar, esquecer, esc, mesAtual };
})();
