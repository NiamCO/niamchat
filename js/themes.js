// themes.js - Theme Switching
class ThemeManager {
    constructor() {
        this.themes = {
            'seaside': {
                name: 'Seaside',
                description: 'Sun-drenched beach with gentle waves',
                hasPearls: true
            },
            'cozy': {
                name: 'Cozy House',
                description: 'Warm living room with fireplace',
                hasPearls: true
            },
            'neon': {
                name: 'Neon City',
                description: 'Futuristic skyline at night',
                hasPearls: false
            },
            'forest': {
                name: 'Forest Retreat',
                description: 'Sunlight through leafy trees',
                hasPearls: true
            },
            'winter': {
                name: 'Winter Wonderland',
                description: 'Snowflakes and cozy lights',
                hasPearls: true
            },
            'starry': {
                name: 'Starry Night',
                description: 'Endless dark sky with stars',
                hasPearls: true
            },
            'candy': {
                name: 'Candyland',
                description: 'Sweet pastel dreamscape',
                hasPearls: false
            },
            'desert': {
                name: 'Desert Oasis',
                description: 'Warm sands and palm trees',
                hasPearls: true
            },
            'arcade': {
                name: 'Retro Arcade',
                description: 'Flashy pixel art and 80s vibes',
                hasPearls: false
            },
            'autumn': {
                name: 'Autumn Park',
                description: 'Crisp breeze with red and orange foliage',
                hasPearls: true
            }
        };
        
        this.currentTheme = localStorage.getItem('niamchat_theme') || 'seaside';
        this.themePickerOpen = false;
        
        this.initializeTheme();
    }
    
