const AIAgent = {
    // 1. AI Auto-Triage & Categorization
    analyzeIssue(title, description) {
        const text = (title + " " + description).toLowerCase();
        let category = 'Other';
        let priority = 'Low';
        let assignedStaff = 'General Maintenance';

        // NLP Keyword Mapping
        const mappings = [
            { keywords: ['water', 'leak', 'pipe', 'plumb', 'tap', 'sink', 'flood', 'burst', 'toilet', 'flush', 'drain', 'leakage'], category: 'Water', staff: 'Plumbing Dept' },
            { keywords: ['power', 'light', 'electric', 'socket', 'wire', 'fan', 'spark', 'shock', 'fire', 'short circuit', 'bulb', 'switch', 'electricity'], category: 'Electrical', staff: 'Electrician' },
            { keywords: ['internet', 'wifi', 'network', 'router', 'connection', 'lan', 'signal', 'slow', 'ethernet'], category: 'Internet', staff: 'IT Support' },
            { keywords: ['ac ', 'aircon', 'cooling', 'heater', 'hvac', 'ventilation', 'filter', 'remote'], category: 'AC', staff: 'Maintenance Staff' },
            { keywords: ['clean', 'dirty', 'trash', 'garbage', 'dust', 'spill', 'smell', 'odor', 'waste', 'mop', 'sweep', 'cleaning'], category: 'Cleaning', staff: 'Cleaning Staff' },
            { keywords: ['security', 'door', 'lock', 'lost', 'suspicious', 'theft', 'threat', 'guard', 'gate', 'camera'], category: 'Security', staff: 'Security Guard' },
            { keywords: ['chair', 'table', 'desk', 'bench', 'furniture', 'broken leg', 'wood', 'cupboard'], category: 'Furniture', staff: 'Carpentry Dept' }
        ];

        for (const map of mappings) {
            if (map.keywords.some(k => text.includes(k))) {
                category = map.category;
                assignedStaff = map.staff;
                break;
            }
        }

        // Priority Prediction
        const highPriorityKeywords = ['urgent', 'dangerous', 'fire', 'broken', 'spark', 'shock', 'flood', 'burst', 'theft', 'threat', 'emergency', 'smoke', 'exposed wire'];
        const mediumPriorityKeywords = ['slow', 'not working properly', 'leak', 'dirty', 'smell', 'issue', 'problem'];

        if (highPriorityKeywords.some(k => text.includes(k))) {
            priority = 'High';
        } else if (mediumPriorityKeywords.some(k => text.includes(k))) {
            priority = 'Medium';
        }

        return {
            category,
            priority,
            assignedStaff,
            aiAssigned: true
        };
    },

    // 2. Auto Title Generation
    generateTitle(description) {
        if (!description) return "";
        const words = description.split(/\s+/).filter(w => w.length > 2);
        if (words.length === 0) return "New Issue";
        
        const analysis = this.analyzeIssue("", description);
        const keywords = words.slice(0, 3).join(" ");
        
        return `${analysis.category}: ${keywords}...`;
    },

    // 2.1 AI Suggestion System
    getSuggestion(description) {
        if (!description || description.length < 5) return null;
        const text = description.toLowerCase();
        
        const suggestions = [
            { keywords: ['water', 'leak', 'pipe'], suggestion: 'Check if the main valve area has any visible leakage.' },
            { keywords: ['wifi', 'internet', 'network'], suggestion: 'Try restarting your device or check if other students in your area have the same issue.' },
            { keywords: ['light', 'electricity', 'power'], suggestion: 'Check if the circuit breaker in your block has tripped.' },
            { keywords: ['ac ', 'cooling'], suggestion: 'Ensure windows are closed and the filter is not visibly clogged.' },
            { keywords: ['clean', 'garbage'], suggestion: 'Our cleaning staff usually does rounds every morning. We will expedite this.' }
        ];

        for (const item of suggestions) {
            if (item.keywords.some(k => text.includes(k))) {
                return item.suggestion;
            }
        }
        return "Please provide more details for a specific suggestion.";
    },

    // 3. Duplicate Issue Detection (AI)
    findSimilarIssues(title, description, location) {
        const issues = Issues.getAll();
        const unresolved = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
        
        const newText = (title + " " + description).toLowerCase().split(/\W+/).filter(w => w.length > 3);
        
        const matches = unresolved.map(issue => {
            const issueText = (issue.title + " " + issue.description).toLowerCase().split(/\W+/).filter(w => w.length > 3);
            
            // Keyword overlap
            const intersection = newText.filter(word => issueText.includes(word));
            const union = [...new Set([...newText, ...issueText])];
            let similarity = union.length > 0 ? intersection.length / union.length : 0;
            
            // Location boost
            if (location && issue.location === location) {
                similarity += 0.3;
            }
            
            return { ...issue, similarity };
        }).filter(i => i.similarity > 0.4) // Increased threshold for better accuracy
          .sort((a, b) => b.similarity - a.similarity);

        return matches.slice(0, 3);
    },

    // 4. Issue Clustering for Admin
    getClusteredIssues() {
        const issues = Issues.getAll();
        const unresolved = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
        const clusters = {};

        unresolved.forEach(issue => {
            const key = `${issue.location}|${issue.category}`;
            if (!clusters[key]) {
                clusters[key] = {
                    location: issue.location,
                    category: issue.category,
                    count: 0,
                    issues: []
                };
            }
            clusters[key].count++;
            clusters[key].issues.push(issue);
        });

        return Object.values(clusters).filter(c => c.count > 1).sort((a, b) => b.count - a.count);
    },

    // 5. Smart Analytics
    getAnalytics() {
        const issues = Issues.getAll();
        
        const categories = {};
        const locations = {};
        
        issues.forEach(i => {
            categories[i.category] = (categories[i.category] || 0) + 1;
            locations[i.location] = (locations[i.location] || 0) + 1;
        });

        const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
        const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];

        return {
            topCategory: topCategory ? topCategory[0] : 'N/A',
            topLocation: topLocation ? topLocation[0] : 'N/A',
            totalIssues: issues.length,
            repeatedAlerts: this.getClusteredIssues().length
        };
    },

    // 6. Smart Quick Replies
    getQuickReplies(status) {
        const replies = {
            'Pending': [
                { label: 'Assigned', text: 'Your issue has been assigned to our staff.' },
                { label: 'Reviewing', text: 'We are currently reviewing your report.' }
            ],
            'In Progress': [
                { label: 'Working', text: 'Work is in progress. We will update you soon.' },
                { label: 'Parts Needed', text: 'We are waiting for required parts to complete the fix.' }
            ],
            'Resolved': [
                { label: 'Resolved', text: 'Issue has been resolved. Please verify.' },
                { label: 'Closed', text: 'Thank you for your patience. The issue is now closed.' }
            ]
        };
        return replies[status] || [];
    },

    // 7. Smart Search (Keyword-based)
    smartSearch(query, issues) {
        if (!query) return issues;
        const q = query.toLowerCase();
        const qWords = q.split(/\s+/).filter(w => w.length > 1);

        return issues.filter(i => {
            const text = (i.title + " " + i.description + " " + i.location + " " + i.category).toLowerCase();
            
            // Partial match
            if (text.includes(q)) return true;
            
            // Keyword overlap
            return qWords.every(word => text.includes(word));
        });
    },

    // 3. Smart Escalation System
    checkEscalations(issues) {
        const now = new Date();
        let updated = false;
        const updatedIssues = issues.map(issue => {
            if (issue.status === 'Pending') {
                const createdTime = new Date(issue.createdAt);
                if (!isNaN(createdTime.getTime())) {
                    const minutesDiff = (now - createdTime) / (1000 * 60);
                    
                    if (minutesDiff > 2 && !issue.escalated) {
                        issue.escalated = true;
                        issue.priority = 'High';
                        issue.escalatedAt = now.toISOString();
                        issue.timeline = issue.timeline || [];
                        issue.timeline.push({
                            action: 'Escalated by AI',
                            date: now.toISOString(),
                            note: 'Issue not accepted within SLA. Auto-escalated to supervisor.'
                        });
                        updated = true;
                        Notifications.add('admin', `URGENT: Issue "${issue.title}" auto-escalated due to SLA breach.`, 'danger');
                    }
                }
            }
            return issue;
        });
        return { updated, issues: updatedIssues };
    },

    // 4. Predictive Workload Dashboard
    getPredictiveInsights(issues) {
        return [
            { type: 'alert', message: 'Water-related issues expected to increase in next 48 hours due to forecasted heavy rain.', icon: 'ri-rainy-line', color: 'var(--primary)' },
            { type: 'insight', message: 'Peak issue reporting time is typically between 8 AM and 10 AM.', icon: 'ri-time-line', color: 'var(--warning)' },
            { type: 'maintenance', message: 'HVAC systems in Main Block require preventative maintenance next week.', icon: 'ri-tools-line', color: 'var(--success)' }
        ];
    },

    // 5. IoT-Driven Predictive Maintenance
    simulateIoTSensors() {
        const sensors = [
            { id: 'SENS-001', type: 'Temperature', location: 'Server Room', value: 22, unit: '°C', status: 'Normal' },
            { id: 'SENS-002', type: 'Vibration', location: 'Water Pump A', value: 0.8, unit: 'mm/s', status: 'Warning' },
            { id: 'SENS-003', type: 'Humidity', location: 'Library Archives', value: 45, unit: '%', status: 'Normal' }
        ];

        // Simulate random fluctuation
        if (Math.random() > 0.8) {
            sensors[1].value = 2.5;
            sensors[1].status = 'Critical';
            // Auto-generation of issues removed as per user request to only show real user issues
        }
        return sensors;
    },

    // 6. Chatbot (Smart Assistant)
    chatbot: {
        responses: {
            "hello": "Hi there! I'm your Campus Assistant. How can I help you today?",
            "hi": "Hi there! I'm your Campus Assistant. How can I help you today?",
            "report": "To report an issue, click on 'Report Issue' in the sidebar, fill in the details, and submit. I can also help you categorize it!",
            "status": "You can check the status of your reported issues in the 'My Issues' section of your dashboard.",
            "category": "I automatically suggest categories based on your description. For example, 'leak' suggests Water, and 'wifi' suggests Internet.",
            "priority": "Priorities are set based on urgency. Fire or electrical hazards are always marked as Emergency/High.",
            "help": "I can help you with reporting issues, checking status, or understanding how the system works. Just ask!",
            "thank": "You're welcome! Let me know if you need anything else.",
            "bye": "Goodbye! Have a great day on campus."
        },

        getResponse(input) {
            const text = input.toLowerCase();
            for (const key in this.responses) {
                if (text.includes(key)) return this.responses[key];
            }
            
            // Smart suggestion if no direct match
            const analysis = AIAgent.analyzeIssue(text, "");
            if (analysis.category !== 'Other') {
                return `It sounds like you're describing a ${analysis.category} issue. Would you like me to help you report it?`;
            }

            return "I'm not sure I understand. You can ask about reporting issues, checking status, or specific categories like 'WiFi' or 'Water'.";
        }
    },

    // 7. Gamification & Badges
    calculateScore(issue) {
        let score = 10; // Base score
        if (issue.description && issue.description.length > 50) score += 10; // Detailed description
        if (issue.category !== 'Other') score += 5; // Correct categorization
        return score;
    },

    updateUserRank(userId, newPoints) {
        if (typeof Auth === 'undefined') return null;
        const users = Auth.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return null;
        
        if (!users[userIndex].points) users[userIndex].points = 0;
        if (!users[userIndex].rank) users[userIndex].rank = 'Novice';
        if (!users[userIndex].badges) users[userIndex].badges = [];
        
        users[userIndex].points += newPoints;
        const pts = users[userIndex].points;
        
        let newRank = 'Novice';
        if (pts >= 500) newRank = 'Campus Guardian';
        else if (pts >= 300) newRank = 'Sustainability Lead';
        else if (pts >= 100) newRank = 'Safety Pioneer';

        if (newRank !== users[userIndex].rank) {
            users[userIndex].rank = newRank;
            Notifications.add(userId, `Congratulations! You ranked up to ${newRank}!`, 'success');
        }

        Auth.saveAll(users);
        this.checkBadges(userId);
        return users[userIndex];
    },

    checkBadges(userId) {
        if (typeof Auth === 'undefined' || typeof Issues === 'undefined') return;
        const users = Auth.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return;

        const user = users[userIndex];
        if (!user.badges) user.badges = [];
        
        const userIssues = Issues.getAll().filter(i => i.studentId === userId);
        const resolvedIssues = userIssues.filter(i => i.status === 'Resolved');
        
        const badgeDefinitions = [
            { id: 'first_report', name: 'First Report', icon: 'ri-flag-line', desc: 'Reported your first issue', condition: () => userIssues.length >= 1 },
            { id: 'active_reporter', name: 'Active Reporter', icon: 'ri- medal-line', desc: 'Reported 5 issues', condition: () => userIssues.length >= 5 },
            { id: 'super_reporter', name: 'Super Reporter', icon: 'ri-trophy-line', desc: 'Reported 10 issues', condition: () => userIssues.length >= 10 },
            { id: 'problem_solver', name: 'Problem Solver', icon: 'ri-check-double-line', desc: 'First issue resolved', condition: () => resolvedIssues.length >= 1 },
            { id: 'efficient_solver', name: 'Efficient Solver', icon: 'ri-flashlight-line', desc: '5 issues resolved', condition: () => resolvedIssues.length >= 5 },
            { id: 'master_resolver', name: 'Master Resolver', icon: 'ri-vip-crown-line', desc: '10 issues resolved', condition: () => resolvedIssues.length >= 10 },
            { id: 'quick_fix', name: 'Quick Fix', icon: 'ri-timer-flash-line', desc: 'Issue resolved within 24h', condition: () => {
                return resolvedIssues.some(i => {
                    if (!i.resolvedAt || !i.createdAt) return false;
                    const diff = new Date(i.resolvedAt) - new Date(i.createdAt);
                    return diff > 0 && diff < (24 * 60 * 60 * 1000);
                });
            }},
            { id: 'communicator', name: 'Communicator', icon: 'ri-chat-smile-line', desc: 'Sent 5 chat messages', condition: () => {
                let chatCount = 0;
                userIssues.forEach(i => {
                    if (i.chat) {
                        chatCount += i.chat.filter(m => m.role === 'student').length;
                    }
                });
                return chatCount >= 5;
            }}
        ];

        let earnedNew = false;
        badgeDefinitions.forEach(badge => {
            const alreadyHas = user.badges.some(b => b.id === badge.id);
            if (!alreadyHas && badge.condition()) {
                user.badges.push({
                    id: badge.id,
                    name: badge.name,
                    icon: badge.icon,
                    description: badge.desc,
                    date: new Date().toISOString()
                });
                earnedNew = true;
                Notifications.add(userId, `New Badge Earned: ${badge.name}!`, 'success');
            }
        });

        if (earnedNew) {
            Auth.saveAll(users);
        }
    },

    getLeaderboard() {
        const users = Auth.getUsers();
        return users.map(user => ({
            id: user.id,
            name: user.name,
            points: user.points || 0,
            rank: user.rank || 'Novice',
            badges: user.badges || []
        })).sort((a, b) => b.points - a.points).slice(0, 5);
    },

    getMissions() {
        return [
            { id: 1, title: 'Clean Hostel Drive', description: 'Report 5 cleaning issues', target: 5, current: 2, reward: '50 pts' },
            { id: 2, title: 'Zero Waste Week', description: 'Properly categorize 10 issues', target: 10, current: 8, reward: '100 pts + Badge' }
        ];
    }
};

window.AIAgent = AIAgent;
