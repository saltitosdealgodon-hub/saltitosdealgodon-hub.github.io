/* ==========================================================================
   Ilustraciones de conejitos en SVG
   Mientras no haya fotos reales, cada conejito se dibuja a partir de su
   "look" (color de pelo, tipo de orejas, patrón…) definido en datos.js.
   Estilo: trazo de tinta y colores naturales, a juego con el logo.
   Uso: Conejo.svg({ pelo: "#fff", orejas: "caidas" }, { clase: "conejo--vivo" })
   ========================================================================== */
(function () {
  "use strict";

  const TINTA = "#2B2621";
  const BASE = {
    pelo: "#EFD9C1",
    sombra: null,
    interior: "#D9B4AB",
    orejas: "arriba", // "arriba" | "caidas" | "una"
    largo: 1, // largo de las orejas
    patron: "solido", // "solido" | "manchas" | "hotot"
    mancha: "#8A5A3C",
    melena: false,
    lanudo: false,
    ojos: TINTA,
  };

  const rgb = (h) => {
    h = String(h).replace("#", "");
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mezclar = (a, b, t) => {
    const A = rgb(a);
    const B = rgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  const luminancia = (h) => {
    const [r, g, b] = rgb(h).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Puntos repartidos sobre una elipse
  const anillo = (cx, cy, rx, ry, n, giro = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + giro;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });

  // Nube de círculos con contorno solo por fuera: trazo grueso detrás y relleno encima
  const nube = (puntos, r, relleno, linea) => {
    const c = puntos.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join("");
    return `<g fill="${linea}" stroke="${linea}" stroke-width="4.4">${c}</g><g fill="${relleno}">${c}</g>`;
  };

  function svg(look = {}, opciones = {}) {
    const L = Object.assign({}, BASE, look);
    const sombra = L.sombra || mezclar(L.pelo, "#6B4A36", 0.2);
    const linea = TINTA;
    const panza = mezclar(L.pelo, "#FBF7F0", 0.5);
    const oscuro = luminancia(L.pelo) < 0.12;
    const trazo = `stroke="${linea}" stroke-width="2.2" stroke-linejoin="round"`;
    const orejaColor = L.patron === "manchas" ? L.mancha : L.pelo;
    const melena = mezclar(L.pelo, sombra, 0.45);
    const p = [];

    const orejaArriba = (lado) => {
      const x = lado < 0 ? 80 : 120;
      const ry = 34 * L.largo;
      const cy = 76 - ry;
      let s = `<g class="c-oreja c-oreja-${lado < 0 ? "izq" : "der"}"><g transform="rotate(${lado * 13} ${x} 76)">`;
      s += `<ellipse cx="${x}" cy="${cy.toFixed(1)}" rx="14" ry="${ry.toFixed(1)}" fill="${orejaColor}" ${trazo}/>`;
      s += `<ellipse cx="${x}" cy="${(cy + 5).toFixed(1)}" rx="7" ry="${(ry * 0.68).toFixed(1)}" fill="${L.interior}"/>`;
      if (L.lanudo) s += nube([[x - 3, cy - ry + 5], [x + 4, cy - ry + 3]], 6, L.pelo, linea);
      return s + "</g></g>";
    };

    const orejaCaida = (lado) => {
      const x = lado < 0 ? 72 : 128;
      const ry = 33 * L.largo;
      const color = L.patron === "manchas" ? L.mancha : sombra;
      return (
        `<g class="c-oreja c-oreja-caida c-oreja-${lado < 0 ? "izq" : "der"}"><g transform="rotate(${-lado * 26} ${x} 66)">` +
        `<ellipse cx="${x}" cy="${(62 + ry).toFixed(1)}" rx="15" ry="${ry.toFixed(1)}" fill="${color}" ${trazo}/>` +
        `<path d="M${x} 74Q${x - lado * 5} ${(66 + ry).toFixed(1)} ${x} ${(52 + 2 * ry).toFixed(1)}" fill="none" stroke="${linea}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>` +
        "</g></g>"
      );
    };

    // Sombra en el suelo
    p.push(`<ellipse cx="100" cy="194" rx="62" ry="4.5" fill="${TINTA}" opacity=".1"/>`);

    // Orejas paradas (van detrás de la cabeza)
    if (L.orejas === "arriba") p.push(orejaArriba(-1), orejaArriba(1));
    if (L.orejas === "una") p.push(orejaArriba(-1));

    // Cuerpo
    if (L.lanudo) p.push(nube(anillo(100, 152, 50, 38, 14), 15, L.pelo, linea));
    p.push(`<ellipse cx="100" cy="150" rx="54" ry="42" fill="${L.pelo}" ${L.lanudo ? "" : trazo}/>`);
    p.push(`<ellipse cx="100" cy="161" rx="30" ry="25" fill="${panza}"/>`);
    if (L.patron === "manchas") p.push(`<ellipse cx="137" cy="152" rx="13" ry="10" fill="${L.mancha}"/>`);

    // Patas
    p.push(
      `<ellipse cx="70" cy="187" rx="19" ry="8.5" fill="${L.pelo}" ${trazo}/>` +
        `<ellipse cx="130" cy="187" rx="19" ry="8.5" fill="${L.pelo}" ${trazo}/>` +
        `<ellipse cx="87" cy="179" rx="9.5" ry="7.5" fill="${L.pelo}" ${trazo}/>` +
        `<ellipse cx="113" cy="179" rx="9.5" ry="7.5" fill="${L.pelo}" ${trazo}/>`
    );

    // Melena o lana alrededor de la cabeza
    if (L.melena) p.push(nube(anillo(100, 102, 46, 41, 16, 0.2), 13, melena, linea));
    if (L.lanudo) p.push(nube(anillo(100, 102, 44, 38, 14), 12, L.pelo, linea));

    // Corona de los orejas caídas
    if (L.orejas !== "arriba") p.push(`<ellipse cx="100" cy="66" rx="31" ry="10" fill="${sombra}" ${trazo}/>`);

    // Cabeza
    p.push(`<ellipse cx="100" cy="100" rx="46" ry="40" fill="${L.pelo}" ${L.lanudo ? "" : trazo}/>`);

    // Patrones
    if (L.patron === "manchas") {
      p.push(`<ellipse cx="119" cy="94" rx="14" ry="12.5" fill="${L.mancha}"/>`);
      p.push(`<path d="M100 104c-3-6-12-6-13 0-1 5 6 8 13 4 7 4 14 1 13-4-1-6-10-6-13 0z" fill="${L.mancha}"/>`);
    }
    if (L.patron === "hotot") {
      p.push(`<g fill="none" stroke="${L.mancha}" stroke-width="3.6"><circle cx="82" cy="95" r="10.5"/><circle cx="118" cy="95" r="10.5"/></g>`);
    }
    if (L.melena) p.push(nube([[89, 64], [100, 59], [111, 64]], 8.5, melena, linea));

    // Cara: cachetes, bigotes, ojos, nariz y boca
    p.push(`<g fill="#C99A8F" opacity=".18"><ellipse cx="71" cy="111" rx="8" ry="5.5"/><ellipse cx="129" cy="111" rx="8" ry="5.5"/></g>`);
    p.push(
      `<path d="M87 110 62 105M87 114 63 119M113 110 138 105M113 114 137 119" fill="none" stroke="${oscuro ? mezclar(L.pelo, "#FFFFFF", 0.5) : linea}" stroke-width="1.1" stroke-linecap="round" opacity=".45"/>`
    );
    if (oscuro) p.push(`<g fill="${mezclar(L.pelo, "#FFFFFF", 0.22)}"><circle cx="82" cy="95" r="9.5"/><circle cx="118" cy="95" r="9.5"/></g>`);
    const ojo = (x) =>
      `<circle cx="${x}" cy="95" r="7" fill="${L.ojos}"/>` +
      `<circle cx="${x - 2.4}" cy="92.4" r="2.5" fill="#fff"/>` +
      `<circle cx="${x + 2.2}" cy="97.6" r="1.1" fill="#fff" opacity=".85"/>`;
    p.push(`<g class="c-ojos"><g class="c-mirada">${ojo(82)}${ojo(118)}</g></g>`);
    p.push(`<path class="c-nariz" d="M94.5 106.5c0-2 2.6-3 5.5-3s5.5 1 5.5 3c0 2.2-3.2 4.6-5.5 4.6s-5.5-2.4-5.5-4.6z" fill="#B57F78"/>`);
    p.push(
      `<path d="M100 111v3.4M100 114.4c-1.3 2.6-4.6 3.3-6.6 1.3M100 114.4c1.3 2.6 4.6 3.3 6.6 1.3" fill="none" stroke="${oscuro ? "#F4E6E0" : mezclar(linea, TINTA, 0.5)}" stroke-width="1.8" stroke-linecap="round"/>`
    );

    // Orejas caídas (van delante de la cabeza)
    if (L.orejas === "caidas") p.push(orejaCaida(-1), orejaCaida(1));
    if (L.orejas === "una") p.push(orejaCaida(1));

    const titulo = opciones.titulo ? `<title>${opciones.titulo}</title>` : "";
    const rol = opciones.titulo ? 'role="img"' : 'aria-hidden="true"';
    return `<svg class="conejo ${opciones.clase || ""}" viewBox="0 0 200 200" ${rol} focusable="false">${titulo}${p.join("")}</svg>`;
  }

  window.Conejo = { svg, mezclar };
})();