    initializeTheme() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Mark current theme as active
        this.markActiveTheme();
    }
    
    applyTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, using default.`);
            themeName = 'seaside';
        }
        
        // Remove all theme classes
        document.body.classList.remove(...Object.keys(this.themes).map(t => `theme-${t}`));
        
        // Add new theme class
        document.body.classList.add(`theme-${themeName}`);
        
        // Update current theme
        this.currentTheme = themeName;
        
        // Save to localStorage
        localStorage.setItem('niamchat_theme', themeName);
        
        // Update active theme marker
        this.markActiveTheme();
        
        console.log(`Theme applied: ${this.themes[themeName].name}`);
    }
    
    markActiveTheme() {
        // Remove active class from all theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Add active class to current theme
        const activeOption = document.querySelector(`.theme-option[data-theme="${this.currentTheme}"]`);
        if (activeOption) {
            activeOption.classList.add('active');
        }
    }
    
    setupEventListeners() {
        // Theme picker toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleThemePicker();
            });
        }
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.selectTheme(theme);
            });
        });
        
        // Close theme picker when clicking outside
        document.addEventListener('click', (e) => {
            const themePicker = document.getElementById('themePicker');
            if (themePicker && !themePicker.contains(e.target) && this.themePickerOpen) {
                this.closeThemePicker();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.themePickerOpen) {
                this.closeThemePicker();
            }
        });
    }
    
    toggleThemePicker() {
        const themePicker = document.getElementById('themePicker');
        if (!themePicker) return;
        
        if (this.themePickerOpen) {
            this.closeThemePicker();
        } else {
            this.openThemePicker();
        }
    }
    
    openThemePicker() {
        const themePicker = document.getElementById('themePicker');
        if (themePicker) {
            themePicker.classList.add('open');
            this.themePickerOpen = true;
        }
    }
    
    closeThemePicker() {
        const themePicker = document.getElementById('themePicker');
        if (themePicker) {
            themePicker.classList.remove('open');
            this.themePickerOpen = false;
        }
    }
    
    selectTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found.`);
            return;
        }
        
        // Apply the theme
        this.applyTheme(themeName);
        
        // Close the theme picker
        this.closeThemePicker();
        
        // Show notification
        this.showThemeNotification(themeName);
    }
    
    showThemeNotification(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;
        
        // Create notification element
        let notification = document.getElementById('themeNotification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'themeNotification';
            notification.className = 'theme-notification';
            document.body.appendChild(notification);
            
            // Add styles for notification
            this.addNotificationStyles();
        }
        
        // Add pearls indicator if theme has them
        const pearlsText = theme.hasPearls ? '✨ With Chardonnay Pearls' : '';
        
        notification.innerHTML = `
            <div class="theme-notification-content">
                <div class="theme-notification-icon">
                    ${this.getThemeIcon(themeName)}
                </div>
                <div class="theme-notification-text">
                    <div class="theme-notification-title">Theme Applied</div>
                    <div class="theme-notification-desc">${theme.name} • ${theme.description}</div>
                    <div class="theme-notification-pearls">${pearlsText}</div>
                </div>
                <button class="theme-notification-close" onclick="window.themeManager.hideThemeNotification()">
                    ${window.getIcon('close')}
                </button>
            </div>
        `;
        
        notification.classList.add('show');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.hideThemeNotification();
        }, 4000);
    }
    
    hideThemeNotification() {
        const notification = document.getElementById('themeNotification');
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    getThemeIcon(themeName) {
        const iconMap = {
            'seaside': 'themeSeaside',
            'cozy': 'themeCozy',
            'neon': 'themeNeon',
            'forest': 'themeForest',
            'winter': 'themeWinter',
            'starry': 'themeStarry',
            'candy': 'themeCandy',
            'desert': 'themeDesert',
            'arcade': 'themeArcade',
            'autumn': 'themeAutumn'
        };
        
        return window.getIcon(iconMap[themeName] || 'themePicker');
    }
    
    addNotificationStyles() {
        const styleId = 'theme-notification-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .theme-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 15px;
                box-shadow: var(--shadow-xl);
                z-index: 10000;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                max-width: 350px;
                backdrop-filter: blur(10px);
            }
            
            .theme-notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .theme-notification-content {
                display: flex;
                align-items: flex-start;
                gap: 15px;
            }
            
            .theme-notification-icon {
                width: 40px;
                height: 40px;
                flex-shrink: 0;
                border-radius: 8px;
                background: var(--primary-color);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            
            .theme-notification-icon svg {
                width: 24px;
                height: 24px;
            }
            
            .theme-notification-text {
                flex: 1;
                min-width: 0;
            }
            
            .theme-notification-title {
                font-weight: 600;
                font-size: 1rem;
                margin-bottom: 4px;
                color: var(--text-color);
            }
            
            .theme-notification-desc {
                font-size: 0.85rem;
                color: var(--text-secondary);
                margin-bottom: 2px;
                line-height: 1.4;
            }
            
            .theme-notification-pearls {
                font-size: 0.8rem;
                color: var(--secondary-color);
                font-weight: 500;
            }
            
            .theme-notification-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
                margin-top: -4px;
                margin-right: -4px;
            }
            
            .theme-notification-close:hover {
                background: rgba(0,0,0,0.05);
            }
            
            /* Chardonnay Pearls effect for themes that have it */
            .theme-seaside .owner-message-pearls,
            .theme-cozy .owner-message-pearls,
            .theme-forest .owner-message-pearls,
            .theme-winter .owner-message-pearls,
            .theme-starry .owner-message-pearls,
            .theme-desert .owner-message-pearls,
            .theme-autumn .owner-message-pearls {
                position: relative;
            }
            
            .theme-seaside .owner-message-pearls::after,
            .theme-cozy .owner-message-pearls::after,
            .theme-forest .owner-message-pearls::after,
            .theme-winter .owner-message-pearls::after,
            .theme-starry .owner-message-pearls::after,
            .theme-desert .owner-message-pearls::after,
            .theme-autumn .owner-message-pearls::after {
                content: "✨";
                position: absolute;
                right: -25px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.2rem;
                animation: pearlGlow 2s ease-in-out infinite;
            }
            
            @keyframes pearlGlow {
                0%, 100% { opacity: 0.7; transform: translateY(-50%) scale(1); }
                50% { opacity: 1; transform: translateY(-50%) scale(1.1); }
            }
            
            /* Theme-specific enhancements */
            .theme-neon .message.owner {
                animation: neonPulse 2s infinite;
            }
            
            @keyframes neonPulse {
                0%, 100% { box-shadow: var(--shadow-xl), 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(236, 72, 153, 0.3); }
                50% { box-shadow: var(--shadow-xl), 0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(236, 72, 153, 0.5); }
            }
            
            .theme-starry .messages-container {
                background-image: 
                    radial-gradient(white 1px, transparent 1px),
                    radial-gradient(white 1px, transparent 1px);
                background-size: 50px 50px;
                background-position: 0 0, 25px 25px;
                background-color: var(--background-color);
                animation: starTwinkle 3s infinite alternate;
            }
            
            @keyframes starTwinkle {
                0% { background-size: 50px 50px; }
                100% { background-size: 51px 51px; }
            }
            
            .theme-winter .message {
                position: relative;
                overflow: hidden;
            }
            
            .theme-winter .message::before {
                content: "";
                position: absolute;
                top: -10px;
                right: -10px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                opacity: 0.3;
                filter: blur(2px);
                animation: snowFloat 10s linear infinite;
            }
            
            .theme-winter .message::after {
                content: "";
                position: absolute;
                top: -15px;
                left: 20%;
                width: 15px;
                height: 15px;
                background: white;
                border-radius: 50%;
                opacity: 0.4;
                filter: blur(1px);
                animation: snowFloat 15s linear infinite;
                animation-delay: 2s;
            }
            
            @keyframes snowFloat {
                0% { transform: translateY(0) rotate(0deg); }
                100% { transform: translateY(100vh) rotate(360deg); }
            }
            
            .theme-candy .message-input:focus {
                border-color: #ec4899;
                box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
            }
            
            .theme-candy .send-btn {
                background: linear-gradient(135deg, #ec4899, #db2777);
            }
            
            .theme-arcade .action-btn-small:hover,
            .theme-arcade .input-btn:hover,
            .theme-arcade .sidebar-btn:hover {
                animation: arcadeGlitch 0.3s;
            }
            
            @keyframes arcadeGlitch {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
            }
            
            .theme-autumn .message:hover {
                transform: translateY(-2px);
                transition: transform 0.3s ease;
            }
            
            .theme-autumn .message {
                transition: transform 0.3s ease;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Get current theme info
    getCurrentThemeInfo() {
        return this.themes[this.currentTheme] || this.themes['seaside'];
    }
    
    // Get all themes
    getAllThemes() {
        return this.themes;
    }
    
    // Cycle through themes (for keyboard shortcut)
    cycleTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        
        this.selectTheme(themeNames[nextIndex]);
    }
}

// Initialize ThemeManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    
    // Add keyboard shortcut (Ctrl+Alt+T to cycle themes)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 't') {
            e.preventDefault();
            if (window.themeManager) {
                window.themeManager.cycleTheme();
            }
        }
    });
});

// Export for other files
window.ThemeManager = ThemeManager;
