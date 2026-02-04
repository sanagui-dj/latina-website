document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const volumeDisplay = document.getElementById('volume-display');
    const trackInfo = document.getElementById('track-info');

    // Volume Control
    const updateVolumeDisplay = () => {
        if (audio && volumeDisplay) {
            const volPercent = Math.round(audio.volume * 100);
            volumeDisplay.textContent = `Volumen: ${volPercent}%`;
        }
    };

    document.getElementById('lowerVolumeBtn')?.addEventListener('click', () => {
        if (audio) {
            audio.volume = Math.max(0, audio.volume - 0.1);
            updateVolumeDisplay();
        }
    });

    document.getElementById('raiseVolumeBtn')?.addEventListener('click', () => {
        if (audio) {
            audio.volume = Math.min(1, audio.volume + 0.1);
            updateVolumeDisplay();
        }
    });

    // Initialize volume display
    updateVolumeDisplay();

    // Track Info Update
    const updateTrackInfo = async () => {
        try {
            const response = await fetch('https://radios.latinalive.net/api/nowplaying/latina');
            const data = await response.json();

            if (data && data.now_playing && data.now_playing.song) {
                const song = data.now_playing.song;
                trackInfo.textContent = `${song.text}`;
            } else {
                trackInfo.textContent = 'Latina Live - En Vivo';
            }
        } catch (error) {
            console.error('Error fetching track info:', error);
            trackInfo.textContent = 'Latina Live - En Vivo';
        }
    };

    // Update immediately and then every 15 seconds
    updateTrackInfo();
    setInterval(updateTrackInfo, 15000);
});
