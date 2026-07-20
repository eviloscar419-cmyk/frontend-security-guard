// Real-time polling interval (in milliseconds)
const REALTIME_POLL_INTERVAL = 3000; // 3 seconds
let realtimePollingInterval = null;

async function updateDashboardStats() {
    const usersResponse = await apiRequest('/admin/users');
    if (usersResponse && !usersResponse.success) {
        console.warn('Failed to load users:', usersResponse.message);
        document.getElementById('stat-users').textContent = '0';
    } else if (Array.isArray(usersResponse)) {
        document.getElementById('stat-users').textContent = usersResponse.length;
    }
    
    console.log('updateDashboardStats - users received:', usersResponse);
    
    const statsResponse = await apiRequest('/admin/stats');
    console.log('updateDashboardStats - stats received:', statsResponse);
    
    if (statsResponse && statsResponse.success === false) {
        console.warn('Failed to load stats:', statsResponse.message);
        return;
    }
    
    if (statsResponse) {
        document.getElementById('stat-status').textContent = statsResponse.systemStatus || 'OPTIMAL';
        document.getElementById('stat-attempts').textContent = statsResponse.loginAttempts || 0;
        document.getElementById('stat-success').textContent = statsResponse.successfulLogins || 0;
        document.getElementById('stat-failed').textContent = statsResponse.failedLogins || 0;
        document.getElementById('stat-urls').textContent = statsResponse.urlsScanned || 0;
        document.getElementById('stat-threats').textContent = statsResponse.dangerousUrls || 0;
        document.getElementById('stat-passwords').textContent = statsResponse.passwordsAnalyzed || 0;
        document.getElementById('status-badge').textContent = statsResponse.systemStatus || 'OPTIMAL';
    }
}

async function loadUsers() {
    const usersResponse = await apiRequest('/admin/users');
    if (usersResponse && usersResponse.success === false) {
        console.warn('Failed to load users:', usersResponse.message);
        return;
    }
    if (Array.isArray(usersResponse)) {
        document.getElementById('stat-users').textContent = usersResponse.length;
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = usersResponse.map(u => `
            <tr>
                <td>${u._id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td class="action-buttons">
                    <button class="btn-outline btn-small" onclick="editUser('${u.id}')">Edit</button>
                    <button class="btn-primary btn-small" style="background:var(--danger)" onclick="deleteUser('${u._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

async function loadPhishingReports() {
    const reportsResponse = await apiRequest('/admin/phishing-reports');
    if (reportsResponse && reportsResponse.success === false) {
        console.warn('Failed to load phishing reports:', reportsResponse.message);
        return;
    }
    if (Array.isArray(reportsResponse)) {
        const tbody = document.querySelector('#phishing-table tbody');
        tbody.innerHTML = reportsResponse.map(r => `
            <tr>
                <td>${r._id}</td>
                <td>${formatDate(r.createdAt)}</td>
                <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis">${r.url}</td>
                <td><span class="status-badge ${getStatusClass(r.status)}">${r.status}</span></td>
                <td>${r.score}%</td>
                <td>
                    ${(() => {
                        if (r.reasons && r.reasons.length > 0) {
                            return `
                                <ul style="list-style:none; padding:0; margin:0; font-size:0.85rem;">
                                    ${r.reasons.map(reason => `<li style="margin:3px 0;">- ${reason}</li>`).join('')}
                                </ul>
                            `;
                        }
                        return 'None';
                    })()}
                </td>
                <td>
                    <button class="btn-outline btn-small delete-phishing-btn" data-id="${r.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.delete-phishing-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                showConfirmModal(
                    'Delete Report?',
                    'Are you sure you want to delete this report?',
                    async () => {
                        await apiRequest(`/admin/phishing-reports/${id}`, {
                            method: 'DELETE'
                        });
                        loadPhishingReports();
                    },
                    'fas fa-trash',
                    'var(--danger)'
                );
            });
        });
    }
}

