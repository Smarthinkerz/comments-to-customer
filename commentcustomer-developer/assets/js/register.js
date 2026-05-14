(function () {
    'use strict';

    var PLAN_CONFIG = {
        trial: {
            icon: 'fa-rocket',
            title: 'Start Your Free Trial',
            subtitle: '7 days free. No credit card required.',
            btn: 'Start Free Trial',
            badge: false
        },
        starter: {
            icon: 'fa-star',
            title: 'Get Started with Starter',
            subtitle: 'Create your account to continue to payment.',
            btn: 'Continue to Payment',
            badge: true,
            planName: 'Starter Plan',
            planPrice: '$29/month'
        },
        growth: {
            icon: 'fa-chart-line',
            title: 'Get Started with Growth',
            subtitle: 'Create your account to continue to payment.',
            btn: 'Continue to Payment',
            badge: true,
            planName: 'Growth Plan',
            planPrice: '$79/month'
        },
        pro: {
            icon: 'fa-crown',
            title: 'Get Started with Pro',
            subtitle: 'Create your account to continue to payment.',
            btn: 'Continue to Payment',
            badge: true,
            planName: 'Pro Plan',
            planPrice: '$149/month'
        }
    };

    function openRegisterPopup(plan) {
        plan = plan && PLAN_CONFIG[plan] ? plan : 'trial';
        var cfg    = PLAN_CONFIG[plan];
        var popup  = document.getElementById('registerPopup');
        if (!popup) return;

        document.getElementById('registerPlan').value    = plan;
        document.getElementById('registerPopupIcon').className = 'fas ' + cfg.icon;
        document.getElementById('registerPopupTitle').textContent = cfg.title;
        document.getElementById('registerPopupSub').textContent   = cfg.subtitle;

        var badge = document.getElementById('registerPlanBadge');
        if (cfg.badge) {
            document.getElementById('registerPlanName').textContent  = cfg.planName;
            document.getElementById('registerPlanPrice').textContent = cfg.planPrice;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }

        document.getElementById('registerBtnIcon').className = 'fas ' + cfg.icon;
        document.getElementById('registerBtnText').textContent = cfg.btn;

        document.getElementById('registerForm').reset();
        var errEl = document.getElementById('registerError');
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

        var submitBtn = document.getElementById('registerSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }

        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeRegisterPopup() {
        var popup = document.getElementById('registerPopup');
        if (popup) {
            popup.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {

        /* ── Open triggers: hero, pricing, demo section ── */
        document.querySelectorAll('.btn-open-register').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openRegisterPopup(this.getAttribute('data-plan') || 'trial');
            });
        });

        /* ── Close button ── */
        var closeBtn = document.getElementById('closeRegisterPopup');
        if (closeBtn) closeBtn.addEventListener('click', closeRegisterPopup);

        /* ── Overlay click ── */
        var overlay = document.getElementById('registerOverlay');
        if (overlay) overlay.addEventListener('click', closeRegisterPopup);

        /* ── Escape key ── */
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeRegisterPopup();
        });

        /* ── "Already have an account? Login here" ── */
        var switchBtn = document.getElementById('switchToLogin');
        if (switchBtn) {
            switchBtn.addEventListener('click', function (e) {
                e.preventDefault();
                closeRegisterPopup();
                var loginPopup = document.getElementById('userLoginPopup');
                if (loginPopup) {
                    loginPopup.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        /* ── "Don't have an account? Start Free Trial" in login popup ── */
        var loginSignupLink = document.querySelector('#userLoginPopup .cc-form-link');
        if (loginSignupLink) {
            loginSignupLink.addEventListener('click', function (e) {
                e.preventDefault();
                var loginPopup = document.getElementById('userLoginPopup');
                if (loginPopup) {
                    loginPopup.classList.remove('active');
                    document.body.style.overflow = '';
                }
                openRegisterPopup('trial');
            });
        }

        /* ── Registration form submit ── */
        var form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name     = document.getElementById('regName').value.trim();
            var email    = document.getElementById('regEmail').value.trim();
            var password = document.getElementById('regPassword').value;
            var plan     = document.getElementById('registerPlan').value;
            var cfg      = PLAN_CONFIG[plan] || PLAN_CONFIG.trial;
            var errEl    = document.getElementById('registerError');
            var submitBtn = document.getElementById('registerSubmitBtn');

            errEl.style.display = 'none';
            errEl.textContent   = '';

            if (!name || !email || !password) {
                errEl.textContent = 'All fields are required.';
                errEl.style.display = 'block';
                return;
            }
            if (password.length < 8) {
                errEl.textContent = 'Password must be at least 8 characters.';
                errEl.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Processing...';

            var ajaxUrl = (window.ccData && window.ccData.ajaxUrl) ? window.ccData.ajaxUrl : '/api/ajax';
            var nonce   = (window.ccData && window.ccData.nonce)   ? window.ccData.nonce   : '';

            fetch(ajaxUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action:   'cc_register',
                    nonce:    nonce,
                    name:     name,
                    email:    email,
                    password: password,
                    plan:     plan
                }).toString()
            })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success) {
                    submitBtn.innerHTML = '<i class="fas fa-check"></i>&nbsp;Success!';
                    submitBtn.style.background = '#22c55e';
                    setTimeout(function () {
                        window.location.href = res.data.redirect;
                    }, 700);
                } else {
                    var msg = (res.data && res.data.message) ? res.data.message : 'Registration failed. Please try again.';
                    errEl.textContent   = msg;
                    errEl.style.display = 'block';
                    submitBtn.disabled  = false;
                    submitBtn.innerHTML = '<i class="fas ' + cfg.icon + '" id="registerBtnIcon"></i>&nbsp;<span id="registerBtnText">' + cfg.btn + '</span>';
                }
            })
            .catch(function () {
                errEl.textContent   = 'Connection error. Please try again.';
                errEl.style.display = 'block';
                submitBtn.disabled  = false;
                submitBtn.innerHTML = '<i class="fas ' + cfg.icon + '" id="registerBtnIcon"></i>&nbsp;<span id="registerBtnText">' + cfg.btn + '</span>';
            });
        });
    });

    /* Expose globally so other scripts can open it */
    window.openRegisterPopup = openRegisterPopup;
    window.closeRegisterPopup = closeRegisterPopup;

})();
