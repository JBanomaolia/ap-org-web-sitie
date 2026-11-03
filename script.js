// ==========================================
// script.js - MOTOR DE LA LANDING PAGE AP ORG
// ==========================================

let dataComunidad = null; // Variable global para guardar el JSON

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Control del Menú Desplegable ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }

    // --- 2. Carga de JSON e inyección en cajas ---
    fetch('miembros.json')
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el archivo miembros.json");
            return response.json();
        })
        .then(data => {
            dataComunidad = data; // Almacenamos para el Modal

            // Suma de Descargas
            if (data.cantidad_de_descargas_jurassic_fences) {
                const totalDescargas = Object.values(data.cantidad_de_descargas_jurassic_fences).reduce((acc, curr) => acc + curr, 0);
                document.getElementById('stat-downloads').textContent = totalDescargas.toLocaleString();
            }

            // Total de miembros Discord
            if (data.cantidad_de_miembros_de_discord && data.cantidad_de_miembros_de_discord.miembros) {
                document.getElementById('stat-discord').textContent = data.cantidad_de_miembros_de_discord.miembros.toLocaleString();
            }

            // Total Patreons Activos
            if (data.miembros_de_patron) {
                const p = data.miembros_de_patron;
                const totalPatreon = (p.comun?.length || 0) + (p.raro?.length || 0) + (p.muy_raro?.length || 0) + (p.legendario?.length || 0) + (p.epico?.length || 0);
                document.getElementById('stat-patreon').textContent = totalPatreon;
            }

            // Total de Colaboradores
            if (data.miembros_de_jb_anomalias && data.miembros_de_jb_anomalias.colaboradores) {
                const c = data.miembros_de_jb_anomalias;
                const totalCollabs = (c.apoyo?.length || 0) + (c.colaboradores?.length || 0) + (c.platino?.length || 0) + (c.oro?.length || 0) + (c.diamante?.length || 0);
                document.getElementById('stat-collabs').textContent = totalCollabs;
            }
        })
        .catch(error => console.error("Error al obtener las estadísticas:", error));

    // --- 3. Lógica del Modal Interactivo ---
    const modal = document.getElementById('stat-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    function openModal(type) {
        if (!dataComunidad) return;
        modalBody.innerHTML = ''; 
        let html = '<ul>';

        switch(type) {
            case 'descargas':
                modalTitle.textContent = 'Historial de Descargas de Vallas Jurásicas';
                for (const [version, descargas] of Object.entries(dataComunidad.cantidad_de_descargas_jurassic_fences)) {
                    html += `<li><span>Versión ${version}</span> <span class="badge">${descargas}</span></li>`;
                }
                break;

            case 'discord':
                modalTitle.textContent = 'Roles de la Comunidad en Discord';
                for (const [rol, cantidad] of Object.entries(dataComunidad.cantidad_de_miembros_de_discord)) {
                    let nombreRol = rol.replace(/_/g, ' ').toUpperCase();
                    html += `<li><span>${nombreRol}</span> <span class="badge">${cantidad}</span></li>`;
                }
                break;

            case 'patreon':
                modalTitle.textContent = 'Suscriptores Activos en Patreon';
                for (const [rango, usuarios] of Object.entries(dataComunidad.miembros_de_patron)) {
                    let nombreRango = rango.replace('_', ' ').toUpperCase();
                    html += `<li class="detail-list">
                                <strong>RANGO ${nombreRango}</strong>
                                <span>${usuarios.length > 0 ? usuarios.join(', ') : '<span class="text-muted">Ninguno</span>'}</span>
                             </li>`;
                }
                break;

            case 'colaboradores':
                modalTitle.textContent = 'Miembros y Colaboradores Oficiales';
                for (const [rango, usuarios] of Object.entries(dataComunidad.miembros_de_jb_anomalias)) {
                    let nombreRango = rango.toUpperCase();
                    html += `<li class="detail-list">
                                <strong>${nombreRango}</strong>
                                <span>${usuarios.length > 0 ? usuarios.join(', ') : '<span class="text-muted">Ninguno</span>'}</span>
                             </li>`;
                }
                break;
        }

        html += '</ul>';
        modalBody.innerHTML = html;
        modal.classList.add('active');
    }

    // Eventos Click para abrir Modal
    document.getElementById('card-downloads')?.addEventListener('click', () => openModal('descargas'));
    document.getElementById('card-discord')?.addEventListener('click', () => openModal('discord'));
    document.getElementById('card-patreon')?.addEventListener('click', () => openModal('patreon'));
    document.getElementById('card-collabs')?.addEventListener('click', () => openModal('colaboradores'));

    // Eventos para cerrar Modal
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});
