const dashboard = {
    init() {
        this.setupSidebar();
        this.setupDropdowns();
        this.updateUserInfo();
        this.updateNotificationBadge();
    },

    setupSidebar() {
        const toggleBtn = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('open');
                } else {
                    sidebar.classList.toggle('collapsed');
                }
            });
        }
    },

    setupDropdowns() {
        const profileBtn = document.querySelector('.profile-btn');
        const dropdown = document.querySelector('.dropdown-menu');
        
        if (profileBtn && dropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('show');
            });
        }
    },

    updateUserInfo() {
        const user = Auth.getSession();
        if (user) {
            const nameElements = document.querySelectorAll('.user-name');
            const emailElements = document.querySelectorAll('.user-email');
            const avatarElements = document.querySelectorAll('.user-avatar');
            
            nameElements.forEach(el => el.textContent = user.name || (user.role === 'admin' ? 'Admin' : 'Student'));
            emailElements.forEach(el => el.textContent = user.email || '');
            avatarElements.forEach(el => {
                if (user.avatar) el.src = user.avatar;
            });
        }
    },

    updateNotificationBadge() {
        const user = Auth.getSession();
        if (user) {
            const notifs = Notifications.getForUser(user.userId);
            const unreadCount = notifs.filter(n => !n.read).length;
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        }
    },

    renderRecentIssues(tableId, issuesList) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;

        tbody.innerHTML = issuesList.slice(0, 5).map(issue => `
            <tr>
                <td>${issue.id}</td>
                <td>${issue.title}</td>
                <td>${issue.category}</td>
                <td><span class="status-badge status-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span></td>
                <td>${(() => {
                    const date = new Date(issue.createdAt);
                    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'N/A';
                })()}</td>
                <td>
                    <button onclick="window.location.href='/student/issue-details.html?id=${issue.id}'" class="btn-icon">
                        <i class="ri-eye-line"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    dashboard.init();
});