async function loadPasswordStats() {
    const statsResponse = await apiRequest('/admin/password-stats');
    if (statsResponse && statsResponse.success === false) {
        console.warn('Failed to load password stats:', statsResponse.message);
        return;
    }
    if (Array.isArray(statsResponse)) {
        const tbody = document.querySelector('#password-stats-table tbody');
        tbody.innerHTML = statsResponse.map(s => `
            <tr>
                <td>${s._id}</td>
                <td>${formatDate(s.createdAt)}</td>
                <td>${s.score}/5</td>
                <td><span class="status-badge ${s.label === 'STRONG' ? 'status-safe' : s.label === 'MEDIUM' ? 'status-suspicious' : 'status-danger'}">${s.label}</span></td>
                <td>
                    <button class="btn-outline btn-small delete-password-stat-btn" data-id="${s.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.delete-password-stat-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                showConfirmModal(
                    'Delete Password Stat?',
                    'Are you sure you want to delete this password stat?',
                    async () => {
                        await apiRequest(`/admin/password-stats/${id}`, {
                            method: 'DELETE'
                        });
                        loadPasswordStats();
                    },
                    'fas fa-trash',
                    'var(--danger)'
                );
            });
        });
    }
}

async function loadActivityLogs() {
    const logsResponse = await apiRequest('/admin/logs');
    if (logsResponse && logsResponse.success === false) {
        console.warn('Failed to load activity logs:', logsResponse.message);
        return;
    }
    if (Array.isArray(logsResponse)) {
        const tbody = document.querySelector('#logs-table tbody');
        tbody.innerHTML = logsResponse.map(l => `
            <tr>
                <td>${l._id}</td>
                <td>${formatDate(l.createdAt)}</td>
                <td>${l.action}</td>
                <td>${l.user}</td>
                <td>
                    <button class="btn-outline btn-small delete-log-btn" data-id="${l.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                showConfirmModal(
                    'Delete Log?',
                    'Are you sure you want to delete this log?',
                    async () => {
                        await apiRequest(`/admin/logs/${id}`, {
                            method: 'DELETE'
                        });
                        loadActivityLogs();
                    },
                    'fas fa-trash',
                    'var(--danger)'
                );
            });
        });
    }
}

