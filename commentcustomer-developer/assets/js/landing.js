document.addEventListener('DOMContentLoaded', function() {
    var header = document.getElementById('cc-header');
    var mobileToggle = document.getElementById('mobileMenuToggle');
    var nav = document.getElementById('ccNav');

    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('mobile-open');
            document.body.classList.toggle('menu-open');
        });
    }

    document.querySelectorAll('.cc-nav-item.has-dropdown').forEach(function(item) {
        var link = item.querySelector('.cc-nav-link');
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var wasOpen = item.classList.contains('dropdown-open');
            document.querySelectorAll('.cc-nav-item.has-dropdown.dropdown-open').forEach(function(other) {
                other.classList.remove('dropdown-open');
            });
            if (!wasOpen) {
                item.classList.add('dropdown-open');
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.cc-nav-item.has-dropdown')) {
            document.querySelectorAll('.cc-nav-item.has-dropdown.dropdown-open').forEach(function(item) {
                item.classList.remove('dropdown-open');
            });
        }
    });

    document.querySelectorAll('.cc-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            document.querySelectorAll('.cc-nav-item.has-dropdown.dropdown-open').forEach(function(dd) {
                dd.classList.remove('dropdown-open');
            });
            if (nav && nav.classList.contains('mobile-open')) {
                mobileToggle.classList.remove('active');
                nav.classList.remove('mobile-open');
                document.body.classList.remove('menu-open');
            }
            var modalAttr = this.getAttribute('data-modal');
            if (modalAttr) {
                e.preventDefault();
                var modal = document.getElementById('modal-' + modalAttr);
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (this.closest('.cc-nav-link') && this.closest('.has-dropdown')) return;
            if (!href || href === '#') return;
            var target = null;
            try { target = document.querySelector(href); } catch(err) { return; }
            if (target) {
                e.preventDefault();
                document.querySelectorAll('.cc-nav-item.has-dropdown.dropdown-open').forEach(function(item) {
                    item.classList.remove('dropdown-open');
                });
                if (nav && nav.classList.contains('mobile-open')) {
                    mobileToggle.classList.remove('active');
                    nav.classList.remove('mobile-open');
                    document.body.classList.remove('menu-open');
                }
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    var userLoginPopup = document.getElementById('userLoginPopup');
    var openUserBtn = document.getElementById('openUserLogin');
    var closeUserBtn = document.getElementById('closeUserPopup');
    var userLoginForm = document.getElementById('userLoginForm');

    if (openUserBtn && userLoginPopup) {
        openUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            userLoginPopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeUserBtn && userLoginPopup) {
        closeUserBtn.addEventListener('click', function() {
            userLoginPopup.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (userLoginPopup) {
        var userOverlay = userLoginPopup.querySelector('.cc-admin-popup-overlay');
        if (userOverlay) {
            userOverlay.addEventListener('click', function() {
                userLoginPopup.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }

    if (userLoginForm) {
        userLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('userEmail').value;
            var password = document.getElementById('userPassword').value;
            var loginBtn = this.querySelector('.btn-admin-login');
            var errorEl = document.getElementById('userLoginError');

            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            loginBtn.disabled = true;
            errorEl.style.display = 'none';

            var ajaxUrl = (window.ccData && window.ccData.ajaxUrl) || '/api/ajax';
            var nonce   = (window.ccData && window.ccData.nonce)   || 'preview';
            var params  = new URLSearchParams();
            params.append('action',   'cc_user_login');
            params.append('nonce',    nonce);
            params.append('email',    email);
            params.append('password', password);

            fetch(ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    loginBtn.innerHTML = '<i class="fas fa-check"></i> Welcome back!';
                    loginBtn.style.background = 'linear-gradient(135deg, #00FF88, #00CC6A)';
                    setTimeout(function() {
                        window.location.href = (data.data && data.data.redirect) || '/user-dashboard/';
                    }, 800);
                } else {
                    errorEl.textContent = (data.data && data.data.message) || 'Invalid credentials. Please check your email and password.';
                    errorEl.style.display = 'block';
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
                    loginBtn.disabled = false;
                }
            })
            .catch(function() {
                errorEl.textContent = 'Connection error. Please try again.';
                errorEl.style.display = 'block';
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
                loginBtn.disabled = false;
            });
        });
    }

    var adminPopup = document.getElementById('adminPopup');
    var openAdminBtns = [document.getElementById('footerAdminLogin')];
    var closeBtn = document.getElementById('closeAdminPopup');
    var adminForm = document.getElementById('adminForm');

    openAdminBtns.forEach(function(btn) {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                adminPopup.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            adminPopup.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (adminPopup) {
        var adminOverlay = adminPopup.querySelector('.cc-admin-popup-overlay');
        if (adminOverlay) {
            adminOverlay.addEventListener('click', function() {
                adminPopup.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }

    if (adminForm) {
        adminForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('adminEmail').value;
            var password = document.getElementById('adminPassword').value;
            var loginBtn = this.querySelector('.btn-admin-login');
            var errorEl = document.getElementById('loginError');

            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            loginBtn.disabled = true;
            errorEl.style.display = 'none';

            var ajaxUrl = (window.ccData && window.ccData.ajaxUrl) || '/api/ajax';
            var nonce   = (window.ccData && window.ccData.nonce)   || 'preview';
            var params  = new URLSearchParams();
            params.append('action',   'cc_admin_login');
            params.append('nonce',    nonce);
            params.append('email',    email);
            params.append('password', password);

            fetch(ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success) {
                    loginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                    loginBtn.style.background = 'linear-gradient(135deg, #00FF88, #00CC6A)';
                    setTimeout(function() {
                        window.location.href = (data.data && data.data.redirect) || '/dashboard/';
                    }, 800);
                } else {
                    errorEl.textContent = (data.data && data.data.message) || 'Invalid credentials. Please try again.';
                    errorEl.style.display = 'block';
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                    loginBtn.disabled = false;
                }
            })
            .catch(function() {
                errorEl.textContent = 'Connection error. Please try again.';
                errorEl.style.display = 'block';
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                loginBtn.disabled = false;
            });
        });
    }

    var watchDemoBtn = document.getElementById('watchDemoBtn');
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', function() {
            var demoSection = document.getElementById('see-it-in-action');
            if (demoSection) {
                demoSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');

            var category = this.getAttribute('data-category');
            document.querySelectorAll('.features-category-section').forEach(function(section) {
                if (category === 'all' || section.getAttribute('data-category') === category) {
                    section.style.display = '';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });

    function setupDemo(demoNum, demoType) {
        var input = document.getElementById('demo-input-' + demoNum);
        var submitBtn = document.getElementById('demo-submit-' + demoNum);
        var chatArea = document.getElementById('demo-chat-' + demoNum);
        var countEl = document.getElementById('demo' + demoNum + '-count');
        var overlay = document.getElementById('demo-overlay-' + demoNum);
        var count = 3;

        if (!submitBtn) return;

        function sendMessage() {
            var message = input.value.trim();
            if (!message || count <= 0) return;

            var placeholder = chatArea.querySelector('.demo-placeholder-msg');
            if (placeholder) placeholder.remove();

            var userMsg = document.createElement('div');
            userMsg.className = 'demo-message-bubble user-msg';
            var userSpan = document.createElement('span');
            userSpan.textContent = message;
            userMsg.appendChild(userSpan);
            chatArea.appendChild(userMsg);

            input.value = '';

            var aiMsg = document.createElement('div');
            aiMsg.className = 'demo-message-bubble ai-msg';
            aiMsg.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
            chatArea.appendChild(aiMsg);

            chatArea.scrollTop = chatArea.scrollHeight;

            var responses;
            if (demoType === 'price') {
                responses = [
                    "Great question! We'd love to help. Could you tell us which product or plan you're interested in? We have Starter ($29/mo), Growth ($79/mo), and Pro ($149/mo) tiers.",
                    "Thanks for your interest! Our pricing starts at $29/month for the Starter plan. What specific features are you looking for?",
                    "I'd be happy to help with pricing! For the best recommendation, could you share what size business you're running?"
                ];
            } else {
                responses = [
                    "We serve businesses globally with our cloud-based platform. No physical delivery needed - setup takes just 5 minutes!",
                    "Great question! Our platform is available worldwide. Since it's cloud-based, you can start using it immediately from anywhere.",
                    "We're available in your area! Our SaaS platform works from any location. Would you like to start a free trial?"
                ];
            }

            setTimeout(function() {
                var response = responses[Math.floor(Math.random() * responses.length)];
                aiMsg.innerHTML = '<div class="ai-avatar"><i class="fas fa-robot"></i></div><span>' + response + '</span>';
                chatArea.scrollTop = chatArea.scrollHeight;

                count--;
                countEl.textContent = count;

                if (demoNum === 2) {
                    var scoringEl = document.getElementById('demo-scoring-2');
                    var fillEl = document.getElementById('scoring-fill-2');
                    var valueEl = document.getElementById('score-value-2');
                    if (scoringEl) {
                        scoringEl.style.display = '';
                        var score = Math.floor(Math.random() * 20) + 78;
                        fillEl.style.width = score + '%';
                        valueEl.textContent = score;
                    }
                }

                if (count <= 0 && overlay) {
                    setTimeout(function() {
                        overlay.style.display = 'flex';
                    }, 500);
                }
            }, 1500);
        }

        submitBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    setupDemo(1, 'price');
    setupDemo(2, 'delivery');

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .feature-item-card, .pricing-card, .demo-box').forEach(function(el) {
        observer.observe(el);
    });

    document.querySelectorAll('.demo-video-wrapper, .demo-centered-video').forEach(function(container) {
        var video = container.querySelector('video.hover-play');
        if (!video) return;

        container.addEventListener('mouseenter', function() {
            container.classList.add('playing');
            video.muted = false;
            video.play().catch(function() {
                video.muted = true;
                video.play().catch(function() {});
            });
        });

        container.addEventListener('mouseleave', function() {
            container.classList.remove('playing');
            video.pause();
            video.muted = true;
        });

        container.addEventListener('touchstart', function(e) {
            if (video.paused) {
                container.classList.add('playing');
                video.muted = false;
                video.play().catch(function() {
                    video.muted = true;
                    video.play().catch(function() {});
                });
            } else {
                container.classList.remove('playing');
                video.pause();
                video.muted = true;
            }
        }, { passive: true });

        container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'button');
        container.setAttribute('aria-label', 'Play video on hover or press Enter');
        container.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (video.paused) {
                    container.classList.add('playing');
                    video.muted = false;
                    video.play().catch(function() {
                        video.muted = true;
                        video.play().catch(function() {});
                    });
                } else {
                    container.classList.remove('playing');
                    video.pause();
                    video.muted = true;
                }
            }
        });
    });

    var floatingEls = document.querySelectorAll('.floating-icon, .floating-planet');
    floatingEls.forEach(function(el, i) {
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var startX = Math.random() * (vw - 60);
        var startY = Math.random() * (vh - 60);
        el.style.left = startX + 'px';
        el.style.top = startY + 'px';

        var speedX = (Math.random() - 0.5) * 0.6;
        var speedY = (Math.random() - 0.5) * 0.6;
        var wobbleAmp = 20 + Math.random() * 30;
        var wobbleFreq = 0.0005 + Math.random() * 0.001;
        var phase = Math.random() * Math.PI * 2;

        function animateFloat() {
            var t = Date.now();
            var wobX = Math.sin(t * wobbleFreq + phase) * wobbleAmp;
            var wobY = Math.cos(t * wobbleFreq * 0.7 + phase) * wobbleAmp * 0.8;

            startX += speedX;
            startY += speedY;

            if (startX < -50) startX = vw + 20;
            if (startX > vw + 50) startX = -20;
            if (startY < -50) startY = vh + 20;
            if (startY > vh + 50) startY = -20;

            el.style.transform = 'translate(' + wobX + 'px, ' + wobY + 'px)';
            el.style.left = startX + 'px';
            el.style.top = startY + 'px';

            requestAnimationFrame(animateFloat);
        }

        requestAnimationFrame(animateFloat);

        window.addEventListener('resize', function() {
            vw = window.innerWidth;
            vh = window.innerHeight;
        });
    });

    var starSections = document.querySelectorAll('.cc-features-overview, .cc-all-features, .cc-demo-section, .cc-pricing-section, .cc-footer, .cc-trust-bar');
    starSections.forEach(function(section) {
        if (!section || section.style.position === 'static' || !getComputedStyle(section).position || getComputedStyle(section).position === 'static') {
            section.style.position = 'relative';
        }
        section.style.overflow = section.style.overflow || 'hidden';
        var count = Math.floor(18 + Math.random() * 22);
        for (var s = 0; s < count; s++) {
            var star = document.createElement('div');
            star.className = 'site-star' + (Math.random() > 0.6 ? ' star-bright' : '');
            star.style.top = (Math.random() * 96) + '%';
            star.style.left = (Math.random() * 96) + '%';
            star.style.animationDelay = (Math.random() * 5).toFixed(1) + 's';
            star.style.animationDuration = (1.5 + Math.random() * 3.5).toFixed(1) + 's';
            section.appendChild(star);
        }
    });

    var shootingStars = [];
    for (var si = 0; si < 3; si++) {
        var ss = document.createElement('div');
        ss.className = 'shooting-star';
        document.body.appendChild(ss);
        shootingStars.push(ss);
    }

    function launchShootingStar() {
        var available = shootingStars.filter(function(s) { return !s.classList.contains('active'); });
        if (available.length === 0) return;
        var star = available[Math.floor(Math.random() * available.length)];

        var startX = Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.15;
        var startY = Math.random() * window.innerHeight * 0.5;

        var angle = -20 - Math.random() * 25;
        var rad = angle * Math.PI / 180;
        var dist = 500 + Math.random() * 500;
        var dx = Math.cos(rad) * dist;
        var dy = -Math.sin(rad) * dist;
        var duration = (0.8 + Math.random() * 0.8).toFixed(2);

        star.style.left = startX + 'px';
        star.style.top = startY + 'px';
        star.style.setProperty('--shoot-angle', angle + 'deg');
        star.style.setProperty('--shoot-x', dx + 'px');
        star.style.setProperty('--shoot-y', dy + 'px');
        star.style.setProperty('--shoot-duration', duration + 's');

        star.classList.remove('active');
        void star.offsetWidth;
        star.classList.add('active');

        setTimeout(function() {
            star.classList.remove('active');
        }, parseFloat(duration) * 1000 + 100);
    }

    function scheduleShootingStar() {
        var delay = 4000 + Math.random() * 10000;
        setTimeout(function() {
            launchShootingStar();
            if (Math.random() < 0.35) {
                setTimeout(function() { launchShootingStar(); }, 300 + Math.random() * 600);
            }
            if (Math.random() < 0.15) {
                setTimeout(function() { launchShootingStar(); }, 700 + Math.random() * 800);
            }
            scheduleShootingStar();
        }, delay);
    }

    scheduleShootingStar();

    var hubChartTargets = [];
    var hubSparkTargets = [];
    var hubAnimReady = false;

    function prepareHubTargets() {
        document.querySelectorAll('.hub-chart-bar').forEach(function(bar) {
            hubChartTargets.push(bar.style.height);
            bar.style.height = '0%';
        });
        document.querySelectorAll('.hub-spark-bar').forEach(function(bar) {
            hubSparkTargets.push(bar.style.height);
            bar.style.height = '0%';
        });
        document.querySelectorAll('.hub-bar-fill').forEach(function(bar) {
            var target = bar.getAttribute('data-bar-target') || '0%';
            bar.style.setProperty('--bar-target', target);
        });
        hubAnimReady = true;
    }

    function resetHubElements() {
        document.querySelectorAll('.hub-count').forEach(function(el) {
            var suffix = el.getAttribute('data-suffix') || '';
            el.textContent = '0' + suffix;
        });
        document.querySelectorAll('.hub-bar-fill').forEach(function(bar) {
            bar.classList.remove('bar-animated');
            bar.style.transition = 'none';
            setTimeout(function() {
                bar.style.transition = '';
            }, 50);
        });
        document.querySelectorAll('.hub-chart-bar').forEach(function(bar, i) {
            bar.style.transition = 'none';
            bar.style.height = '0%';
            setTimeout(function() { bar.style.transition = ''; }, 50);
        });
        document.querySelectorAll('.hub-spark-bar').forEach(function(bar, i) {
            bar.style.transition = 'none';
            bar.style.height = '0%';
            setTimeout(function() { bar.style.transition = ''; }, 50);
        });
    }

    function animateHubElements() {
        var duration = 1800;

        document.querySelectorAll('.hub-count').forEach(function(el) {
            var target = parseFloat(el.getAttribute('data-target'));
            if (isNaN(target)) return;
            var suffix = el.getAttribute('data-suffix') || '';
            var decimals = parseInt(el.getAttribute('data-decimal')) || 0;
            var useComma = el.getAttribute('data-comma') === 'true';
            var start = null;

            function step(ts) {
                if (!start) start = ts;
                var prog = Math.min((ts - start) / duration, 1);
                var ease = 1 - Math.pow(1 - prog, 3);
                var val = ease * target;
                var display;
                if (decimals > 0) {
                    display = val.toFixed(decimals);
                } else if (useComma) {
                    display = Math.round(val).toLocaleString();
                } else {
                    display = Math.round(val);
                }
                el.textContent = display + suffix;
                if (prog < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });

        document.querySelectorAll('.hub-bar-fill').forEach(function(bar) {
            setTimeout(function() {
                bar.classList.add('bar-animated');
            }, 80);
        });

        document.querySelectorAll('.hub-chart-bar').forEach(function(bar, i) {
            var target = hubChartTargets[i] || '0%';
            setTimeout(function() {
                bar.style.height = target;
            }, 120 + Math.random() * 250);
        });

        document.querySelectorAll('.hub-spark-bar').forEach(function(bar, i) {
            var target = hubSparkTargets[i] || '0%';
            setTimeout(function() {
                bar.style.height = target;
            }, 100 + i * 80);
        });
    }

    var HUB_CYCLE = 5500;

    function runHubCycle() {
        animateHubElements();
        setTimeout(function() {
            resetHubElements();
            setTimeout(runHubCycle, 400);
        }, HUB_CYCLE - 400);
    }

    setTimeout(function() {
        prepareHubTargets();
        runHubCycle();
    }, 700);

    var bubbleMap = {
        'red':    'planetBubbleRed',
        'blue':   'planetBubbleBlue',
        'purple': 'planetBubblePurple'
    };

    function closeAllBubbles() {
        Object.values(bubbleMap).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        document.querySelectorAll('.planet[data-planet-color]').forEach(function(p) {
            p.classList.remove('planet-active');
        });
    }

    function togglePlanetBubble(color, planet) {
        var bubbleId = bubbleMap[color];
        var bubble = document.getElementById(bubbleId);
        if (!bubble) return;

        var isOpen = bubble.classList.contains('active');
        closeAllBubbles();

        if (!isOpen) {
            bubble.classList.add('active');
            if (planet) planet.classList.add('planet-active');
        }
    }

    document.querySelectorAll('.planet').forEach(function(planet) {
        var clickZone = planet.querySelector('.planet-click-zone') || planet;
        function handlePlanetClick(e) {
            e.preventDefault();
            e.stopPropagation();
            var color = planet.getAttribute('data-planet-color');
            if (color) togglePlanetBubble(color, planet);
        }
        clickZone.addEventListener('click', handlePlanetClick);
        planet.addEventListener('click', handlePlanetClick);
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.planet') && !e.target.closest('.planet-bubble')) {
            closeAllBubbles();
        }
    });

    document.querySelectorAll('.planet-legend-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var color = item.getAttribute('data-planet');
            var cards = document.querySelectorAll('.feature-card[data-planet-group]');
            var legends = document.querySelectorAll('.planet-legend-item');
            legends.forEach(function(l) { l.classList.remove('active'); });
            item.classList.add('active');
            if (color === 'all') {
                cards.forEach(function(card) {
                    card.classList.remove('planet-hidden', 'planet-glow-red', 'planet-glow-blue', 'planet-glow-purple');
                    card.classList.add('animate-in');
                });
            } else {
                cards.forEach(function(card) {
                    var group = card.getAttribute('data-planet-group');
                    card.classList.remove('planet-glow-red', 'planet-glow-blue', 'planet-glow-purple');
                    if (group === color) {
                        card.classList.remove('planet-hidden');
                        card.classList.add('animate-in', 'planet-glow-' + color);
                    } else {
                        card.classList.add('planet-hidden');
                        card.classList.remove('animate-in');
                    }
                });
            }
        });
    });
});
