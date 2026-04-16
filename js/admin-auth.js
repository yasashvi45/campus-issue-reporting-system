const AdminAuth = {
    ADMIN_CODE: 'admin',

    register(adminData) {
        if (adminData.adminCode !== this.ADMIN_CODE) {
            throw new Error('Invalid Admin Code');
        }

        const users = Auth.getUsers();
        const email = adminData.email.trim().toLowerCase();
        
        if (users.find(u => u.email.toLowerCase() === email)) {
            throw new Error('Account already exists, please login');
        }

        const collegeName = adminData.collegeName ? adminData.collegeName.trim() : 'Campus Issue Reporting System';
        localStorage.setItem('collegeName', collegeName);

        const newAdmin = {
            id: 'admin-' + Date.now(),
            name: adminData.name,
            email: email,
            password: adminData.password,
            collegeName: collegeName,
            role: 'admin',
            department: 'Administration',
            status: 'active',
            adminId: adminData.adminId ? adminData.adminId.trim() : 'ADM-' + Date.now().toString().slice(-5)
        };

        users.push(newAdmin);
        Auth.saveAll(users);
        return newAdmin;
    },

    login(email, password) {
        return Auth.login(email, password, 'admin');
    }
};

window.AdminAuth = AdminAuth;
