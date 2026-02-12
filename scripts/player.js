document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const volumeDisplay = document.getElementById('volume-display');
    const trackInfo = document.getElementById('track-info');

    // Volume Control
    const updateVolumeDisplay = () => {
        if (audio && volumeDisplay) {
            const volPercent = Math.round(audio.volume * 100);
            volumeDisplay.textContent = `Volumen: ${volPercent}%`;

            // Visual feedback animation
            volumeDisplay.style.transform = 'scale(1.2)';
            volumeDisplay.style.color = 'var(--brand-primary)';
            setTimeout(() => {
                volumeDisplay.style.transform = 'scale(1)';
                volumeDisplay.style.color = 'var(--text-muted)';
            }, 200);
        }
    };

    const changeVolume = (amount) => {
        if (!audio) return;
        let newVol = Math.round((audio.volume + amount) * 10) / 10;
        if (newVol > 1) newVol = 1;
        if (newVol < 0) newVol = 0;
        audio.volume = newVol;
        updateVolumeDisplay();
    };

    document.getElementById('lowerVolumeBtn')?.addEventListener('click', () => changeVolume(-0.1));
    document.getElementById('raiseVolumeBtn')?.addEventListener('click', () => changeVolume(0.1));

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Prevent default only if we are specifically handling the key
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (isInput) return;

        switch (e.code) {
            case 'KeyK': // Common 'Play/Pause' shortcut in media apps
            case 'Space':
                e.preventDefault();
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                changeVolume(0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                changeVolume(-0.1);
                break;
        }
    });

    // Initialize volume
    if (audio) {
        audio.volume = 0.1; // Start at 10%
    }

    // Initialize volume display without animation
    if (audio && volumeDisplay) {
        const volPercent = Math.round(audio.volume * 100);
        volumeDisplay.textContent = `Volumen: ${volPercent}%`;
    }

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
