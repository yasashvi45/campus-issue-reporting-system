const UI = {
    renderSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const session = Auth.getSession();
        if (!session) return;

        const collegeName = this.getCollegeName();
        const isDefault = collegeName === "Campus Issue Reporting System";
        const shortName = isDefault ? "Campus" : collegeName.split(' ').slice(0, 2).join(' ');

        const isStudent = session.role === 'student';
        const isSubdir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/');
        const basePath = isSubdir ? './' : (isStudent ? './student/' : './admin/');

        const menuItems = isStudent ? [
            { name: 'Dashboard', icon: 'ri-dashboard-line', url: basePath + 'dashboard.html' },
            { name: 'Report Issue', icon: 'ri-add-circle-line', url: basePath + 'report.html' },
            { name: 'My Issues', icon: 'ri-list-check', url: basePath + 'myissues.html' },
            { name: 'Analytics', icon: 'ri-bar-chart-box-line', url: basePath + 'analytics.html' }
        ] : [
            { name: 'Dashboard', icon: 'ri-dashboard-line', url: basePath + 'admin-dashboard.html' },
            { name: 'Manage Issues', icon: 'ri-list-settings-line', url: basePath + 'manage-issues.html' },
            { name: 'User Management', icon: 'ri-group-line', url: basePath + 'students.html' },
            { name: 'Analytics', icon: 'ri-bar-chart-box-line', url: basePath + 'analytics.html' },
            { name: 'Reports', icon: 'ri-file-chart-line', url: basePath + 'reports.html' },
            { name: 'Announcements', icon: 'ri-megaphone-line', url: basePath + 'announcements.html' }
        ];

        const currentPath = window.location.pathname;
        sidebar.innerHTML = `
            <div class="sidebar-logo">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="ri-government-line"></i>
                    <span>${shortName}</span>
                </div>
                <button class="mobile-close-btn" onclick="UI.toggleSidebar()" title="Close Sidebar">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <ul class="nav-menu">
                ${menuItems.map(item => {
                    const isActive = currentPath.includes(item.url.replace('./', ''));
                    return `
                    <li class="nav-item">
                        <a href="${item.url}" class="nav-link ${isActive ? 'active' : ''}">
                            <i class="${item.icon}"></i>
                            <span>${item.name}</span>
                        </a>
                    </li>
                    `;
                }).join('')}
            </ul>
        `;

        // Show close button on mobile
        if (window.innerWidth <= 1024) {
            const closeBtn = sidebar.querySelector('.mobile-close-btn');
            if (closeBtn) closeBtn.style.display = 'block';
        }
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        sidebar.classList.toggle('active');
        
        // Handle overlay
        let overlay = document.querySelector('.sidebar-overlay');
        if (sidebar.classList.contains('active')) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'rgba(0, 0, 0, 0.5)';
                overlay.style.zIndex = '10000';
                overlay.style.backdropFilter = 'blur(4px)';
                overlay.style.transition = 'all 0.3s ease';
                overlay.onclick = UI.toggleSidebar;
                document.body.appendChild(overlay);
            }
        } else {
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        }
    },

    initSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Add mobile menu button to navbar if not present
        const navbar = document.querySelector('.top-navbar');
        if (navbar && !navbar.querySelector('.mobile-menu-btn')) {
            const mobileBtn = document.createElement('button');
            mobileBtn.className = 'toggle-btn mobile-menu-btn';
            mobileBtn.innerHTML = '<i class="ri-menu-line"></i>';
            mobileBtn.onclick = (e) => {
                e.stopPropagation();
                UI.toggleSidebar();
            };
            navbar.insertBefore(mobileBtn, navbar.firstChild);
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && sidebar.classList.contains('active')) {
                if (!sidebar.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
                    UI.toggleSidebar();
                }
            }
        });
    },

    showLoading() {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
        loader.style.height = '100%';
        loader.style.background = 'var(--bg)';
        loader.style.display = 'flex';
        loader.style.justifyContent = 'center';
        loader.style.alignItems = 'center';
        loader.style.zIndex = '10000';
        loader.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1.25rem;">
                <div class="spinner" style="width: 3rem; height: 3rem; border: 0.25rem solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;"></div>
                <div style="font-weight: 600; font-size: 0.875rem; opacity: 0.5; letter-spacing: 0.05em; text-transform: uppercase;">Loading Smart Campus</div>
            </div>
        `;
        document.body.appendChild(loader);
        
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => loader.remove(), 500);
        }, 800);
    },

    initGlobalSearch() {
        const searchInput = document.querySelector('.search-bar input');
        if (!searchInput) return;

        const searchContainer = document.querySelector('.search-bar');
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'search-results glass';
        searchContainer.appendChild(resultsDiv);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }

            const session = Auth.getSession();
            let results = [];
            
            // Search issues
            const issues = session.role === 'admin' ? Issues.getAll() : Issues.getByStudent(session.userId);
            const matchedIssues = issues.filter(i => 
                i.title.toLowerCase().includes(query) || 
                i.description.toLowerCase().includes(query) ||
                i.id.toLowerCase().includes(query)
            ).slice(0, 5);

            matchedIssues.forEach(i => {
                results.push({
                    title: i.title,
                    subtitle: `Issue • ${i.status} • ${i.id}`,
                    url: session.role === 'admin' ? `./manage-issues.html?id=${i.id}` : `./issue-details.html?id=${i.id}`
                });
            });

            // Search students (admin only)
            if (session.role === 'admin') {
                const students = Auth.getStudents();
                const matchedStudents = students.filter(s => 
                    s.name.toLowerCase().includes(query) || 
                    s.email.toLowerCase().includes(query) ||
                    (s.studentId && s.studentId.toLowerCase().includes(query))
                ).slice(0, 3);

                matchedStudents.forEach(s => {
                    results.push({
                        title: s.name,
                        subtitle: `Student • ${s.email}`,
                        url: `./students.html?search=${encodeURIComponent(s.name)}`
                    });
                });
            }

            if (results.length > 0) {
                resultsDiv.innerHTML = results.map(r => `
                    <div class="search-result-item" onclick="window.location.href='${r.url}'" style="padding: 12px 16px; cursor: pointer; transition: var(--transition); border-radius: 8px; margin: 4px;">
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${r.title}</div>
                        <div class="search-subtitle" style="font-size: 11px; opacity: 0.5;">${r.subtitle}</div>
                    </div>
                `).join('');
                resultsDiv.style.display = 'block';
            } else {
                resultsDiv.innerHTML = '<div style="padding: 24px; text-align: center; opacity: 0.5; font-size: 13px;">No results found</div>';
                resultsDiv.style.display = 'block';
            }

            // Styling for resultsDiv
            resultsDiv.style.position = 'absolute';
            resultsDiv.style.top = '100%';
            resultsDiv.style.left = '0';
            resultsDiv.style.width = '100%';
            resultsDiv.style.marginTop = '8px';
            resultsDiv.style.zIndex = '1000';
            resultsDiv.style.maxHeight = '400px';
            resultsDiv.style.overflowY = 'auto';
            resultsDiv.style.borderRadius = '12px';
            resultsDiv.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)';
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        });
    },

    showSkeleton(containerId, rows = 5) {
        const container = document.getElementById(containerId);
        let html = '';
        for (let i = 0; i < rows; i++) {
            html += `
                <tr>
                    <td><div class="skeleton" style="height: 1.25rem; width: 6.25rem; border-radius: 0.5rem;"></div></td>
                    <td><div class="skeleton" style="height: 1.25rem; width: 9.375rem; border-radius: 0.5rem;"></div></td>
                    <td><div class="skeleton" style="height: 1.25rem; width: 5rem; border-radius: 0.5rem;"></div></td>
                    <td><div class="skeleton" style="height: 1.25rem; width: 3.75rem; border-radius: 0.5rem;"></div></td>
                </tr>
            `;
        }
        container.innerHTML = html;
    },

    toggleNotifications(event) {
        if (typeof Auth === 'undefined' || typeof Notifications === 'undefined') return;
        if (event) event.stopPropagation();
        const dropdown = document.getElementById('notif-dropdown');
        if (!dropdown) return;
        
        const isVisible = dropdown.style.display === 'block';
        
        // Close other dropdowns
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) profileMenu.style.display = 'none';

        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            dropdown.style.display = 'block';
            
            const session = Auth.getSession();
            const userId = session.role === 'admin' ? 'admin' : session.userId;
            const notifs = Notifications.getForUser(userId);
            const list = document.getElementById('notif-list');
            
            if (notifs.length === 0) {
                list.innerHTML = '<p style="font-size: 12px; opacity: 0.5; text-align: center; padding: 24px;">No notifications</p>';
            } else {
                list.innerHTML = notifs.reverse().slice(0, 5).map(n => {
                    const date = new Date(n.date);
                    const timeStr = isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString();
                    const isStudent = session.role === 'student';
                    const targetPage = isStudent ? 'myissues.html' : 'manage-issues.html';
                    const url = n.relatedIssueId ? `./${targetPage}?id=${n.relatedIssueId}` : '#';
                    
                    const clickAction = n.relatedIssueId 
                        ? `Notifications.markAsRead(${n.id}); if(window.location.pathname.includes('${targetPage}')) { UI.showIssueDetails('${n.relatedIssueId}', ${n.type === 'chat'}); } else { window.location.href='${url}${n.type === 'chat' ? '&chat=true' : ''}'; }`
                        : `Notifications.markAsRead(${n.id});`;

                    return `
                        <div onclick="${clickAction}" style="padding: 16px; border-radius: 14px; background: ${n.read ? 'transparent' : 'rgba(79, 70, 229, 0.08)'}; font-size: 13px; margin-bottom: 8px; border-left: 4px solid ${n.read ? 'transparent' : 'var(--primary)'}; transition: var(--transition); cursor: pointer;" onmouseover="this.style.background='rgba(79, 70, 229, 0.12)'" onmouseout="this.style.background='${n.read ? 'transparent' : 'rgba(79, 70, 229, 0.08)'}'">
                            <div style="font-weight: 600; margin-bottom: 6px; color: var(--text);">${n.message}</div>
                            <div style="font-size: 11px; opacity: 0.5; color: var(--text);">${timeStr}</div>
                        </div>
                    `;
                }).join('') + `
                    <div style="padding: 12px; text-align: center; border-top: 1px solid var(--border); margin-top: 8px;">
                        <a href="./notifications.html" style="color: var(--primary); text-decoration: none; font-size: 13px; font-weight: 700;">View All Notifications</a>
                    </div>
                `;
            }
        }
    },

    toggleAnnouncementModal() {
        const textarea = document.getElementById('quickAnnounceText');
        if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            textarea.style.boxShadow = '0 0 0 4px rgba(79, 70, 229, 0.2)';
            setTimeout(() => textarea.style.boxShadow = 'none', 2000);
        }
    },

    toggleProfileMenu(event) {
        if (event) event.stopPropagation();
        const menu = document.getElementById('profileMenu');
        if (!menu) return;
        
        const isVisible = menu.style.display === 'block';
        
        // Close other dropdowns
        const notifDropdown = document.getElementById('notif-dropdown');
        if (notifDropdown) notifDropdown.style.display = 'none';

        if (isVisible) {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
        }
    },

    updateNotifBadge() {
        const session = Auth.getSession();
        if (!session) return;
        const userId = session.role === 'admin' ? 'admin' : session.userId;
        const notifs = Notifications.getForUser(userId);
        const unread = notifs.filter(n => !n.read).length;
        const badge = document.getElementById('notif-badge');
        if (badge) {
            if (unread > 0) {
                badge.style.display = 'flex';
                badge.innerText = unread > 9 ? '9+' : unread;
                badge.style.background = '#ef4444';
                badge.style.color = 'white';
                badge.style.fontSize = '10px';
                badge.style.fontWeight = '700';
                badge.style.width = '18px';
                badge.style.height = '18px';
                badge.style.borderRadius = '50%';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                badge.style.position = 'absolute';
                badge.style.top = '-4px';
                badge.style.right = '-4px';
                badge.style.border = '2px solid var(--card)';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    updateUserInfo() {
        const session = Auth.getSession();
        if (!session) return;
        
        const avatarStr = session.name ? session.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        const avatarContent = session.avatar ? `<img src="${session.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : avatarStr;
        
        // Update all avatar elements
        const avatars = document.querySelectorAll('#adminAvatar, #userAvatar, #profileAvatar');
        avatars.forEach(el => {
            if (el.id === 'profileAvatar' && session.avatar) {
                el.innerHTML = `<img src="${session.avatar}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                el.innerHTML = avatarContent;
            }
        });

        // Update all name elements
        const names = document.querySelectorAll('#adminName, #userName, #profileName');
        names.forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = session.name;
            } else {
                el.innerText = session.name;
            }
        });

        // Update profile menu content dynamically
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) {
            const isAdmin = session.role === 'admin';
            profileMenu.innerHTML = `
                <div style="padding: 16px; border-bottom: 1px solid var(--border); margin-bottom: 8px;">
                    <div style="font-weight: 600; font-size: 14px; color: var(--text);">${session.name}</div>
                    <div style="font-size: 12px; opacity: 0.6; color: var(--text);">${session.email}</div>
                    <div style="font-size: 10px; margin-top: 8px; display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--primary); color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${session.role}</div>
                </div>
                <a href="./profile.html" class="nav-link" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; color: var(--text); text-decoration: none; font-size: 14px; transition: var(--transition); border-radius: 8px; margin: 0 8px;">
                    <i class="ri-user-line"></i> Profile
                </a>
                <a href="./support.html" class="nav-link" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; color: var(--text); text-decoration: none; font-size: 14px; transition: var(--transition); border-radius: 8px; margin: 0 8px;">
                    <i class="ri-customer-service-2-line"></i> Support / Help
                </a>
                <div class="dropdown-divider" style="height: 1px; background: var(--border); margin: 8px 0;"></div>
                <a href="#" onclick="Auth.logout()" class="nav-link danger" style="display: flex; align-items: center; gap: 10px; padding: 10px 16px; color: var(--danger); text-decoration: none; font-size: 14px; transition: var(--transition); border-radius: 8px; margin: 0 8px;">
                    <i class="ri-logout-box-line"></i> Logout
                </a>
            `;
        }
    },

    getCollegeName() {
        return localStorage.getItem("collegeName") || "Campus Issue Reporting System";
    },

    updateBranding() {
        const collegeName = this.getCollegeName();
        const isDefault = collegeName === "Campus Issue Reporting System";
        const shortName = isDefault ? "Campus" : collegeName.split(' ').slice(0, 2).join(' ');
        
        const headerTitles = document.querySelectorAll('.navbar-center');
        headerTitles.forEach(el => {
            if (isDefault) {
                el.innerHTML = `<div style="font-weight: 600; font-size: 16px;">Campus Issue Reporting System</div>`;
            } else {
                el.innerHTML = `
                    <div style="font-weight: 700; font-size: 16px;">${collegeName}</div>
                    <div style="font-size: 12px; opacity: 0.7; font-weight: 500;">Campus Issue Reporting System</div>
                `;
            }
            // Ensure proper layout for the two lines
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'center';
            el.style.lineHeight = '1.2';
        });

        const sidebarLogos = document.querySelectorAll('.sidebar-logo span');
        sidebarLogos.forEach(el => {
            el.textContent = shortName;
        });

        if (document.title.includes('-')) {
            const parts = document.title.split('-');
            document.title = `${parts[0].trim()} - ${collegeName}`;
        } else {
            document.title = collegeName;
        }

        // Update login/register titles if they exist
        const authTitles = document.querySelectorAll('.auth-title');
        authTitles.forEach(el => {
            if (isDefault) {
                el.innerHTML = `Campus Issue Reporting System`;
            } else {
                el.innerHTML = `
                    <div style="font-weight: 700; font-size: 24px; margin-bottom: 4px;">${collegeName}</div>
                    <div style="font-size: 16px; opacity: 0.7; font-weight: 500;">Campus Issue Reporting System</div>
                `;
            }
        });
    },

    getEmptyState(message = "No issues reported yet", subtext = "Once issues are reported, they will appear here", icon = "ri-inbox-line") {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; opacity: 0.7; text-align: center; width: 100%; background: var(--card); border-radius: 16px; border: 1px dashed var(--border);">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <i class="${icon}" style="font-size: 32px; opacity: 0.5;"></i>
                </div>
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: var(--text);">${message}</div>
                <div style="font-size: 14px; opacity: 0.6; color: var(--text-muted); max-width: 300px;">${subtext}</div>
            </div>
        `;
    },

    showIssueDetails(id, scrollToChat = false) {
        if (typeof Auth === 'undefined' || typeof Issues === 'undefined') return;
        const issue = Issues.getById(id);
        if (!issue) return;

        const session = Auth.getSession();
        const isAdmin = session && session.role === 'admin';

        const students = Auth.getStudents();
        const users = Auth.getUsers();
        const user = students.find(u => u.id === issue.studentId) || users.find(u => u.id === issue.studentId);
        const studentName = user ? user.name : 'Unknown Student';
        const studentRoll = user ? (user.studentId || 'N/A') : 'N/A';
        
        const priorityColor = this.getPriorityColor(issue.priority);
        const dateStr = new Date(issue.date).toLocaleString();

        let resolutionTimeHtml = '';
        if (issue.status === 'Resolved' && issue.resolvedAt) {
            const diff = new Date(issue.resolvedAt) - new Date(issue.createdAt);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            resolutionTimeHtml = `
                <div style="background: rgba(16, 185, 129, 0.1); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 16px;">
                    <div style="font-size: 11px; opacity: 0.7; text-transform: uppercase; font-weight: 700; color: var(--success);">Resolution Time</div>
                    <div style="font-weight: 600; font-size: 14px; color: var(--success);">${hours}h ${minutes}m</div>
                </div>
            `;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        let adminControls = '';
        if (isAdmin) {
            adminControls = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
                    <!-- Section 3: Assign Staff -->
                    <section>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 16px; color: var(--text);">Assign Staff</div>
                        <div style="display: flex; gap: 12px;">
                            <select id="staffSelect" style="flex: 1; background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 10px 16px; border-radius: 12px; font-size: 14px; outline: none;">
                                <option value="" ${!issue.assignedStaff ? 'selected' : ''}>Unassigned</option>
                                <option value="Electrician" ${issue.assignedStaff === 'Electrician' ? 'selected' : ''}>Electrician</option>
                                <option value="Plumber" ${issue.assignedStaff === 'Plumber' ? 'selected' : ''}>Plumber</option>
                                <option value="IT Support" ${issue.assignedStaff === 'IT Support' ? 'selected' : ''}>IT Support</option>
                                <option value="Maintenance" ${issue.assignedStaff === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                            </select>
                            <button class="btn btn-primary" onclick="UI.assignStaff('${issue.id}')" style="padding: 10px 20px; border-radius: 12px; font-weight: 600;">Assign</button>
                        </div>
                    </section>
 
                    <!-- Section 4: Status Control -->
                    <section>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 16px; color: var(--text);">Status Control</div>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn" onclick="UI.updateIssueStatus('${issue.id}', 'Pending')" style="flex: 1; padding: 10px; border-radius: 12px; font-weight: 600; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">Pending</button>
                            <button class="btn" onclick="UI.updateIssueStatus('${issue.id}', 'Resolved')" style="flex: 1; padding: 10px; border-radius: 12px; font-weight: 600; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Resolved</button>
                        </div>
                    </section>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content glass" style="background: var(--card); padding: 0; border-radius: 24px; max-width: 800px; width: 95%; border: 1px solid var(--border); box-shadow: var(--shadow-l3); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 24px 32px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text);">${issue.title}</h2>
                        <div style="font-size: 12px; opacity: 0.5; color: var(--text); margin-top: 4px;">Issue ID: ${issue.id} • Reported on ${dateStr}</div>
                    </div>
                    <button class="icon-btn" onclick="this.closest('.modal-overlay').remove()" style="background: var(--bg); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); color: var(--text); cursor: pointer;"><i class="ri-close-line"></i></button>
                </div>
 
                <!-- Body -->
                <div style="padding: 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 32px;">
                    
                    <!-- Section 1: Issue Details -->
                    <section>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 16px; color: var(--text); display: flex; align-items: center; gap: 8px;">
                            <i class="ri-information-line" style="color: var(--primary);"></i> Issue Details
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                            <div style="background: var(--bg); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; color: var(--text);">Student Name</div>
                                <div style="font-weight: 600; font-size: 14px; color: var(--text);">${studentName}</div>
                            </div>
                            <div style="background: var(--bg); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; color: var(--text);">Roll Number</div>
                                <div style="font-weight: 600; font-size: 14px; color: var(--text);">${studentRoll}</div>
                            </div>
                            <div style="background: var(--bg); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; color: var(--text);">Location</div>
                                <div style="font-weight: 600; font-size: 14px; color: var(--text);">${issue.location}</div>
                            </div>
                            <div style="background: var(--bg); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; color: var(--text);">Category</div>
                                <div style="font-weight: 600; font-size: 14px; color: var(--text);">${issue.category}</div>
                            </div>
                            <div style="background: var(--bg); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; color: var(--text);">Priority</div>
                                <span class="badge" style="background: ${priorityColor}15; color: ${priorityColor}; font-weight: 700; font-size: 11px;">${issue.priority}</span>
                            </div>
                            <div style="background: var(--bg); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);">
                                <div style="font-size: 11px; opacity: 0.5; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; color: var(--text);">Status</div>
                                <span class="badge badge-${issue.status.toLowerCase().replace(' ', '-')}" style="font-weight: 700; font-size: 11px;">${issue.status}</span>
                            </div>
                        </div>
                        ${resolutionTimeHtml}
                    </section>
 
                    <!-- Section 2: Description -->
                    <section>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--text);">Description</div>
                        <div style="background: var(--bg); padding: 20px; border-radius: 16px; border: 1px solid var(--border); color: var(--text); font-size: 14px; line-height: 1.6; min-height: 80px;">
                            ${issue.description || 'No description provided.'}
                        </div>
                    </section>
 
                    <!-- Section 2.1: Issue Timeline -->
                    <section>
                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 16px; color: var(--text); display: flex; align-items: center; gap: 8px;">
                            <i class="ri-history-line" style="color: var(--primary);"></i> Issue Timeline
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0; padding-left: 8px; border-left: 2px solid var(--border);">
                            ${(issue.timeline || []).map((t, idx) => `
                                <div style="position: relative; padding-bottom: 20px; padding-left: 24px;">
                                    <div style="position: absolute; left: -31px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--primary); border: 2px solid var(--card);"></div>
                                    <div style="font-size: 13px; font-weight: 600; color: var(--text);">${t.action}</div>
                                    <div style="font-size: 11px; opacity: 0.5; margin-top: 2px;">${new Date(t.date).toLocaleString()}</div>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${t.note}</div>
                                </div>
                            `).join('')}
                        </div>
                    </section>
 
                    ${adminControls}
 
                    <!-- Section 5: Chat with Student/Admin -->
                    <section style="background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid var(--border); overflow: hidden;">
                        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 14px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px;">
                            <i class="ri-chat-3-line" style="color: var(--primary);"></i> ${isAdmin ? 'Chat with Student' : 'Chat with Admin'}
                        </div>
                        <div id="chatMessages" style="height: 200px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: var(--bg);">
                            <!-- Messages will be loaded here -->
                        </div>
                        <div style="padding: 16px; background: var(--card); border-top: 1px solid var(--border); display: flex; gap: 12px;">
                            <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1; background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 10px 16px; border-radius: 12px; font-size: 14px; outline: none;" onkeypress="if(event.key === 'Enter') UI.sendChatMessage('${issue.id}')">
                            <button class="btn btn-primary" onclick="UI.sendChatMessage('${issue.id}')" style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 0;"><i class="ri-send-plane-2-line"></i></button>
                        </div>
                    </section>
                </div>
 
                <!-- Footer -->
                <div style="padding: 20px 32px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; background: rgba(255,255,255,0.02);">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 24px; border-radius: 12px; font-weight: 600; color: var(--text);">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.loadChatMessages(issue.id);
        
        if (scrollToChat) {
            setTimeout(() => {
                const chatSection = document.getElementById('chatMessages');
                if (chatSection) {
                    chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    },

    assignStaff(id) {
        const staff = document.getElementById('staffSelect').value;
        Issues.update(id, { assignedStaff: staff });
        Notifications.showToast(`Staff assigned: ${staff || 'Unassigned'}`, 'success');
        if (window.Admin) Admin.loadManageIssues();
    },

    updateIssueStatus(id, status) {
        Issues.update(id, { status: status });
        Notifications.showToast(`Issue marked as ${status}`, 'success');
        if (window.Admin) {
            Admin.loadManageIssues();
            Admin.loadDashboard();
        }
        
        // Refresh modal if open
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
            this.showIssueDetails(id);
        }
    },

    loadChatMessages(issueId) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const issue = Issues.getById(issueId);
        const messages = issue ? (issue.chat || []) : [];
        
        const session = Auth.getSession();
        const isAdmin = session && session.role === 'admin';
        
        if (messages.length === 0) {
            container.innerHTML = `<div style="text-align: center; opacity: 0.4; font-size: 12px; margin-top: 40px;">No messages yet. Start the conversation.</div>`;
            return;
        }

        container.innerHTML = messages.map(m => {
            const msgRole = m.role || m.sender; // fallback to sender for older messages
            const msgTime = m.date ? new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : m.time;
            const isMe = (isAdmin && msgRole === 'admin') || (!isAdmin && msgRole === 'student');
            return `
            <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 80%;">
                <div style="padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.4; background: ${isMe ? 'var(--primary-gradient)' : 'var(--border)'}; color: ${isMe ? 'white' : 'var(--text)'}; ${isMe ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                    ${m.text}
                </div>
                <div style="font-size: 10px; opacity: 0.4; margin-top: 4px; text-align: ${isMe ? 'right' : 'left'}">${msgTime}</div>
            </div>
        `}).join('');
        container.scrollTop = container.scrollHeight;
    },

    sendChatMessage(issueId) {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;

        try {
            const session = Auth.getSession();
            const senderRole = session && session.role === 'admin' ? 'admin' : 'student';
            
            Issues.addChatMessage(issueId, {
                text: text,
                senderId: session.userId,
                senderName: session.name,
                role: senderRole
            });
            
            input.value = '';
            this.loadChatMessages(issueId);
        } catch (err) {
            Notifications.showToast('Failed to send message', 'danger');
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
    }
};

window.UI = UI;

document.addEventListener('DOMContentLoaded', () => {
    UI.showLoading();
    UI.renderSidebar();
    UI.initSidebar();
    UI.initGlobalSearch();
    UI.updateNotifBadge();
    UI.updateUserInfo();
    UI.updateBranding();
});

function toggleNotifications() { UI.toggleNotifications(); }

function toggleProfileMenu() { UI.toggleProfileMenu(); }

// Close dropdowns when clicking outside
window.onclick = (event) => {
    if (!event.target.closest('.notification-wrapper')) {
        const notifDropdown = document.getElementById('notif-dropdown');
        if (notifDropdown) notifDropdown.style.display = 'none';
    }
    if (!event.target.closest('.profile-dropdown')) {
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) profileMenu.style.display = 'none';
    }
    if (!event.target.closest('.action-container')) {
        document.querySelectorAll('.delete-popup').forEach(p => {
            p.style.display = 'none';
        });
    }
};

window.addEventListener("storage", () => {
    const path = window.location.pathname;
    if (window.Admin) {
        if (path.includes('admin-dashboard.html') || path.includes('dashboard.html')) Admin.loadDashboard();
        if (path.includes('manage-issues.html')) Admin.loadManageIssues();
        if (path.includes('students.html')) Admin.loadStudents();
        if (path.includes('analytics.html')) Admin.loadAnalytics();
    }
    if (window.Student) {
        if (path.includes('dashboard.html')) Student.loadDashboard();
        if (path.includes('myissues.html')) Student.loadMyIssues();
    }
    
    // Refresh modal if open
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        const issueIdMatch = modal.innerHTML.match(/Issue ID: (ISS-[\d-]+)/);
        if (issueIdMatch && issueIdMatch[1]) {
            const issueId = issueIdMatch[1];
            modal.remove();
            UI.showIssueDetails(issueId);
        }
    }
    
    UI.updateNotifBadge();
});