async function loadUserHistory() {
    if (!currentUser) return;
    const historyResponse = await apiRequest(`/user/history/${currentUser.id}`);
    if (historyResponse && historyResponse.success === false) {
        console.warn('Failed to load user history:', historyResponse.message);
        return;
    }
    if (Array.isArray(historyResponse)) {
        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = historyResponse.map(h => `
            <tr data-history-id="${h.id}">
                <td>${h.id}</td>
                <td>${formatDate(h.createdAt)}</td>
                <td>${h.type}</td>
                <td>${JSON.stringify(h.result)}</td>
                <td>
                    <button class="btn-outline btn-small delete-history-btn" data-id="${h.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const historyId = this.getAttribute('data-id');
                showConfirmModal(
                    'Delete History Entry?',
                    'Are you sure you want to delete this history entry?',
                    async () => {
                        await apiRequest(`/user/history/${currentUser.id}/${historyId}`, {
                            method: 'DELETE'
                        });
                        loadUserHistory();
                    },
                    'fas fa-trash',
                    'var(--danger)'
                );
            });
        });
    }
}

function generateStrongPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 8; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
}

function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profile-name-input').value = currentUser.name || '';
    document.getElementById('profile-email-input').value = currentUser.email || '';

    if (currentUser.profilePic) {
        document.getElementById('profile-pic').src = currentUser.profilePic;
    } else {
        document.getElementById('profile-pic').src = '';
    }
}

async function loadConversations() {
    if (!currentUser || currentUser.role !== 'Admin') return;
    const conversationsResponse = await apiRequest(`/chat/admin/${currentUser.id}`);
    if (conversationsResponse && conversationsResponse.success === false) {
        console.warn('Failed to load conversations:', conversationsResponse.message);
        return;
    }
    if (Array.isArray(conversationsResponse)) {
        const container = document.getElementById('conversations-container');
        container.innerHTML = conversationsResponse.map(c => `
            <div class="conversation-item" data-user-id="${c.userId}" style="padding:10px; border-radius:8px; cursor:pointer; transition:0.3s; ${c.unread ? 'background: rgba(255,100,100,0.1); border-left:3px solid var(--danger);' : 'background: rgba(255,255,255,0.05);'}">
                <div style="font-weight:bold;">${c.userName}</div>
                <div style="font-size:12px; color: var(--muted-color);">${c.lastMessage}</div>
            </div>
        `).join('');

        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', async function() {
                currentChatUserId = this.getAttribute('data-user-id');
                await loadMessages();
            });
        });
    }
}

async function loadMessages() {
    if (!currentUser) return;

    let otherUserId;
    let otherUserName;

    if (currentUser.role === 'Admin') {
        if (!currentChatUserId) return;
        otherUserId = currentChatUserId;
        otherUserName = 'User';
    } else {
        otherUserId = ADMIN_ID;
        otherUserName = ADMIN_NAME;
    }

    document.getElementById('chat-header').innerHTML = `<i class="fas fa-user"></i> ${otherUserName}`;

    const messagesResponse = await apiRequest(`/chat/${currentUser.id}/${otherUserId}`);
    if (messagesResponse && messagesResponse.success === false) {
        console.warn('Failed to load messages:', messagesResponse.message);
        return;
    }
    if (Array.isArray(messagesResponse)) {
        const container = document.getElementById('messages-container');
        container.innerHTML = messagesResponse.map(m => {
            const isSent = m.senderId === currentUser.id;
            return `
                <div style="display:flex; justify-content:${isSent ? 'flex-end' : 'flex-start'}">
                    <div style="max-width:70%; padding:10px 15px; border-radius:12px; background:${isSent ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};">
                        <div style="font-size:12px; color: rgba(255,255,255,0.6); margin-bottom:5px;">
                            ${m.senderName}
                        </div>
                        <div>${m.content}</div>
                        <div style="font-size:10px; margin-top:5px; opacity:0.7;">
                            ${formatDate(m.createdAt)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;

        await apiRequest(`/chat/mark-read/${currentUser.id}/${otherUserId}`, {
            method: 'PUT'
        });
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content || !currentUser) return;

    let receiverId;
    let receiverName;

    if (currentUser.role === 'Admin') {
        if (!currentChatUserId) {
            showAlertModal('Error', 'Please select a conversation first!', 'fas fa-exclamation-circle', 'var(--danger)');
            return;
        }
        receiverId = currentChatUserId;
        receiverName = 'User';
    } else {
        receiverId = ADMIN_ID;
        receiverName = ADMIN_NAME;
    }

    const result = await apiRequest('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRole: currentUser.role,
            receiverId,
            receiverName,
            content
        })
    });

    if (result) {
        input.value = '';
        await loadMessages();
        if (currentUser.role === 'Admin') {
            await loadConversations();
        }
    }
}

function showDashboard(user) {
    currentUser = user;
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = user.role;

    const isAdmin = user.role === 'Admin';
    document.getElementById('admin-tabs').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('user-tabs').style.display = isAdmin ? 'none' : 'flex';
    document.getElementById('conversations-list').style.display = isAdmin ? 'flex' : 'none';

    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    if (isAdmin) {
        document.getElementById('tab-overview').classList.remove('hidden');
    } else {
        document.getElementById('tab-tools').classList.remove('hidden');
    }

    updateDashboardStats();
    if (isAdmin) {
        loadUsers();
        loadPhishingReports();
        loadPasswordStats();
        loadActivityLogs();
        loadConversations();
    } else {
        loadUserHistory();
    }
    loadProfile();
    
    // Start real-time polling
    if (realtimePollingInterval) {
        clearInterval(realtimePollingInterval);
    }
    realtimePollingInterval = setInterval(() => {
        updateDashboardStats();
        if (isAdmin) {
            loadUsers();
        }
    }, REALTIME_POLL_INTERVAL);
}

