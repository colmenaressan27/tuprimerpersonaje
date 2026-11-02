/* Personajes guardados en este dispositivo. Cada uno ocupa su propia clave, porque con imagen pueden pesar bastante;
   el índice guarda lo justo para pintar la lista sin abrirlos todos. Sin DOM, se prueba con Node. */
(function (P) {
  const INDICE = 'tpp.indice', PREFIJO = 'tpp.pj.', ANTIGUO = 'tpp.estado';
  const leer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const indice = () => leer(INDICE) || { actual: null, lista: [] };

  function resumen(id, estado) {
    const pj = estado.pj, c = P.calcular(pj);
    return { id, nombre: pj.nombre || '', sub: [c.nombreRaza, c.clase && c.clase.nombre].filter(Boolean).join(' · '), icono: c.clase ? c.clase.icono : c.raza ? c.raza.icono : 'd20', color: c.clase ? c.clase.color : '', mini: pj.retratoMini || '', fecha: Date.now() };
  }

  P.guardados = {
    nuevoId: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    lista: () => indice().lista.slice().sort((a, b) => b.fecha - a.fecha),
    abrir(id) { const e = leer(PREFIJO + id); return e && e.pj ? e : null; },
    // Devuelve el personaje con el que se estaba trabajando. Trae al nuevo sistema el que vivía en una sola clave.
    iniciar() {
      const viejo = leer(ANTIGUO);
      if (viejo && viejo.pj && !leer(INDICE)) {
        const id = P.guardados.nuevoId();
        viejo.pj = Object.assign(P.pjVacio(), viejo.pj);
        if (P.guardados.guardar(id, viejo)) { try { localStorage.removeItem(ANTIGUO); } catch (e) { /* sin almacenamiento */ } }
      }
      const { actual } = indice(), estado = actual ? P.guardados.abrir(actual) : null;
      return estado ? { id: actual, estado } : null;
    },
    // Devuelve false si no cupo: el navegador da unos 5 MB por sitio y las imágenes los gastan
    guardar(id, estado) {
      if (!escribir(PREFIJO + id, estado)) return false;
      const i = indice();
      i.lista = i.lista.filter((x) => x.id !== id).concat(resumen(id, estado));
      i.actual = id;
      return escribir(INDICE, i);
    },
    fijarActual(id) { const i = indice(); i.actual = id; escribir(INDICE, i); },
    eliminar(id) {
      try { localStorage.removeItem(PREFIJO + id); } catch (e) { /* sin almacenamiento */ }
      const i = indice();
      i.lista = i.lista.filter((x) => x.id !== id);
      if (i.actual === id) i.actual = null;
      escribir(INDICE, i);
    },
  };
})(window.PJ);
