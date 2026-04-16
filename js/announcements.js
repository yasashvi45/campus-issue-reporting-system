const Announcements = {
    getAll() {
        try {
            return JSON.parse(localStorage.getItem('announcements')) || [];
        } catch (e) {
            console.error('Error loading announcements:', e);
            return [];
        }
    },

    saveAll(list) {
        try {
            localStorage.setItem('announcements', JSON.stringify(list));
            return true;
        } catch (e) {
            console.error('Error saving announcements:', e);
            return false;
        }
    },

    getLatest() {
        const all = this.getAll();
        return all.length > 0 ? all[all.length - 1] : null;
    },

    create(announcement) {
        const list = this.getAll();
        const newAnnouncement = {
            id: Date.now(),
            text: announcement.text,
            type: announcement.type || 'info', // info, warning, success
            date: new Date().toISOString(),
            active: true
        };
        list.push(newAnnouncement);
        this.saveAll(list);
        return newAnnouncement;
    },

    delete(id) {
        const list = this.getAll();
        const filtered = list.filter(a => a.id !== id);
        this.saveAll(filtered);
    },

    deactivate(id) {
        const list = this.getAll();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
            list[index].active = false;
            this.saveAll(list);
        }
    }
};
