const Notifications = {
    add(userId, message, type = 'info', relatedIssueId = null) {
        const notifs = this.getAll();
        
        const isDuplicate = notifs.some(n => 
            n.userId === userId && 
            n.message === message && 
            !n.read
        );
        
        if (isDuplicate) return;

        const now = Date.now();
        const newNotif = {
            id: now,
            userId,
            message,
            type,
            read: false,
            date: new Date().toISOString(),
            relatedIssueId
        };
        
        notifs.push(newNotif);
        this.saveAll(notifs);
        this.showToast(message, type);
        if (window.UI) UI.updateNotifBadge();
    },

    notifyAdmins(message, type = 'info', relatedIssueId = null) {
        this.add('admin', message, type, relatedIssueId);
    },

    getAll() {
        try {
            return JSON.parse(localStorage.getItem('campus_notifications')) || [];
        } catch (e) {
            console.error('Error loading notifications:', e);
            return [];
        }
    },

    saveAll(notifs) {
        try {
            localStorage.setItem('campus_notifications', JSON.stringify(notifs));
            window.dispatchEvent(new Event("storage"));
            return true;
        } catch (e) {
            console.error('Error saving notifications:', e);
            return false;
        }
    },

    getForUser(userId) {
        if (typeof Auth === 'undefined') return [];
        const session = Auth.getSession();
        if (!session) return [];
        const notifs = this.getAll();
        
        if (session.role === 'admin') {
            return notifs.filter(n => n.userId === 'admin' || n.userId === session.userId);
        }
        return notifs.filter(n => n.userId === userId);
    },

    markAsRead(id) {
        const notifs = this.getAll();
        const index = notifs.findIndex(n => n.id === id);
        if (index !== -1) {
            notifs[index].read = true;
            this.saveAll(notifs);
        }
    },

    markAllRead() {
        if (typeof Auth === 'undefined') return;
        const session = Auth.getSession();
        if (!session) return;
        const userId = session.role === 'admin' ? 'admin' : session.userId;
        const notifs = this.getAll();
        
        let changed = false;
        for (const n of notifs) {
            if (n.userId === userId && !n.read) {
                n.read = true;
                changed = true;
            }
        }
        
        if (changed) {
            this.saveAll(notifs);
            if (window.UI) UI.updateNotifBadge();
            if (typeof loadAllNotifications === 'function') {
                loadAllNotifications();
            }
        }
    },

    clearAll() {
        if (typeof Auth === 'undefined') return;
        const session = Auth.getSession();
        if (!session) return;
        const userId = session.role === 'admin' ? 'admin' : session.userId;
        const notifs = this.getAll();
        const filtered = notifs.filter(n => n.userId !== userId);
        
        this.saveAll(filtered);
        if (window.UI) UI.updateNotifBadge();
        if (typeof loadAllNotifications === 'function') {
            loadAllNotifications();
        }
    },

    refreshDropdown() {
        if (typeof Auth === 'undefined') return;
        const session = Auth.getSession();
        if (!session) return;
        const userId = session.role === 'admin' ? 'admin' : session.userId;
        const dropdown = document.getElementById('notif-dropdown');
        if (dropdown && dropdown.style.opacity === '1') {
            const list = document.getElementById('notif-list');
            const userNotifs = this.getForUser(userId);
            if (list) {
                if (userNotifs.length === 0) {
                    list.innerHTML = '<p style="font-size: 12px; opacity: 0.5; text-align: center; padding: 24px;">No notifications</p>';
                } else {
                    list.innerHTML = userNotifs.reverse().slice(0, 10).map(n => {
                        const date = new Date(n.date);
                        const timeStr = isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
                        return `
                            <div style="padding: 16px; border-radius: 14px; background: ${n.read ? 'transparent' : 'rgba(79, 70, 229, 0.08)'}; font-size: 13px; margin-bottom: 8px; border-left: 4px solid ${n.read ? 'transparent' : 'var(--primary)'}; transition: var(--transition); cursor: pointer;" onmouseover="this.style.background='rgba(79, 70, 229, 0.12)'" onmouseout="this.style.background='${n.read ? 'transparent' : 'rgba(79, 70, 229, 0.08)'}'">
                                <div style="font-weight: 600; margin-bottom: 6px;">${n.message}</div>
                                <div style="font-size: 11px; opacity: 0.5;">${timeStr}</div>
                            </div>
                        `;
                    }).join('') + `
                        <div style="padding: 12px; text-align: center; border-top: 1px solid var(--border); margin-top: 8px;">
                            <a href="${session.role === 'admin' ? './notifications.html' : './notifications.html'}" style="color: var(--primary); text-decoration: none; font-size: 13px; font-weight: 600;">View All Notifications</a>
                        </div>
                    `;
                }
            }
        }
    },

    showToast(message, type) {
        const container = document.querySelector('.toast-container') || this.createContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.background = type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#4f46e5';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '12px';
        toast.style.boxShadow = 'var(--shadow-l2)';
        toast.style.marginBottom = '12px';
        toast.style.transition = 'all 0.3s ease';
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
};

window.Notifications = Notifications;
