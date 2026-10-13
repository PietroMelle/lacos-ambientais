// O cordão: cinco fios nas cores das lixeiras, trançados em SVG, e o movimento do site
window.Cordao = (function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const mqCalmo = matchMedia("(prefers-reduced-motion: reduce)");
  const calmo = () => mqCalmo.matches;
  const TIPOS = Object.keys(Lacos.LIXOS); // papel, plastico, vidro, metal, organico
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const saida = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)); // ease-out exponencial
  const sombra = (c) => "color-mix(in srgb, " + c + " 58%, #0b0d0e)";
  const f1 = (n) => Math.round(n * 10) / 10;

  function el(tag, attrs, pai) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }
  const caminho = (pts) => "M" + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L");

  // Trama: cada lixeira tem o seu desenho de fio, para ser reconhecida mesmo sem enxergar a cor
  // tom: cor do desenho quando o fio é claro ou escuro demais para o brilho/contas padrão
  // mistura uma cor hex no branco da folha (k = quanto da cor entra)
  function clarear(hex, k) {
    const n = parseInt(hex.slice(1), 16), b = [250, 251, 248];
    return "rgb(" + [n >> 16, (n >> 8) & 255, n & 255].map((c, i) => Math.round(c * k + b[i] * (1 - k))).join(",") + ")";
  }
  function trama(tipo, w, fundo, tom) {
    const r = (n) => Math.round(n * 100) / 100;
    switch (Lacos.LIXOS[tipo].trama) {
      // o cetim é só um brilho: no fio claro, um tom leve da cor (o vão cheio é do vidro)
      case "liso": return { stroke: tom ? clarear(tom, 0.3) : "rgba(255,255,255,.5)", "stroke-width": r(w * 0.22) };
      case "torcido": return { stroke: tom || "rgba(10,12,14,.32)", "stroke-opacity": tom ? 0.55 : null, "stroke-width": r(w), "stroke-dasharray": r(w * 0.32) + " " + r(w * 0.5), "stroke-linecap": "butt", style: "--periodo:" + r(w * 0.82) };
      case "duplo": return { stroke: fundo, "stroke-width": r(w * 0.36) };
      case "contas": return { stroke: tom || "rgba(10,12,14,.45)", "stroke-opacity": tom ? 0.95 : null, "stroke-width": r(w * 0.46), "stroke-dasharray": "0 " + r(w * 1.15), "stroke-linecap": "round", style: "--periodo:" + r(w * 1.15) };
      case "nos": return { stroke: fundo, "stroke-width": r(w + 1.5), "stroke-dasharray": r(w * 0.42) + " " + r(w * 1.7), "stroke-linecap": "butt", style: "--periodo:" + r(w * 2.12) };
    }
    return {};
  }

  // ---------- Linha central: retas, a volta do laço e a curva que desce ----------
  function Linha(x, y) { this.p = [[x, y]]; }
  Linha.prototype.add = function (x, y) {
    const u = this.p[this.p.length - 1];
    if (Math.hypot(x - u[0], y - u[1]) > 0.6) this.p.push([x, y]);
  };
  Linha.prototype.fim = function () { return this.p[this.p.length - 1]; };
  Linha.prototype.reta = function (x1, y1) {
    const [x0, y0] = this.fim(), n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let k = 1; k <= n; k++) this.add(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n);
    return this;
  };
  // laço: uma volta (cicloide alongada) por baixo da linha, ou por cima com sobe = true, seguindo em frente
  Linha.prototype.volta = function (R, r, sobe) {
    const [x0, y0] = this.fim(), n = 220, lado = sobe ? -1 : 1;
    for (let k = 1; k <= n; k++) { const t = 2 * Math.PI * k / n; this.add(x0 + R * t + r * Math.sin(t), y0 + lado * r * (1 - Math.cos(t))); }
    return this;
  };
  // vira de "indo para a direita" para "descendo"
  Linha.prototype.desce = function (rho) {
    const [x0, y0] = this.fim(), n = Math.ceil(rho * 0.6) + 8;
    for (let k = 1; k <= n; k++) { const a = (Math.PI / 2) * k / n; this.add(x0 + rho * Math.sin(a), y0 + rho * (1 - Math.cos(a))); }
    return this;
  };
  Linha.prototype.curva = function (c1x, c1y, c2x, c2y, x, y) {
    const [x0, y0] = this.fim();
    const n = Math.max(8, Math.ceil((Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)) / 2.5));
    for (let k = 1; k <= n; k++) {
      const t = k / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
      this.add(a * x0 + b * c1x + c * c2x + e * x, a * y0 + b * c1y + c * c2y + e * y);
    }
    return this;
  };
  // o laço: duas alças e uma ponta a partir do ponto atual (tamanho s); a outra ponta volta como linha separada
  Linha.prototype.laco = function (s) {
    const [cx, cy] = this.fim(), P = (a, b) => [cx + a * s, cy + b * s];
    const seg = (l, a, b, c) => l.curva(...P(...a), ...P(...b), ...P(...c));
    seg(this, [0.35, -0.55], [-0.85, -0.75], [-0.95, -0.1]);
    seg(this, [-1.05, 0.45], [-0.25, 0.35], [0, 0]);
    seg(this, [-0.35, -0.55], [0.85, -0.75], [0.95, -0.1]);
    seg(this, [1.05, 0.45], [0.4, 0.1], [0, 0]);
    seg(this, [-0.25, -0.05], [-0.4, 0.6], [-0.6, 1.1]);
    const ponta = new Linha(cx, cy);
    seg(ponta, [0.2, 0.15], [0.4, 0.65], [0.6, 1.1]);
    return ponta;
  };

  // ---------- Trança: cada fio gira em hélice em volta da linha central ----------
  // A: raio da hélice · L: passo de uma volta · gap: distância entre fios quando destrançados
  // solta: [início, comprimento] do trecho onde a trança se desfaz em fios paralelos
  function trancar(pts, o) {
    const n = pts.length, s = new Float64Array(n), nx = new Float64Array(n), ny = new Float64Array(n);
    for (let k = 1; k < n; k++) s[k] = s[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1;
      nx[k] = -ty / m; ny[k] = tx / m;
    }
    const fios = TIPOS.map((tipo, i) => {
      const fase = (2 * Math.PI * i) / 5, q = (2 - i) * o.gap, limite = o.ate ? o.ate[i] : Infinity, out = [];
      for (let k = 0; k < n && s[k] <= limite; k++) {
        let b = o.solta ? clamp((s[k] - o.solta[0]) / o.solta[1], 0, 1) : 0;
        b = b * b * (3 - 2 * b);
        const th = (2 * Math.PI * s[k]) / o.L + fase;
        const off = (1 - b) * o.A * Math.sin(th) + b * q;
        out.push([pts[k][0] + nx[k] * off, pts[k][1] + ny[k] * off, (1 - b) * Math.cos(th)]);
      }
      return { tipo, pts: out };
    });
    return { fios, s, total: s[n - 1] };
  }

  // Separa cada fio em trechos "na frente" e "atrás" (profundidade da hélice)
  function trechos(f) {
    const runs = [];
    let cur = null;
    for (const p of f.pts) {
      const frente = p[2] >= -0.04;
      if (!cur || cur.frente !== frente) {
        const ult = cur && cur.pts[cur.pts.length - 1];
        cur = { frente, pts: ult ? [ult] : [] };
        runs.push(cur);
      }
      cur.pts.push(p);
    }
    return runs.filter((r) => r.pts.length > 1);
  }

  function pintar(gTras, gFrente, fios, w, fundo) {
    for (const f of fios) {
      const c = Lacos.LIXOS[f.tipo].hex, tr = trama(f.tipo, w, fundo);
      for (const r of trechos(f)) {
        const d = caminho(r.pts);
        if (r.frente) {
          el("path", { d, stroke: c, "stroke-width": w }, gFrente);
          el("path", Object.assign({ d, class: "trama" }, tr), gFrente);
        } else {
          el("path", { d, "stroke-width": w, style: "stroke:" + sombra(c) }, gTras);
        }
      }
    }
  }

  function grupo(svg, mascara) {
    return el("g", { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", mask: mascara ? "url(#" + mascara + ")" : null }, svg);
  }

  let seq = 0;
  // Máscara que "desenha" a corda ao longo do seu comprimento (stroke-dashoffset de 1 até 0)
  function mascara(svg, pts, largura, W, H) {
    const id = "cordao-m" + ++seq;
    const defs = svg.querySelector("defs") || el("defs", {}, svg);
    const m = el("mask", { id, maskUnits: "userSpaceOnUse", x: -60, y: -60, width: W + 120, height: H + 120 }, defs);
    const p = el("path", {
      d: caminho(pts), fill: "none", stroke: "#fff", "stroke-width": largura, "stroke-linecap": "round", "stroke-linejoin": "round",
      pathLength: 1, "stroke-dasharray": "1 1",
    }, m);
    p.style.strokeDashoffset = "1";
    return { id, p };
  }
  const revelar = (m, k) => { m.p.style.strokeDashoffset = String(1 - clamp(k, 0, 1)); };

  function novoSvg(classe) {
    return el("svg", { class: "cordao " + classe, "aria-hidden": "true", focusable: "false" });
  }
  function medir(svg, W, H) {
    svg.setAttribute("width", W); svg.setAttribute("height", H); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  }

  // Liga a animação contínua da trama só enquanto o cordão está na tela
  function andarQuandoVisivel(alvo, svgs) {
    if (calmo() || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(([e]) => svgs.forEach((s) => s.classList.toggle("anda", e.isIntersecting)), { threshold: 0 }).observe(alvo);
  }

  // ======================================================================
  // Início: a corda atravessa "laços.", dá a volta e desce até as lixeiras
  // ======================================================================
  function abertura() {
    const caixa = document.querySelector(".trama");
    const palavra = caixa && caixa.querySelector(".no");
    const lanes = caixa ? [...caixa.querySelectorAll(".lane")] : [];
    if (!caixa || !palavra || lanes.length !== TIPOS.length) return;

    const tras = novoSvg("cordao-tras"), frente = novoSvg("cordao-frente"), sobre = novoSvg("cordao-sobre");
    caixa.prepend(tras); caixa.append(frente, sobre);
    caixa.classList.add("com-cordao");
    const st = { feita: calmo(), Pi: 0, Ps: 0, yMax: 0, desenhados: new Set(), chave: "" };
    const tag = caixa.querySelector(".recado .etiqueta"), recado = caixa.querySelector(".recado");

    function construir() {
      const W = caixa.clientWidth, H = caixa.offsetHeight;
      const chave = W + "x" + H;
      if (chave === st.chave) return;
      st.chave = chave;
      tras.replaceChildren(); frente.replaceChildren(); sobre.replaceChildren();
      medir(tras, W, H); medir(frente, W, H); medir(sobre, W, H);

      const cx = caixa.getBoundingClientRect();
      const rel = (n) => { const r = n.getBoundingClientRect(); return { x: r.left - cx.left, y: r.top - cx.top, w: r.width, h: r.height }; };
      const larga = W >= 760;
      const w = larga ? 7 : 5.2, A = larga ? 11 : 8.5, L = larga ? 66 : 46, gap = w + (larga ? 3.4 : 2.6);
      const rho = larga ? 48 : 26, rhoT = larga ? 30 : 20;

      // a corda corre logo abaixo da linha de base de "grandes laços.": as letras pisam nela e as descendentes (g, ç) passam por cima
      const rp = rel(palavra), base = palavra.querySelector(".base");
      const y0 = (base ? rel(base).y : rp.y + rp.h * 0.8) + (larga ? 7 : 5);
      const r0 = rel(lanes[0]);
      const canal = parseFloat(getComputedStyle(lanes[0]).paddingRight) || 56;
      const xD = r0.x + r0.w - canal / 2;
      const x1 = Math.min(rp.x + rp.w + (larga ? 30 : 12), xD - rho - 10);
      const espaco = xD - rho - x1;
      const R = clamp((espaco * 0.55) / (2 * Math.PI), 0, larga ? 15 : 8.5);
      const xFimVolta = x1 + (R >= 5 ? 2 * Math.PI * R : 0);

      // dentro de "laços." a corda sobe 0,15em: cruza o pé do "l" e do "o" por cima e some atrás do "a", do "ç" e do "s"
      const texto = palavra.firstChild, rg = document.createRange();
      const letra = (i) => {
        if (!texto || texto.nodeType !== 3 || i >= texto.length) return null;
        rg.setStart(texto, i); rg.setEnd(texto, i + 1);
        const r = rg.getBoundingClientRect();
        return { x: r.left - cx.left, w: r.width };
      };
      const gl = letra(0), go = letra(3), fs = parseFloat(getComputedStyle(palavra).fontSize) || 64;
      const sobe = gl && go ? fs * 0.15 + (larga ? 7 : 5) : 0;
      const suave = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
      const ergue = (x) => (sobe ? sobe * suave(gl.x - fs * 0.45, gl.x, x) * (1 - suave(go.x + go.w, x1 - 2, x)) : 0);

      // a etiqueta fica pendurada na corda: depois da volta na tela larga, no pé do "l" no celular
      if (tag) {
        const xGancho = larga ? xFimVolta + 64 : gl ? gl.x + gl.w / 2 : rp.x + 28;
        const cabe = xGancho - 17 + tag.offsetWidth < xD - 2 * gap - 24;
        tag.classList.toggle("pendurada", cabe);
        recado.classList.toggle("tem-pendurada", cabe && !larga);
        if (cabe) {
          const rr = rel(recado);
          tag.style.left = f1(xGancho - 17 - rr.x) + "px";
          tag.style.top = f1(y0 + 21 - rr.y) + "px";
          tag.style.setProperty("--alca", f1(ergue(xGancho)) + "px"); // o barbante alcança a corda erguida
        } else { tag.style.left = ""; tag.style.top = ""; tag.style.removeProperty("--alca"); }
      }
      const rl = lanes.map(rel);
      const yLane = rl.map((r) => r.y + 3);

      const lin = new Linha(-40, y0);
      for (let x = -37; x < x1; x += 3) lin.add(x, y0 - ergue(x));
      lin.add(x1, y0);
      // no celular a volta sobe para o espaço livre ao lado de "laços."; na tela larga ela desce, longe da linha de cima
      if (R >= 5) lin.volta(R, R * 2.9, !larga);
      if (lin.fim()[0] < xD - rho) lin.reta(xD - rho, y0);
      lin.desce(rho);
      const yDesc = lin.fim()[1];
      const sDesc = (() => { let s = 0; for (let k = 1; k < lin.p.length; k++) s += Math.hypot(lin.p[k][0] - lin.p[k - 1][0], lin.p[k][1] - lin.p[k - 1][1]); return s; })();
      lin.reta(xD, yLane[4] - rhoT);

      const ate = yLane.map((y) => sDesc + (y - rhoT - yDesc));
      const t = trancar(lin.p, { A, L, gap, solta: [sDesc, larga ? 170 : 120], ate });
      st.total = t.total; st.sDesc = sDesc; st.yDesc = yDesc;
      const heroFim = rel(caixa.querySelector(".abertura")).h;
      st.sHero = sDesc + Math.max(0, heroFim - yDesc);

      const banda = Math.max(2 * A + w, 4 * gap + w) + 10;
      st.mT = mascara(tras, lin.p, banda, W, H);
      st.mF = mascara(frente, lin.p, banda, W, H);
      pintar(grupo(tras, st.mT.id), grupo(frente, st.mF.id), t.fios, w, "#eef0ec");

      // a trança passa POR CIMA do "l" e do "o" e por baixo do "a", do "ç" e do "s"
      st.mS = null;
      if (gl && go) {
        const clip = el("clipPath", { id: "cordao-c" + ++seq }, el("defs", {}, sobre));
        [gl, go].forEach((r) => el("rect", { x: f1(r.x - 1), y: f1(rp.y), width: f1(r.w + 2), height: f1(rp.h + 40) }, clip));
        st.mS = mascara(sobre, lin.p, banda, W, H);
        const g = grupo(sobre, st.mS.id);
        g.setAttribute("clip-path", "url(#" + clip.id + ")");
        const trecho = t.fios.map((f) => ({ tipo: f.tipo, pts: f.pts.filter((p) => p[0] > rp.x - 30 && p[0] < rp.x + rp.w + 4 && Math.abs(p[1] - y0) < 60) }));
        pintar(el("g", {}), g, trecho, w, "#eef0ec");
      }

      // Ramais: cada fio vira à esquerda e corre pelo topo da sua lixeira
      st.ramais = t.fios.map((f, i) => {
        const [xi] = f.pts[f.pts.length - 1];
        const yi = yLane[i];
        const r = new Linha(xi, yi - rhoT);
        for (let k = 1; k <= 18; k++) { const a = (Math.PI / 2) * k / 18; r.add(xi - rhoT + rhoT * Math.cos(a), yi - rhoT + rhoT * Math.sin(a)); }
        r.reta(rl[i].x + w, yi);
        const m = mascara(frente, r.p, w + 10, W, H);
        const g = grupo(frente, m.id);
        const c = Lacos.LIXOS[f.tipo].hex, d = caminho(r.p);
        el("path", { d, stroke: c, "stroke-width": w }, g);
        el("path", Object.assign({ d, class: "trama" }, trama(f.tipo, w, "#eef0ec")), g);
        el("circle", { cx: f1(rl[i].x + w), cy: f1(yi), r: f1(w * 1.05), fill: c }, g);
        m.p.style.transition = "stroke-dashoffset .9s cubic-bezier(.16,1,.3,1)";
        return { m, s0: ate[i], tipo: f.tipo };
      });
      aplicar(true);
    }

    function aplicar(sem) {
      const P = st.feita ? Math.max(st.Pi, st.Ps, st.sHero) : st.Pi;
      const k = P / st.total;
      revelar(st.mT, k); revelar(st.mF, k);
      if (st.mS) revelar(st.mS, k);
      st.ramais.forEach((rm) => {
        if (st.desenhados.has(rm.tipo) || P >= rm.s0) {
          if (sem && st.desenhados.has(rm.tipo)) rm.m.p.style.transition = "none";
          st.desenhados.add(rm.tipo);
          rm.m.p.style.strokeDashoffset = "0";
        }
      });
    }

    // o fio desce com a rolagem e não volta atrás quando a pessoa sobe a página
    function rolar() {
      st.yMax = Math.max(st.yMax, innerHeight * 0.9 - caixa.getBoundingClientRect().top);
      st.Ps = st.yMax > st.yDesc ? st.sDesc + (st.yMax - st.yDesc) : 0;
      if (st.feita) aplicar();
    }

    function intro() {
      rolar();
      const alvo = Math.max(st.sHero, st.Ps), t0 = performance.now(), dur = 1700;
      const passo = (agora) => {
        const k = clamp((agora - t0) / dur, 0, 1);
        st.Pi = alvo * saida(k);
        aplicar();
        if (k < 1) requestAnimationFrame(passo);
        else { st.feita = true; aplicar(); }
      };
      requestAnimationFrame(passo);
    }

    let pendente = 0;
    const agendar = () => { cancelAnimationFrame(pendente); pendente = requestAnimationFrame(() => { construir(); rolar(); }); };
    const iniciar = () => {
      construir();
      if (st.feita) { rolar(); aplicar(true); } else intro();
      new ResizeObserver(agendar).observe(caixa);
      addEventListener("scroll", () => requestAnimationFrame(rolar), { passive: true });
      andarQuandoVisivel(caixa.querySelector(".abertura"), [frente]);
    };
    // espera a fonte para medir a palavra no lugar certo
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(iniciar);
  }

  // ======================================================================
  // Trança reta (rodapé, ranking, privacidade): cinco fios atravessando a faixa
  // ======================================================================
  function tranca(alvo, o = {}) {
    if (!alvo) return;
    const fundo = o.fundo || "#eef0ec";
    const svg = novoSvg("cordao-faixa");
    alvo.appendChild(svg);
    let chave = "";
    const desenhar = () => {
      const W = alvo.clientWidth, H = alvo.clientHeight;
      if (!W || W + "x" + H === chave) return;
      const primeira = !chave;
      chave = W + "x" + H;
      svg.replaceChildren(); medir(svg, W, H);
      const larga = W >= 760, fina = !!o.laco;
      const w = fina ? (larga ? 5.5 : 4.5) : (larga ? 6.5 : 5), A = fina ? (larga ? 8 : 6) : (larga ? 10 : 8), L = larga ? 62 : 46;
      const y = o.laco ? H * 0.42 : H / 2;
      const lin = new Linha(-30, y);
      let ponta = null;
      if (o.laco) { lin.reta(W * o.laco, y); ponta = lin.laco(larga ? 58 : 36); } // a corda termina amarrada num laço
      else lin.reta(W + 30, y);
      const linhas = ponta ? [lin, ponta] : [lin];
      const ms = linhas.map((l) => {
        const t = trancar(l.p, { A, L, gap: w + 3 });
        const m = mascara(svg, l.p, 2 * A + w + 12, W, H);
        const g = grupo(svg, m.id);
        pintar(el("g", {}, g), el("g", {}, g), t.fios, w, fundo); // atrás primeiro, frente por cima
        return m;
      });
      if (calmo() || !primeira) ms.forEach((m) => revelar(m, 1));
      else {
        ms.forEach((m, i) => { m.p.style.transition = "stroke-dashoffset " + (i ? ".6s" : "1.6s") + " cubic-bezier(.16,1,.3,1) " + (i ? "1.1s" : "0s"); });
        const ir = () => requestAnimationFrame(() => ms.forEach((m) => revelar(m, 1)));
        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); ir(); } }, { threshold: 0.4 });
          io.observe(alvo);
        } else ir();
      }
    };
    desenhar();
    new ResizeObserver(() => requestAnimationFrame(desenhar)).observe(alvo);
    andarQuandoVisivel(alvo, [svg]);
  }

  // ======================================================================
  // Um fio só, na trama de uma lixeira (capa da página da lixeira)
  // ======================================================================
  function fio(alvo, tipo, o = {}) {
    if (!alvo) return;
    const svg = novoSvg("cordao-fio");
    alvo.appendChild(svg);
    let chave = "";
    const desenhar = () => {
      const W = alvo.clientWidth, H = alvo.clientHeight;
      if (!W || W + "x" + H === chave) return;
      const primeira = !chave;
      chave = W + "x" + H;
      svg.replaceChildren(); medir(svg, W, H);
      const w = W >= 760 ? 12 : 8.5, y = H * 0.5, amp = Math.min(10, H * 0.22);
      const lin = new Linha(-20, y);
      for (let x = -20; x <= W + 20; x += 4) lin.add(x, y + amp * Math.sin((x / W) * Math.PI * 2.2 + 0.6));
      const m = mascara(svg, lin.p, w + 14, W, H);
      const g = grupo(svg, m.id), d = caminho(lin.p), campo = o.fundo || Lacos.LIXOS[tipo].hex;
      el("path", { d, stroke: o.cor || "#fafbf8", "stroke-width": w }, g);
      // o desenho do fio sai na cor do campo, para aparecer sobre o fio claro (ou escuro, no metal)
      el("path", Object.assign({ d, class: "trama" }, trama(tipo, w, campo, campo)), g);
      if (calmo() || !primeira) revelar(m, 1);
      else { m.p.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) .15s"; requestAnimationFrame(() => requestAnimationFrame(() => revelar(m, 1))); }
    };
    desenhar();
    new ResizeObserver(() => requestAnimationFrame(desenhar)).observe(alvo);
    andarQuandoVisivel(alvo, [svg]);
  }

  // ======================================================================
  // Etiqueta pendurada: dá para puxar e ela balança de volta
  // ======================================================================
  function balancar(tag) {
    if (tag._balanco) return tag._balanco;
    let ang = 0, vel = 0, arr = null, raf = 0;
    const set = () => tag.style.setProperty("--giro", ang.toFixed(2) + "deg");
    const passo = () => {
      vel += -ang * 0.055; vel *= 0.93; ang += vel; set();
      if (Math.abs(ang) > 0.04 || Math.abs(vel) > 0.04) raf = requestAnimationFrame(passo);
      else { ang = 0; vel = 0; set(); raf = 0; }
    };
    const soltar = () => { if (!arr) return; arr = null; tag.classList.remove("puxando"); if (!raf) raf = requestAnimationFrame(passo); };
    tag.addEventListener("pointerdown", (e) => {
      if (calmo()) return;
      arr = { x: e.clientX, a: ang, ult: e.clientX };
      cancelAnimationFrame(raf); raf = 0; vel = 0;
      tag.classList.add("puxando");
      try { tag.setPointerCapture(e.pointerId); } catch (_) {}
    });
    tag.addEventListener("pointermove", (e) => {
      if (!arr) return;
      ang = clamp(arr.a + (e.clientX - arr.x) * 0.4, -38, 38);
      vel = (e.clientX - arr.ult) * 0.12; arr.ult = e.clientX; set();
    });
    tag.addEventListener("pointerup", soltar);
    tag.addEventListener("pointercancel", soltar);
    tag._balanco = {
      empurrar(v) { if (calmo()) return; vel += v; if (!raf) raf = requestAnimationFrame(passo); },
    };
    return tag._balanco;
  }

  // ======================================================================
  // Números que contam até o valor (placar e ranking)
  // ======================================================================
  function contar(alvo, ate, dur = 1000) {
    const fim = Number(ate) || 0;
    if (calmo() || fim <= 1) { alvo.textContent = fim; return; }
    const t0 = performance.now();
    const passo = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      alvo.textContent = Math.round(fim * saida(k));
      if (k < 1) requestAnimationFrame(passo);
    };
    alvo.textContent = "0";
    requestAnimationFrame(passo);
  }
  const contarTodos = (raiz) => (raiz || document).querySelectorAll("[data-conta]").forEach((n) => contar(n, n.dataset.conta));

  // ======================================================================
  // Descarte registrado: o fio da própria lixeira entra e se fecha num laço
  // ======================================================================
  function laco(alvo, tipo) {
    if (!alvo) return;
    const L = Lacos.LIXOS[tipo], svg = novoSvg("cordao-laco");
    alvo.appendChild(svg);
    const W = alvo.clientWidth || 320, H = alvo.clientHeight || 130, w = 8, s = Math.min(50, H * 0.38);
    medir(svg, W, H);
    const cy = H * 0.4, lin = new Linha(-12, cy).reta(W / 2, cy), ponta = lin.laco(s);
    const tom = L.texto || null; // só o metal (fio amarelo) pede um desenho escuro
    [lin, ponta].forEach((l, i) => {
      const m = mascara(svg, l.p, w + 12, W, H), g = grupo(svg, m.id), d = caminho(l.p);
      el("path", { d, stroke: L.hex, "stroke-width": w }, g);
      el("path", Object.assign({ d, class: "trama" }, trama(tipo, w, "#fafbf8", tom)), g);
      if (calmo()) revelar(m, 1);
      else {
        m.p.style.transition = "stroke-dashoffset " + (i ? ".45s" : "1.3s") + " cubic-bezier(.16,1,.3,1) " + (i ? "1.15s" : ".05s");
        requestAnimationFrame(() => requestAnimationFrame(() => revelar(m, 1)));
      }
    });
  }

  // ======================================================================
  // Fio de leitura: avança conforme a página é lida
  // ======================================================================
  function progressoLeitura() {
    const barra = document.createElement("div");
    barra.className = "fio-leitura";
    barra.setAttribute("aria-hidden", "true");
    document.body.appendChild(barra);
    const atualizar = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      barra.style.setProperty("--p", max > 0 ? clamp(scrollY / max, 0, 1).toFixed(4) : "1");
    };
    addEventListener("scroll", () => requestAnimationFrame(atualizar), { passive: true });
    addEventListener("resize", atualizar);
    atualizar();
  }

  // Em todas as páginas: o rodapé amarra o cordão e as etiquetas balançam
  document.addEventListener("DOMContentLoaded", () => {
    tranca(document.querySelector(".rodape-no"), { fundo: "#15181b", laco: 0.78 });
    document.querySelectorAll("[data-balanca]").forEach((t) => {
      const b = balancar(t);
      if (t.dataset.balanca === "entra") setTimeout(() => b.empurrar(3.2), 650);
    });
  });

  return { abertura, tranca, fio, balancar, contar, contarTodos, laco, progressoLeitura, calmo };
})();
