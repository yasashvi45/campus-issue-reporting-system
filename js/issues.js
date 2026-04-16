const Issues = {
    getAll() {
        try {
            const issues = JSON.parse(localStorage.getItem('campus_issues')) || [];
            return this.cleanData(issues);
        } catch (e) {
            console.error('Error loading issues:', e);
            return [];
        }
    },

    cleanData(issues) {
        if (!Array.isArray(issues)) return [];
        
        const uniqueIssues = new Map();
        let changed = false;
        
        for (const i of issues) {
            if (!i.id) continue;
            
            let itemChanged = false;
            if (!i.title) { i.title = "Untitled Issue"; itemChanged = true; }
            if (!i.studentId) { i.studentId = i.userId || 'unknown'; itemChanged = true; }
            if (!i.status) { i.status = 'Pending'; itemChanged = true; }
            if (!i.date) { i.date = i.createdAt || new Date().toISOString(); itemChanged = true; }
            if (!i.createdAt) { i.createdAt = i.date || new Date().toISOString(); itemChanged = true; }
 
            if (itemChanged) changed = true;

            if (!uniqueIssues.has(i.id)) {
                uniqueIssues.set(i.id, i);
            }
        }
 
        const cleaned = Array.from(uniqueIssues.values());
        
        if (changed || cleaned.length !== issues.length) {
            this.saveAll(cleaned);
        }
        
        return cleaned;
    },

    saveAll(issues) {
        try {
            localStorage.setItem('campus_issues', JSON.stringify(issues));
            window.dispatchEvent(new Event("storage"));
            return true;
        } catch (e) {
            console.error("Issues.saveAll failed", e);
            return false;
        }
    },

    getById(id) {
        const issues = this.getAll();
        return issues.find(i => i.id === id);
    },

    getByStudent(userId) {
        const issues = this.getAll();
        return issues.filter(i => i.studentId === userId);
    },

    checkDuplicate(issueData) {
        if (!window.AIAgent) return [];
        const location = (issueData.block && issueData.room) ? `${issueData.block} - ${issueData.room}` : (issueData.location || 'Unknown');
        return AIAgent.findSimilarIssues(issueData.title || '', issueData.description || '', location);
    },

    create(issueData, force = false) {
        if (!issueData.studentName || issueData.studentName === 'Unknown Student') {
            throw new Error('Valid student name is required for submission.');
        }

        const issues = this.getAll();
        
        let aiData = {};
        if (window.AIAgent) {
            aiData = AIAgent.analyzeIssue(issueData.title || '', issueData.description || '');
            if (!issueData.title || issueData.title.toLowerCase() === 'new issue') {
                issueData.title = AIAgent.generateTitle(issueData.description);
            }
        }

        if (!force) {
            const now = Date.now();
            const isDuplicate = issues.some(i => 
                i.studentId === issueData.studentId && 
                i.title.trim() === issueData.title.trim() && 
                i.description.trim() === issueData.description.trim() &&
                (now - new Date(i.createdAt).getTime()) < 60000
            );
            
            if (isDuplicate) {
                throw new Error('This issue has already been reported recently.');
            }
        }

        const idStr = 'ISS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const location = (issueData.block && issueData.room) ? `${issueData.block} - ${issueData.room}` : (issueData.location || 'Unknown');

        const newIssue = {
            id: idStr,
            title: issueData.title.trim(),
            description: issueData.description.trim(),
            location: location,
            block: issueData.block || 'N/A',
            room: issueData.room || 'N/A',
            category: aiData.category || issueData.category || 'Other',
            priority: aiData.priority || issueData.priority || 'Medium',
            status: 'Pending',
            studentId: issueData.studentId,
            studentName: issueData.studentName,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null,
            isImportant: false,
            pinned: false,
            rating: null,
            ratingComment: null,
            assignedStaff: aiData.assignedStaff || '',
            comments: [],
            chat: [],
            tags: [],
            timeline: [{
                action: 'Issue Reported',
                date: new Date().toISOString(),
                note: 'Issue successfully submitted by student.'
            }],
            history: [{
                status: 'Pending',
                updatedAt: new Date().toISOString(),
                note: 'Initial report'
            }]
        };

        const similar = this.checkDuplicate(newIssue);
        if (similar.length > 0) {
            newIssue.tags.push('Repeated Issue');
            newIssue.isRepeated = true;
            newIssue.similarTo = similar[0].id;
        }

        if (aiData.aiAssigned) {
            newIssue.timeline.push({
                action: 'AI Auto-Triage',
                date: new Date().toISOString(),
                note: `AI categorized as ${aiData.category} and assigned to ${aiData.assignedStaff}.`
            });
        }

        issues.push(newIssue);
        this.saveAll(issues);
        
        if (window.AIAgent && newIssue.studentId !== 'system') {
            const score = AIAgent.calculateScore(newIssue);
            AIAgent.updateUserRank(newIssue.studentId, score);
            Notifications.add(newIssue.studentId, `Issue reported! You earned +${score} points.`, 'success', newIssue.id);
        }

        if (newIssue.isRepeated) {
            Notifications.add(newIssue.studentId, "We already have a similar issue reported. Our team is working on it.", "info", newIssue.id);
            Notifications.notifyAdmins(`Multiple reports detected for the same issue in ${newIssue.location}`, 'warning', newIssue.id);
        } else {
            Notifications.notifyAdmins(`New issue reported: ${newIssue.title}`, 'info', newIssue.id);
        }
        
        return newIssue;
    },

    getEnrichedIssues() {
        const issues = this.getAll();
        const now = new Date();
        
        const enrichedIssues = [];
        for (const issue of issues) {
            const enriched = { ...issue, tags: [...(issue.tags || [])] };
            
            if (issue.status === 'Pending') {
                const created = new Date(issue.createdAt);
                const hoursDiff = (now - created) / (1000 * 60 * 60);
                if (hoursDiff > 24) {
                    if (!enriched.tags.includes('Overdue Issue')) enriched.tags.push('Overdue Issue');
                    enriched.isOverdue = true;
                }
            }
            
            if (window.AIAgent) {
                const clusters = AIAgent.getClusteredIssues();
                const cluster = clusters.find(c => c.location === issue.location && c.category === issue.category);
                if (cluster && cluster.count >= 3) {
                    if (!enriched.tags.includes('High Frequency')) enriched.tags.push('High Frequency');
                    enriched.isHighFrequency = true;
                }
            }
            enrichedIssues.push(enriched);
        }
        return enrichedIssues;
    },

    update(id, updates) {
        if (typeof Notifications === 'undefined') return null;
        const issues = this.getAll();
        const index = issues.findIndex(i => i.id === id);
        if (index === -1) return null;

        const issue = issues[index];
        const oldStatus = issue.status;
        const newUpdates = { ...updates, updatedAt: new Date().toISOString() };
        
        if (updates.status === 'Resolved' && oldStatus !== 'Resolved') {
            newUpdates.resolvedAt = new Date().toISOString();
        } else if (updates.status && updates.status !== 'Resolved') {
            newUpdates.resolvedAt = null;
        }

        if (updates.status && updates.status !== oldStatus && !updates.timeline) {
            const timeline = [...(issue.timeline || [])];
            timeline.push({
                action: 'Status Updated',
                date: new Date().toISOString(),
                note: `Status changed from ${oldStatus} to ${updates.status}`
            });
            newUpdates.timeline = timeline;

            const history = [...(issue.history || [])];
            history.push({
                status: updates.status,
                updatedAt: new Date().toISOString(),
                note: updates.note || `Status updated to ${updates.status}`
            });
            newUpdates.history = history;
        }

        if (updates.assignedStaff && updates.assignedStaff !== issue.assignedStaff) {
            const timeline = [...(issue.timeline || (newUpdates.timeline || []))];
            timeline.push({
                action: 'Staff Assigned',
                date: new Date().toISOString(),
                note: `Assigned to ${updates.assignedStaff}`
            });
            newUpdates.timeline = timeline;
        }

        const updatedIssue = { ...issue, ...newUpdates };
        issues[index] = updatedIssue;
        this.saveAll(issues);
        
        if (updates.status && updates.status !== oldStatus) {
            Notifications.add(updatedIssue.studentId, `Issue "${updatedIssue.title}" status updated to ${updatedIssue.status}.`, 'info', updatedIssue.id);
            
            if (updates.status === 'Resolved' && window.AIAgent) {
                AIAgent.checkBadges(updatedIssue.studentId);
            }
        }
        
        return updatedIssue;
    },

    rate(id, rating, comment) {
        const issues = this.getAll();
        const index = issues.findIndex(i => i.id === id);
        if (index === -1) return null;

        const issue = issues[index];
        issue.rating = rating;
        issue.ratingComment = comment;
        issue.updatedAt = new Date().toISOString();
        
        this.saveAll(issues);
        Notifications.notifyAdmins(`New rating for issue ${issue.id}: ${rating} stars`, 'info', issue.id);
        return issue;
    },

    delete(id) {
        const issues = this.getAll();
        const filtered = issues.filter(i => i.id !== id);
        this.saveAll(filtered);
    },

    addComment(issueId, comment) {
        const issues = this.getAll();
        const index = issues.findIndex(i => i.id === issueId);
        if (index === -1) return null;

        const issue = issues[index];
        issue.comments.push({
            id: 'COM-' + Date.now(),
            text: comment.text,
            author: comment.author,
            date: new Date().toISOString()
        });
        issue.updatedAt = new Date().toISOString();
        
        this.saveAll(issues);
        Notifications.add(issue.studentId, `New admin update on issue: ${issue.title}`, 'info', issue.id);
        return issue;
    },

    addChatMessage(issueId, messageData) {
        if (typeof Auth === 'undefined' || typeof Notifications === 'undefined') return null;
        const issues = this.getAll();
        const index = issues.findIndex(i => i.id === issueId);
        if (index === -1) return null;

        const issue = issues[index];
        if (!issue.chat) issue.chat = [];
        
        const newMessage = {
            id: 'MSG-' + Date.now(),
            text: messageData.text,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            role: messageData.role,
            date: new Date().toISOString()
        };

        issue.chat.push(newMessage);
        issue.updatedAt = new Date().toISOString();
        
        // Add to timeline
        if (!issue.timeline) issue.timeline = [];
        issue.timeline.push({
            action: 'Chat Activity',
            date: new Date().toISOString(),
            note: `${messageData.senderName} (${messageData.role}) sent a message.`
        });
        
        this.saveAll(issues);

        if (messageData.role === 'student') {
            Notifications.notifyAdmins(`New message from student on issue ${issue.id}`, 'chat', issue.id);
            if (window.AIAgent) {
                AIAgent.checkBadges(messageData.senderId);
            }
        } else {
            Notifications.add(issue.studentId, `New message from admin on issue ${issue.id}`, 'chat', issue.id);
        }

        return newMessage;
    },

    exportToCSV() {
        const issues = this.getAll();
        if (issues.length === 0) {
            Notifications.showToast('No issues to export', 'info');
            return;
        }

        const headers = ['ID', 'Student', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Date'];
        const rows = issues.map(i => [
            i.id,
            i.studentName,
            `"${i.title.replace(/"/g, '""')}"`,
            i.category,
            i.priority,
            i.status,
            `"${i.location.replace(/"/g, '""')}"`,
            new Date(i.date).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `campus_issues_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.Issues = Issues;
