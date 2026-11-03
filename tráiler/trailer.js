document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('trailer-audio');
    
    // Pantallas
    const screenStart = document.getElementById('screen-start');
    const screenTrailer = document.getElementById('screen-trailer');
    const screenEnd = document.getElementById('screen-end');

    // Botones
    const btnStart = document.getElementById('btn-start-trailer');
    const btnReplay = document.getElementById('btn-replay');

    // Elementos de visualización
    const lyricText = document.getElementById('lyric-text');
    const slides = document.querySelectorAll('.slide');

    let currentSlide = 0;
    let slideInterval = null;

    // MARCAS DE TIEMPO EXACTAS CON LA CANCIÓN ("REGRESO A LAS 5 MUERTES")
    const lyricsData = [
        { time: 14.0, text: "El mundo cambió, el orden se ha quebrado..." },
        { time: 21.0, text: "¡Cielo, mar y tierra, todo ha sido reclamado!" },
        { time: 27.0, text: "Desde las nubes hasta el abismo más profundo..." },
        { time: 31.0, text: "Antiguos señores dominan el mundo..." },
        { time: 34.0, text: "Pero hay Nueva Zelanda, un bastión resiste..." },
        { time: 37.0, text: "Donde el Equipo AP, el destino desviste..." },
        { time: 41.0, text: "Bajo el mando firme del Líder Carmesí," },
        { time: 43.0, text: "El acero y la furia se encuentran aquí." },
        { time: 45.0, text: "¡Alza las vallas jurásicas, muros de contención!" },
        { time: 51.0, text: "Frenando el avance de la destrucción..." },
        { time: 54.0, text: "Reportan anomalías en progreso en el radar..." },
        { time: 59.0, text: "Sombras invisibles que acechan sin cesar..." },
        { time: 65.0, text: "No los puedes ver, pero están al acecho..." },
        { time: 68.0, text: "El aire se agita, el miedo en el pecho..." },
        { time: 71.0, text: "Escamas que cambian, imitan la flora..." },
        { time: 74.0, text: "¡El Carnotaurus espera su hora!" },
        { time: 80.0, text: "¡Cuidado con la sombra que se sabe camuflar!" },
        { time: 83.0, text: "¡El depredador Apex te va a encontrar!" },
        { time: 86.0, text: "Del cielo al abismo, la orden es fuerte:" },
        { time: 90.0, text: "¡QUE VUELVAN TODOS A LAS CINCO MUERTES!" },
        { time: 97.0, text: "Invisible en el bosque, un cazador letal..." },
        { time: 99.0, text: "Borrando la línea entre el bien y el mal..." },
        { time: 103.0, text: "El Equipo AP no retrocederá..." },
        { time: 106.0, text: "Aunque el depredador frente a ellos está..." },
        { time: 109.0, text: "Rumbo al archipiélago, el transporte espera..." },
        { time: 111.0, text: "Para encerrar de nuevo a la bestia de fuera..." },
        { time: 120.0, text: "Cruzan el océano dejando atrás el miedo..." },
        { time: 124.0, text: "Envolviendo al monstruo en un letal enredo..." },
        { time: 127.0, text: "Las vallas se cierran, la trampa está lista..." },
        { time: 130.0, text: "¡Borrando al gigante de nuestra vista!" },
        { time: 136.0, text: "¡Cuidado con la sombra que se sabe camuflar!" },
        { time: 139.0, text: "¡El depredador Apex te va a encontrar!" },
        { time: 142.0, text: "Del cielo al abismo, la orden es fuerte:" },
        { time: 146.0, text: "¡QUE VUELVAN TODOS A LAS CINCO MUERTES!" },
        { time: 149.0, text: "¡Anomalías contenidas!" },
        { time: 152.0, text: "¡Lidel Carmesí!" },
        { time: 154.0, text: "¡Cambio y fuera!" },
        { time: 156.0, text: "¡EL ARCHIPIÉLAGO VUELVE A RUGIR!" }
    ];

    // Cambiar de vista
    function showScreen(screenToShow) {
        [screenStart, screenTrailer, screenEnd].forEach(s => s.classList.remove('active'));
        screenToShow.classList.add('active');
    }

    // Rotación de las 4 imágenes
    function startSlideshow() {
        slides.forEach(s => s.classList.remove('active'));
        currentSlide = 0;
        if (slides.length > 0) slides[0].classList.add('active');

        slideInterval = setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 6000);
    }

    function stopSlideshow() {
        if (slideInterval) clearInterval(slideInterval);
    }

    // Iniciar tráiler
    function startTrailer() {
        showScreen(screenTrailer);
        lyricText.innerText = "...";
        audio.currentTime = 0;
        audio.play().catch(err => console.log("Permiso de audio requerido:", err));
        startSlideshow();
    }

    // Sincronizar letra en vivo
    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        
        const currentLine = lyricsData.reduce((prev, curr) => {
            return (currentTime >= curr.time) ? curr : prev;
        }, null);

        if (currentLine && lyricText.innerText !== currentLine.text) {
            lyricText.style.opacity = 0;
            setTimeout(() => {
                lyricText.innerText = currentLine.text;
                lyricText.style.opacity = 1;
            }, 150);
        }
    });

    // Final de la canción
    audio.addEventListener('ended', () => {
        stopSlideshow();
        showScreen(screenEnd);
    });

    // Eventos
    btnStart?.addEventListener('click', startTrailer);
    btnReplay?.addEventListener('click', startTrailer);
});
