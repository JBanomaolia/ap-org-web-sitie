// ==========================================
// music-player.js - Motor AP ORG
// Acumulativo + Visualizador + Background UI
// ==========================================

const audioElement = new Audio();
let playlist = [];
let currentTrackIndex = -1;
let isShuffle = false;
let isRepeat = false;

// --- VARIABLES DEL VISUALIZADOR DE AUDIO ---
let audioCtx, analyser, dataArray, bufferLength;
const canvas = document.getElementById('audio-visualizer');
const ctx = canvas.getContext('2d');

// Elementos UI
const playlistScreen = document.getElementById('playlist-items');
const fullPlayer = document.getElementById('full-player');
const floatingPlayer = document.getElementById('floating-player');
const fileBtn = document.getElementById('load-files-btn');
const fileInput = document.getElementById('file-input');

// Elementos Visualizador Grande
const titleBig = document.getElementById('track-title-big');
const artistBig = document.getElementById('track-artist-big');
const playBtnBig = document.getElementById('play-btn-big');
const progressBarBig = document.getElementById('progress-bar-big');
const progressContBig = document.getElementById('progress-container-big');
const currentTimeBig = document.getElementById('current-time-big');
const totalDurationBig = document.getElementById('total-duration-big');
const volSliderBig = document.getElementById('volume-slider-big');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');

// Elementos Flotante
const playBtnFloat = document.getElementById('play-btn-float');

// --- 1. SELECCIÓN MÚLTIPLE Y ACUMULACIÓN ---
fileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));

    if (audioFiles.length === 0) return;

    // Crea un arreglo temporal con los nuevos archivos
    const newTracks = audioFiles.map(file => {
        return {
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Archivo Local",
            src: URL.createObjectURL(file)
        };
    });

    // ACUMULA las canciones sin borrar la lista anterior
    playlist = playlist.concat(newTracks);
    renderPlaylist();
    
    // Limpia el input para permitir volver a cargar los mismos archivos si se desea
    fileInput.value = '';
});

function renderPlaylist() {
    playlistScreen.innerHTML = '';
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        if (index === currentTrackIndex) li.classList.add('active');

        li.innerHTML = `
            <div class="item-info">
                <span>${track.title}</span>
                <small>${track.artist}</small>
            </div>
            <span class="play-icon">▶</span>
        `;
        li.addEventListener('click', () => selectAndPlayTrack(index));
        playlistScreen.appendChild(li);
    });
}

// --- 2. CONFIGURACIÓN DEL VISUALIZADOR (ANIMACIÓN RÍTMICA) ---
function initVisualizer() {
    // Solo inicializa el contexto de audio una vez por seguridad del navegador
    if (audioCtx) return; 

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    
    const source = audioCtx.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    drawVisualizer();
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = '#000000'; // Fondo negro puro
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i]; 

        // Crea variaciones de color rojo dependiendo de la intensidad del sonido
        ctx.fillStyle = `rgb(${barHeight + 50}, 0, 0)`;
        // Dibuja las barras desde el centro hacia los lados
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// --- 3. CONTROLES DEL SISTEMA (SEGUNDO PLANO / LOCKSCREEN) ---
function updateMediaSession(track) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: 'AP ORG Player'
        });

        navigator.mediaSession.setActionHandler('play', playAudio);
        navigator.mediaSession.setActionHandler('pause', pauseAudio);
        navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
        navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    }
}

// --- FLUJO DEL REPRODUCTOR ---
function selectAndPlayTrack(index) {
    initVisualizer(); 
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    currentTrackIndex = index;
    loadTrack(index);
    playAudio();
    openFullPlayer(); 
    updatePlaylistUI();
}

function loadTrack(index) {
    const track = playlist[index];
    titleBig.textContent = track.title;
    artistBig.textContent = track.artist;
    audioElement.src = track.src;
    audioElement.load();
    updateMediaSession(track);
}

// UI Windows
function openFullPlayer() {
    fullPlayer.classList.add('active');
    floatingPlayer.classList.remove('active');
}
function closeFullPlayer() {
    fullPlayer.classList.remove('active');
    if (!audioElement.paused) floatingPlayer.classList.add('active');
}
document.getElementById('open-full-btn').addEventListener('click', openFullPlayer);
document.getElementById('close-player-btn').addEventListener('click', closeFullPlayer);

function updatePlaylistUI() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
        if (index === currentTrackIndex) item.classList.add('active');
        else item.classList.remove('active');
    });
}

// Play / Pause / Next / Prev
function togglePlay() {
    if (currentTrackIndex === -1) return;
    initVisualizer();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (audioElement.paused) playAudio();
    else pauseAudio();
}

function playAudio() {
    audioElement.play().then(() => {
        playBtnBig.textContent = '⏸';
        playBtnFloat.textContent = '⏸';
        if (!fullPlayer.classList.contains('active')) {
            floatingPlayer.classList.add('active');
        }
    }).catch(e => console.error(e));
}

function pauseAudio() {
    audioElement.pause();
    playBtnBig.textContent = '▶';
    playBtnFloat.textContent = '▶';
}

function nextTrack() {
    if (playlist.length === 0) return;
    if (isRepeat) {
        audioElement.currentTime = 0;
        playAudio();
        return;
    }
    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    }
    loadTrack(currentTrackIndex);
    playAudio();
    updatePlaylistUI();
}

function prevTrack() {
    if (playlist.length === 0) return;
    if (audioElement.currentTime > 3) {
        audioElement.currentTime = 0;
        return;
    }
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    playAudio();
    updatePlaylistUI();
}

// Event Listeners
playBtnBig.addEventListener('click', togglePlay);
document.getElementById('next-btn-big').addEventListener('click', nextTrack);
document.getElementById('prev-btn-big').addEventListener('click', prevTrack);
playBtnFloat.addEventListener('click', togglePlay);
document.getElementById('next-btn-float').addEventListener('click', nextTrack);
document.getElementById('prev-btn-float').addEventListener('click', prevTrack);

shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active'); });
repeatBtn.addEventListener('click', () => { isRepeat = !isRepeat; repeatBtn.classList.toggle('active'); });
volSliderBig.addEventListener('input', (e) => audioElement.volume = e.target.value);
audioElement.addEventListener('ended', nextTrack);

// Barra de Progreso
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const { currentTime, duration } = audioElement;
        progressBarBig.style.width = `${(currentTime / duration) * 100}%`;
        currentTimeBig.textContent = formatTime(currentTime);
        totalDurationBig.textContent = formatTime(duration);
    }
});
progressContBig.addEventListener('click', function(e) {
    if (audioElement.duration) {
        audioElement.currentTime = (e.offsetX / this.clientWidth) * audioElement.duration;
    }
});

function formatTime(time) {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
