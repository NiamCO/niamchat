// supabase-config.js
// SUPABASE CONFIGURATION - Replace with your credentials
const SUPABASE_URL = 'https://cwbdhrlbflsygamnsanf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YmRocmxiZmxzeWdhbW5zYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODgwOTEsImV4cCI6MjA4MDk2NDA5MX0.tpVyrDseLdJayTpoMGlkBPIXFJ9oRQ5G8ZIM0Bugpkw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user information
let currentUser = {
    id: null,
    username: '',
    displayName: '',
    role: 'user',
    online: false
};

// Chat rooms
const CHAT_ROOMS = {
    PUBLIC: 'public',
    ADMIN: 'admin'
};

// Message sound
const MESSAGE_SOUND = new Audio('msg.mp3');
MESSAGE_SOUND.volume = 0.3;

// Export for use in other files
window.supabaseClient = supabase;
window.currentUser = currentUser;
window.CHAT_ROOMS = CHAT_ROOMS;
window.MESSAGE_SOUND = MESSAGE_SOUND;
