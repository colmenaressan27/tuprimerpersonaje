/* Realidad aumentada de los dados. En cualquier celular, los dados caen sobre la imagen de la cámara.
   Donde el navegador lo permite (hoy, Android con Chrome), WebXR los deja además fijos sobre la mesa real.
   El iPhone no ofrece WebXR en Safari: ahí solo está el modo cámara. */
(function (P) {
  const $ = (id) => document.getElementById(id);
  const ESCALA_MESA = 0.03; // un dado de la escena mide unos 2 de ancho: queda en unos 6 cm reales
  let flujo = null;

  const ra = {
    activa: false,
    hayCamara: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false,
    async encender() {
      if (flujo) return;
      flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      const v = $('ra-video');
      v.srcObject = flujo;
      await v.play();
    },
    apagar() {
      if (flujo) flujo.getTracks().forEach((t) => t.stop());
      flujo = null;
      const v = $('ra-video');
      if (v) v.srcObject = null;
    },
    motivo(e) {
      if (e && e.name === 'NotAllowedError') return 'No diste permiso para usar la cámara. Puedes activarlo en los ajustes del navegador.';
      if (e && e.name === 'NotFoundError') return 'No encontré ninguna cámara en este dispositivo.';
      return 'No se pudo abrir la cámara.';
    },
    async hayMesa() {
      try { return !!navigator.xr && await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) { return false; }
    },

    /* Sesión anclada a la mesa. Primero se apunta a una superficie y se toca para fijarla; después, cada toque lanza.
       pedirTiro devuelve { dados: [lados], suma }. Debe llamarse desde un toque del usuario: lo exige WebXR. */
    async abrirMesa(pedirTiro) {
      const T = window.THREE, capa = $('ra-capa'), texto = $('ra-texto');
      const sesion = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: capa } });
      capa.hidden = false;
      texto.textContent = 'Apunta a tu mesa hasta ver el círculo y toca la pantalla.';

      const renderer = new T.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(sesion);

      const escena = new T.Scene(), camara = new T.PerspectiveCamera();
      P.dados3d.xr.montarEntorno(renderer, escena);
      const luz = new T.DirectionalLight(0xfff0d8, 1.6);
      luz.position.set(-0.3, 1, 0.4); luz.castShadow = true;
      escena.add(luz, new T.AmbientLight(0xffffff, 0.4));

      const mesa = new T.Group();
      mesa.visible = false; mesa.scale.setScalar(ESCALA_MESA);
      const sombra = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({ opacity: 0.35 }));
      sombra.rotation.x = -Math.PI / 2; sombra.receiveShadow = true;
      mesa.add(sombra);
      escena.add(mesa);

      // La mira se dibuja en un lienzo porque el paquete de Three.js no incluye geometría de anillo
      const dibujo = document.createElement('canvas');
      dibujo.width = dibujo.height = 128;
      const x = dibujo.getContext('2d');
      x.strokeStyle = '#F6DD97'; x.lineWidth = 10;
      x.beginPath(); x.arc(64, 64, 48, 0, Math.PI * 2); x.stroke();
      const planoMira = new T.PlaneGeometry(0.16, 0.16);
      planoMira.rotateX(-Math.PI / 2);
      const mira = new T.Mesh(planoMira, new T.MeshBasicMaterial({ map: new T.CanvasTexture(dibujo), transparent: true }));
      mira.matrixAutoUpdate = false; mira.visible = false;
      escena.add(mira);

      const espacio = await sesion.requestReferenceSpace('viewer');
      const fuente = await sesion.requestHitTestSource({ space: espacio });
      let tiro = null;

      sesion.addEventListener('select', () => {
        if (!mesa.visible) {
          if (!mira.visible) return;
          mesa.position.setFromMatrixPosition(mira.matrix);
          mesa.visible = true; mira.visible = false;
          texto.textContent = 'Toca la pantalla para lanzar.';
          return;
        }
        if (tiro && !tiro.listo) return;
        if (tiro) tiro.dados.forEach((d) => mesa.remove(d.dado));
        const { dados, suma } = pedirTiro();
        const lista = P.dados3d.xr.expandir(dados.map((lados) => ({ lados })));
        const valores = dados.map((_, i) => lista.find((d) => d.idx === i).valor);
        tiro = { dados: P.dados3d.xr.crearTiro(lista, mesa), inicio: performance.now(), valores, suma, listo: false };
        texto.textContent = 'Lanzando…';
      });

      renderer.setAnimationLoop((ahora, marco) => {
        if (marco && !mesa.visible) {
          const hit = marco.getHitTestResults(fuente)[0];
          const pose = hit && hit.getPose(renderer.xr.getReferenceSpace());
          mira.visible = !!pose;
          if (pose) mira.matrix.fromArray(pose.transform.matrix);
        }
        if (tiro && !tiro.listo && !P.dados3d.xr.moverDados(tiro.dados, performance.now(), tiro.inicio)) {
          tiro.listo = true;
          const total = tiro.valores.reduce((a, b) => a + b, 0) + tiro.suma;
          texto.textContent = `${tiro.valores.join(' + ')}${tiro.suma ? ' ' + P.signo(tiro.suma) : ''} = ${total}. Toca para lanzar otra vez.`;
        }
        renderer.render(escena, camara);
      });

      const salir = () => sesion.end().catch(() => null);
      $('ra-salir').onclick = salir;
      sesion.addEventListener('end', () => {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        capa.hidden = true;
      });
    },
  };
  P.ra = ra;
})(window.PJ);
