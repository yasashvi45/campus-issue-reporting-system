const Bookmarks = {
    getAll() {
        try {
            return JSON.parse(localStorage.getItem('bookmarks')) || [];
        } catch (e) {
            console.error('Error loading bookmarks:', e);
            return [];
        }
    },

    saveAll(list) {
        try {
            localStorage.setItem('bookmarks', JSON.stringify(list));
            return true;
        } catch (e) {
            console.error('Error saving bookmarks:', e);
            return false;
        }
    },

    getForUser(userId) {
        const all = this.getAll();
        return all.filter(b => b.userId === userId);
    },

    get(userId) {
        const userBookmarks = this.getForUser(userId);
        return userBookmarks.map(b => b.issueId);
    },

    isBookmarked(userId, issueId) {
        const all = this.getAll();
        return all.some(b => b.userId === userId && b.issueId === issueId);
    },

    toggle(userId, issueId) {
        const bookmarks = this.getAll();
        const index = bookmarks.findIndex(b => b.userId === userId && b.issueId === issueId);
        
        if (index === -1) {
            bookmarks.push({ 
                userId, 
                issueId, 
                date: new Date().toISOString() 
            });
            this.saveAll(bookmarks);
            Notifications.showToast('Issue added to favorites', 'success');
            return true;
        } else {
            bookmarks.splice(index, 1);
            this.saveAll(bookmarks);
            Notifications.showToast('Issue removed from favorites', 'info');
            return false;
        }
    }
};
