const Auth = {
    init() {
        // Seed admin if not exists
        const users = this.getUsers();
        if (!users.find(u => u.email.toLowerCase() === 'admin' && u.role === 'admin')) {
            users.push({
                id: 'admin-1',
                name: 'System Admin',
                email: 'admin',
                password: 'admin123',
                role: 'admin',
                department: 'Administration',
                collegeName: 'Campus Issue Reporting System',
                adminId: 'ADM-00001',
                status: 'active'
            });
            this.saveAll(users);
        }

        // Seed student if not exists
        if (!users.find(u => u.email === 'student@demo.com')) {
            users.push({
                id: 'demo-student',
                name: 'Demo Student',
                studentId: 'STU12345',
                email: 'student@demo.com',
                password: 'password123',
                role: 'student',
                department: 'Computer Science',
                status: 'active'
            });
            this.saveAll(users);
        }
    },

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem('campus_users')) || [];
        } catch (e) {
            console.error('Error loading users:', e);
            return [];
        }
    },

    getStudents() {
        const users = this.getUsers();
        return users.filter(u => u.role === 'student');
    },

    getAdmins() {
        const users = this.getUsers();
        return users.filter(u => u.role === 'admin');
    },

    saveAll(users) {
        try {
            localStorage.setItem('campus_users', JSON.stringify(users));
            return true;
        } catch (e) {
            console.error("Auth.saveAll failed", e);
            return false;
        }
    },

    register(userData) {
        const users = this.getUsers();
        const email = userData.email.trim().toLowerCase();
        const studentId = userData.studentId ? userData.studentId.trim().toLowerCase() : '';
        
        if (users.find(u => u.email.toLowerCase() === email || (studentId && u.studentId && u.studentId.toLowerCase() === studentId))) {
            throw new Error('Account already exists, please login');
        }
        
        userData.id = 'user-' + Date.now();
        userData.role = 'student';
        userData.email = email;
        userData.status = 'active';
        userData.pinned = false;
        if (userData.studentId) {
            userData.studentId = userData.studentId.trim();
        }
        
        users.push(userData);
        this.saveAll(users);
        return userData;
    },

    login(emailOrId, password, role) {
        const users = this.getUsers();
        const normalizedInput = emailOrId.trim().toLowerCase();
        
        const user = users.find(u => {
            if (role === 'admin') {
                return u.role === 'admin' && u.email.toLowerCase() === normalizedInput;
            } else {
                return u.role === 'student' && (u.email.toLowerCase() === normalizedInput || 
                       (u.studentId && u.studentId.toLowerCase() === normalizedInput));
            }
        });

        if (!user) {
            throw new Error('User not registered');
        }

        if (user.password !== password) {
            throw new Error('Incorrect password');
        }

        if (user.status === 'disabled' || user.disabled) {
            throw new Error('Your account has been disabled. Contact admin.');
        }

        sessionStorage.setItem('current_user', JSON.stringify({
            userId: user.id,
            role: user.role,
            name: user.name,
            email: user.email
        }));

        return user;
    },

    logout() {
        sessionStorage.removeItem('current_user');
        if (typeof Theme !== 'undefined') Theme.clear();
        
        const isSubdir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/');
        if (isSubdir) {
            window.location.replace('../login.html');
        } else {
            window.location.replace('./login.html');
        }
    },

    getSession() {
        try {
            const session = sessionStorage.getItem('current_user');
            return session ? JSON.parse(session) : null;
        } catch (e) {
            console.error('Session retrieval error:', e);
            return null;
        }
    },

    checkAuth(requiredRole) {
        const session = this.getSession();
        const isSubdir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/');
        const loginPath = isSubdir ? '../login.html' : './login.html';

        if (!session) {
            window.location.replace(loginPath);
            return null;
        }

        if (requiredRole && session.role !== requiredRole) {
            window.location.replace(loginPath);
            return null;
        }
        return session;
    },

    findUserByEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === normalizedEmail);
    },

    resetPassword(email, newPassword) {
        const normalizedEmail = email.trim().toLowerCase();
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);

        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            this.saveAll(users);
            return true;
        }

        throw new Error('User not found');
    }
};

window.Auth = Auth;
Auth.init();