function resetToLoginState() {
    currentUser = null;
    currentChatUserId = null;
    // Stop real-time polling
    if (realtimePollingInterval) {
        clearInterval(realtimePollingInterval);
        realtimePollingInterval = null;
    }
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('email-input').value = '';
    document.getElementById('password-input').value = '';
    document.getElementById('login-message').textContent = '';
    document.getElementById('password-feedback').classList.add('hidden');
    isLoginMode = true;
    document.getElementById('form-title').textContent = 'LOGIN';
    document.getElementById('btn-text').textContent = 'SECURE ACCESS';
    document.getElementById('toggle-register').textContent = 'REGISTER NEW USER';
}
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${this.dataset.tab}`).classList.remove('hidden');

            switch (this.dataset.tab) {
                case 'users': loadUsers(); break;
                case 'phishing-reports': loadPhishingReports(); break;
                case 'password-stats': loadPasswordStats(); break;
                case 'activity-logs': loadActivityLogs(); break;
                case 'history': loadUserHistory(); break;
                case 'profile': loadProfile(); break;
                case 'chat':
                    if (currentUser.role === 'Admin') {
                        loadConversations();
                    } else {
                        loadMessages();
                    }
                    break;
            }
        });
    });

    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    document.getElementById('profile-pic-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(loadEvent) {
                document.getElementById('profile-pic').src = loadEvent.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentUser) return;

        const newName = document.getElementById('profile-name-input').value;
        const newEmail = document.getElementById('profile-email-input').value;
        const newPassword = document.getElementById('profile-password-input').value;
        const newProfilePic = document.getElementById('profile-pic').src;

        const userData = {
            name: newName,
            email: newEmail,
            profilePic: newProfilePic
        };

        if (newPassword) {
            userData.password = newPassword;
        }

        const result = await apiRequest(`/admin/users/${currentUser.id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });

        if (result && result.success) {
            // Update currentUser
            currentUser.name = newName;
            currentUser.email = newEmail;
            currentUser.profilePic = newProfilePic;
            document.getElementById('user-name').textContent = currentUser.name;
            showAlertModal('Success', 'Profile updated successfully!', 'fas fa-check-circle', 'var(--success)');
        } else {
            showAlertModal('Error', result?.message || 'Failed to update profile!', 'fas fa-exclamation-circle', 'var(--danger)');
        }
    });

    document.getElementById('scan-btn').addEventListener('click', async function() {
        const url = document.getElementById('phish-url-input').value;
        if (!url) return;

        document.getElementById('phish-result').classList.add('hidden');

        const backendResult = await apiRequest('/tools/phishing-scan', {
            method: 'POST',
            body: JSON.stringify({ url, userId: currentUser?.id })
        });

        let result = backendResult && backendResult.url ? backendResult : checkUrl(url) || detectPhishing(url);
        if (!result) return;

        const color = (result.status === 'SAFE' || result.status === 'LIKELY SAFE')
            ? 'var(--success)'
            : result.status === 'SUSPICIOUS'
                ? 'var(--warning)'
                : 'var(--danger)';

        document.getElementById('phish-status').textContent = result.status;
        document.getElementById('phish-status').style.color = color;
        document.getElementById('phish-score').textContent = result.score + '% RISK';

        const securityScore = 100 - result.score;
        document.getElementById('phish-score-fill').style.width = securityScore + '%';
        document.getElementById('phish-score-fill').style.background = color;

        let domain = url;
        try {
            const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
            domain = hostname.replace(/^www\./, '');
        } catch {}

        const domainDetails = document.getElementById('phish-domain-details');
        const sslValid = url.toLowerCase().startsWith('https://');

        let blacklistColor = 'var(--success)';
        let blacklistText = 'Clean';
        let blacklistIcon = 'OK';
        if (result.score >= 70) {
            blacklistColor = 'var(--danger)';
            blacklistText = 'Likely Blacklisted';
            blacklistIcon = '!';
        } else if (result.score >= 40) {
            blacklistColor = 'var(--warning)';
            blacklistText = 'Under Review';
            blacklistIcon = '...';
        }

        domainDetails.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>Domain:</span>
                <span style="font-weight:bold;">${domain}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>SSL:</span>
                <span style="color: ${sslValid ? 'var(--success)' : 'var(--danger)'}">${sslValid ? 'Valid' : 'Invalid'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>Blacklist Status:</span>
                <span style="color: ${blacklistColor}">${blacklistText} ${blacklistIcon}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>Risk Score:</span>
                <span style="color: ${result.score < 30 ? 'var(--success)' : result.score < 60 ? 'var(--warning)' : 'var(--danger)'}">${result.score}/100</span>
            </div>
        `;

        const reasonsDiv = document.getElementById('phish-reasons');
        reasonsDiv.innerHTML = '';
        if (result.reasons && result.reasons.length > 0) {
            result.reasons.forEach(reason => {
                const reasonEl = document.createElement('div');
                reasonEl.style.cssText = 'padding:8px; border-left:3px solid ' + color + '; margin:5px 0; background:rgba(255,255,255,0.05);';
                reasonEl.textContent = '- ' + reason;
                reasonsDiv.appendChild(reasonEl);
            });
        } else {
            const safeEl = document.createElement('div');
            safeEl.style.cssText = 'padding:8px; color:var(--success);';
            safeEl.textContent = 'No suspicious indicators found.';
            reasonsDiv.appendChild(safeEl);
        }

        document.getElementById('phish-result').classList.remove('hidden');
        updateDashboardStats();
    });

    // Admin password analyzer (Overview tab)
    document.getElementById('analyze-btn').addEventListener('click', async() => {
        const input = document.getElementById('password-check-input').value.trim();
        if (!input) return;

        const result = await apiRequest('/tools/password-analyze', {
            method: 'POST',
            body: JSON.stringify({ password: input, userId: currentUser.id })
        });

        if (result) {
            const color = result.score === 5 ? 'var(--success)' : result.score >= 3 ? 'var(--warning)' : 'var(--danger)';
            document.getElementById('pass-label').textContent = result.label;
            document.getElementById('pass-label').style.color = color;
            document.getElementById('pass-score').textContent = result.score + '/5';
            document.getElementById('pass-fill').style.width = (result.score * 20) + '%';
            document.getElementById('pass-fill').style.background = color;

            const checksDiv = document.getElementById('pass-checks');
            checksDiv.innerHTML = '';
            for (const key in result.checks) {
                const checkDiv = document.createElement('div');
                checkDiv.className = 'check-item';
                const icon = result.checks[key]
                    ? '<i class="fas fa-check" style="color:var(--success)"></i>'
                    : '<i class="fas fa-times" style="color:var(--danger)"></i>';
                checkDiv.innerHTML = icon + ' ' + key;
                checksDiv.appendChild(checkDiv);
            }

            document.getElementById('password-result').classList.remove('hidden');
            updateDashboardStats();
        }
    });

    // User password analyzer (Tools tab)
    document.getElementById('user-analyze-btn').addEventListener('click', async() => {
        const input = document.getElementById('user-password-check-input').value.trim();
        if (!input) return;

        const result = await apiRequest('/tools/password-analyze', {
            method: 'POST',
            body: JSON.stringify({ password: input, userId: currentUser.id })
        });

        if (result) {
            const color = result.score === 5 ? 'var(--success)' : result.score >= 3 ? 'var(--warning)' : 'var(--danger)';
            document.getElementById('user-pass-label').textContent = result.label;
            document.getElementById('user-pass-label').style.color = color;
            document.getElementById('user-pass-score').textContent = result.score + '/5';
            document.getElementById('user-pass-fill').style.width = (result.score * 20) + '%';
            document.getElementById('user-pass-fill').style.background = color;

            const checksDiv = document.getElementById('user-pass-checks');
            checksDiv.innerHTML = '';
            for (const key in result.checks) {
                const checkDiv = document.createElement('div');
                checkDiv.className = 'check-item';
                const icon = result.checks[key]
                    ? '<i class="fas fa-check" style="color:var(--success)"></i>'
                    : '<i class="fas fa-times" style="color:var(--danger)"></i>';
                checkDiv.innerHTML = icon + ' ' + key;
                checksDiv.appendChild(checkDiv);
            }

            document.getElementById('user-password-result').classList.remove('hidden');
            loadUserHistory();
            updateDashboardStats();
        }
    });

    document.getElementById('gen-pass-btn').addEventListener('click', function() {
        document.getElementById('password-check-input').value = generateStrongPassword();
        document.getElementById('password-result').classList.add('hidden');
    });

    document.getElementById('user-gen-pass-btn').addEventListener('click', function() {
        document.getElementById('user-password-check-input').value = generateStrongPassword();
        document.getElementById('user-password-result').classList.add('hidden');
    });

    document.getElementById('password-check-input').addEventListener('input', function() {
        document.getElementById('password-result').classList.add('hidden');
    });

    document.getElementById('user-password-check-input').addEventListener('input', function() {
        document.getElementById('user-password-result').classList.add('hidden');
    });

    document.getElementById('phish-url-input').addEventListener('input', function() {
        document.getElementById('phish-result').classList.add('hidden');
    });

    document.getElementById('user-phish-url-input').addEventListener('input', function() {
        document.getElementById('user-phish-result').classList.add('hidden');
    });

    document.getElementById('clear-phishing-btn').addEventListener('click', function() {
        showConfirmModal(
            'Clear All Phishing Reports?',
            'Are you sure you want to clear ALL phishing reports? This action cannot be undone!',
            async function() {
                await apiRequest('/admin/phishing-reports/clear', {
                    method: 'POST'
                });
                loadPhishingReports();
                showAlertModal('Success', 'All phishing reports cleared!', 'fas fa-check-circle', 'var(--success)');
            },
            'fas fa-trash',
            'var(--danger)'
        );
    });

    document.getElementById('clear-password-stats-btn').addEventListener('click', function() {
        showConfirmModal(
            'Clear All Password Stats?',
            'Are you sure you want to clear ALL password stats? This action cannot be undone!',
            async function() {
                await apiRequest('/admin/password-stats/clear', {
                    method: 'POST'
                });
                loadPasswordStats();
                showAlertModal('Success', 'All password stats cleared!', 'fas fa-check-circle', 'var(--success)');
            },
            'fas fa-trash',
            'var(--danger)'
        );
    });

    document.getElementById('clear-logs-btn').addEventListener('click', function() {
        showConfirmModal(
            'Clear All Activity Logs?',
            'Are you sure you want to clear ALL activity logs? This action cannot be undone!',
            async function() {
                await apiRequest('/admin/logs/clear', {
                    method: 'POST'
                });
                loadActivityLogs();
                showAlertModal('Success', 'All activity logs cleared!', 'fas fa-check-circle', 'var(--success)');
            },
            'fas fa-trash',
            'var(--danger)'
        );
    });

    document.getElementById('clear-history-btn').addEventListener('click', function() {
        if (!currentUser) return;
        showConfirmModal(
            'Clear All Scan History?',
            'Are you sure you want to clear all scan history? This action cannot be undone!',
            async function() {
                await apiRequest(`/user/history/clear/${currentUser.id}`);
                loadUserHistory();
                showAlertModal('Success', 'All scan history cleared!', 'fas fa-check-circle', 'var(--success)');
            },
            'fas fa-trash',
            'var(--danger)'
        );
    });

    document.getElementById('user-scan-btn').addEventListener('click', async function() {
        const url = document.getElementById('user-phish-url-input').value;
        if (!url) return;

        document.getElementById('user-phish-result').classList.add('hidden');

        const backendResult = await apiRequest('/tools/phishing-scan', {
            method: 'POST',
            body: JSON.stringify({ url, userId: currentUser?.id })
        });

        let result = backendResult && backendResult.url ? backendResult : checkUrl(url) || detectPhishing(url);
        if (!result) return;

        const color = (result.status === 'SAFE' || result.status === 'LIKELY SAFE')
            ? 'var(--success)'
            : result.status === 'SUSPICIOUS'
                ? 'var(--warning)'
                : 'var(--danger)';

        document.getElementById('user-phish-status').textContent = result.status;
        document.getElementById('user-phish-status').style.color = color;
        document.getElementById('user-phish-score').textContent = result.score + '% RISK';

        const securityScore = 100 - result.score;
        document.getElementById('user-phish-score-fill').style.width = securityScore + '%';
        document.getElementById('user-phish-score-fill').style.background = color;

        let domain = url;
        try {
            const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
            domain = hostname.replace(/^www\./, '');
        } catch {}

        const domainDetails = document.getElementById('user-phish-domain-details');
        const sslValid = url.toLowerCase().startsWith('https://');

        let blacklistColor = 'var(--success)';
        let blacklistText = 'Clean';
        let blacklistIcon = 'OK';
        if (result.score >= 70) {
            blacklistColor = 'var(--danger)';
            blacklistText = 'Likely Blacklisted';
            blacklistIcon = '!';
        } else if (result.score >= 40) {
            blacklistColor = 'var(--warning)';
            blacklistText = 'Under Review';
            blacklistIcon = '...';
        }

        domainDetails.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>Domain:</span>
                <span style="font-weight:bold;">${domain}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>SSL:</span>
                <span style="color: ${sslValid ? 'var(--success)' : 'var(--danger)'}">${sslValid ? 'Valid' : 'Invalid'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>Blacklist Status:</span>
                <span style="color: ${blacklistColor}">${blacklistText} ${blacklistIcon}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>Risk Score:</span>
                <span style="color: ${result.score < 30 ? 'var(--success)' : result.score < 60 ? 'var(--warning)' : 'var(--danger)'}">${result.score}/100</span>
            </div>
        `;

        const reasonsDiv = document.getElementById('user-phish-reasons');
        reasonsDiv.innerHTML = '';
        if (result.reasons && result.reasons.length > 0) {
            result.reasons.forEach(reason => {
                const reasonEl = document.createElement('div');
                reasonEl.style.cssText = 'padding:8px; border-left:3px solid ' + color + '; margin:5px 0; background:rgba(255,255,255,0.05);';
                reasonEl.textContent = '- ' + reason;
                reasonsDiv.appendChild(reasonEl);
            });
        } else {
            const safeEl = document.createElement('div');
            safeEl.style.cssText = 'padding:8px; color:var(--success);';
            safeEl.textContent = 'No suspicious indicators found.';
            reasonsDiv.appendChild(safeEl);
        }

        document.getElementById('user-phish-result').classList.remove('hidden');
        loadUserHistory();
        updateDashboardStats();
    });

    document.getElementById('add-user-btn').addEventListener('click', function() {
        document.getElementById('modal-title').textContent = 'ADD USER';
        document.getElementById('edit-user-id').value = '';
        document.getElementById('user-name-input').value = '';
        document.getElementById('user-email-input').value = '';
        document.getElementById('user-password-input').value = '';
        document.getElementById('user-role-input').value = 'User';
        document.getElementById('user-modal').classList.remove('hidden');
    });

    window.editUser = async function(userId) {
        const users = await apiRequest('/admin/users');
        const user = users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('modal-title').textContent = 'EDIT USER';
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('user-name-input').value = user.name;
        document.getElementById('user-email-input').value = user.email;
        document.getElementById('user-password-input').value = '';
        document.getElementById('user-role-input').value = user.role;
        document.getElementById('user-modal').classList.remove('hidden');
    };

    window.deleteUser = function(userId) {
        pendingDeleteUserId = userId;
        document.getElementById('delete-user-modal').classList.remove('hidden');
    };

    document.getElementById('cancel-modal-btn').addEventListener('click', function() {
        document.getElementById('user-modal').classList.add('hidden');
    });

    document.getElementById('user-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const userId = document.getElementById('edit-user-id').value;
        const userData = {
            name: document.getElementById('user-name-input').value,
            email: document.getElementById('user-email-input').value,
            role: document.getElementById('user-role-input').value
        };

        const password = document.getElementById('user-password-input').value;
        if (password) userData.password = password;

        let result;
        if (userId) {
            result = await apiRequest(`/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            if (!password) {
                showAlertModal('Error', 'Password is required for new users', 'fas fa-exclamation-circle', 'var(--danger)');
                return;
            }
            result = await apiRequest('/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }

        if (result.success) {
            document.getElementById('user-modal').classList.add('hidden');
            loadUsers();
            updateDashboardStats();
        } else {
            showAlertModal('Error', result.message || 'Failed to save user', 'fas fa-exclamation-circle', 'var(--danger)');
        }
    });

    document.getElementById('save-settings-btn').addEventListener('click', async function() {
        const systemStatus = document.getElementById('system-status-select').value;
        const result = await apiRequest('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify({ systemStatus })
        });

        if (result.success) {
            updateDashboardStats();
            showAlertModal('Success', 'Settings saved successfully', 'fas fa-check-circle', 'var(--success)');
        }
    });

    document.getElementById('reset-all-stats-btn').addEventListener('click', async function() {
        showConfirmModal(
            'Reset All Stats?',
            'Are you sure you want to reset ALL system stats? This cannot be undone!',
            async () => {
                const result = await apiRequest('/admin/stats/reset', {
                    method: 'POST'
                });

                if (result.success) {
                    updateDashboardStats();
                    loadActivityLogs();
                    showAlertModal('Success', 'All system stats have been reset!', 'fas fa-check-circle', 'var(--success)');
                }
            },
            'fas fa-sync',
            'var(--danger)'
        );
    });

});
