const Student = {
    loadDashboard() {
        try {
            if (typeof Auth === 'undefined' || typeof Issues === 'undefined') return;
            const session = Auth.getSession();
            if (!session) return;
            
            // Force fresh data
            const allEnriched = Issues.getEnrichedIssues();
            const issues = allEnriched.filter(i => i.studentId === session.userId);
            const notifs = typeof Notifications !== 'undefined' ? Notifications.getForUser(session.userId) : [];

            // Update stats
            if (document.getElementById('totalIssues')) {
                document.getElementById('totalIssues').innerText = issues.length;
            }
            if (document.getElementById('pendingIssues')) {
                document.getElementById('pendingIssues').innerText = issues.filter(i => i.status === 'Pending').length;
            }
            if (document.getElementById('resolvedIssues')) {
                document.getElementById('resolvedIssues').innerText = issues.filter(i => i.status === 'Resolved').length;
            }
            
            const users = Auth.getUsers();
            const currentUser = users.find(u => u.id === session.userId) || { points: 0, rank: 'Novice', badges: [] };
            
            if (document.getElementById('userPoints')) {
                document.getElementById('userPoints').innerText = currentUser.points || 0;
            }
            if (document.getElementById('userRank') && window.AIAgent) {
                const leaderboard = AIAgent.getLeaderboard();
                document.getElementById('userRank').innerText = `#${leaderboard.findIndex(u => u.id === session.userId) + 1 || 0}`;
            }
            if (document.getElementById('userBadges')) {
                document.getElementById('userBadges').innerText = (currentUser.badges || []).length;
            }

            // Load recent issues
            const container = document.getElementById('recentIssuesContainer');
            if (container) {
                if (issues.length === 0) {
                    container.innerHTML = UI.getEmptyState("No issues reported yet", "Your reported issues will appear here", "ri-inbox-line");
                } else {
                    container.innerHTML = issues.slice(-5).reverse().map(i => {
                        const tagsHtml = (i.tags || []).map(tag => `
                            <span class="badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); font-size: 9px; padding: 2px 6px;">${tag}</span>
                        `).join('');

                        return `
                        <div class="issue-card" onclick="UI.showIssueDetails('${i.id}')" style="cursor: pointer;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <div>
                                    <div style="font-weight: 600; font-size: 15px; color: var(--text);">${i.title}</div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${i.id} • ${i.category}</div>
                                    <div style="display: flex; gap: 4px; margin-top: 4px;">${tagsHtml}</div>
                                </div>
                                <span class="badge" style="background: ${this.getPriorityColor(i.priority)}15; color: ${this.getPriorityColor(i.priority)}; font-weight: 700; font-size: 10px; text-transform: uppercase;">${i.priority}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}" style="font-size: 11px; font-weight: 600;">${i.status}</span>
                                <div style="font-size: 12px; color: var(--text-muted);">${new Date(i.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                    `}).join('');
                }
            }

            // Load Gamification Data
            const userRankContainer = document.getElementById('userRankContainer');
            if (userRankContainer) {
                const users = Auth.getUsers();
                const currentUser = users.find(u => u.id === session.userId) || { points: 0, rank: 'Novice', badges: [] };
                
                const points = currentUser.points || 0;
                const rank = currentUser.rank || 'Novice';
                const badges = currentUser.badges || [];
                let icon = 'ri-seedling-line';
                let color = '#4F46E5'; // Default primary
                
                if (rank === 'Safety Pioneer') { icon = 'ri-shield-star-line'; color = '#3b82f6'; }
                else if (rank === 'Sustainability Lead') { icon = 'ri-leaf-line'; color = '#10b981'; }
                else if (rank === 'Campus Guardian') { icon = 'ri-vip-crown-line'; color = '#f59e0b'; }

                let badgesHtml = '';
                if (badges.length > 0) {
                    badgesHtml = `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                        ${badges.map(b => `<span style="background: var(--bg); padding: 4px 10px; border-radius: 8px; font-size: 11px; border: 1px solid var(--border); color: var(--text-light); font-weight: 500;">${b}</span>`).join('')}
                    </div>`;
                }

                userRankContainer.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 56px; height: 56px; border-radius: 16px; background: ${color}15; display: flex; align-items: center; justify-content: center; font-size: 28px; color: ${color}; flex-shrink: 0; border: 1px solid ${color}30;">
                            <i class="${icon}"></i>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--text);">${rank}</div>
                            <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">${points} Impact Points</div>
                        </div>
                    </div>
                    ${badgesHtml}
                `;
            }

            const leaderboardContainer = document.getElementById('leaderboardContainer');
            if (leaderboardContainer) {
                const leaderboard = AIAgent.getLeaderboard();
                if (leaderboard.length === 0) {
                    leaderboardContainer.innerHTML = UI.getEmptyState("No guardians yet", "Report issues to climb the ranks", "ri-trophy-line");
                } else {
                    leaderboardContainer.innerHTML = leaderboard.slice(0, 3).map((user, index) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 28px; height: 28px; border-radius: 50%; background: ${index === 0 ? '#f59e0b20' : index === 1 ? '#94a3b820' : '#b4530920'}; color: ${index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#b45309'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
                                    #${index + 1}
                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px; color: var(--text);">${user.name}</div>
                                    <div style="font-size: 12px; opacity: 0.6;">${user.rank || 'Novice'}</div>
                                </div>
                            </div>
                            <div style="font-weight: 700; color: var(--primary);">${user.points || 0} pts</div>
                        </div>
                    `).join('');
                }
            }

            const missionsContainer = document.getElementById('missionsContainer');
            if (missionsContainer) {
                const missions = AIAgent.getMissions();
                if (missions.length === 0) {
                    missionsContainer.innerHTML = UI.getEmptyState("No active missions", "Check back later for new challenges", "ri-focus-2-line");
                } else {
                    missionsContainer.innerHTML = missions.map(mission => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                                    <i class="ri-focus-2-line"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px; color: var(--text);">${mission.title}</div>
                                    <div style="font-size: 12px; opacity: 0.6;">${mission.description}</div>
                                </div>
                            </div>
                            <div style="font-weight: 700; color: var(--success);">+${mission.reward} pts</div>
                        </div>
                    `).join('');
                }
            }

            // Load timeline
            const timeline = document.getElementById('activityTimeline');
            if (timeline) {
                const activities = [
                    ...issues.map(i => ({ type: 'report', title: `Reported: ${i.title}`, date: i.date })),
                    ...notifs.map(n => ({ type: 'notif', title: n.message, date: n.date }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

                if (activities.length === 0) {
                    timeline.innerHTML = UI.getEmptyState("No recent activity", "Activity will appear here once you report issues", "ri-history-line");
                } else {
                    timeline.innerHTML = activities.map(a => {
                        const date = new Date(a.date);
                        const dateStr = !isNaN(date.getTime()) ? date.toLocaleString() : 'N/A';
                        return `
                        <div style="display: flex; gap: 16px; align-items: flex-start; padding: 12px; border-radius: 12px; transition: var(--transition); cursor: default;" onmouseover="this.style.background='rgba(79, 70, 229, 0.05)'" onmouseout="this.style.background='transparent'">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--primary); margin-top: 5px; box-shadow: 0 0 8px var(--primary);"></div>
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: var(--text);">${a.title}</div>
                                <div style="font-size: 12px; opacity: 0.5; margin-top: 2px;">${dateStr}</div>
                            </div>
                        </div>
                    `}).join('');
                }
            }
            this.loadFavorites();
        } catch (error) {
            console.error("Error in Student.loadDashboard:", error);
        }
    },

    loadFavorites() {
        try {
            const session = Auth.getSession();
            const favoriteIds = Bookmarks.get(session.userId);
            const container = document.getElementById('favoritesList');
            if (!container) return;

            if (favoriteIds.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 32px; opacity: 0.5;">
                        <i class="ri-bookmark-line" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                        <p style="font-size: 14px;">No bookmarked issues yet.</p>
                    </div>
                `;
                return;
            }

            const allIssues = Issues.getAll();
            const issues = favoriteIds.map(id => allIssues.find(i => i.id === id)).filter(i => i);
            container.innerHTML = issues.map(i => `
                <div style="background: var(--card); padding: 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: var(--transition); border: 1px solid var(--border);" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateX(4px)'" onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateX(0)'" onclick="UI.showIssueDetails('${i.id}')">
                    <div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--text);">${i.title}</div>
                        <div style="font-size: 12px; opacity: 0.6; margin-top: 2px;">${i.category} • <span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}" style="font-size: 10px; padding: 2px 6px;">${i.status}</span></div>
                    </div>
                    <i class="ri-arrow-right-s-line" style="color: var(--primary); font-size: 20px;"></i>
                </div>
            `).join('');
        } catch (error) {
            console.error("Error in Student.loadFavorites:", error);
        }
    },

    getPriorityColor(priority) {
        switch(priority) {
            case 'Low': return '#10B981';
            case 'Medium': return '#F59E0B';
            case 'High': return '#EF4444';
            case 'Emergency': return '#7F1D1D';
            default: return '#4F46E5';
        }
    },

    loadMyIssues(filters = {}) {
        try {
            if (typeof Auth === 'undefined' || typeof Issues === 'undefined') return;
            const session = Auth.getSession();
            if (!session) return;

            const allEnriched = Issues.getEnrichedIssues();
            let issues = allEnriched.filter(i => i.studentId === session.userId);

            if (filters.search) {
                if (window.AIAgent) {
                    issues = AIAgent.smartSearch(filters.search, issues);
                } else {
                    issues = issues.filter(i => i.title.toLowerCase().includes(filters.search.toLowerCase()));
                }
            }
            if (filters.category) {
                issues = issues.filter(i => i.category === filters.category);
            }
            if (filters.status) {
                issues = issues.filter(i => i.status === filters.status);
            }

            // Apply Sorting
            const sortBy = filters.sortBy || 'newest';
            if (sortBy === 'newest') {
                issues.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
            } else if (sortBy === 'priority') {
                const priorityMap = { 'Emergency': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                issues.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);
            }

            const table = document.getElementById('myIssuesTable');
            if (table) {
                if (issues.length === 0) {
                    table.innerHTML = `<tr><td colspan="6">${UI.getEmptyState("No issues found", "Try adjusting your filters or search query", "ri-search-line")}</td></tr>`;
                    return;
                }
                table.innerHTML = issues.map(i => {
                    const date = new Date(i.date);
                    const dateStr = !isNaN(date.getTime()) ? date.toLocaleDateString() : 'N/A';
                    
                    // Add AI Tags
                    const tagsHtml = (i.tags || []).map(tag => `
                        <span class="badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); font-size: 9px; padding: 2px 6px; margin-top: 4px; display: inline-block;">${tag}</span>
                    `).join('');

                    return `
                    <tr style="border-bottom: 1px solid var(--border); transition: var(--transition);" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 16px;">
                            <div style="font-weight: 600; color: var(--text);">${i.title}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${i.id}</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">${tagsHtml}</div>
                        </td>
                        <td style="padding: 16px; color: var(--text);">${i.block} - ${i.room}</td>
                        <td style="padding: 16px;"><span class="badge" style="background: ${this.getPriorityColor(i.priority)}15; color: ${this.getPriorityColor(i.priority)}; font-weight: 600;">${i.priority}</span></td>
                        <td style="padding: 16px;"><span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}">${i.status}</span></td>
                        <td style="padding: 16px; color: var(--text-light);">${dateStr}</td>
                        <td style="padding: 16px;">
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-outline" onclick="UI.showIssueDetails('${i.id}')" style="padding: 6px 12px; font-size: 12px; background: var(--card); border: 1px solid var(--border); color: var(--text);">View</button>
                                <div class="action-container" style="position: relative;">
                                    <button class="btn btn-outline danger" onclick="event.stopPropagation(); this.nextElementSibling.style.display='block'" style="padding: 6px 12px; font-size: 12px; border-color: var(--danger); color: var(--danger);">Delete</button>
                                    <div class="delete-popup glass" style="display: none; position: absolute; bottom: 100%; right: 0; width: 200px; padding: 16px; border-radius: 12px; z-index: 100; margin-bottom: 8px; border: 1px solid var(--danger);">
                                        <p style="font-size: 12px; margin-bottom: 12px; color: var(--text);">Are you sure you want to delete this issue?</p>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn btn-primary danger" onclick="Issues.delete('${i.id}'); Student.loadMyIssues(); Notifications.showToast('Issue deleted', 'success');" style="padding: 4px 8px; font-size: 11px; flex: 1;">Yes</button>
                                            <button class="btn btn-outline" onclick="this.parentElement.parentElement.style.display='none'" style="padding: 4px 8px; font-size: 11px; flex: 1;">No</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `}).join('');
            }
        } catch (error) {
            console.error("Error in Student.loadMyIssues:", error);
        }
    }
};

window.Student = Student;

document.addEventListener("DOMContentLoaded", () => {
    try {
        if (window.Student) {
            if (document.getElementById('recentIssuesContainer')) {
                Student.loadDashboard();
            }
            if (document.getElementById('myIssuesTable')) {
                Student.loadMyIssues();
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
});
