const Admin = {
    loadDashboard() {
        try {
            if (typeof Auth === 'undefined' || typeof Issues === 'undefined') return;
            console.log("--- DEBUG: loadDashboard ---");
            const issuesData = JSON.parse(localStorage.getItem("campus_issues")) || [];
            const usersData = JSON.parse(localStorage.getItem("campus_users")) || [];
            
            let issues = Issues.getEnrichedIssues();
            const students = Auth.getStudents();
            const users = Auth.getUsers();
            
            // AI Agent Checks
            if (window.AIAgent) {
                const escalationResult = AIAgent.checkEscalations(issues);
                if (escalationResult.updated) {
                    issues = escalationResult.issues;
                    Issues.saveAll(issues);
                }
                issues = Issues.getEnrichedIssues(); // Refresh issues list
            }

            if (document.getElementById('totalIssues')) document.getElementById('totalIssues').innerText = issues.length;
            if (document.getElementById('pendingIssues')) document.getElementById('pendingIssues').innerText = issues.filter(i => i.status.toLowerCase() === 'pending').length;
            if (document.getElementById('resolvedIssues')) document.getElementById('resolvedIssues').innerText = issues.filter(i => i.status.toLowerCase() === 'resolved').length;
            if (document.getElementById('totalStudents')) document.getElementById('totalStudents').innerText = students.length;
            
            // Resolution Analytics
            const resolvedIssues = issues.filter(i => i.status === 'Resolved' && i.resolvedAt);
            if (document.getElementById('avgResolutionTime')) {
                if (resolvedIssues.length > 0) {
                    const totalTime = resolvedIssues.reduce((acc, i) => acc + (new Date(i.resolvedAt) - new Date(i.createdAt)), 0);
                    const avgTime = totalTime / resolvedIssues.length;
                    const hours = Math.floor(avgTime / (1000 * 60 * 60));
                    const minutes = Math.floor((avgTime % (1000 * 60 * 60)) / (1000 * 60));
                    document.getElementById('avgResolutionTime').innerText = `${hours}h ${minutes}m`;
                } else {
                    document.getElementById('avgResolutionTime').innerText = 'N/A';
                }
            }

            // Add Active/Disabled counts if elements exist
            if (document.getElementById('activeUsers')) document.getElementById('activeUsers').innerText = students.filter(s => s.status !== 'disabled').length;
            if (document.getElementById('disabledUsers')) document.getElementById('disabledUsers').innerText = students.filter(s => s.status === 'disabled').length;

            // Render Recent Issues as Cards (Latest 3-5)
            const issuesContainer = document.getElementById('recentIssuesContainer');
            if (issuesContainer) {
                if (issues.length === 0) {
                    issuesContainer.innerHTML = `<div style="text-align: center; padding: 32px; opacity: 0.5;"><i class="ri-inbox-line" style="font-size: 24px; display: block; margin-bottom: 8px;"></i><p style="font-size: 14px;">No recent issues found</p></div>`;
                } else {
                    const recentIssues = [...issues].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                    issuesContainer.innerHTML = recentIssues.map(i => {
                        const user = students.find(u => u.id === i.studentId) || users.find(u => u.id === i.studentId);
                        const studentName = user ? user.name : 'Unknown Student';
                        const priorityColor = this.getPriorityColor(i.priority);
                        const date = new Date(i.date);
                        const dateStr = !isNaN(date.getTime()) ? date.toLocaleDateString() : 'N/A';
                        
                        return `
                        <div class="issue-card" onclick="UI.showIssueDetails('${i.id}')" style="background: var(--card); padding: 16px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease; cursor: pointer; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 700; font-size: 15px; color: var(--text); margin-bottom: 2px;">${i.title}</div>
                                    <div style="font-size: 12px; opacity: 0.7; color: var(--text-light);">${studentName} • ${dateStr}</div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                    <span class="badge" style="background: ${priorityColor}15; color: ${priorityColor}; font-weight: 700; font-size: 10px; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;">${i.priority}</span>
                                    <span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}" style="font-size: 10px; font-weight: 700; text-transform: uppercase;">${i.status}</span>
                                </div>
                            </div>
                        </div>
                    `}).join('');
                }
            }
            // ... rest of loadDashboard logic ...

        // Load AI Analytics & Insights
        const aiInsightsContainer = document.getElementById('aiInsightsContainer');
        if (aiInsightsContainer && window.AIAgent) {
            const analytics = AIAgent.getAnalytics();
            const clusters = AIAgent.getClusteredIssues();
            
            if (issues.length === 0) {
                aiInsightsContainer.closest('.card').style.display = 'none';
            } else {
                aiInsightsContainer.closest('.card').style.display = 'block';
                let html = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div style="background: rgba(79, 70, 229, 0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(79, 70, 229, 0.1);">
                            <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; margin-bottom: 4px;">Top Category</div>
                            <div style="font-weight: 600; font-size: 14px;">${analytics.topCategory}</div>
                        </div>
                        <div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.1);">
                            <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; margin-bottom: 4px;">Top Location</div>
                            <div style="font-weight: 600; font-size: 14px;">${analytics.topLocation}</div>
                        </div>
                    </div>
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                        <i class="ri-bubble-chart-line" style="color: var(--primary);"></i> Issue Clusters
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                `;

                if (clusters.length === 0) {
                    html += `<div style="font-size: 12px; opacity: 0.5; text-align: center; padding: 12px;">No clusters detected</div>`;
                } else {
                    html += clusters.slice(0, 3).map(c => `
                        <div style="padding: 10px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 13px; font-weight: 500;">${c.category} at ${c.location}</div>
                                <div style="font-size: 11px; opacity: 0.6;">${c.count} related issues</div>
                            </div>
                            <i class="ri-arrow-right-s-line" style="opacity: 0.3;"></i>
                        </div>
                    `).join('');
                }

                html += `</div>`;
                aiInsightsContainer.innerHTML = html;
            }
        }

        // Load Announcements
        if (window.Announcements) {
            const announcementsList = document.getElementById('announcementsList');
            if (announcementsList) {
                const list = Announcements.getAll();
                if (list.length === 0) {
                    announcementsList.innerHTML = '<p style="font-size: 12px; opacity: 0.5; text-align: center; padding: 16px;">No announcements yet</p>';
                } else {
                    announcementsList.innerHTML = list.reverse().slice(0, 3).map(a => `
                        <div style="padding: 12px; border-radius: 12px; background: var(--bg); border-left: 4px solid ${a.type === 'warning' ? 'var(--warning)' : a.type === 'success' ? 'var(--success)' : 'var(--primary)'};">
                            <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">${a.text}</div>
                            <div style="font-size: 10px; opacity: 0.5;">${new Date(a.date).toLocaleString()}</div>
                        </div>
                    `).join('');
                }
            }
        }

        const statusData = issues.reduce((acc, i) => {
            acc[i.status] = (acc[i.status] || 0) + 1;
            return acc;
        }, {});
        Charts.renderStatusChart('statusChart', statusData);

        const monthlyData = issues.reduce((acc, i) => {
            const date = new Date(i.date);
            if (!isNaN(date.getTime())) {
                const month = date.toLocaleString('default', { month: 'short' });
                acc[month] = (acc[month] || 0) + 1;
            }
            return acc;
        }, {});
        
        const monthlyChartEl = document.getElementById('monthlyChart');
        if (monthlyChartEl) {
            if (issues.length === 0) {
                monthlyChartEl.closest('.card').style.display = 'none';
            } else {
                monthlyChartEl.closest('.card').style.display = 'block';
                Charts.renderBarChart('monthlyChart', monthlyData, 'Issues per Month');
            }
        }

        // Load timeline
        const timeline = document.getElementById('adminTimeline');
        if (timeline) {
            const activities = [
                ...issues.map(i => ({ title: `New issue: ${i.title}`, date: i.date })),
                ...students.map(s => {
                    const idParts = s.id.split('-');
                    const timestamp = idParts[1] ? parseInt(idParts[1]) : Date.now();
                    const date = new Date(timestamp);
                    return { 
                        title: `New student: ${s.name}`, 
                        date: !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString() 
                    };
                })
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

            if (activities.length === 0) {
                timeline.innerHTML = UI.getEmptyState("No recent activity", "Activity will appear here once users interact with the system", "ri-history-line");
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

        // Load AI Insights
        if (aiInsightsContainer && window.AIAgent) {
            const insights = AIAgent.getPredictiveInsights(issues);
            aiInsightsContainer.innerHTML += `<div style="margin-top: 16px; font-size: 13px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;"><i class="ri-lightbulb-flash-line" style="color: var(--warning);"></i> Predictive Insights</div>` + insights.map(insight => `
                <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; border-radius: 16px; background: rgba(79, 70, 229, 0.03); border: 1px solid rgba(79, 70, 229, 0.1); margin-bottom: 8px;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: ${insight.color}22; color: ${insight.color}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                        <i class="${insight.icon}"></i>
                    </div>
                    <div>
                        <div style="font-size: 14px; font-weight: 500; color: var(--text); line-height: 1.4;">${insight.message}</div>
                    </div>
                </div>
            `).join('');
        }

        // Load IoT Sensors
        const iotSensorsContainer = document.getElementById('iotSensorsContainer');
        if (iotSensorsContainer && window.AIAgent) {
            const sensors = AIAgent.simulateIoTSensors();
            iotSensorsContainer.innerHTML = sensors.map(sensor => {
                let statusColor = 'var(--success)';
                if (sensor.status === 'Warning') statusColor = 'var(--warning)';
                if (sensor.status === 'Critical') statusColor = 'var(--danger)';
                
                return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 16px; background: var(--bg); border: 1px solid var(--border);">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-size: 14px; font-weight: 600; color: var(--text);">${sensor.type}</div>
                        <div style="font-size: 12px; opacity: 0.6;">${sensor.location}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <div style="font-size: 16px; font-weight: 700; color: var(--text);">${sensor.value} <span style="font-size: 12px; font-weight: 500; opacity: 0.6;">${sensor.unit}</span></div>
                        <div style="font-size: 12px; font-weight: 600; color: ${statusColor};">${sensor.status}</div>
                    </div>
                </div>
            `}).join('');
        }

        // Load Live Heatmap
        const liveHeatmapContainer = document.getElementById('liveHeatmap');
        if (liveHeatmapContainer) {
            // Placeholder for actual heatmap implementation (e.g., using Leaflet or Google Maps)
            liveHeatmapContainer.innerHTML = `
                <div style="position: absolute; inset: 0; background-image: url('https://picsum.photos/seed/campus/800/400'); background-size: cover; background-position: center; opacity: 0.5; filter: grayscale(50%);"></div>
                <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, var(--card));"></div>
                
                <!-- Simulated Heatmap Points -->
                <div style="position: absolute; top: 30%; left: 40%; width: 20px; height: 20px; background: rgba(239,68,68,0.6); border-radius: 50%; box-shadow: 0 0 20px rgba(239,68,68,0.4); animation: pulse 2s infinite;"></div>
                <div style="position: absolute; top: 60%; left: 20%; width: 30px; height: 30px; background: rgba(245,158,11,0.6); border-radius: 50%; box-shadow: 0 0 30px rgba(245,158,11,0.4); animation: pulse 3s infinite;"></div>
                <div style="position: absolute; top: 40%; left: 70%; width: 15px; height: 15px; background: rgba(16,185,129,0.6); border-radius: 50%; box-shadow: 0 0 15px rgba(16,185,129,0.4); animation: pulse 2.5s infinite;"></div>

                <div style="position: absolute; bottom: 16px; left: 16px; background: var(--card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; font-weight: 500; display: flex; gap: 12px; z-index: 10;">
                    <div style="display: flex; align-items: center; gap: 4px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--danger);"></div> High Activity</div>
                    <div style="display: flex; align-items: center; gap: 4px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--warning);"></div> Moderate</div>
                    <div style="display: flex; align-items: center; gap: 4px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--success);"></div> Low</div>
                </div>
            `;
        }

        // Load Vendor Performance Analytics
        const vendorPerformanceContainer = document.getElementById('vendorPerformance');
        if (vendorPerformanceContainer) {
            const vendors = [
                { name: 'Campus Electric Co.', category: 'Electrical', rating: 4.8, avgResolution: '2.4 hrs', activeIssues: 3, color: '#3b82f6' },
                { name: 'AquaFlow Plumbing', category: 'Plumbing', rating: 4.5, avgResolution: '3.1 hrs', activeIssues: 5, color: '#10b981' },
                { name: 'Sparkle Cleaners', category: 'Cleaning', rating: 4.9, avgResolution: '1.2 hrs', activeIssues: 1, color: '#8b5cf6' },
                { name: 'SecureNet Systems', category: 'Security', rating: 4.2, avgResolution: '4.5 hrs', activeIssues: 2, color: '#ef4444' }
            ];

            vendorPerformanceContainer.innerHTML = vendors.map(vendor => `
                <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: ${vendor.color}20; color: ${vendor.color}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                <i class="ri-store-2-line"></i>
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 14px; color: var(--text);">${vendor.name}</div>
                                <div style="font-size: 12px; opacity: 0.6;">${vendor.category}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                            <i class="ri-star-fill"></i> ${vendor.rating}
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px;">
                        <div style="background: var(--bg); padding: 10px; border-radius: 10px; border: 1px solid var(--border);">
                            <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Avg Resolution</div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text);">${vendor.avgResolution}</div>
                        </div>
                        <div style="background: var(--bg); padding: 10px; border-radius: 10px; border: 1px solid var(--border);">
                            <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Active Issues</div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text);">${vendor.activeIssues}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        } catch (error) {
            console.error("Error in Admin.loadDashboard:", error);
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

    loadManageIssues(filters = {}) {
        try {
            if (typeof Auth === 'undefined' || typeof Issues === 'undefined') return;
            console.log("--- DEBUG: loadManageIssues ---");
            const issuesData = JSON.parse(localStorage.getItem("campus_issues")) || [];
            
            let issues = Issues.getEnrichedIssues();
            const students = Auth.getStudents();
            const users = Auth.getUsers();

            const table = document.getElementById('manageIssuesTable');
            if (!table) return;

            // Apply filters
            if (filters.search) {
                const query = filters.search.toLowerCase();
                issues = issues.filter(i => {
                    const student = students.find(u => u.id === i.studentId) || users.find(u => u.id === i.studentId);
                    const studentName = student ? student.name.toLowerCase() : 'unknown';
                    return i.title.toLowerCase().includes(query) || 
                           i.id.toLowerCase().includes(query) ||
                           studentName.includes(query);
                });
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

            // Pinned first
            issues.sort((a, b) => {
                const aPinned = a.pinned || a.isImportant;
                const bPinned = b.pinned || b.isImportant;
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return 0;
            });

            if (issues.length === 0) {
                table.innerHTML = `<tr><td colspan="8">${UI.getEmptyState("No issues found", "Try adjusting your filters or search query", "ri-search-line")}</td></tr>`;
                return;
            }

            table.innerHTML = issues.map(i => {
                const user = students.find(u => u.id === i.studentId) || users.find(u => u.id === i.studentId);
                const studentName = user ? user.name : 'Unknown Student';
                const isPinned = i.pinned || i.isImportant;
                
                // Add AI Tags
                const tagsHtml = (i.tags || []).map(tag => `
                    <span class="badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); font-size: 9px; padding: 2px 6px; margin-top: 4px; display: inline-block;">${tag}</span>
                `).join('');

                return `
                <tr style="border-bottom: 1px solid var(--border); transition: var(--transition); ${isPinned ? 'background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.3);' : ''}" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='${isPinned ? 'rgba(245, 158, 11, 0.05)' : 'transparent'}'">
                    <td style="padding: 16px;">
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 4px; color: var(--text);">
                            ${isPinned ? '<i class="ri-pushpin-fill" style="color: #f59e0b; font-size: 12px;"></i>' : ''}
                            ${studentName}
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted);">${i.id}</div>
                    </td>
                    <td style="padding: 16px; color: var(--text);">
                        <div style="font-weight: 500;">${i.title}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${tagsHtml}</div>
                    </td>
                    <td style="padding: 16px; font-size: 13px; color: var(--text-light);">${i.location}</td>
                    <td style="padding: 16px;"><span class="badge" style="background: rgba(79, 70, 229, 0.1); color: var(--primary);">${i.category}</span></td>
                    <td style="padding: 16px; color: var(--text);">${i.assignedStaff || '<span style="opacity: 0.4;">Unassigned</span>'}</td>
                    <td style="padding: 16px;"><span class="badge" style="background: ${this.getPriorityColor(i.priority)}15; color: ${this.getPriorityColor(i.priority)}; font-weight: 600;">${i.priority}</span></td>
                    <td style="padding: 16px;"><span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}">${i.status}</span></td>
                    <td style="padding: 16px;">
                        <div style="display: flex; gap: 8px;">
                            <button class="btn" onclick="UI.showIssueDetails('${i.id}')" style="padding: 6px 12px; font-size: 12px; background: var(--primary-gradient); color: white; border: none; border-radius: 8px;">View</button>
                            <button class="btn" onclick="Admin.togglePinIssue('${i.id}')" style="padding: 6px 12px; font-size: 12px; color: ${isPinned ? '#f59e0b' : 'var(--text)'}; background: var(--card); border: 1px solid ${isPinned ? '#f59e0b' : 'var(--border)'}; border-radius: 8px;" title="${isPinned ? 'Unpin' : 'Pin'}"><i class="${isPinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'}"></i></button>
                            <div class="action-container" style="position: relative;">
                                <button class="btn" onclick="Admin.toggleDeletePopup(event, '${i.id}', 'issue')" style="padding: 6px 12px; font-size: 12px; color: white; background: var(--danger); border: none; border-radius: 8px;"><i class="ri-delete-bin-line"></i></button>
                                <div id="delete-popup-issue-${i.id}" class="delete-popup glass" style="display: none; position: absolute; bottom: 100%; right: 0; width: 240px; padding: 20px; border-radius: 16px; z-index: 100; margin-bottom: 12px; border: 1px solid var(--danger); box-shadow: var(--shadow-l3); text-align: center;">
                                    <div style="font-size: 32px; color: var(--danger); margin-bottom: 12px;"><i class="ri-error-warning-line"></i></div>
                                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text);">Delete Issue?</h3>
                                    <p style="margin: 0 0 20px 0; font-size: 12px; color: var(--text-light); line-height: 1.4;">This action cannot be undone.</p>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn" style="flex: 1; background: #334155; color: white; font-size: 11px; padding: 8px;" onclick="Admin.closeDeletePopup('issue-${i.id}')">Cancel</button>
                                        <button class="btn" style="flex: 1; background: var(--danger); color: white; font-size: 11px; padding: 8px;" onclick="Admin.confirmDeleteIssue('${i.id}')">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                `}).join('');
        } catch (error) {
            console.error("Error in Admin.loadManageIssues:", error);
        }
    },

    confirmDeleteIssue(id) {
        Issues.delete(id);
        this.loadManageIssues();
        Notifications.showToast('Issue deleted successfully', 'success');
    },

    togglePinIssue(id) {
        const issue = Issues.getById(id);
        if (issue) {
            const isPinned = issue.pinned || issue.isImportant;
            Issues.update(id, { pinned: !isPinned, isImportant: !isPinned });
            this.loadManageIssues();
            Notifications.showToast(isPinned ? 'Issue unpinned' : 'Issue pinned to top', 'success');
        }
    },

    loadStudents(search = '') {
        try {
            console.log("--- DEBUG: loadStudents ---");
            // Force read from localStorage
            const usersData = JSON.parse(localStorage.getItem("campus_users")) || [];
            const issuesData = JSON.parse(localStorage.getItem("campus_issues")) || [];
            
            console.log("USERS DATA (localStorage):", usersData);
            console.log("ISSUES DATA (localStorage):", issuesData);

            let students = Auth.getStudents();
            const issues = Issues.getAll();

            console.log("Students (before filter):", students.length);

            if (search) {
                const q = search.toLowerCase();
                students = students.filter(s => 
                    s.name.toLowerCase().includes(q) || 
                    s.email.toLowerCase().includes(q) ||
                    (s.studentId && s.studentId.toLowerCase().includes(q))
                );
                console.log("Students after search filter:", students.length);
            }

            console.log("FINAL STUDENTS TO RENDER:", students.length);

            const table = document.getElementById('studentsTable');
            if (!table) return;

            if (students.length === 0) {
                table.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 48px;"><div style="opacity: 0.5; margin-bottom: 8px;"><i class="ri-group-line" style="font-size: 32px;"></i></div><div style="font-weight: 500; color: var(--text);">No users found</div></td></tr>`;
                return;
            }

            // Sort: Pinned first
            students.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return 0;
            });

            table.innerHTML = students.map(s => {
                const studentIssues = issues.filter(i => i.studentId === s.id).length;
                const isDisabled = s.status === 'disabled' || s.disabled;
                return `
                    <tr style="border-bottom: 1px solid var(--border); transition: var(--transition); ${s.pinned ? 'background: rgba(245, 158, 11, 0.05);' : ''} ${isDisabled ? 'opacity: 0.6;' : ''}" onmouseover="this.style.background='rgba(0,0,0,0.01)'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 16px;">
                            <div style="font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 4px;">
                                ${s.pinned ? '<i class="ri-pushpin-fill" style="color: #f59e0b; font-size: 12px;"></i>' : ''}
                                ${s.name}
                            </div>
                            <div style="font-size: 11px; opacity: 0.5; color: var(--text-muted);">${s.studentId}</div>
                        </td>
                        <td style="padding: 16px; color: var(--text);">${s.email}</td>
                        <td style="padding: 16px; color: var(--text);">${s.department}</td>
                        <td style="padding: 16px;"><span class="badge" style="background: rgba(79, 70, 229, 0.1); color: var(--primary);">${studentIssues} Issues</span></td>
                        <td style="padding: 16px;"><span class="badge badge-${isDisabled ? 'closed' : 'resolved'}">${isDisabled ? 'Disabled' : 'Active'}</span></td>
                        <td style="padding: 16px;">
                            <div style="display: flex; gap: 8px;">
                                <button class="btn" onclick="Admin.viewStudent('${s.id}')" style="padding: 6px 12px; font-size: 12px; background: var(--primary-gradient); color: white; border: none; border-radius: 8px;">View</button>
                                <button class="btn" onclick="Admin.togglePinStudent('${s.id}')" style="padding: 6px 12px; font-size: 12px; color: ${s.pinned ? '#f59e0b' : 'var(--text)'}; background: var(--card); border: 1px solid ${s.pinned ? '#f59e0b' : 'var(--border)'}; border-radius: 8px;" title="${s.pinned ? 'Unpin' : 'Pin'}"><i class="${s.pinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'}"></i></button>
                                <button class="btn" onclick="Admin.toggleStudentStatus('${s.id}')" style="padding: 6px 12px; font-size: 12px; color: white; background: ${isDisabled ? 'var(--success)' : 'var(--warning)'}; border: none; border-radius: 8px;" title="${isDisabled ? 'Enable' : 'Disable'}"><i class="${isDisabled ? 'ri-user-follow-line' : 'ri-user-forbid-line'}"></i></button>
                                <div class="action-container" style="position: relative;">
                                    <button class="btn" onclick="Admin.toggleDeletePopup(event, '${s.id}', 'student')" style="padding: 6px 12px; font-size: 12px; color: white; background: var(--danger); border: none; border-radius: 8px;"><i class="ri-delete-bin-line"></i></button>
                                    <div id="delete-popup-student-${s.id}" class="delete-popup glass" style="display: none; position: absolute; bottom: 100%; right: 0; width: 240px; padding: 20px; border-radius: 16px; z-index: 100; margin-bottom: 12px; border: 1px solid var(--danger); box-shadow: var(--shadow-l3); text-align: center;">
                                        <div style="font-size: 32px; color: var(--danger); margin-bottom: 12px;"><i class="ri-user-unfollow-line"></i></div>
                                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--text);">Delete Student?</h3>
                                        <p style="margin: 0 0 20px 0; font-size: 12px; color: var(--text-light); line-height: 1.4;">This will permanently remove the student account and all their reported issues.</p>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn" style="flex: 1; background: #334155; color: white; font-size: 11px; padding: 8px;" onclick="Admin.closeDeletePopup('student-${s.id}')">Cancel</button>
                                            <button class="btn" style="flex: 1; background: var(--danger); color: white; font-size: 11px; padding: 8px;" onclick="Admin.confirmDeleteStudent('${s.id}')">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error("Error in Admin.loadStudents:", error);
        }
    },

    togglePinStudent(id) {
        const students = Auth.getStudents();
        const index = students.findIndex(u => u.id === id);
        if (index !== -1) {
            students[index].pinned = !students[index].pinned;
            Auth.saveAll(students);
            this.loadStudents();
            Notifications.showToast(students[index].pinned ? 'Student pinned to top' : 'Student unpinned', 'success');
        }
    },

    toggleStudentStatus(id) {
        const students = Auth.getStudents();
        const userIndex = students.findIndex(u => u.id === id);
        if (userIndex !== -1) {
            const currentStatus = students[userIndex].status || (students[userIndex].disabled ? 'disabled' : 'active');
            const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
            
            if (newStatus === 'disabled') {
                // Show confirmation modal for disabling
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content glass" style="background: var(--card); padding: 32px; border-radius: 20px; max-width: 400px; width: 90%; border: 1px solid var(--warning); box-shadow: var(--shadow-l3); text-align: center;">
                        <div style="font-size: 48px; color: var(--warning); margin-bottom: 16px;"><i class="ri-user-forbid-line"></i></div>
                        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: var(--text);">Disable User Account?</h2>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: var(--text-light); line-height: 1.5;">User will not be able to login or report issues until re-enabled.</p>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn" style="flex: 1; background: #334155; color: white;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            <button class="btn" style="flex: 1; background: var(--warning); color: white;" onclick="Admin.executeToggleStatus('${id}', 'disabled'); this.closest('.modal-overlay').remove()">Disable</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } else {
                this.executeToggleStatus(id, 'active');
            }
        }
    },

    executeToggleStatus(id, status) {
        const students = Auth.getStudents();
        const userIndex = students.findIndex(u => u.id === id);
        if (userIndex !== -1) {
            students[userIndex].status = status;
            students[userIndex].disabled = (status === 'disabled');
            Auth.saveAll(students);
            this.loadStudents();
            this.loadDashboard(); // Refresh counts
            Notifications.showToast(`Student account ${status === 'disabled' ? 'disabled' : 'enabled'}`, 'success');
        }
    },

    viewStudent(id) {
        const students = Auth.getStudents();
        const student = students.find(u => u.id === id);
        if (!student) return;

        const allIssues = Issues.getAll();
        const issues = allIssues.filter(i => i.studentId === id);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass" style="background: var(--card); padding: 32px; border-radius: 24px; max-width: 600px; width: 95%; border: 1px solid var(--border); box-shadow: var(--shadow-l3); max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: var(--text);">User Details</h2>
                    <button class="icon-btn" onclick="this.closest('.modal-overlay').remove()" style="background: var(--bg); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); color: var(--text); cursor: pointer;"><i class="ri-close-line"></i></button>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <div style="display: flex; align-items: center; gap: 20px; padding: 20px; background: rgba(79, 70, 229, 0.05); border-radius: 20px; border: 1px solid rgba(79, 70, 229, 0.1);">
                        <div class="avatar" style="width: 72px; height: 72px; font-size: 28px; background: var(--primary-gradient); color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--text);">${student.name}</div>
                            <div style="font-size: 14px; opacity: 0.6; color: var(--text);">${student.studentId}</div>
                            <div style="margin-top: 6px;"><span class="badge badge-${(student.status === 'disabled' || student.disabled) ? 'closed' : 'resolved'}">${(student.status === 'disabled' || student.disabled) ? 'Disabled' : 'Active'}</span></div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: var(--bg); padding: 16px; border-radius: 16px; border: 1px solid var(--border);">
                            <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; color: var(--text);">Email Address</div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text);">${student.email}</div>
                        </div>
                        <div style="background: var(--bg); padding: 16px; border-radius: 16px; border: 1px solid var(--border);">
                            <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; color: var(--text);">Department</div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text);">${student.department}</div>
                        </div>
                        <div style="background: var(--bg); padding: 16px; border-radius: 16px; border: 1px solid var(--border);">
                            <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; color: var(--text);">College</div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text);">${UI.getCollegeName()}</div>
                        </div>
                        <div style="background: var(--bg); padding: 16px; border-radius: 16px; border: 1px solid var(--border);">
                            <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; color: var(--text);">Total Issues</div>
                            <div style="font-weight: 600; font-size: 14px; color: var(--text);">${issues.length} Reported</div>
                        </div>
                    </div>

                    ${issues.length > 0 ? `
                        <div>
                            <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--text);">Recent Submissions</div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${issues.slice(-3).reverse().map(i => `
                                    <div style="padding: 12px 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="UI.showIssueDetails('${i.id}')">
                                        <div>
                                            <div style="font-size: 13px; font-weight: 600; color: var(--text);">${i.title}</div>
                                            <div style="font-size: 11px; opacity: 0.5; color: var(--text);">${new Date(i.date).toLocaleDateString()}</div>
                                        </div>
                                        <span class="badge badge-${i.status.toLowerCase().replace(' ', '-')}" style="font-size: 10px;">${i.status}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 32px;">
                    <button class="btn btn-outline" style="width: 100%; padding: 14px; border-radius: 14px; font-weight: 600; color: var(--text);" onclick="this.closest('.modal-overlay').remove()">Close Details</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    confirmDeleteStudent(id) {
        const allUsers = Auth.getUsers();
        const students = allUsers.filter(u => u.id !== id);
        Auth.saveAll(students);
        this.loadStudents();
        Notifications.showToast('Student account deleted', 'success');
    },

    toggleDeletePopup(event, id, type) {
        event.stopPropagation();
        const popupId = `delete-popup-${type}-${id}`;
        const popup = document.getElementById(popupId);
        
        // Close all other popups first
        document.querySelectorAll('.delete-popup').forEach(p => {
            if (p.id !== popupId) p.style.display = 'none';
        });

        if (popup) {
            const isVisible = popup.style.display === 'block';
            popup.style.display = isVisible ? 'none' : 'block';
        }
    },

    closeDeletePopup(id) {
        const popup = document.getElementById(`delete-popup-${id}`);
        if (popup) popup.style.display = 'none';
    },

    exportToCSV() {
        Issues.exportToCSV();
    }
};

window.Admin = Admin;

document.addEventListener("DOMContentLoaded", () => {
    try {
        if (window.Admin) {
            Admin.loadDashboard();
            Admin.loadManageIssues();
            Admin.loadStudents();
        }
    } catch (e) {
        console.error("Error:", e);
    }
});

// Remove the old style injection at the end
// (The multi_edit_file call will handle removing the old style block)

