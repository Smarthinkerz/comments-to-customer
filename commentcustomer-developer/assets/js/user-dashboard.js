document.addEventListener('DOMContentLoaded', function() {
    var sidebar = document.getElementById('userDashSidebar');
    var mobileToggle = document.getElementById('udMobileToggle');
    var sidebarToggle = document.getElementById('udSidebarToggle');
    var pageTitle = document.getElementById('udPageTitle');
    var upgradeModal = document.getElementById('udUpgradeModal');

    var TIERS = ['trial','starter','growth','pro'];

    var TIER_CONFIG = {
        trial: {
            name: 'Free Trial', badge: 'TRIAL', badgeClass: 'ud-badge-trial',
            pages: 1, repliesDay: 30, repliesMonth: 500,
            aiEnabled: false, aiLabel: 'Basic AI (View Only)',
            analyticsRange: 'Last 7 days', analyticsLabel: '7-day analytics',
            features: [],
            billingDesc: '30 replies/day \u2022 1 page \u2022 7-day analytics'
        },
        starter: {
            name: 'Starter', badge: 'STARTER', badgeClass: 'ud-badge-starter',
            pages: 1, repliesDay: 100, repliesMonth: 1000,
            aiEnabled: true, aiLabel: 'Basic AI Model',
            analyticsRange: 'Dashboard Analytics', analyticsLabel: 'Dashboard analytics',
            features: ['aimodel','leadcapture','dashanalytics'],
            billingDesc: '1 page \u2022 1,000 automated replies \u2022 Basic AI \u2022 Lead capture'
        },
        growth: {
            name: 'Growth', badge: 'GROWTH', badgeClass: 'ud-badge-growth',
            pages: 3, repliesDay: 300, repliesMonth: 5000,
            aiEnabled: true, aiLabel: 'Advanced AI Replies',
            analyticsRange: 'Advanced Analytics', analyticsLabel: 'Advanced analytics',
            features: ['aimodel','leadcapture','dashanalytics','autodm','priority'],
            billingDesc: '3 pages \u2022 5,000 automated replies \u2022 Advanced AI \u2022 Auto-DM'
        },
        pro: {
            name: 'Pro', badge: 'PRO', badgeClass: 'ud-badge-pro',
            pages: 7, repliesDay: 500, repliesMonth: 15000,
            aiEnabled: true, aiLabel: 'Lead Scoring AI',
            analyticsRange: 'Full Analytics Suite', analyticsLabel: 'Full analytics suite',
            features: ['aimodel','leadcapture','dashanalytics','autodm','priority','leadscore','multiteam','fullanalytics'],
            billingDesc: '7 pages \u2022 15,000 automated replies \u2022 Lead scoring AI \u2022 Multi-team'
        }
    };

    function tierLevel(t) { return TIERS.indexOf(t || 'trial'); }

    /* Plan must come from server session, NOT localStorage. We render with a
       safe default and then refresh from /api/me — if the user has no session
       the server already redirected them to /unauthorized.
       sessionStorage cache prevents reload-loop flashing across the /api/me round-trip. */
    var cachedPlan = null;
    try { cachedPlan = sessionStorage.getItem('cc_plan'); } catch (_) {}
    var currentPlan = (cachedPlan && TIER_CONFIG[cachedPlan]) ? cachedPlan : 'trial';
    var cfg = TIER_CONFIG[currentPlan];
    var lvl = tierLevel(currentPlan);

    function fmtDate(d) {
        try {
            return new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
        } catch (_) { return String(d); }
    }
    function renderBillingState(me) {
        var d = (me && me.data) || {};
        var status = d.billing_status || 'active';
        var expires = d.plan_expires ? new Date(d.plan_expires) : null;
        var planKey = d.plan || currentPlan;
        var isPaid = ['starter','growth','pro'].indexOf(planKey) >= 0;

        var renewalEl = document.getElementById('udBillingRenewal');
        if (renewalEl) {
            if (isPaid && expires) {
                var label = 'Next renewal: ' + fmtDate(expires);
                if (status === 'cancelled')  label = 'Plan ends on ' + fmtDate(expires) + ' (cancelled, no auto-renewal)';
                else if (status === 'refunded') label = 'Refunded — access ends on ' + fmtDate(expires);
                else if (status === 'past_due') label = 'Payment past due — renewal failed (previous period ended ' + fmtDate(expires) + ')';
                renewalEl.textContent = label;
                renewalEl.style.display = 'block';
            } else {
                renewalEl.style.display = 'none';
            }
        }

        var alertEl = document.getElementById('udBillingAlert');
        if (alertEl) {
            var msg = '';
            var tone = 'warn';
            if (status === 'past_due') {
                msg = '<i class="fas fa-exclamation-triangle"></i> Your last payment did not go through. Please update your payment method with our billing partner to keep your plan active.';
            } else if (status === 'cancelled') {
                msg = '<i class="fas fa-info-circle"></i> Your subscription is cancelled and will not auto-renew. You\u2019ll keep access until ' + (expires ? fmtDate(expires) : 'the end of the current period') + '.';
            } else if (status === 'refunded') {
                msg = '<i class="fas fa-undo"></i> This subscription was refunded. Access will end on ' + (expires ? fmtDate(expires) : 'the end of the current period') + '.';
                tone = 'danger';
            }
            if (msg) {
                alertEl.innerHTML = msg;
                alertEl.style.display = 'block';
                if (tone === 'danger') {
                    alertEl.style.borderColor = 'rgba(255,80,80,0.4)';
                    alertEl.style.background  = 'rgba(255,80,80,0.08)';
                    alertEl.style.color       = '#FFB3B3';
                }
            } else {
                alertEl.style.display = 'none';
            }
        }
    }

    fetch('/api/me', { credentials: 'same-origin' })
        .then(function(r){ if (r.status === 401) { window.location.href = '/'; return null; } return r.json(); })
        .then(function(me){
            if (!me || !me.success) return;
            var serverPlan = me.data && me.data.plan;
            if (serverPlan && TIER_CONFIG[serverPlan]) {
                try { sessionStorage.setItem('cc_plan', serverPlan); } catch (_) {}
                if (serverPlan !== currentPlan) {
                    /* Reload so tier-aware DOM rebuilds cleanly with cached plan */
                    window.location.reload();
                    return;
                }
            }
            renderBillingState(me);
        })
        .catch(function(){});

    /* ── Sidebar & topbar ── */
    var tierLabel = document.getElementById('udTierLabel');
    if (tierLabel) tierLabel.innerHTML = '<i class="fas fa-bolt"></i> ' + cfg.name;

    var tierBadge = document.getElementById('udTierBadge');
    if (tierBadge) {
        tierBadge.textContent = cfg.badge;
        tierBadge.className = 'ud-tier-badge ' + cfg.badgeClass;
    }

    var dashTitle = document.getElementById('udDashTitle');
    if (dashTitle) dashTitle.textContent = cfg.name + ' Dashboard';

    /* ── Sidebar nav: show/hide tier-locked pages ── */
    document.querySelectorAll('.ud-nav-link[data-tier-min]').forEach(function(link) {
        var minTier = link.getAttribute('data-tier-min');
        if (tierLevel(minTier) > lvl) {
            link.style.opacity = '0.4';
            link.innerHTML = link.innerHTML.replace('</span>', ' <i class="fas fa-lock" style="font-size:10px;margin-left:4px;"></i></span>');
        }
    });

    /* ── Connected pages ── */
    var pagesConnected = document.getElementById('udPagesConnected');
    var pagesLimitTag = document.getElementById('udPagesLimitTag');
    if (pagesConnected) pagesConnected.textContent = '1';
    if (pagesLimitTag) pagesLimitTag.textContent = 'of ' + cfg.pages;
    var accountsLimit = document.getElementById('udAccountsLimit');
    if (accountsLimit) accountsLimit.textContent = cfg.pages;
    if (cfg.pages >= 3) {
        var lp = document.getElementById('udLockedPlatforms');
        if (lp) lp.style.display = 'none';
        var al = document.getElementById('udAccountsLocked');
        if (al && cfg.pages >= 7) {
            al.querySelector('.ud-btn-gradient').textContent = 'All platforms available';
            al.querySelector('.ud-btn-gradient').disabled = true;
            al.querySelector('.ud-btn-gradient').style.opacity = '0.5';
        }
    }

    /* ── Usage ── */
    var used = 20, limit = cfg.repliesDay, pct = Math.round((used/limit)*100);
    function setUsage(countEl, pctEl, fillEl) {
        if (countEl) countEl.textContent = used + '/' + limit;
        if (pctEl) pctEl.textContent = pct + '% used';
        if (fillEl) fillEl.style.width = pct + '%';
    }
    setUsage(
        document.getElementById('udHomeUsageCount'),
        document.getElementById('udHomeUsagePct'),
        document.getElementById('udHomeProgressFill')
    );
    setUsage(
        document.getElementById('udUsageCount'),
        document.getElementById('udUsagePct'),
        document.getElementById('udUsageProgressFill')
    );
    var homeNote = document.getElementById('udHomeUsageNote');
    if (homeNote) homeNote.textContent = limit + '/day limit' + (currentPlan === 'pro' ? '' : ' \u2014 Upgrade for more');
    var usageToday = document.getElementById('udUsageToday');
    if (usageToday) usageToday.textContent = used;
    var dailyLimitEl = document.getElementById('udUsageDailyLimit');
    if (dailyLimitEl) dailyLimitEl.textContent = limit;
    var monthlyEl = document.getElementById('udUsageMonthly');
    if (monthlyEl) monthlyEl.textContent = Math.round(used * 15);
    var monthlyLimitEl = document.getElementById('udUsageMonthlyLimit');
    if (monthlyLimitEl) monthlyLimitEl.textContent = cfg.repliesMonth.toLocaleString();
    var upgradeNote = document.getElementById('udUsageUpgradeNote');
    if (upgradeNote) {
        if (currentPlan === 'pro') upgradeNote.textContent = 'You are on the highest plan';
        else upgradeNote.textContent = 'Upgrade for more daily replies';
    }
    var usageUpBtn = document.getElementById('udUsageUpgradeBtn');
    if (usageUpBtn && currentPlan === 'pro') {
        usageUpBtn.style.display = 'none';
    }

    /* ── AI Replies card ── */
    var aiBadge = document.getElementById('udAiBadge');
    var aiBtn = document.getElementById('udAiBtn');
    var aiPreviews = document.getElementById('udAiPreviews');
    if (cfg.aiEnabled) {
        if (aiBadge) { aiBadge.textContent = 'ACTIVE'; aiBadge.style.background = 'rgba(0,255,136,0.2)'; aiBadge.style.color = '#00FF88'; aiBadge.style.borderColor = 'rgba(0,255,136,0.4)'; }
        if (aiPreviews) aiPreviews.style.opacity = '1';
        if (aiBtn) { aiBtn.innerHTML = '<i class="fas fa-cog"></i> Configure AI Replies'; aiBtn.classList.remove('ud-btn-gradient'); aiBtn.classList.add('ud-btn-cyan'); }
    }
    var repliesBadge = document.getElementById('udRepliesBadge');
    var repliesBtn = document.getElementById('udRepliesBtn');
    var repliesPreviews = document.getElementById('udRepliesPreviews');
    var repliesDesc = document.getElementById('udRepliesDesc');
    if (cfg.aiEnabled) {
        if (repliesBadge) { repliesBadge.textContent = 'ACTIVE'; repliesBadge.style.background = 'rgba(0,255,136,0.2)'; repliesBadge.style.color = '#00FF88'; repliesBadge.style.borderColor = 'rgba(0,255,136,0.4)'; }
        if (repliesPreviews) repliesPreviews.style.opacity = '1';
        if (repliesBtn) { repliesBtn.innerHTML = '<i class="fas fa-cog"></i> Configure AI Replies'; repliesBtn.classList.remove('ud-btn-gradient'); repliesBtn.classList.add('ud-btn-cyan'); }
        if (repliesDesc) repliesDesc.textContent = 'Your AI is actively generating replies to incoming comments.';
    }

    /* ── Analytics range ── */
    var analyticsRangeBadge = document.getElementById('udAnalyticsRangeBadge');
    if (analyticsRangeBadge) analyticsRangeBadge.textContent = cfg.analyticsRange;
    var analyticsPageRange = document.getElementById('udAnalyticsPageRange');
    if (analyticsPageRange) analyticsPageRange.textContent = cfg.analyticsRange;
    var analyticsBtn = document.getElementById('udAnalyticsBtn');
    var analyticsPageBtn = document.getElementById('udAnalyticsPageBtn');
    if (lvl >= tierLevel('growth')) {
        if (analyticsBtn) analyticsBtn.style.display = 'none';
        if (analyticsPageBtn) analyticsPageBtn.style.display = 'none';
        var statLeads = document.getElementById('udStatLeads');
        if (statLeads && currentPlan === 'pro') statLeads.style.display = 'block';
    }

    /* ── Feature cards: lock/unlock ── */
    document.querySelectorAll('.ud-feature-card[data-feature]').forEach(function(card) {
        var feature = card.getAttribute('data-feature');
        var minTier = card.getAttribute('data-tier-min');
        var minLvl = tierLevel(minTier);
        var lockBadge = card.querySelector('.ud-lock-badge');
        var btn = card.querySelector('.ud-btn-upgrade');
        var isViewOnly = cfg.features && cfg.features.indexOf(feature + ':view') >= 0;

        if (lvl >= minLvl) {
            card.classList.add('ud-feature-unlocked');
            if (lockBadge) { lockBadge.innerHTML = '<i class="fas fa-check"></i>'; lockBadge.style.background = 'linear-gradient(135deg, #00FF88, #00CC6A)'; lockBadge.style.boxShadow = '0 0 20px rgba(0,255,136,0.6)'; }
            if (btn) { btn.innerHTML = 'Active <i class="fas fa-check-circle"></i>'; btn.classList.remove('ud-btn-upgrade'); btn.classList.add('ud-btn-cyan'); btn.style.cursor = 'default'; }
        } else if (isViewOnly) {
            card.classList.add('ud-feature-preview');
        } else {
            var neededTier = TIER_CONFIG[minTier] ? TIER_CONFIG[minTier].name : minTier;
            if (btn) btn.innerHTML = neededTier + '+ <i class="fas fa-crown"></i>';
        }
    });

    /* ── Features heading ── */
    var featuresHeading = document.getElementById('udFeaturesHeading');
    if (featuresHeading) {
        var unlocked = document.querySelectorAll('.ud-feature-unlocked').length;
        var total = document.querySelectorAll('.ud-feature-card[data-feature]').length;
        if (unlocked === total) {
            featuresHeading.textContent = 'All Features Active';
        } else {
            featuresHeading.textContent = unlocked + '/' + total + ' Features Active';
        }
    }

    /* ── Billing page ── */
    var billingBadge = document.getElementById('udBillingBadge');
    if (billingBadge) { billingBadge.textContent = cfg.badge; billingBadge.className = 'ud-plan-badge ' + cfg.badgeClass; }
    var billingPlanName = document.getElementById('udBillingPlanName');
    if (billingPlanName) billingPlanName.textContent = cfg.name;
    var billingPlanDesc = document.getElementById('udBillingPlanDesc');
    if (billingPlanDesc) billingPlanDesc.textContent = cfg.billingDesc;
    document.querySelectorAll('[data-billing-plan]').forEach(function(card) {
        var cardPlan = card.getAttribute('data-billing-plan');
        var btn = card.querySelector('.ud-btn');
        if (cardPlan === currentPlan) {
            card.style.border = '2px solid #00FF88';
            card.style.boxShadow = '0 0 30px rgba(0,255,136,0.2)';
            if (btn) { btn.textContent = 'Current Plan'; btn.disabled = true; btn.style.opacity = '0.6'; }
        } else if (tierLevel(cardPlan) < lvl) {
            if (btn) { btn.textContent = 'Downgrade'; btn.style.opacity = '0.5'; }
        }
    });

    /* ── Page navigation ── */
    var pageTitles = {
        home: 'Dashboard', accounts: 'Connected Pages', replies: 'AI Replies',
        leadcapture: 'Lead Capture', dm: 'Auto-DM Sequences', analytics: 'Analytics',
        leads: 'Lead Scoring AI', multiteam: 'Multi-Team Access',
        usage: 'Usage', tutorials: 'Watch Tutorials',
        profile: 'Profile Settings', billing: 'Billing & Plan'
    };

    /* ── Watch Tutorials: track completion in localStorage ── */
    var WATCHED_KEY = 'cc_watched_tutorials';
    function loadWatched() {
        try {
            var raw = localStorage.getItem(WATCHED_KEY);
            if (!raw) return {};
            var parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (_) { return {}; }
    }
    function saveWatched(map) {
        try { localStorage.setItem(WATCHED_KEY, JSON.stringify(map)); } catch (_) {}
    }
    function refreshTutorialsProgress() {
        var cards = document.querySelectorAll('.ud-tutorial-card');
        if (!cards.length) return;
        var done = document.querySelectorAll('.ud-tutorial-card.is-watched').length;
        var total = cards.length;
        var label = document.getElementById('udTutorialsProgressLabel');
        var fill = document.getElementById('udTutorialsProgressFill');
        if (label) label.textContent = done + ' of ' + total + ' watched';
        if (fill) fill.style.width = Math.round((done / total) * 100) + '%';
    }
    function markTutorialWatched(card) {
        if (!card || card.classList.contains('is-watched')) return;
        card.classList.add('is-watched');
        var id = card.getAttribute('data-tutorial-id');
        if (!id) return;
        var map = loadWatched();
        map[id] = Date.now();
        saveWatched(map);
        refreshTutorialsProgress();
    }
    (function initTutorials() {
        var cards = document.querySelectorAll('.ud-tutorial-card');
        if (!cards.length) return;
        var watched = loadWatched();
        cards.forEach(function(card) {
            var id = card.getAttribute('data-tutorial-id');
            if (id && watched[id]) card.classList.add('is-watched');
            var video = card.querySelector('video');
            if (video) {
                video.addEventListener('ended', function() { markTutorialWatched(card); });
                /* Also mark watched if the user scrubs to ≥95% — long videos
                   may not always fire 'ended' if the user pauses near the end. */
                video.addEventListener('timeupdate', function() {
                    if (video.duration && (video.currentTime / video.duration) >= 0.95) {
                        markTutorialWatched(card);
                    }
                });
            }
        });
        refreshTutorialsProgress();
    })();

    document.querySelectorAll('.ud-nav-link[data-page]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.getAttribute('data-page');
            var minTier = this.getAttribute('data-tier-min');
            if (minTier && tierLevel(minTier) > lvl) {
                openUpgradeModal('Upgrade to ' + TIER_CONFIG[minTier].name + ' to access this feature.');
                return;
            }
            document.querySelectorAll('.ud-nav-link').forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.ud-page').forEach(function(p) { p.classList.remove('active'); });
            var target = document.getElementById('ud-page-' + page);
            if (target) target.classList.add('active');
            if (pageTitle) pageTitle.textContent = pageTitles[page] || 'Dashboard';
            if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');
        });
    });

    /* ── Mobile sidebar ── */
    if (mobileToggle && sidebar) mobileToggle.addEventListener('click', function() { sidebar.classList.toggle('open'); });
    if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', function() { sidebar.classList.remove('open'); });

    /* ── Toast ── */
    function showUdToast(message) {
        var existing = document.querySelector('.ud-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'ud-toast';
        toast.innerHTML = '<i class="fas fa-info-circle"></i> ' + message;
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 3000);
    }

    /* ── Upgrade modal ── */
    function openUpgradeModal(msg) {
        if (upgradeModal) {
            var msgEl = document.getElementById('udModalUpgradeMsg');
            if (msgEl && msg) msgEl.textContent = msg;
            upgradeModal.classList.add('active');
        }
    }
    function closeUpgradeModal() { if (upgradeModal) upgradeModal.classList.remove('active'); }

    var modalClose = document.querySelector('.ud-modal-close');
    if (modalClose) modalClose.addEventListener('click', closeUpgradeModal);
    var modalOverlay = document.querySelector('.ud-modal-overlay');
    if (modalOverlay) modalOverlay.addEventListener('click', closeUpgradeModal);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeUpgradeModal(); });

    /* ── Click handlers ── */
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.ud-btn-upgrade');
        if (btn) {
            var card = btn.closest('.ud-feature-card');
            if (card && card.classList.contains('ud-feature-unlocked')) {
                showUdToast('This feature is active on your plan!');
                return;
            }
            openUpgradeModal();
            return;
        }

        if (e.target.closest('.ud-feature-card') && !e.target.closest('.ud-btn')) {
            var fcard = e.target.closest('.ud-feature-card');
            if (fcard.classList.contains('ud-feature-unlocked')) {
                showUdToast('This feature is active!');
            } else {
                openUpgradeModal();
            }
            return;
        }

        if (e.target.closest('.ud-btn-gradient') && e.target.closest('.ud-locked-section')) {
            openUpgradeModal();
            return;
        }

        if (e.target.closest('[data-testid="btn-ud-manage-ig"]')) {
            showUdToast('Opening account management...');
            return;
        }

        if (e.target.closest('[data-testid="btn-ud-save-profile"]')) {
            var saveBtn = e.target.closest('[data-testid="btn-ud-save-profile"]');
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            setTimeout(function() {
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                showUdToast('Profile saved successfully');
                setTimeout(function() { saveBtn.innerHTML = 'Save Changes'; }, 1500);
            }, 800);
            return;
        }

        if (e.target.closest('.ud-btn-purple')) {
            openUpgradeModal();
            return;
        }

        if (e.target.closest('[data-testid="btn-ud-select-starter"], [data-testid="btn-modal-starter"]')) {
            if (currentPlan !== 'starter') window.location.href = '/checkout/?plan=starter';
            return;
        }
        if (e.target.closest('[data-testid="btn-ud-select-growth"], [data-testid="btn-modal-growth"]')) {
            if (currentPlan !== 'growth') window.location.href = '/checkout/?plan=growth';
            return;
        }
        if (e.target.closest('[data-testid="btn-ud-select-pro"], [data-testid="btn-modal-pro"]')) {
            if (currentPlan !== 'pro') window.location.href = '/checkout/?plan=pro';
            return;
        }

        if (e.target.closest('[data-testid="btn-ud-notifications"]')) {
            showUdToast('No new notifications');
            return;
        }

        if (e.target.closest('[data-testid="btn-ud-create-dm"]')) {
            showUdToast('Opening DM sequence builder...');
            return;
        }

        if (e.target.closest('[data-testid="btn-ud-invite-team"]')) {
            showUdToast('Opening team invitation...');
            return;
        }
    });
});
