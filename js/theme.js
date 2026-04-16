const Theme = {
    init() {
        const session = Auth.getSession();
        const isAuthPage = window.location.pathname.includes('login') || window.location.pathname.includes('register') || window.location.pathname === '/' || window.location.pathname === '/index.html';
        
        if (isAuthPage) {
            document.documentElement.setAttribute('data-theme', 'light');
            return;
        }

        if (session) {
            const savedTheme = localStorage.getItem(`theme_${session.userId}`) || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateUI(savedTheme);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    },

    set(theme) {
        const session = Auth.getSession();
        if (!session) return;

        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(`theme_${session.userId}`, theme);
        this.updateUI(theme);
        
        // Trigger chart re-render if on analytics page
        if (window.location.pathname.includes('analytics')) {
            if (typeof Admin !== 'undefined' && Admin.loadDashboard) Admin.loadDashboard();
            if (typeof Student !== 'undefined' && Student.loadDashboard) Student.loadDashboard();
            // If there's a specific analytics load function, call it
            if (window.loadAnalytics) window.loadAnalytics();
        }
    },

    updateUI(theme) {
        const icons = document.querySelectorAll('.theme-icon, .toggle-btn i');
        icons.forEach(icon => {
            if (theme === 'dark') {
                icon.classList.remove('ri-moon-line');
                icon.classList.add('ri-sun-line');
            } else {
                icon.classList.remove('ri-sun-line');
                icon.classList.add('ri-moon-line');
            }
        });
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        this.set(next);
    },

    clear() {
        document.documentElement.setAttribute('data-theme', 'light');
    }
};

window.Theme = Theme;

document.addEventListener('DOMContentLoaded', () => Theme.init());
