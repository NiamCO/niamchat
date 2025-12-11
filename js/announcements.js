// announcements.js - Announcement System
class AnnouncementManager {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = window.currentUser;
        this.unreadAnnouncements = [];
        this.announcementSound = new Audio('msg.mp3');
        this.announcementSound.volume = 0.4;
        
        this.initializeAnnouncements();
    }
    
    async initializeAnnouncements() {
        // Load unread announcements
        await this.loadUnreadAnnouncements();
        
        // Setup realtime listener for new announcements
        this.setupRealtimeListener();
        
        // Check for announcements periodically
        this.startAnnouncementPolling();
        
        // Setup notification click handler
        this.setupNotificationHandler();
    }
    
    async loadUnreadAnnouncements() {
        try {
            const { data: announcements, error } = await this.supabase
                .from('announcements')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            
            // Filter to unread announcements
            this.unreadAnnouncements = announcements.filter(announcement => 
                !announcement.read_by || !announcement.read_by.includes(this.currentUser.id)
            );
            
            // Update notification badge
            this.updateNotificationBadge();
            
            // Show notifications for unread announcements
            if (this.unreadAnnouncements.length > 0) {
                this.showPendingAnnouncements();
            }
            
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }
    
    setupRealtimeListener() {
        // Subscribe to new announcements
        this.supabase
            .channel('announcements')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'announcements'
                },
                (payload) => {
                    this.handleNewAnnouncement(payload.new);
                }
            )
            .subscribe();
    }
    
    handleNewAnnouncement(announcement) {
        // Check if announcement is already read
        if (announcement.read_by && announcement.read_by.includes(this.currentUser.id)) {
            return;
        }
        
        // Add to unread announcements
        this.unreadAnnouncements.unshift(announcement);
        
        // Update notification badge
        this.updateNotificationBadge();
        
        // Show notification
        this.showAnnouncementNotification(announcement);
        
        // Play notification sound
        this.playAnnouncementNotificationSound();
    }
    
    showPendingAnnouncements() {
        // If there are pending announcements and user just joined, show them
        if (this.unreadAnnouncements.length > 0) {
            // Show the most recent announcement immediately
            const latestAnnouncement = this.unreadAnnouncements[0];
            setTimeout(() => {
                this.showAnnouncementNotification(latestAnnouncement, true);
            }, 2000); // Wait 2 seconds after page load
        }
    }
    
    showAnnouncementNotification(announcement, isPending = false) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `announcement-notification ${isPending ? 'pending' : 'new'}`;
        notification.dataset.announcementId = announcement.id;
        
        // Format timestamp
        const timestamp = new Date(announcement.timestamp);
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = timestamp.toLocaleDateString();
        
        // Get announcement creator name
        const creatorName = this.getCreatorName(announcement.created_by);
        
        notification.innerHTML = `
            <div class="announcement-notification-content">
                <div class="announcement-notification-header">
                    <div class="announcement-notification-icon">
                        ${window.getIcon('announce')}
                    </div>
                    <div class="announcement-notification-title">
                        ${isPending ? '📬 Pending Announcement' : '📢 New Announcement'}
                    </div>
                    <button class="announcement-notification-close" onclick="this.parentElement.parentElement.remove()">
                        ${window.getIcon('close')}
                    </button>
                </div>
                <div class="announcement-notification-body">
                    <div class="announcement-text">${this.escapeHtml(announcement.text)}</div>
                    <div class="announcement-meta">
                        <span class="announcement-creator">By ${creatorName}</span>
                        <span class="announcement-time">${dateString} at ${timeString}</span>
                    </div>
                </div>
                <div class="announcement-notification-actions">
                    <button class="announcement-action-btn mark-read-btn" 
                            onclick="window.announcementManager.markAsRead('${announcement.id}'); this.parentElement.parentElement.parentElement.remove()">
                        ${window.getIcon('checkmark')}
                        Mark as Read
                    </button>
                    <button class="announcement-action-btn view-all-btn" 
                            onclick="window.announcementManager.showAllAnnouncements()">
                        ${window.getIcon('notification')}
                        View All (${this.unreadAnnouncements.length})
                    </button>
                </div>
            </div>
        `;
        
        // Add to notification container
        const container = this.getNotificationContainer();
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 30 seconds if not pending
        if (!isPending) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 30000);
        }
    }
    
    async markAsRead(announcementId) {
        try {
            // Get current announcement
            const announcement = this.unreadAnnouncements.find(a => a.id === announcementId);
            if (!announcement) return;
            
            // Update read_by array
            const readBy = announcement.read_by || [];
            if (!readBy.includes(this.currentUser.id)) {
                readBy.push(this.currentUser.id);
                
                // Update in database
                const { error } = await this.supabase
                    .from('announcements')
                    .update({ read_by: readBy })
                    .eq('id', announcementId);
                
                if (error) throw error;
                
                // Remove from unread list
                this.unreadAnnouncements = this.unreadAnnouncements.filter(a => a.id !== announcementId);
                
                // Update notification badge
                this.updateNotificationBadge();
                
                console.log(`Announcement ${announcementId} marked as read`);
            }
            
        } catch (error) {
            console.error('Error marking announcement as read:', error);
        }
    }
    
    async markAllAsRead() {
        try {
            // Mark all unread announcements as read
            for (const announcement of this.unreadAnnouncements) {
                const readBy = announcement.read_by || [];
                if (!readBy.includes(this.currentUser.id)) {
                    readBy.push(this.currentUser.id);
                    
                    await this.supabase
                        .from('announcements')
                        .update({ read_by: readBy })
                        .eq('id', announcement.id);
                }
            }
            
            // Clear unread announcements
            this.unreadAnnouncements = [];
            
            // Update notification badge
            this.updateNotificationBadge();
            
            // Remove all announcement notifications
            this.clearAllNotifications();
            
            // Show success message
            this.showSuccess('All announcements marked as read.');
            
        } catch (error) {
            console.error('Error marking all announcements as read:', error);
            this.showError('Failed to mark announcements as read.');
        }
    }
    
    async showAllAnnouncements() {
        try {
            // Get all announcements
            const { data: announcements, error } = await this.supabase
                .from('announcements')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            
            // Create announcements modal
            this.createAnnouncementsModal(announcements);
            
        } catch (error) {
            console.error('Error loading all announcements:', error);
            this.showError('Failed to load announcements.');
        }
    }
    
    createAnnouncementsModal(announcements) {
        // Remove existing modal if any
        const existingModal = document.getElementById('allAnnouncementsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'allAnnouncementsModal';
        modal.className = 'modal open';
        modal.style.zIndex = '10001';
        
        // Count unread announcements
        const unreadCount = this.unreadAnnouncements.length;
        
        // Create announcements list HTML
        let announcementsHTML = '';
        announcements.forEach(announcement => {
            const isRead = announcement.read_by && announcement.read_by.includes(this.currentUser.id);
            const timestamp = new Date(announcement.timestamp);
            const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = timestamp.toLocaleDateString();
            const creatorName = this.getCreatorName(announcement.created_by);
            
            announcementsHTML += `
                <div class="announcement-item ${isRead ? 'read' : 'unread'}" data-announcement-id="${announcement.id}">
                    <div class="announcement-item-header">
                        <div class="announcement-item-status">
                            ${isRead ? window.getIcon('checkmark') : window.getIcon('notification')}
                        </div>
                        <div class="announcement-item-title">
                            <div class="announcement-item-creator">${creatorName}</div>
                            <div class="announcement-item-time">${dateString} at ${timeString}</div>
                        </div>
                        ${!isRead ? `
                            <button class="announcement-item-mark-read" 
                                    onclick="window.announcementManager.markAsRead('${announcement.id}'); this.closest('.announcement-item').classList.add('read')">
                                Mark Read
                            </button>
                        ` : ''}
                    </div>
                    <div class="announcement-item-content">
                        ${this.escapeHtml(announcement.text)}
                    </div>
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        ${window.getIcon('announce')}
                        Announcements
                        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount} unread</span>` : ''}
                    </h2>
                    <button class="modal-close" onclick="document.getElementById('allAnnouncementsModal').remove()">
                        ${window.getIcon('close')}
                    </button>
                </div>
                <div class="modal-body">
                    ${announcements.length === 0 ? 
                        `<div class="empty-state">
                            <div class="empty-icon">${window.getIcon('announce')}</div>
                            <h3>No announcements</h3>
                            <p class="text-secondary">No announcements have been made yet.</p>
                        </div>` : 
                        `<div class="announcements-list">${announcementsHTML}</div>`
                    }
                </div>
                <div class="modal-footer">
                    ${unreadCount > 0 ? `
                        <button class="send-btn" onclick="window.announcementManager.markAllAsRead()">
                            ${window.getIcon('checkmark')}
                            Mark All as Read
                        </button>
                    ` : ''}
                    <button class="send-btn" style="background: var(--secondary-color);" 
                            onclick="document.getElementById('allAnnouncementsModal').remove()">
                        ${window.getIcon('close')}
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        const unreadCount = this.unreadAnnouncements.length;
        
        // Create badge if it doesn't exist
        if (!badge && unreadCount > 0) {
            this.createNotificationBadge();
        } else if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    createNotificationBadge() {
        // Check if badge already exists
        if (document.querySelector('.notification-badge')) return;
        
        // Create badge
        const badge = document.createElement('div');
        badge.className = 'notification-badge';
        badge.textContent = this.unreadAnnouncements.length > 99 ? '99+' : this.unreadAnnouncements.length;
        
        // Add to announcement button in admin controls
        const announceBtn = document.getElementById('announceBtn');
        if (announceBtn) {
            announceBtn.style.position = 'relative';
            announceBtn.appendChild(badge);
        }
        
        // Also add to sidebar if exists
        const notificationBtn = document.querySelector('[data-action="notifications"]');
        if (notificationBtn) {
            notificationBtn.style.position = 'relative';
            const sidebarBadge = badge.cloneNode(true);
            sidebarBadge.className = 'notification-badge sidebar-badge';
            notificationBtn.appendChild(sidebarBadge);
        }
    }
    
    clearAllNotifications() {
        // Remove all announcement notifications from DOM
        document.querySelectorAll('.announcement-notification').forEach(notification => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
    
    getNotificationContainer() {
        let container = document.getElementById('announcementNotifications');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'announcementNotifications';
            container.className = 'announcement-notifications-container';
            document.body.appendChild(container);
            
            // Add styles if not already added
            this.addNotificationStyles();
        }
        
        return container;
    }
    
    getCreatorName(creatorId) {
        // This would ideally fetch from users table
        // For now, return a placeholder
        return creatorId === window.currentUser?.id ? 'You' : 'Admin';
    }
    
    playAnnouncementNotificationSound() {
        try {
            this.announcementSound.currentTime = 0;
            this.announcementSound.play().catch(e => {
                console.log('Announcement sound play failed:', e);
            });
        } catch (error) {
            console.error('Error playing announcement sound:', error);
        }
    }
    
    startAnnouncementPolling() {
        // Check for new announcements every 30 seconds
        setInterval(async () => {
            await this.loadUnreadAnnouncements();
        }, 30000);
    }
    
    setupNotificationHandler() {
        // Handle mark read button from chat header
        const markReadBtn = document.getElementById('markReadBtn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showSuccess(message) {
        if (window.authManager && window.authManager.showSuccess) {
            window.authManager.showSuccess(message);
        }
    }
    
    showError(message) {
        if (window.authManager && window.authManager.showError) {
            window.authManager.showError(message);
        }
    }
    
    addNotificationStyles() {
        const styleId = 'announcement-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .announcement-notifications-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                pointer-events: none;
            }
            
            .announcement-notification {
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-xl);
                overflow: hidden;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                pointer-events: all;
                max-height: 0;
                margin-bottom: 0;
            }
            
            .announcement-notification.show {
                transform: translateX(0);
                opacity: 1;
                max-height: 500px;
                margin-bottom: 10px;
            }
            
            .announcement-notification.new {
                border-left: 4px solid var(--warning-color);
            }
            
            .announcement-notification.pending {
                border-left: 4px solid var(--info-color);
            }
            
            .announcement-notification-content {
                padding: 15px;
            }
            
            .announcement-notification-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
            }
            
            .announcement-notification-icon {
                width: 24px;
                height: 24px;
                color: var(--warning-color);
            }
            
            .announcement-notification-title {
                flex: 1;
                font-weight: 600;
                font-size: 0.95rem;
            }
            
            .announcement-notification-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .announcement-notification-close:hover {
                background: rgba(0,0,0,0.05);
            }
            
            .announcement-notification-body {
                margin-bottom: 15px;
            }
            
            .announcement-text {
                font-size: 0.95rem;
                line-height: 1.5;
                margin-bottom: 8px;
                word-wrap: break-word;
            }
            
            .announcement-meta {
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .announcement-notification-actions {
                display: flex;
                gap: 8px;
            }
            
            .announcement-action-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: var(--border-radius-sm);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 0.85rem;
                transition: all 0.2s;
            }
            
            .announcement-action-btn:hover {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }
            
            .mark-read-btn {
                background: var(--success-color);
                color: white;
                border-color: var(--success-color);
            }
            
            .view-all-btn {
                background: var(--info-color);
                color: white;
                border-color: var(--info-color);
            }
            
            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--danger-color);
                color: white;
                font-size: 0.7rem;
                font-weight: 600;
                min-width: 18px;
                height: 18px;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                animation: badgePulse 2s infinite;
            }
            
            @keyframes badgePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .sidebar-badge {
                top: 5px;
                right: 5px;
            }
            
            .unread-badge {
                background: var(--danger-color);
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.8rem;
                font-weight: 600;
                margin-left: 8px;
            }
            
            .announcements-list {
                max-height: 400px;
                overflow-y: auto;
                padding-right: 10px;
            }
            
            .announcement-item {
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 15px;
                margin-bottom: 10px;
                transition: all 0.3s ease;
            }
            
            .announcement-item.unread {
                border-left: 4px solid var(--warning-color);
                background: linear-gradient(135deg, 
                    rgba(245, 158, 11, 0.05), 
                    rgba(217, 119, 6, 0.05));
            }
            
            .announcement-item.read {
                opacity: 0.8;
                border-left: 4px solid var(--success-color);
            }
            
            .announcement-item:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
            
            .announcement-item-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .announcement-item-status {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .announcement-item-status svg {
                width: 16px;
                height: 16px;
            }
            
            .announcement-item.unread .announcement-item-status {
                color: var(--warning-color);
            }
            
            .announcement-item.read .announcement-item-status {
                color: var(--success-color);
            }
            
            .announcement-item-title {
                flex: 1;
            }
            
            .announcement-item-creator {
                font-weight: 600;
                font-size: 0.95rem;
                margin-bottom: 2px;
            }
            
            .announcement-item-time {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .announcement-item-mark-read {
                padding: 4px 12px;
                background: var(--success-color);
                color: white;
                border: none;
                border-radius: var(--border-radius-sm);
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
            }
            
            .announcement-item-mark-read:hover {
                background: var(--success-color);
                opacity: 0.9;
                transform: translateY(-1px);
            }
            
            .announcement-item-content {
                font-size: 0.95rem;
                line-height: 1.5;
                word-wrap: break-word;
            }
            
            .modal-footer {
                display: flex;
                gap: 10px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--border-color);
            }
            
            .modal-footer .send-btn {
                flex: 1;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize AnnouncementManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.announcementManager = new AnnouncementManager();
    }, 1500); // Wait for auth to initialize
});

// Export for other files
window.AnnouncementManager = AnnouncementManager;
