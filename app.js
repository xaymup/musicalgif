document.addEventListener('DOMContentLoaded', () => {
    const trackNameElement = document.getElementById('track-name');
    const gifDisplay = document.getElementById('gif-display');
    const loginButton = document.getElementById('login-btn');
    const currentTrackDiv = document.getElementById('current-track');
    
    const clientId = '6d4133f7becf4e8fbfa7ee955d938399'; // Replace with your Spotify Client ID
    const redirectUri = 'https://xaymup.me/musicalgif/'; // Replace with your redirect URI
    const scopes = 'user-read-currently-playing user-read-playback-state'; // Scope for accessing currently playing track

    let accessToken = '';
    let currentTrack = '';
    let gifUrls = [];
    let gifIndex = 0;

    function authenticate() {
        console.log('Redirecting to Spotify for authentication...');
        const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
        window.location.href = authUrl;
    }

    function getHashParams() {
        const hashParams = {};
        const r = /([^&;=]+)=([^&;]*)/g;
        const q = window.location.hash.substring(1);
        let e;
        while (e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }

    function setAccessToken() {
        const params = getHashParams();
        if (params.access_token) {
            accessToken = params.access_token;
            currentTrackDiv.style.display = 'block';
            getCurrentTrack(); // Fetch the current track
        } else {
            console.error('Access token not found in URL');
        }
    }

    async function getCurrentTrack() {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const trackName = data.item ? data.item.name : 'No track playing';
                if (trackName !== currentTrack) {
                    currentTrack = trackName;
                    trackNameElement.textContent = trackName;
                    await getGifs(trackName);
                }
            } else {
                trackNameElement.textContent = 'Error fetching track';
            }
        } catch (error) {
            console.error('Error fetching track:', error);
            trackNameElement.textContent = 'Error fetching track';
        }
    }

    async function getGifs(query) {
        try {
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=YOUR_GIPHY_API_KEY&q=${encodeURIComponent(query)}&limit=10`);
            const data = await response.json();

            if (data.data.length > 0) {
                gifUrls = data.data.map(gif => gif.images.original.url);
                gifIndex = 0;
                showNextGif();
            } else {
                gifDisplay.src = '';
                gifUrls = [];
            }
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            gifDisplay.src = '';
            gifUrls = [];
        }
    }

    function showNextGif() {
        if (gifUrls.length > 0) {
            gifDisplay.src = gifUrls[gifIndex];
            gifIndex = (gifIndex + 1) % gifUrls.length;
        }
    }

    loginButton.addEventListener('click', () => {
        console.log('Login button clicked');
        authenticate();
    });

    // If access token exists in the URL hash, set it
    if (window.location.hash) {
        setAccessToken();
    } else {
        loginButton.style.display = 'block'; // Show login button if not authenticated
    }

    // Refresh the track and GIFs
    setInterval(getCurrentTrack, 30000); // Check current track every 30 seconds
    setInterval(showNextGif, 5000); // Change GIF every 5 seconds
});