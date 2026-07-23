// API Configuration
// Uncomment the local backend for development, and the Render backend for production
const API_BASE = 'https://security-guard-backend-rn4b.onrender.com';
let currentUser = null;
let currentChatUserId = null;
let isLoginMode = true;

        function startMatrix() {
            const canvas = document.getElementById('bg-canvas');
            const ctx = canvas.getContext('2d');
            
            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.addEventListener('resize', resize);
            resize();
            
            const chars = "01010101ABCDEF";
            const fontSize = 14;
            let columns = canvas.width / fontSize;
            let drops = Array(Math.floor(columns)).fill(1);
            
            function draw() {
                ctx.fillStyle = "rgba(5,8,17,0.1)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#00d4ff";
                ctx.font = fontSize + "px Orbitron";
                for (let i=0; i<drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i*fontSize, drops[i]*fontSize);
                    if (drops[i]*fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
                requestAnimationFrame(draw);
            }
            draw();
        }

        function checkUrl(url) { 
            const trustedDomains = [ 
                "google.com", 
                "www.google.com", 
                "openai.com", 
                "www.openai.com", 
                "abu.edu.ng", 
                "www.abu.edu.ng", 
                "microsoft.com", 
                "github.com", 
                "facebook.com", 
                "linkedin.com", 
                "youtube.com" 
            ]; 
        
            try { 
                let hostname = new URL( 
                    url.startsWith("http") ? url : `https://${url}` 
                ).hostname.toLowerCase(); 
            
                // Remove www 
                hostname = hostname.replace(/^www\./, ""); 
            
                const isTrusted = trustedDomains.some(domain => 
                    hostname === domain.replace(/^www\./, "") 
                ); 
            
                if (isTrusted) { 
                    return { 
                        status: "LIKELY SAFE", 
                        score: 0, 
                        reasons: ["Trusted domain detected."] 
                    }; 
                } 
                return null; 
            } catch { 
                return { 
                    status: "INVALID URL", 
                    score: 100, 
                    reasons: ["Invalid URL format."] 
                }; 
            } 
        }
        
        function detectPhishing(url) { 
            const suspiciousTLDs = [
    
  "xyz",
  "top",
  "click",
  "work",
  "gq",
  "cf",
  "tk",
  "ml",
  "ga",
  "buzz",
  "cam",
  "loan",
  "download",
  "stream",
  "review",
  "date",
  "party",
  "trade",
  "accountant",
  "country",
  "racing",
  "science",
  "win",
  "bid",
  "monster",
  "site",
  "online",
  "website",
  "space",
  "store",
  "live",
  "tech",
  "host",
  "press",
  "fun",
  "club",
  "info",
  "link",
  "cloud",
  "world",
  "today",
  "support",
  "email",
  "solutions",
  "digital",
  "group",
  "network",
  "services",
  "zone",
  "center",
  "company",
  "one",
  "pro",
  "vip",
  "shop",
  "fit",
  "life",
  "wiki",
  "lol",
  "best",
  "rest",
  "men",
  "kim",
  "pw",
  "icu",
  "cyou",
  "quest",
  "autos",
  "makeup",
  "skin",
  "mom",
  "hair",
  "cfd",
  "bar",
  "pink",
  "blue",
  "red",
  "gold",
  "black",
  "green",
  "chat",
  "news",
  "media",
  "rocks",
  "capital",
  "finance",
  "money",
  "exchange",
  "credit",
  "help",
  "marketing",
  "agency",
  "events",
  "promo",
  "sale",
  "deals",
  "offers",
  "gift",
  "security",
  "app"
];
            const suspiciousKeywords = [ 
                'login', 'log-in', 'log in',
                'verify', 'verification',
                'secure', 'security',
                'account', 'accounts',
                'update', 'updates',
                'banking', 'bank',
                'password', 'pass',
                'signin', 'sign-in', 'sign in',
                'wallet', 'wallets',
                'payment', 'payments',
                'apple', 'google', 'paypal', 'microsoft', 'amazon',
                'facebook', 'instagram', 'twitter', 'linkedin',
                'auth', 'authenticate', 'authentication',
                'confirm', 'confirmation',
                'reset', 'recovery',
                'free', 'bonus', 'claim', 'win', 'prize'
            ]; 
            
            let score = 0; 
            const reasons = []; 
            
            const lowerUrl = url.toLowerCase(); 
            
            // Check TLD 
            if (suspiciousTlds.some(tld => lowerUrl.endsWith(tld) || lowerUrl.includes(tld + '/'))) { 
                score += 25; 
                reasons.push('Suspicious domain extension'); 
            } 
            
            // Check URL length 
            if (url.length > 50) { 
                score += 10; 
                reasons.push('Very long URL'); 
            } 
            
            // Check IP address instead of domain 
            const ipRegex = /https?:\/\/(\d{1,3}\.){3}\d{1,3}/; 
            if (ipRegex.test(url)) { 
                score += 35; 
                reasons.push('Uses IP address instead of domain'); 
            } 
            
            // Check suspicious keywords 
            suspiciousKeywords.forEach(keyword => { 
                if (lowerUrl.includes(keyword)) { 
                    score += 8; 
                    reasons.push(`Contains keyword: ${keyword}`); 
                } 
            }); 
            
            // Check excessive subdomains 
            try { 
                const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname; 
                const subdomainCount = hostname.split('.').length - 2; 
            
                if (subdomainCount > 1) { 
                    score += 15; 
                    reasons.push('Too many subdomains'); 
                } 
            } catch { 
                score += 40; 
                reasons.push('Invalid URL format'); 
            } 
            
            // Check for @ symbol 
            if (url.includes('@')) { 
                score += 30; 
                reasons.push('Contains @ symbol'); 
            } 
            
            // Check for multiple hyphens 
            if ((url.match(/-/g) || []).length >= 2) { 
                score += 10; 
                reasons.push('Excessive hyphens'); 
            } 
            
            // Check for numbers in domain 
            try { 
                const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname; 
                const numberRegex = /\d/; 
                if (numberRegex.test(hostname)) { 
                    score += 10; 
                    reasons.push('Domain contains numbers'); 
                } 
            } catch {
                // Ignore
            }
            
            let status; 
            
            if (score >= 30) { 
                status = 'HIGH RISK PHISHING'; 
            } else if (score >= 15) { 
                status = 'SUSPICIOUS'; 
            } else { 
                status = 'LIKELY SAFE'; 
            } 
            
            return { 
                score, 
                status, 
                reasons 
            }; 
        }

        async function apiRequest(endpoint, options = {}) {
            const url = `${API_BASE}/api${endpoint}`;
            const config = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            if (options.body) {
                config.body = options.body;
            }
            
            try {
                const response = await fetch(url, config);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('API request failed:', error);
                return { success: false, message: 'Failed to connect to server' };
            }
        }

        function formatDate(isoString) {
            const d = new Date(isoString);
            return isNaN(d) ? 'N/A' : d.toLocaleString();
        }

        // Modal variables
        let promptCallback = null;
        let confirmCallback = null;
        let pendingDeleteUserId = null;
        
        // Show prompt modal
        function showPromptModal(title, message, callback) {
            document.getElementById('prompt-title').textContent = title;
            document.getElementById('prompt-message').textContent = message;
            document.getElementById('prompt-input').value = '';
            promptCallback = callback;
            document.getElementById('prompt-modal').classList.remove('hidden');
            document.getElementById('prompt-input').focus();
        }

        // Show alert modal
        function showAlertModal(title, message, icon = 'fas fa-info-circle', iconColor = 'var(--primary)') {
            document.getElementById('alert-title').textContent = title;
            document.getElementById('alert-message').textContent = message;
            document.getElementById('alert-icon').className = icon;
            document.getElementById('alert-icon').style.color = iconColor;
            document.getElementById('alert-modal').classList.remove('hidden');
        }

        // Show confirm modal
        function showConfirmModal(title, message, callback, icon = 'fas fa-exclamation-triangle', iconColor = 'var(--warning)') {
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-icon').className = icon;
            document.getElementById('confirm-icon').style.color = iconColor;
            confirmCallback = callback;
            document.getElementById('confirm-modal').classList.remove('hidden');
        }

        function getStatusClass(status) {
            switch (status.toUpperCase()) {
                case 'LIKELY SAFE': return 'status-safe';
                case 'SAFE': return 'status-safe';
                case 'SUSPICIOUS': return 'status-suspicious';
                case 'HIGH RISK PHISHING': return 'status-danger';
                case 'DANGEROUS': return 'status-danger';
                case 'INVALID URL': return 'status-danger';
                case 'DOES NOT EXIST': return 'status-danger';
                default: return '';
            }
        }

        document.addEventListener('DOMContentLoaded', async function() {
            startMatrix();
            
            // Test backend connection!
            console.log('Testing backend connection to:', API_BASE);
            try {
                const testResponse = await apiRequest('/stats');
                console.log('✅ Backend connection SUCCESS! Response:', testResponse);
            } catch (error) {
                console.error('❌ Backend connection FAILED! Error:', error);
            }
            
            // Show/Hide Password toggle functionality
            const togglePasswordBtn = document.getElementById('toggle-password');
            const passwordInput = document.getElementById('password-input');
            const passwordFeedback = document.getElementById('password-feedback');
            
            togglePasswordBtn.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.innerHTML = type === 'text' ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
            
            // Real-time password feedback
            passwordInput.addEventListener('input', function() {
                const password = this.value;
                
                if (password.length === 0) {
                    passwordFeedback.classList.add('hidden');
                } else if (password.length >= 4) {
                    passwordFeedback.classList.remove('hidden');
                    passwordFeedback.classList.remove('invalid');
                    passwordFeedback.classList.add('valid');
                    passwordFeedback.innerHTML = '<i class="fas fa-check-circle"></i> Password length looks good';
                } else {
                    passwordFeedback.classList.remove('hidden');
                    passwordFeedback.classList.remove('valid');
                    passwordFeedback.classList.add('invalid');
                    passwordFeedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> Password should be at least 4 characters';
                }
            });

            // Toggle Login/Register
            document.getElementById('toggle-register').addEventListener('click', function() {
                isLoginMode = !isLoginMode;
                if (isLoginMode) {
                    document.getElementById('form-title').textContent = 'LOGIN';
                    document.getElementById('btn-text').textContent = 'SECURE ACCESS';
                    document.getElementById('toggle-register').textContent = 'REGISTER NEW USER';
                } else {
                    document.getElementById('form-title').textContent = 'REGISTER';
                    document.getElementById('btn-text').textContent = 'ESTABLISH LINK';
                    document.getElementById('toggle-register').textContent = 'ALREADY HAVE AN ACCOUNT? LOGIN';
                }
                document.getElementById('email-input').value = '';
                document.getElementById('password-input').value = '';
                document.getElementById('login-message').textContent = '';
            });

            // Forgot Password
            document.getElementById('forgot-btn').addEventListener('click', async function() {
                showPromptModal('Recover Password', 'Please enter your registered email:', async (email) => {
                    if (!email) return;
                    
                    const result = await apiRequest('/auth/recover', {
                        method: 'POST',
                        body: JSON.stringify({ email })
                    });
                    
                    if (result.success) {
                        showAlertModal('Success', `Password recovery successful!\nName: ${result.name}\nPassword: ${result.password}`, 'fas fa-check-circle', 'var(--success)');
                    } else {
                        showAlertModal('Error', result.message || 'No account found with that email!', 'fas fa-exclamation-circle', 'var(--danger)');
                    }
                });
            });

            // Logout modal listeners
            document.getElementById('logout-btn').addEventListener('click', function() {
                document.getElementById('logout-modal').classList.remove('hidden');
            });

            document.getElementById('logout-confirm-btn').addEventListener('click', function() {
                resetToLoginState();
                document.getElementById('logout-modal').classList.add('hidden');
            });

            document.getElementById('logout-cancel-btn').addEventListener('click', function() {
                document.getElementById('logout-modal').classList.add('hidden');
            });

            document.getElementById('logout-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    document.getElementById('logout-modal').classList.add('hidden');
                }
            });

            // Prompt modal listeners
            document.getElementById('prompt-confirm-btn').addEventListener('click', function() {
                const value = document.getElementById('prompt-input').value;
                document.getElementById('prompt-modal').classList.add('hidden');
                if (promptCallback) {
                    promptCallback(value);
                }
            });

            document.getElementById('prompt-cancel-btn').addEventListener('click', function() {
                document.getElementById('prompt-modal').classList.add('hidden');
                if (promptCallback) {
                    promptCallback(null);
                }
            });

            document.getElementById('prompt-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    document.getElementById('prompt-modal').classList.add('hidden');
                    if (promptCallback) {
                        promptCallback(null);
                    }
                }
            });

            document.getElementById('prompt-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('prompt-confirm-btn').click();
                }
            });

            // Alert modal listeners
            document.getElementById('alert-confirm-btn').addEventListener('click', function() {
                document.getElementById('alert-modal').classList.add('hidden');
            });

            document.getElementById('alert-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    document.getElementById('alert-modal').classList.add('hidden');
                }
            });
            
            // Delete user modal listeners
            document.getElementById('delete-user-confirm-btn').addEventListener('click', async function() {
                console.log(pendingDeleteUserId);
                if (pendingDeleteUserId) {
                    const result = await apiRequest(`/admin/users/${pendingDeleteUserId}`, {
                        method: 'DELETE'
                    });

                    if (result.success) {
                        loadUsers();
                        updateDashboardStats();
                        showAlertModal('Success', 'User deleted successfully!', 'fas fa-check-circle', 'var(--success)');
                    } else {
                        showAlertModal('Error', result.message || 'Failed to delete user', 'fas fa-exclamation-circle', 'var(--danger)');
                    }
                    pendingDeleteUserId = null;
                }
                document.getElementById('delete-user-modal').classList.add('hidden');
            });

            document.getElementById('delete-user-cancel-btn').addEventListener('click', function() {
                pendingDeleteUserId = null;
                document.getElementById('delete-user-modal').classList.add('hidden');
            });

            document.getElementById('delete-user-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    pendingDeleteUserId = null;
                    document.getElementById('delete-user-modal').classList.add('hidden');
                }
            });

            // Confirm modal listeners
            document.getElementById('confirm-confirm-btn').addEventListener('click', async function() {
                if (confirmCallback) {
                    await confirmCallback();
                }
                confirmCallback = null;
                document.getElementById('confirm-modal').classList.add('hidden');
            });

            document.getElementById('confirm-cancel-btn').addEventListener('click', function() {
                confirmCallback = null;
                document.getElementById('confirm-modal').classList.add('hidden');
            });

            document.getElementById('confirm-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    confirmCallback = null;
                    document.getElementById('confirm-modal').classList.add('hidden');
                }
            });
            
            // Login Form Submit
            document.getElementById('login-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('email-input').value;
                const password = document.getElementById('password-input').value;
                const messageDiv = document.getElementById('login-message');

                let result;
                if (isLoginMode) {
                    result = await handleLogin(email, password); // Use login.js's handleLogin
                    
                    if (result.success) {
                        showDashboard(result.user);
                    } else {
                        messageDiv.textContent = result.message || 'Invalid email or password!';
                    }
                } else {
                    result = await handleRegister(email, password); // Use register.js's handleRegister
                    
                    if (result.success) {
                        showDashboard(result.user);
                    } else {
                        messageDiv.textContent = result.message || 'Email already registered!';
                    }
                }
                
                updateDashboardStats();
            });
        });
