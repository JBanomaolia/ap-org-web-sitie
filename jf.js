// =================================================================
// ARCHIVO: jf.js
// MOTOR DE BASE DE DATOS: VALLAS JURÁSICAS 3.0 (EDICIÓN ROBUSTA)
// AUTORIZACIÓN: AP ORG
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Motor Vallas Jurásicas 3.0: Sistemas y Base de Datos en línea.");

    // =============================================================
    // 1. NAVEGACIÓN Y REFERENCIAS DE PANTALLA
    // =============================================================
    const views = {
        step1: document.getElementById('step-1'),
        step2: document.getElementById('step-2'),
        step3: document.getElementById('step-3'),
        step4: document.getElementById('step-4')
    };

    function switchView(from, to) {
        if (from) { from.classList.remove('view-active'); from.classList.add('view-past'); }
        if (to) { to.classList.remove('view-future', 'view-past'); to.classList.add('view-active'); }
    }

    document.getElementById('btn-conectar')?.addEventListener('click', () => switchView(views.step1, views.step2));
    document.getElementById('btn-volver-sector')?.addEventListener('click', () => switchView(views.step3, views.step2));
    document.getElementById('btn-sistemas-vallas')?.addEventListener('click', () => { 
        cargarVallas(); 
        cargarTutorialFunciones();
        switchView(views.step3, views.step4); 
    });
    document.getElementById('btn-volver-dinos')?.addEventListener('click', () => switchView(views.step4, views.step2));

    // Menú Superior
    document.getElementById('nav-inicio')?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(document.querySelector('.view.view-active'), views.step1);
    });
    document.getElementById('nav-vallas')?.addEventListener('click', (e) => {
        e.preventDefault();
        cargarVallas();
        cargarTutorialFunciones();
        switchView(document.querySelector('.view.view-active'), views.step4);
    });

    const tituloSector = document.getElementById('current-sector-title');
    document.querySelectorAll('.hub-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sectorElegido = e.currentTarget.getAttribute('data-sector'); 
            if (sectorElegido === 'VALLAS') {
                cargarVallas();
                cargarTutorialFunciones();
                switchView(views.step2, views.step4);
            } else {
                if (tituloSector) tituloSector.innerText = `SECTOR ${sectorElegido}`;
                cargarEspeciesPorSector(sectorElegido);
                switchView(views.step2, views.step3);
            }
        });
    });

    // =============================================================
    // 2. CONFIGURACIÓN DE VARIABLES GLOBALES Y DB
    // =============================================================
    let dinosJSON = null;
    let vallasJSON = null;
    const sectoresDB = { "CIELO": {}, "MAR": {}, "TIERRA": {} };

    const DOM_listaDinos = document.getElementById('dino-list-container');
    const DOM_hojaDatos = document.getElementById('active-data-sheet');
    const DOM_listaVariantes = document.getElementById('variants-list-container');

    // Aplicar Marcos Tactical HUD a los contenedores principales
    [DOM_listaDinos, DOM_hojaDatos, DOM_listaVariantes].forEach(el => {
        if (el) el.classList.add('hud-corner-box');
    });

    // FILTRO DE BÚSQUEDA EN VIVO
    document.getElementById('dino-search-input')?.addEventListener('input', (e) => {
        const termino = e.target.value.trim().toLowerCase();
        const botonesDino = DOM_listaDinos ? DOM_listaDinos.querySelectorAll('.dino-selector-btn') : [];
        let resultadosEncontrados = 0;

        botonesDino.forEach(btn => {
            const terminosBusqueda = btn.getAttribute('data-search-terms') || '';
            if (terminosBusqueda.includes(termino)) {
                btn.style.display = 'flex';
                resultadosEncontrados++;
            } else {
                btn.style.display = 'none';
            }
        });

        let avisoVacio = document.getElementById('no-search-results-msg');
        if (resultadosEncontrados === 0 && botonesDino.length > 0) {
            if (!avisoVacio && DOM_listaDinos) {
                avisoVacio = document.createElement('p');
                avisoVacio.id = 'no-search-results-msg';
                avisoVacio.style.cssText = 'color:#ff4500; font-size:12px; padding:10px; text-align:center; font-style:italic;';
                avisoVacio.innerText = '⚠️ No se encontró ningún espécimen.';
                DOM_listaDinos.appendChild(avisoVacio);
            }
        } else if (avisoVacio) {
            avisoVacio.remove();
        }
    });

    // =============================================================
    // 3. CARGA ASÍNCRONA INDEPENDIENTE
    // =============================================================
    const mostrarError = (msg) => {
        if (DOM_listaDinos) {
            DOM_listaDinos.innerHTML = `<p style="color:#ff3333; font-size:13px; padding:10px; background:rgba(255,0,0,0.1); border-radius:5px;">⚠️ ${msg}</p>`;
        }
    };

    // 3A. Cargar dinosaurios
    try {
        const dinosResponse = await fetch('dinos.json');
        if (dinosResponse.ok) {
            dinosJSON = await dinosResponse.json();
            procesarBaseDeDatos();
        } else {
            mostrarError(`No se encontró dinos.json (Error ${dinosResponse.status}).`);
        }
    } catch (error) {
        console.error("❌ ERROR CRÍTICO AL CARGAR dinos.json:", error);
        mostrarError("Error de lectura. Activa el Servidor Interno en los ajustes de Acode.");
    }

    // 3B. Cargar vallas
    try {
        const vallasResponse = await fetch('vallas.json');
        if (vallasResponse.ok) {
            vallasJSON = await vallasResponse.json();
        } else {
            console.warn("⚠️ No se encontró vallas.json.");
        }
    } catch (error) {
        console.warn("⚠️ No se pudo cargar vallas.json.");
    }

    // =============================================================
    // 4. PROCESAMIENTO INTELIGENTE DE DINOSAURIOS
    // =============================================================
    function procesarBaseDeDatos() {
        if (!dinosJSON) return;
        const dinosArray = Array.isArray(dinosJSON) ? dinosJSON : Object.values(dinosJSON);

        dinosArray.forEach((dino, index) => {
            if (!dino) return;
            let nombreCompleto = dino.nombre || dino.Nombre || `Espécimen Indefinido #${index}`;
            let especieBase = nombreCompleto.split(" ")[0] || "AP_NULO";
            if (especieBase.toUpperCase() === "CRIATURA") especieBase = "AP_NULO";

            let familia = dino.familia || dino.Familia || "";
            let sector = dino.sector || "TIERRA"; 
            
            if (!sectoresDB[sector]) sectoresDB[sector] = {};
            if (!sectoresDB[sector][especieBase]) {
                sectoresDB[sector][especieBase] = { nombreBase: especieBase, variantes: [] };
            }

            let rareza = dino.rareza || dino.Rareza || "Común";
            let precio = "50 BILLETES";
            if (rareza === "Muy Raro") precio = "120 BILLETES";
            else if (rareza === "Épico") precio = "200 MINECOINS";
            else if (rareza === "Legendario") precio = "500 MINECOINS";
            else if (rareza === "Mítico") precio = "1000 MINECOINS";

            const dinoSanitizado = {
                nombre: nombreCompleto,
                familia: familia || "Clasificación Pendiente",
                dieta: dino.dieta || dino.Dieta || "Omnívoro",
                rareza: rareza,
                costoFormateado: precio,
                colorHex: dino.colorHex || dino.color || "#00ffcc",
                icon: dino.icon || dino.icono || "imagenes/dinos/default_icon.png",
                img: dino.img || dino.imagen || "imagenes/dinos/default_dino.png",
                lugar: dino.lugar || dino.ubicacion || "Isla Nublar",
                lat: parseFloat(dino.lat) || 0,
                lon: parseFloat(dino.lon) || 0,
                info: dino.info || dino.descripcion || "Sin análisis biológico en el registro.",
                modelo3d: dino.modelo3d || dino.modelo || null
            };

            sectoresDB[sector][especieBase].variantes.push(dinoSanitizado);
        });
    }

    // =============================================================
    // 5. RENDERIZADO DINÁMICO DE ESPECIES Y ESTADÍSTICAS
    // =============================================================
    function cargarEspeciesPorSector(sector) {
        if (!DOM_listaDinos) return;
        DOM_listaDinos.innerHTML = '';
        if (DOM_listaVariantes) DOM_listaVariantes.innerHTML = '<p class="placeholder-text">Seleccione un espécimen base...</p>';
        if (DOM_hojaDatos) DOM_hojaDatos.innerHTML = '<div class="sheet-notice">Esperando decodificación de ADN...</div>';
        renderizarModelo3D(null);

        const searchInput = document.getElementById('dino-search-input');
        if (searchInput) searchInput.value = '';

        const especiesDelSector = sectoresDB[sector];
        
        if (!especiesDelSector || Object.keys(especiesDelSector).length === 0) {
            DOM_listaDinos.innerHTML = `<p style="color:#aaa; font-size:12px; padding:10px;">⚠️ No hay especímenes registrados en el sector ${sector}.</p>`;
            return;
        }

        const listaEspecies = Object.values(especiesDelSector);
        const totalEspecies = listaEspecies.length;
        let totalVariantes = 0;
        let totalAltaRareza = 0;

        listaEspecies.forEach(e => {
            totalVariantes += e.variantes.length;
            totalAltaRareza += e.variantes.filter(v => ["Épico", "Legendario", "Mítico"].includes(v.rareza)).length;
        });

        const statsBar = document.createElement('div');
        statsBar.className = 'sector-stats-bar hud-corner-box';
        statsBar.innerHTML = `
            <div class="stat-item">
                <span>BASES</span>
                <span class="stat-value">${totalEspecies}</span>
            </div>
            <div class="stat-item">
                <span>VARIANTES</span>
                <span class="stat-value" style="color:#00ff88;">${totalVariantes}</span>
            </div>
            <div class="stat-item">
                <span>RAROS+</span>
                <span class="stat-value" style="color:#ffaa00;">${totalAltaRareza}</span>
            </div>
        `;
        DOM_listaDinos.appendChild(statsBar);

        listaEspecies.forEach(especieObj => {
            const btn = document.createElement('button');
            btn.className = 'dino-selector-btn';
            
            const nombresVariantes = especieObj.variantes.map(v => v.nombre.toLowerCase()).join(' ');
            btn.setAttribute('data-search-terms', `${especieObj.nombreBase.toLowerCase()} ${nombresVariantes}`);

            const iconoBase = especieObj.variantes[0]?.icon || 'imagenes/dinos/default_icon.png';
            
            btn.innerHTML = `
                <img src="${iconoBase}" class="dino-mini-icon" style="width:20px; height:20px; margin-right:8px; vertical-align:middle; object-fit:contain;" onerror="this.src='imagenes/dinos/default_icon.png'">
                <span>${especieObj.nombreBase}</span>
            `;
            btn.addEventListener('click', () => renderizarVariantes(especieObj));
            DOM_listaDinos.appendChild(btn);
        });
    }

    function renderizarVariantes(especieObj) {
        if (!DOM_listaVariantes) return;
        DOM_listaVariantes.innerHTML = `<h3 style="margin-top:0; font-size:14px; color:var(--accent-color);">Variantes: ${especieObj.nombreBase}</h3>`;
        if (DOM_hojaDatos) DOM_hojaDatos.innerHTML = '<div class="sheet-notice">Seleccione una variante para analizar.</div>';
        renderizarModelo3D(null);

        especieObj.variantes.forEach(variante => {
            const divVar = document.createElement('div');
            const colorMoneda = variante.costoFormateado.includes('MINECOINS') ? '#ffaa00' : '#00ff88';
            
            divVar.style.cssText = `background:rgba(0,0,0,0.3); border-left: 4px solid ${variante.colorHex}; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; transition: 0.2s; border-radius: 4px;`;
            divVar.innerHTML = `
                <span style="font-size:13px; font-weight:bold;">${variante.nombre}</span>
                <span style="color:${colorMoneda}; font-size:11px; font-weight:bold;">[ ${variante.costoFormateado} ]</span>
            `;
            
            divVar.onmouseover = () => divVar.style.background = 'rgba(255,255,255,0.1)';
            divVar.onmouseout = () => divVar.style.background = 'rgba(0,0,0,0.3)';
            divVar.onclick = () => mostrarFichaCompleta(variante);

            DOM_listaVariantes.appendChild(divVar);
        });
    }

    // =============================================================
    // 6. EFECTO VISUAL DE ESCANEO LÁSER
    // =============================================================
    function ejecutarEfectoEscaneo() {
        if (!DOM_hojaDatos) return;

        const escaneoPrevio = DOM_hojaDatos.querySelector('.scan-line-overlay');
        if (escaneoPrevio) escaneoPrevio.remove();

        const rayoLaser = document.createElement('div');
        rayoLaser.className = 'scan-line-overlay';
        DOM_hojaDatos.appendChild(rayoLaser);

        DOM_hojaDatos.classList.remove('data-sheet-glow');
        void DOM_hojaDatos.offsetWidth;
        DOM_hojaDatos.classList.add('data-sheet-glow');

        setTimeout(() => {
            rayoLaser.remove();
        }, 800);
    }

    // =============================================================
    // 7. FICHA TÉCNICA COMPLETA Y CONEXIÓN 3D
    // =============================================================
    function mostrarFichaCompleta(dinoData) {
        if (!DOM_hojaDatos) return;
        
        const estaEnFullScreen = DOM_hojaDatos.classList.contains('fullscreen-mode');

        DOM_hojaDatos.innerHTML = `
            <button id="btn-toggle-fullscreen" class="fullscreen-toggle-btn">
                ${estaEnFullScreen ? '🗗 Restaurar' : '🗖 Pantalla Completa'}
            </button>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 15px; margin-bottom: 15px; padding-right: 35px;">
                <div>
                    <h2 style="margin: 0; color: ${dinoData.colorHex}; font-size: 20px;">${dinoData.nombre}</h2>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #ccc;">Familia: ${dinoData.familia}</p>
                </div>
                <img src="${dinoData.icon}" alt="Icono" style="width: 45px; height: 45px; object-fit: contain; background: rgba(0,0,0,0.5); border-radius: 8px; padding: 5px;" onerror="this.src='imagenes/dinos/default_icon.png'">
            </div>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <span style="background:var(--accent-color); color:#000; padding:4px 10px; border-radius:4px; font-weight:bold; font-size:11px;">${dinoData.dieta}</span>
                <span style="border:1px solid ${dinoData.colorHex}; color: ${dinoData.colorHex}; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:bold;">Rareza: ${dinoData.rareza}</span>
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 140px; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px; text-align: center;">
                    <img src="${dinoData.img}" alt="${dinoData.nombre}" style="max-width: 100%; max-height: 180px; object-fit: contain;" onerror="this.src='imagenes/dinos/default_dino.png'">
                </div>
                <div style="flex: 1; min-width: 140px; display: flex; flex-direction: column; justify-content: center;">
                    <h4 style="color: var(--accent-color); margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase;">Ubicación de Extracción</h4>
                    <p style="margin: 0; font-size: 14px; font-weight: bold;">${dinoData.lugar}</p>
                    <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 12px; background: #000; padding: 5px; border-left: 3px solid ${dinoData.colorHex};">
                        LAT: ${dinoData.lat} <br> LON: ${dinoData.lon}
                    </p>
                </div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 13px;">Análisis Biológico</h4>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #ddd;">${dinoData.info}</p>
            </div>
        `;

        if (estaEnFullScreen) {
            DOM_hojaDatos.classList.add('fullscreen-mode');
        }

        const btnFullscreen = document.getElementById('btn-toggle-fullscreen');
        btnFullscreen?.addEventListener('click', () => {
            DOM_hojaDatos.classList.toggle('fullscreen-mode');
            const esActivo = DOM_hojaDatos.classList.contains('fullscreen-mode');
            btnFullscreen.innerText = esActivo ? '🗗 Restaurar' : '🗖 Pantalla Completa';
        });

        // Carga dinámicamente el modelo 3D (soporta allosaurus.gltf de prueba)
        const archivo3D = dinoData.modelo3d || (dinoData.nombre.toLowerCase().includes('allosaurus') ? 'allosaurus.gltf' : null);
        renderizarModelo3D(archivo3D);

        ejecutarEfectoEscaneo();
    }

    // =============================================================
    // 8. RENDERIZADO DE SISTEMAS DE VALLAS
    // =============================================================
    function cargarVallas() {
        const DOM_listaVallas = document.getElementById('vallas-list-container');
        const DOM_fichaValla = document.getElementById('active-valla-sheet');
        if (!DOM_listaVallas) return;
        
        DOM_listaVallas.innerHTML = '';
        if (DOM_fichaValla) DOM_fichaValla.innerHTML = '<div class="sheet-notice">Seleccione un sistema de contención...</div>';

        if (!vallasJSON) {
            DOM_listaVallas.innerHTML = '<p style="color:#aaa; font-size:12px; padding:10px;">⚠️ Archivo vallas.json no detectado.</p>';
            return;
        }

        const vallasArray = Array.isArray(vallasJSON) ? vallasJSON : Object.values(vallasJSON);

        vallasArray.forEach((valla, index) => {
            if (!valla) return;
            let nombreValla = valla.nombre || valla.Nombre || `Valla Mod # ${index}`;

            const btn = document.createElement('button');
            btn.className = 'dino-selector-btn';
            btn.innerText = nombreValla;
            btn.addEventListener('click', () => {
                if (!DOM_fichaValla) return;
                DOM_fichaValla.innerHTML = `
                    <h2 style="color: #ffaa00; font-size: 18px; margin-top:0;">${nombreValla}</h2>
                    <div style="display:flex; gap:10px; margin-bottom:12px;">
                        <span style="background:#444; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px;">Seguridad: ${(valla.seguridad || 'N/A').toUpperCase()}</span>
                        <span style="background:#a00; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px;">Peligro: ${(valla.peligro || 'N/A').toUpperCase()}</span>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 12px;">
                        <img src="${valla.imagen || valla.img || 'imagenes/default_valla.png'}" alt="${nombreValla}" style="max-width: 100%; max-height: 150px; object-fit: contain;" onerror="this.src='imagenes/default_valla.png'">
                    </div>
                    <p style="font-size: 13px; margin: 5px 0;"><strong>Costo:</strong> <span style="color:#00ff88;">${valla.costo || 'Libre'}</span></p>
                    <p style="font-size: 13px; margin: 5px 0;"><strong>Daño Eléctrico:</strong> ${valla.daño || 'Ninguno'}</p>
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-top: 10px;">
                        <h4 style="margin: 0 0 5px 0; font-size: 12px; color:#fff;">Especificaciones Técnicas</h4>
                        <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #ddd;">${valla.info || 'Sin detalles extra.'}</p>
                    </div>
                `;
            });
            DOM_listaVallas.appendChild(btn);
        });
    }

    // =============================================================
    // 9. CARGAR TUTORIAL DESDE funciones.json
    // =============================================================
    async function cargarTutorialFunciones() {
        const contenedor = document.getElementById('tutorial-container');
        if (!contenedor) return;

        contenedor.innerHTML = '<p class="sheet-notice">Cargando guía de construcción...</p>';

        try {
            const response = await fetch('funciones.json');
            if (!response.ok) throw new Error("No se pudo encontrar funciones.json");
            
            const data = await response.json();
            const tutorial = data.tutorial_construccion_vallas;

            let html = `
                <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,170,0,0.3); border-radius: 10px; padding: 15px; margin-top: 15px; backdrop-filter: blur(5px);">
                    <h3 style="color: #ffaa00; margin-top: 0; font-size: 16px;">📖 ${tutorial.titulo}</h3>
                    <p style="font-size: 12px; color: #ccc; line-height: 1.4; margin-bottom: 12px;">${tutorial.descripcion}</p>
                    
                    <h4 style="color: #00ff88; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">Fases de Construcción:</h4>
            `;

            tutorial.fases.forEach(fase => {
                html += `
                    <div style="background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #ffaa00;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; color: #fff;">
                            <span>Fase ${fase.fase}: ${fase.nombre}</span>
                            <span style="color: #ffaa00; font-size: 10px; background: rgba(0,0,0,0.4); padding: 2px 5px; border-radius: 4px;">⏱️ ${fase.timestamp}</span>
                        </div>
                        <p style="font-size: 11px; color: #ddd; margin: 4px 0 0 0; line-height: 1.3;">${fase.descripcion}</p>
                    </div>
                `;
            });

            const req = tutorial.requisitos_recinto_nivel_1;
            html += `
                    <h4 style="color: #00ff88; font-size: 13px; margin-top: 15px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">Requisitos Recinto Nivel 1:</h4>
                    <p style="font-size: 11px; color: #ccc; margin-bottom: 6px; line-height: 1.3;">${req.descripcion}</p>
                    <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #ddd; line-height: 1.4;">
            `;

            req.materiales_y_estructura.forEach(mat => {
                html += `<li style="margin-bottom: 4px;">${mat}</li>`;
            });

            html += `
                    </ul>
                </div>
            `;

            contenedor.innerHTML = html;

        } catch (error) {
            console.error("Error al cargar funciones.json:", error);
            contenedor.innerHTML = '<p style="color: #ff3333; font-size: 11px; padding: 8px; background: rgba(255,0,0,0.1); border-radius: 5px;">⚠️ No se pudo cargar la guía de funciones.</p>';
        }
    }

    // =============================================================
    // 10. MOTOR DE PARTÍCULAS (FX CANVAS)
    // =============================================================
    const canvas = document.getElementById('fx-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particulas = [];
        const ajustar = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', ajustar);
        ajustar();
        for(let i=0; i<30; i++) {
            particulas.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, radio: Math.random()*1.5+0.5, velY: -(Math.random()*0.3+0.1) });
        }
        function animar() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 255, 200, 0.4)';
            particulas.forEach(p => {
                p.y += p.velY;
                if(p.y < 0) p.y = canvas.height;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, Math.PI*2); ctx.fill();
            });
            requestAnimationFrame(animar);
        }
        animar();
    }
});

// =============================================================
// 11. CONTROLADOR GLOBAL DEL VISOR 3D (MODEL-VIEWER)
// =============================================================
function renderizarModelo3D(archivoModelo) {
    const container = document.getElementById('dino-3d-viewer-container');
    const viewer = document.getElementById('dino-model-viewer');

    if (!container || !viewer) return;

    if (archivoModelo) {
        viewer.setAttribute('src', `models/${archivoModelo}`);
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
        viewer.removeAttribute('src');
    }
}
