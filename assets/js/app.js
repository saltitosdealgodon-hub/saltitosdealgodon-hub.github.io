/* ==========================================================================
   Saltitos de Algodón — interacción del sitio
   Arma catálogo, fichas, razas y detalles a partir de datos.js.
   ========================================================================== */
(() => {
  "use strict";

  const D = window.SALTITOS;
  if (!D || !window.Conejo) return;
  const { config, razas, conejitos } = D;

  /* Utilidades ------------------------------------------------------------ */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const soles = (n) => "S/ " + Number(n).toLocaleString("es-PE");
  const icono = (id, extra = "") => `<svg class="i ${extra}" aria-hidden="true"><use href="/assets/img/iconos.svg#${id}"/></svg>`;
  const waURL = (msg) => `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg || config.mensajeWa)}`;
  const razaDe = Object.fromEntries(razas.map((r) => [r.id, r]));
  const lookDe = (c) => Object.assign({}, razaDe[c.raza]?.look, c.look);
  const dibujo = (look, clase = "") => window.Conejo.svg(look, { clase });
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const leer = (k, def) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? def;
    } catch {
      return def;
    }
  };
  const guardar = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  };

  /* Fechas y edades ------------------------------------------------------- */
  const HOY = new Date();
  HOY.setHours(0, 0, 0, 0);
  const fecha = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const diasDe = (c) => Math.round((HOY - fecha(c.nacimiento)) / 864e5);
  const edad = (c) => {
    const d = diasDe(c);
    if (d < 0) return "Por nacer";
    if (d < 14) return `${d} días`;
    const s = Math.floor(d / 7);
    if (s < 17) return `${s} semanas`;
    return `${Math.floor(d / 30.44)} meses`;
  };
  const listoDesde = (c) => {
    const f = fecha(c.nacimiento);
    f.setDate(f.getDate() + 56);
    return f;
  };
  const fechaCorta = (f) => f.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  const fechaLarga = (f) => f.toLocaleDateString("es-PE", { day: "numeric", month: "long" });

  const ESTADOS = { disponible: "Disponible", reservado: "Reservado", proximamente: "Próximamente" };
  const SEXO = { macho: "Macho", hembra: "Hembra" };
  const NIVEL = ["Bajo", "Medio", "Alto"];
  const PESO_ESTADO = { disponible: 0, proximamente: 1, reservado: 2 };
  const recomendados = (lista) =>
    [...lista].sort((a, b) => PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado] || a.codigo.localeCompare(b.codigo));
  const medidor = (n, nombre) =>
    `<span class="medidor" role="img" aria-label="${nombre}: ${NIVEL[n - 1].toLowerCase()}">${[1, 2, 3]
      .map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`)
      .join("")}</span>`;

  /* Favoritos ------------------------------------------------------------- */
  const FAV = "saltitos:favoritos";
  const favoritos = new Set(leer(FAV, []));

  /* Piezas reutilizables -------------------------------------------------- */
  const media = (c) => {
    const r = razaDe[c.raza] || {};
    return c.foto
      ? `<img src="${esc(c.foto)}" alt="${esc(c.nombre)}, ${esc(r.nombre)}" loading="lazy">`
      : dibujo(lookDe(c));
  };

  function tarjetaRaza(r, i) {
    const n = conejitos.filter((c) => c.raza === r.id && c.estado !== "reservado").length;
    const nota = n
      ? `<span class="disp-nota">${n} disponible${n > 1 ? "s" : ""}</span>`
      : `<span class="disp-nota disp-nota--vacia">Próxima camada</span>`;
    return `<a class="tarjeta-raza" href="/razas#${r.id}" data-revelar style="--d:${(i % 4) * 0.07}s">
      <div class="media-fondo">
        <span class="chip chip--flotante">${esc(r.tamano)}</span>
        ${dibujo(r.look)}
        ${nota}
      </div>
      <div class="tarjeta-raza-cuerpo">
        <h3>${esc(r.nombre)}</h3>
        <p class="alias">${esc(r.alias)}</p>
        <div class="tarjeta-raza-pie">
          <span class="precio-desde"><small>desde</small>${soles(r.precioDesde)}</span>
          <span class="flecha-circulo">${icono("flecha")}</span>
        </div>
      </div>
    </a>`;
  }

  function tarjetaConejo(c, i = 0) {
    const r = razaDe[c.raza] || {};
    const fav = favoritos.has(c.codigo);
    const nota = c.estado === "proximamente" ? `listo el ${fechaCorta(listoDesde(c))}` : edad(c);
    return `<article class="tarjeta-conejo tarjeta-conejo--${c.estado}" data-revelar style="--d:${(i % 3) * 0.07}s">
      <div class="media-fondo">
        ${media(c)}
        <span class="estado estado--${c.estado}">${ESTADOS[c.estado]}</span>
      </div>
      <button class="fav" type="button" data-fav="${esc(c.codigo)}" aria-pressed="${fav}" aria-label="Guardar a ${esc(c.nombre)} en favoritos">${icono("corazon")}</button>
      <div class="tarjeta-conejo-cuerpo">
        <div class="tc-fila"><h3 class="tc-nombre">${esc(c.nombre)}</h3><span class="tc-codigo">${esc(c.codigo)}</span></div>
        <p class="tc-meta">${esc(r.nombre)} · ${SEXO[c.sexo]} · ${nota}</p>
        <div class="tc-rasgos">${(c.rasgos || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        <div class="tc-pie">
          <span class="precio">${soles(c.precio)}</span>
          <span class="boton boton--chico boton--primario" aria-hidden="true">Ver ficha ${icono("flecha", "i-mover")}</span>
        </div>
      </div>
      <button class="tarjeta-abrir" type="button" data-ficha="${esc(c.codigo)}" aria-label="Ver ficha de ${esc(c.nombre)}, ${esc(r.nombre)}"></button>
    </article>`;
  }

  /* Ficha (ventana con el detalle de cada conejito) ----------------------- */
  let ventana;
  function abrirFicha(codigo) {
    const c = conejitos.find((x) => x.codigo === codigo);
    if (!c) return;
    const r = razaDe[c.raza] || {};
    if (!ventana) {
      ventana = document.createElement("dialog");
      ventana.className = "ficha";
      ventana.setAttribute("aria-labelledby", "ficha-titulo");
      document.body.append(ventana);
      ventana.addEventListener("click", (e) => {
        if (e.target === ventana || e.target.closest("[data-cerrar]")) ventana.close();
      });
    }
    const msg =
      c.estado === "reservado"
        ? `Hola 🐰 vi a ${c.nombre} (${c.codigo}, ${r.nombre}) pero está reservado. ¿Tienen otro parecido?`
        : `Hola 🐰 me interesa ${c.nombre} (${c.codigo}, ${r.nombre}). ¿Me cuentan más?`;
    const fechaDato =
      c.estado === "proximamente"
        ? `<div><dt>Listo para casa</dt><dd>${fechaLarga(listoDesde(c))}</dd></div>`
        : `<div><dt>Edad</dt><dd>${edad(c)}</dd></div>`;
    ventana.innerHTML = `<div class="ficha-interior">
      <div class="media-fondo">
        ${media(c)}
        <span class="estado estado--${c.estado}">${ESTADOS[c.estado]}</span>
      </div>
      <div class="ficha-cuerpo">
        <p class="etiqueta">${esc(r.nombre)} · ${esc(c.codigo)}</p>
        <h2 id="ficha-titulo">${esc(c.nombre)}</h2>
        <p class="ficha-lead">${esc(c.descripcion || r.caracter)}</p>
        <dl class="ficha-datos">
          <div><dt>Sexo</dt><dd>${SEXO[c.sexo]}</dd></div>
          ${fechaDato}
          <div><dt>Color</dt><dd>${esc(c.color)}</dd></div>
          <div><dt>Tamaño adulto</dt><dd>${esc(r.tamano)} · ${esc(r.peso)}</dd></div>
          <div><dt>Energía</dt><dd>${NIVEL[r.energia - 1]}</dd></div>
          <div><dt>Cuidado del pelaje</dt><dd>${NIVEL[r.cuidado - 1]}</dd></div>
        </dl>
        <div class="tc-rasgos">${(c.rasgos || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        <div class="ficha-incluye">
          <h3>Viene con</h3>
          <ul class="lista-check">${config.incluye.map((t) => `<li>${icono("check")}<span>${esc(t)}</span></li>`).join("")}</ul>
        </div>
        <div class="ficha-acciones">
          <div><span class="ficha-precio-label">Precio</span><span class="precio">${soles(c.precio)}</span></div>
          <div class="ficha-botones">
            <a class="boton" href="/razas#${r.id}">Ver la raza</a>
            <a class="boton boton--wa" href="${waURL(msg)}" target="_blank" rel="noopener">${icono("whatsapp")} ${c.estado === "reservado" ? "Pedir uno parecido" : "¡Lo quiero!"}</a>
          </div>
        </div>
      </div>
      <button class="ficha-cerrar" type="button" data-cerrar autofocus aria-label="Cerrar ficha">${icono("cerrar")}</button>
    </div>`;
    ventana.showModal();
    $(".ficha-cuerpo", ventana).scrollTop = 0;
  }

  /* Eventos globales: favoritos y fichas ---------------------------------- */
  document.addEventListener("click", (e) => {
    const f = e.target.closest("[data-fav]");
    if (f) {
      const id = f.dataset.fav;
      favoritos.has(id) ? favoritos.delete(id) : favoritos.add(id);
      guardar(FAV, [...favoritos]);
      $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => b.setAttribute("aria-pressed", String(favoritos.has(id))));
      document.dispatchEvent(new CustomEvent("favoritos"));
      return;
    }
    const a = e.target.closest("[data-ficha]");
    if (a) abrirFicha(a.dataset.ficha);
  });

  /* Página: inicio -------------------------------------------------------- */
  function paginaInicio() {
    const disponibles = conejitos.filter((c) => c.estado === "disponible").length;
    $$("[data-cuenta='disponibles']").forEach((el) => (el.textContent = disponibles));
    $$("[data-cuenta='razas']").forEach((el) => (el.textContent = razas.length));

    const gr = $("#grid-razas");
    if (gr) gr.innerHTML = razas.map(tarjetaRaza).join("");
    const gd = $("#grid-disponibles");
    if (gd)
      gd.innerHTML = recomendados(conejitos.filter((c) => c.estado !== "reservado"))
        .slice(0, 6)
        .map(tarjetaConejo)
        .join("");
  }

  /* Página: catálogo ------------------------------------------------------ */
  function paginaCatalogo() {
    const grid = $("#catalogo-grid");
    if (!grid) return;
    const q = new URLSearchParams(location.search);
    const est = {
      texto: q.get("q") || "",
      raza: razaDe[q.get("raza")] ? q.get("raza") : "todas",
      sexo: ["macho", "hembra"].includes(q.get("sexo")) ? q.get("sexo") : "todos",
      estado: ESTADOS[q.get("estado")] ? q.get("estado") : "todos",
      orden: q.get("orden") || "recomendado",
      favs: q.get("favs") === "1",
    };

    const buscar = $("#f-buscar");
    const selEstado = $("#f-estado");
    const selOrden = $("#f-orden");
    const btnFavs = $("#f-favs");
    const chips = $("#f-razas");
    const vacio = $("#catalogo-vacio");
    const contador = $("#catalogo-contador");

    // Resumen de estados
    const resumen = $("#catalogo-resumen");
    if (resumen)
      resumen.innerHTML = Object.keys(ESTADOS)
        .map((k) => [k, conejitos.filter((c) => c.estado === k).length])
        .filter(([, n]) => n)
        .map(([k, n]) => `<span class="estado estado--${k}">${n} ${ESTADOS[k].toLowerCase()}${n > 1 && k !== "proximamente" ? "s" : ""}</span>`)
        .join("");

    chips.innerHTML =
      `<button class="chip-filtro" type="button" data-raza="todas">Todas <span>${conejitos.length}</span></button>` +
      razas
        .map((r) => {
          const n = conejitos.filter((c) => c.raza === r.id).length;
          return `<button class="chip-filtro" type="button" data-raza="${r.id}">${esc(r.nombre)} <span>${n}</span></button>`;
        })
        .join("");

    buscar.value = est.texto;
    selEstado.value = est.estado;
    selOrden.value = est.orden;
    $("#f-favs-n").textContent = favoritos.size;

    const ordenar = {
      recomendado: recomendados,
      "precio-asc": (l) => [...l].sort((a, b) => a.precio - b.precio),
      "precio-desc": (l) => [...l].sort((a, b) => b.precio - a.precio),
      jovenes: (l) => [...l].sort((a, b) => fecha(b.nacimiento) - fecha(a.nacimiento)),
    };
    const normal = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    function aplicar() {
      const t = normal(est.texto.trim());
      let lista = conejitos.filter((c) => {
        if (est.raza !== "todas" && c.raza !== est.raza) return false;
        if (est.sexo !== "todos" && c.sexo !== est.sexo) return false;
        if (est.estado !== "todos" && c.estado !== est.estado) return false;
        if (est.favs && !favoritos.has(c.codigo)) return false;
        if (t) {
          const pajar = normal([c.nombre, c.codigo, c.color, razaDe[c.raza]?.nombre, ...(c.rasgos || [])].join(" "));
          if (!pajar.includes(t)) return false;
        }
        return true;
      });
      lista = (ordenar[est.orden] || recomendados)(lista);

      grid.innerHTML = lista.map(tarjetaConejo).join("");
      vacio.hidden = lista.length > 0;
      const n = lista.length;
      contador.textContent = n === conejitos.length ? `Mostrando los ${n} conejitos` : `${n} de ${conejitos.length} conejitos`;

      $$("[data-raza]", chips).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.raza === est.raza)));
      $$("[data-sexo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sexo === est.sexo)));
      btnFavs.setAttribute("aria-pressed", String(est.favs));

      const p = new URLSearchParams();
      if (est.texto) p.set("q", est.texto);
      if (est.raza !== "todas") p.set("raza", est.raza);
      if (est.sexo !== "todos") p.set("sexo", est.sexo);
      if (est.estado !== "todos") p.set("estado", est.estado);
      if (est.orden !== "recomendado") p.set("orden", est.orden);
      if (est.favs) p.set("favs", "1");
      history.replaceState(null, "", location.pathname + (p.toString() ? `?${p}` : ""));
      revelar(grid);
    }

    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-raza]");
      if (!b) return;
      est.raza = b.dataset.raza;
      aplicar();
    });
    $$("[data-sexo]").forEach((b) =>
      b.addEventListener("click", () => {
        est.sexo = b.dataset.sexo;
        aplicar();
      })
    );
    let espera;
    buscar.addEventListener("input", () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        est.texto = buscar.value;
        aplicar();
      }, 160);
    });
    selEstado.addEventListener("change", () => {
      est.estado = selEstado.value;
      aplicar();
    });
    selOrden.addEventListener("change", () => {
      est.orden = selOrden.value;
      aplicar();
    });
    btnFavs.addEventListener("click", () => {
      est.favs = !est.favs;
      aplicar();
    });
    document.addEventListener("favoritos", () => {
      $("#f-favs-n").textContent = favoritos.size;
      if (est.favs) aplicar();
    });
    $("#f-limpiar").addEventListener("click", () => {
      Object.assign(est, { texto: "", raza: "todas", sexo: "todos", estado: "todos", orden: "recomendado", favs: false });
      buscar.value = "";
      selEstado.value = "todos";
      selOrden.value = "recomendado";
      aplicar();
    });

    const vc = $("#vacio-conejo");
    if (vc) vc.innerHTML = dibujo({ pelo: "#E9CBA7", sombra: "#D4AC80", orejas: "caidas", largo: 0.9 });

    aplicar();
    const pedido = q.get("conejo");
    if (pedido) abrirFicha(pedido);
  }

  /* Página: razas --------------------------------------------------------- */
  function razaDetalle(r, i) {
    const n = conejitos.filter((c) => c.raza === r.id && c.estado !== "reservado").length;
    const cta = n
      ? `<a class="boton boton--primario" href="/catalogo?raza=${r.id}">Ver ${n} disponible${n > 1 ? "s" : ""} ${icono("flecha", "i-mover")}</a>`
      : `<a class="boton boton--primario" href="#" data-wa="Hola 🐰 quiero que me avisen de la próxima camada de ${esc(r.nombre)}.">Avísame de la próxima camada</a>`;
    return `<article class="raza-detalle" id="${r.id}">
      <div class="media-fondo raza-media" data-revelar>
        <span class="chip chip--flotante">${esc(r.tamano)}</span>
        <span class="raza-num">${String(i + 1).padStart(2, "0")}<small> / ${String(razas.length).padStart(2, "0")}</small></span>
        ${dibujo(r.look)}
      </div>
      <div class="raza-info" data-revelar style="--d:.08s">
        <p class="etiqueta">${esc(r.alias)}</p>
        <h2>${esc(r.nombre)}</h2>
        <p class="raza-desc">${esc(r.descripcion)}</p>
        <dl class="raza-specs">
          <div class="spec"><dt>Peso adulto</dt><dd>${esc(r.peso)}</dd></div>
          <div class="spec"><dt>Esperanza de vida</dt><dd>${esc(r.vida)}</dd></div>
          <div class="spec"><dt>Pelaje</dt><dd>${esc(r.pelaje)}</dd></div>
          <div class="spec"><dt>Carácter</dt><dd>${esc(r.caracter)}</dd></div>
        </dl>
        <div class="medidores">
          <div>Energía ${medidor(r.energia, "Energía")}</div>
          <div>Cuidado del pelaje ${medidor(r.cuidado, "Cuidado del pelaje")}</div>
        </div>
        <p class="raza-ideal">${icono("casa")}<span><strong>Ideal para:</strong> ${esc(r.idealPara)}</span></p>
        <div class="raza-acciones">${cta}<span class="precio-desde"><small>desde</small>${soles(r.precioDesde)}</span></div>
      </div>
    </article>`;
  }

  function paginaRazas() {
    const lista = $("#lista-razas");
    if (!lista) return;
    $("#saltos-razas").innerHTML = razas.map((r) => `<a class="chip-filtro" href="#${r.id}">${esc(r.nombre)}</a>`).join("");
    lista.innerHTML = razas.map(razaDetalle).join("");
    $("#escala").innerHTML = [...razas]
      .sort((a, b) => a.escala - b.escala)
      .map(
        (r) => `<div class="escala-item">
          <div class="escala-conejo" style="--e:${r.escala}">${dibujo(r.look)}</div>
          <strong>${esc(r.nombre)}</strong><span>${esc(r.peso)}</span>
        </div>`
      )
      .join("");
    $("#tabla-razas tbody").innerHTML = razas
      .map(
        (r) => `<tr>
          <td><span class="tabla-raza"><span class="mini-conejo">${dibujo(r.look)}</span><a href="#${r.id}">${esc(r.nombre)}</a></span></td>
          <td>${esc(r.tamano)}</td>
          <td>${esc(r.peso)}</td>
          <td>${medidor(r.energia, "Energía")}</td>
          <td>${medidor(r.cuidado, "Cuidado del pelaje")}</td>
          <td><strong>${soles(r.precioDesde)}</strong></td>
        </tr>`
      )
      .join("");
    if (location.hash) {
      const destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (destino) requestAnimationFrame(() => destino.scrollIntoView({ behavior: "instant", block: "start" }));
    }
  }

  /* Página: cuidados ------------------------------------------------------ */
  function paginaCuidados() {
    const cajas = $$("#checklist input[type='checkbox']");
    if (!cajas.length) return;
    const CLAVE = "saltitos:checklist";
    const marcados = new Set(leer(CLAVE, []));
    const progreso = $("#checklist-progreso");
    const barra = $("#checklist-barra");
    const actualizar = () => {
      const n = cajas.filter((c) => c.checked).length;
      progreso.textContent = n === cajas.length ? "¡Todo listo para recibirlo! 🎉" : `${n} de ${cajas.length} listos`;
      barra.style.setProperty("--p", n / cajas.length);
    };
    cajas.forEach((c) => {
      c.checked = marcados.has(c.value);
      c.addEventListener("change", () => {
        guardar(CLAVE, cajas.filter((x) => x.checked).map((x) => x.value));
        actualizar();
      });
    });
    actualizar();
  }

  /* Comunes --------------------------------------------------------------- */
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entradas) =>
            entradas.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("visible");
                io.unobserve(e.target);
              }
            }),
          { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
        )
      : null;
  function revelar(raiz = document) {
    $$("[data-revelar]:not(.visible)", raiz).forEach((el) => (io && !reducir ? io.observe(el) : el.classList.add("visible")));
  }

  function enlazarContacto() {
    $$("[data-wa]").forEach((a) => {
      a.href = waURL(a.dataset.wa);
      a.target = "_blank";
      a.rel = "noopener";
    });
    const redes = {
      instagram: (u) => `https://www.instagram.com/${u}/`,
      tiktok: (u) => `https://www.tiktok.com/@${u}`,
      correo: (u) => `mailto:${u}`,
    };
    $$("[data-red]").forEach((a) => {
      const valor = config[a.dataset.red];
      if (!valor) return (a.closest("li") || a).remove(); // sin dato: no se muestra
      a.href = redes[a.dataset.red](valor);
      if (!a.children.length) a.textContent = a.dataset.red === "correo" ? valor : `@${valor}`;
    });
    $$("[data-config]").forEach((el) => {
      const v = config[el.dataset.config];
      if (typeof v === "string") el.textContent = v;
    });
    $$("[data-anio]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  function cabecera() {
    const cab = $("#cabecera");
    if (!cab) return;
    const btn = $(".nav-menu", cab);
    const cerrar = () => {
      cab.classList.remove("abierto");
      btn?.setAttribute("aria-expanded", "false");
      btn?.setAttribute("aria-label", "Abrir menú");
    };
    btn?.addEventListener("click", () => {
      const abierto = cab.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", String(abierto));
      btn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    });
    $$(".nav-enlaces a", cab).forEach((a) => a.addEventListener("click", cerrar));
    document.addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
    document.addEventListener("click", (e) => !cab.contains(e.target) && cerrar());
    const alDesplazar = () => cab.classList.toggle("con-scroll", scrollY > 10);
    addEventListener("scroll", alDesplazar, { passive: true });
    alDesplazar();
  }

  function botonFlotante() {
    const a = document.createElement("a");
    a.className = "wa-flotante";
    a.href = waURL(config.mensajeWa);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Escríbenos por WhatsApp");
    a.innerHTML = icono("whatsapp");
    document.body.append(a);
  }

  /* Arranque -------------------------------------------------------------- */
  const paginas = { inicio: paginaInicio, catalogo: paginaCatalogo, razas: paginaRazas, cuidados: paginaCuidados };
  paginas[document.body.dataset.pagina]?.();
  cabecera();
  enlazarContacto();
  botonFlotante();
  revelar();
})();
