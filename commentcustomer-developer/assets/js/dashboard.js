document.addEventListener('DOMContentLoaded', function() {
    var sidebarToggle = document.getElementById('sidebarToggle');
    var mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    var sidebar = document.getElementById('dashboardSidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (mobileSidebarToggle && sidebar) {
        mobileSidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    var pageTitle = document.getElementById('dashPageTitle');
    var pageTitles = {
        comments: 'Comments',
        leads: 'Leads',
        analytics: 'Analytics',
        inbox: 'Inbox',
        workflows: 'Workflows',
        templates: 'Templates',
        crm: 'CRM Overview',
        'site-editor': 'Site Editor',
        media: 'Media Library',
        profile: 'Profile',
        settings: 'Account Settings',
        security: 'Security',
        connected: 'Connected Accounts',
        billing: 'Billing',
        team: 'Team',
        'system-monitor': 'System Monitor',
        'audit-log': 'Security Audit Log',
        'active-sessions': 'Active Sessions',
        'ip-bans': 'IP Bans & Intrusion Detection'
    };

    document.querySelectorAll('.dash-nav-link[data-page]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.getAttribute('data-page');
            if (!page) return;

            document.querySelectorAll('.dash-nav-link').forEach(function(l) {
                l.classList.remove('active');
            });
            this.classList.add('active');

            document.querySelectorAll('.dash-page').forEach(function(p) {
                p.style.display = 'none';
            });

            var target = document.getElementById('page-' + page);
            if (target) target.style.display = '';

            if (pageTitle && pageTitles[page]) {
                pageTitle.textContent = pageTitles[page];
            }

            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.add('collapsed');
            }
        });
    });

    function showDashToast(message, type) {
        var existing = document.querySelector('.dash-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'dash-toast' + (type === 'error' ? ' dash-toast-error' : '');
        var icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        toast.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('active'); }, 10);
        setTimeout(function() {
            toast.classList.remove('active');
            setTimeout(function() { toast.remove(); }, 400);
        }, 3000);
    }

    function spinButton(btn, duration, callback) {
        var original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
        setTimeout(function() {
            btn.innerHTML = original;
            btn.disabled = false;
            if (callback) callback();
        }, duration || 800);
    }

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.dash-btn-sm, .dash-btn-primary, .dash-btn-icon');
        if (!btn) return;

        if (btn.classList.contains('dash-btn-icon')) {
            var icon = btn.querySelector('i');
            if (!icon) return;

            if (icon.classList.contains('fa-eye')) {
                spinButton(btn, 600, function() {
                    showDashToast('Comment details loaded.');
                });
            } else if (icon.classList.contains('fa-paper-plane')) {
                spinButton(btn, 800, function() {
                    showDashToast('DM sent successfully!');
                });
            } else if (icon.classList.contains('fa-edit')) {
                spinButton(btn, 500, function() {
                    showDashToast('Editing template...');
                });
            } else if (icon.classList.contains('fa-copy')) {
                spinButton(btn, 400, function() {
                    showDashToast('Template copied to clipboard!');
                });
            } else if (icon.classList.contains('fa-ellipsis-h')) {
                spinButton(btn, 400, function() {
                    showDashToast('Member options opened.');
                });
            }
            return;
        }

        if (btn.classList.contains('dash-btn-sm')) {
            var text = btn.textContent.trim().toLowerCase();

            if (text.includes('filter')) {
                spinButton(btn, 700, function() {
                    showDashToast('Comments filtered by selected platform.');
                });
            } else if (text.includes('export')) {
                spinButton(btn, 1000, function() {
                    showDashToast('Leads exported to CSV successfully!');
                });
            } else if (text.includes('edit')) {
                spinButton(btn, 500, function() {
                    showDashToast('Edit mode activated.');
                });
            } else if (text.includes('pause')) {
                spinButton(btn, 600, function() {
                    btn.innerHTML = '<i class="fas fa-play"></i> Resume';
                    showDashToast('Workflow paused.');
                });
            } else if (text.includes('resume')) {
                spinButton(btn, 600, function() {
                    btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    showDashToast('Workflow resumed.');
                });
            } else if (text.includes('sync')) {
                spinButton(btn, 1200, function() {
                    showDashToast('Account synced. All data is up to date.');
                });
            } else if (text.includes('disconnect')) {
                spinButton(btn, 800, function() {
                    showDashToast('Account disconnected.', 'error');
                });
            } else if (text.includes('change photo')) {
                spinButton(btn, 600, function() {
                    showDashToast('Photo upload dialog opened.');
                });
            } else if (text.includes('view invoices')) {
                spinButton(btn, 800, function() {
                    showDashToast('Invoice history loaded. 3 invoices found.');
                });
            } else if (text.includes('update')) {
                spinButton(btn, 700, function() {
                    showDashToast('Payment method updated successfully!');
                });
            }
            return;
        }

        if (btn.classList.contains('dash-btn-primary')) {
            var text = btn.textContent.trim().toLowerCase();

            if (text.includes('create workflow')) {
                spinButton(btn, 800, function() {
                    showDashToast('New workflow created! Configure triggers and actions.');
                });
            } else if (text.includes('new template')) {
                spinButton(btn, 700, function() {
                    showDashToast('New template created. Start editing your response.');
                });
            } else if (text.includes('save changes')) {
                spinButton(btn, 1000, function() {
                    showDashToast('Profile changes saved successfully!');
                });
            } else if (text.includes('save settings')) {
                spinButton(btn, 1000, function() {
                    showDashToast('Account settings saved successfully!');
                });
            } else if (text.includes('update password')) {
                spinButton(btn, 1000, function() {
                    showDashToast('Password updated successfully!');
                });
            } else if (text.includes('connect new') || text.includes('connect')) {
                spinButton(btn, 900, function() {
                    showDashToast('Social account connection initiated.');
                });
            } else if (text.includes('upgrade')) {
                spinButton(btn, 800, function() {
                    showDashToast('Redirecting to Pro upgrade checkout...');
                });
            } else if (text.includes('invite member')) {
                spinButton(btn, 800, function() {
                    showDashToast('Team invitation sent!');
                });
            }
            return;
        }
    });

    var toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    toggleSwitches.forEach(function(toggle) {
        toggle.addEventListener('change', function() {
            var row = this.closest('.dash-setting-row, .setting-row, tr, div');
            var name = row ? row.querySelector('h4, label, strong, span') : null;
            var settingName = name ? name.textContent.trim() : 'Setting';
            if (this.checked) {
                showDashToast(settingName + ' enabled.');
            } else {
                showDashToast(settingName + ' disabled.');
            }
        });
    });

    var inboxItems = document.querySelectorAll('.inbox-item');
    inboxItems.forEach(function(item) {
        item.addEventListener('click', function() {
            inboxItems.forEach(function(i) { i.classList.remove('selected'); });
            this.classList.add('selected');
            showDashToast('Conversation loaded.');
        });
    });

    var filterDropdowns = document.querySelectorAll('.dash-select');
    filterDropdowns.forEach(function(select) {
        select.addEventListener('change', function() {
            showDashToast('Filter applied: ' + this.value);
        });
    });

    var logoutBtn = document.querySelector('.dash-nav-link[data-page="logout"], .dash-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showDashToast('Logging out...');
            fetch('/api/ajax', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'cc_logout' }).toString()
            }).finally(function(){ window.location.href = '/'; });
        });
    }

    initLivePreview();
});

function initLivePreview() {
    var layout = document.getElementById('siteEditorLayout');
    var preview = document.getElementById('siteEditorPreview');
    var iframe = document.getElementById('sitePreviewFrame');
    var toggleBtn = document.getElementById('btnTogglePreview');
    var closeBtn = document.getElementById('previewCloseBtn');
    if (!layout || !iframe) return;

    var zoomLevel = 100;
    var currentViewport = 'desktop';
    var viewportDims = { desktop: '1200 \u00d7 800', tablet: '768 \u00d7 1024', mobile: '375 \u00d7 667' };

    function togglePreview(show) {
        if (show) {
            layout.classList.add('preview-active');
            toggleBtn.querySelector('span').textContent = 'Hide Preview';
            toggleBtn.querySelector('i').className = 'fas fa-eye-slash';
            iframe.src = '/';
        } else {
            layout.classList.remove('preview-active');
            toggleBtn.querySelector('span').textContent = 'Show Preview';
            toggleBtn.querySelector('i').className = 'fas fa-eye';
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            var isActive = layout.classList.contains('preview-active');
            togglePreview(!isActive);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            togglePreview(false);
        });
    }

    var vpBtns = document.querySelectorAll('.preview-vp-btn');
    vpBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            vpBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentViewport = btn.getAttribute('data-viewport');
            iframe.className = 'preview-iframe';
            if (currentViewport === 'tablet') iframe.classList.add('viewport-tablet');
            if (currentViewport === 'mobile') iframe.classList.add('viewport-mobile');
            var info = document.getElementById('previewViewportInfo');
            if (info) info.textContent = viewportDims[currentViewport] + ' (' + currentViewport + ')';
        });
    });

    var zoomIn = document.getElementById('zoomIn');
    var zoomOut = document.getElementById('zoomOut');
    var zoomReset = document.getElementById('zoomReset');
    var zoomLabel = document.getElementById('zoomLabel');

    function applyZoom() {
        var wrapper = document.getElementById('previewFrameWrapper');
        if (!wrapper) return;
        var scale = zoomLevel / 100;
        iframe.style.transform = 'scale(' + scale + ')';
        iframe.style.transformOrigin = 'top center';
        if (currentViewport === 'desktop') {
            iframe.style.width = (100 / scale) + '%';
            iframe.style.height = (100 / scale) + '%';
        }
        if (zoomLabel) zoomLabel.textContent = zoomLevel + '%';
    }

    if (zoomIn) zoomIn.addEventListener('click', function() { if (zoomLevel < 200) { zoomLevel += 25; applyZoom(); } });
    if (zoomOut) zoomOut.addEventListener('click', function() { if (zoomLevel > 25) { zoomLevel -= 25; applyZoom(); } });
    if (zoomReset) zoomReset.addEventListener('click', function() { zoomLevel = 100; applyZoom(); });

    var highlightBtns = document.querySelectorAll('.btn-highlight-section');
    highlightBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var section = btn.getAttribute('data-section');
            var isActive = btn.classList.contains('active');
            highlightBtns.forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.dash-section-item.highlighted').forEach(function(el) { el.classList.remove('highlighted'); });
            var badge = document.getElementById('previewEditingBadge');
            if (!isActive) {
                btn.classList.add('active');
                btn.closest('.dash-section-item').classList.add('highlighted');
                if (badge) { badge.textContent = section.charAt(0).toUpperCase() + section.slice(1); badge.classList.add('active'); }
                scrollPreviewToSection(section);
                if (!layout.classList.contains('preview-active')) togglePreview(true);
            } else {
                if (badge) badge.classList.remove('active');
            }
        });
    });

    var toggleSectionBtns = document.querySelectorAll('.btn-toggle-section');
    toggleSectionBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            btn.classList.toggle('hidden-section');
            var section = btn.getAttribute('data-section');
            var hidden = btn.classList.contains('hidden-section');
            showDashToast(section + ' section ' + (hidden ? 'hidden' : 'visible'));
        });
    });

    function scrollPreviewToSection(section) {
        if (!iframe.contentWindow) return;
        try {
            var sectionMap = {
                'hero': '#hero',
                'features': '#features',
                'all-features': '#all-features',
                'demo1': '#see-it-in-action',
                'demo2': '#product-demo',
                'pricing': '#pricing-section',
                'footer': '#footer'
            };
            var selector = sectionMap[section];
            if (selector) {
                var el = iframe.contentDocument.querySelector(selector);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch(e) {}
    }

    var colorInputs = document.querySelectorAll('.dash-color-picker input[type="color"]');
    colorInputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var span = input.parentElement.querySelector('span');
            if (span) span.textContent = input.value;
        });
    });

    var saveBtn = document.querySelector('[data-testid="btn-site-save"]');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            showDashToast('Changes saved successfully!');
        });
    }

    var applyThemeBtn = document.querySelector('[data-testid="btn-apply-theme"]');
    if (applyThemeBtn) {
        applyThemeBtn.addEventListener('click', function() {
            showDashToast('Theme applied! Preview updated.');
            if (iframe.contentWindow) iframe.contentWindow.location.reload();
        });
    }

    var saveSeoBtn = document.querySelector('[data-testid="btn-save-seo"]');
    if (saveSeoBtn) {
        saveSeoBtn.addEventListener('click', function() {
            showDashToast('SEO settings saved!');
        });
    }
}

/* ───────────────────────── ADMIN SECURITY DASHBOARD CONTROLLERS ───────────────────────── */
(function(){
    'use strict';

    function fmtTs(s) {
        if (!s) return '—';
        try { var d = new Date(s); return d.toLocaleString(); } catch(e) { return s; }
    }
    function fmtRel(s) {
        if (!s) return '—';
        var diff = (Date.now() - new Date(s).getTime()) / 1000;
        if (diff < 60) return Math.floor(diff) + 's ago';
        if (diff < 3600) return Math.floor(diff/60) + 'm ago';
        if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
        return Math.floor(diff/86400) + 'd ago';
    }
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
    function toast(msg, isErr){
        var t = document.createElement('div');
        t.className = 'dash-toast' + (isErr ? ' dash-toast-error' : '');
        t.innerHTML = '<i class="fas fa-' + (isErr ? 'exclamation-circle' : 'check-circle') + '"></i> ' + esc(msg);
        document.body.appendChild(t);
        setTimeout(function(){ t.classList.add('active'); }, 10);
        setTimeout(function(){ t.classList.remove('active'); setTimeout(function(){ t.remove(); }, 400); }, 3000);
    }
    function getCsrf(){
        var meta = document.querySelector('meta[name="csrf-token"]');
        if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
        if (window.ccData && window.ccData.csrf) return window.ccData.csrf;
        return '';
    }
    async function api(method, url, body){
        var opts = { method: method, headers: { 'Accept':'application/json' }, credentials: 'same-origin' };
        if (method !== 'GET' && method !== 'HEAD') {
            opts.headers['X-CSRF-Token'] = getCsrf();
        }
        if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
        try {
            var r = await fetch(url, opts);
            var j = await r.json().catch(function(){ return null; });
            return { ok: r.ok, status: r.status, body: j };
        } catch (e) { return { ok: false, status: 0, body: null }; }
    }

    /* AUDIT LOG */
    async function loadAuditLog(){
        var event = (document.getElementById('audit-filter-event') || {}).value || '';
        var url   = '/api/admin/audit' + (event ? '?event=' + encodeURIComponent(event) : '');
        var tbody = document.getElementById('audit-log-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';
        var r = await api('GET', url);
        if (!r.ok || !r.body || !r.body.success) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ff5050">Failed to load.</td></tr>'; return; }
        var d = r.body.data;
        var s = d.summary || {};
        var setStat = function(id, v){ var el = document.getElementById(id); if (el) el.textContent = (v == null ? '—' : v); };
        setStat('stat-events-24h',   s.events_24h);
        setStat('stat-failures-24h', s.failures_24h);
        setStat('stat-unique-users', s.unique_users);
        setStat('stat-unique-ips',   s.unique_ips);
        if (!d.rows.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:2rem">No events found.</td></tr>'; return; }
        tbody.innerHTML = d.rows.map(function(row){
            var meta = row.meta ? JSON.stringify(row.meta) : '';
            return '<tr>'
                + '<td>' + esc(fmtTs(row.ts)) + '</td>'
                + '<td><span class="dash-badge">' + esc(row.event) + '</span></td>'
                + '<td>' + esc(row.user_email || (row.user_id ? '#' + row.user_id : '—')) + '</td>'
                + '<td><code>' + esc(row.ip || '—') + '</code></td>'
                + '<td><code style="font-size:.75rem">' + esc(row.request_id || '—') + '</code></td>'
                + '<td><code style="font-size:.7rem;max-width:300px;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:middle">' + esc(meta.slice(0, 200)) + '</code></td>'
                + '</tr>';
        }).join('');
    }

    /* ACTIVE SESSIONS */
    async function loadSessions(){
        var tbody = document.getElementById('sessions-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';
        var r = await api('GET', '/api/admin/sessions');
        if (!r.ok || !r.body || !r.body.success) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ff5050">Failed to load.</td></tr>'; return; }
        var d = r.body.data, s = d.stats || {};
        var setStat = function(id, v){ var el = document.getElementById(id); if (el) el.textContent = (v == null ? '—' : v); };
        setStat('stat-sessions-active',   s.active);
        setStat('stat-sessions-users',    s.unique_users);
        setStat('stat-sessions-expiring', s.expiring_soon);
        setStat('stat-sessions-stale',    s.stale);
        if (!d.rows.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:2rem">No active sessions.</td></tr>'; return; }
        tbody.innerHTML = d.rows.map(function(row){
            return '<tr>'
                + '<td>' + esc(row.user_email || '#' + row.user_id) + (row.user_role === 'admin' ? ' <span class="dash-badge dash-badge-admin">ADMIN</span>' : '') + '</td>'
                + '<td><code>' + esc(row.ip || '—') + '</code></td>'
                + '<td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(row.user_agent || '') + '">' + esc((row.user_agent || '—').slice(0, 60)) + '</td>'
                + '<td>' + esc(fmtRel(row.last_activity)) + '</td>'
                + '<td>' + esc(fmtRel(row.expires_at)) + '</td>'
                + '<td><button class="dash-btn-danger dash-btn-sm" data-revoke="' + esc(row.id) + '"><i class="fas fa-times"></i> Revoke</button></td>'
                + '</tr>';
        }).join('');
    }

    /* IP BANS */
    async function loadBans(){
        var tbody = document.getElementById('bans-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';
        var r = await api('GET', '/api/admin/bans');
        if (!r.ok || !r.body || !r.body.success) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ff5050">Failed to load.</td></tr>'; return; }
        var d = r.body.data, s = d.stats || {};
        var setStat = function(id, v){ var el = document.getElementById(id); if (el) el.textContent = (v == null ? '—' : v); };
        setStat('stat-bans-active',   s.active);
        setStat('stat-bans-24h',      s.new_24h);
        setStat('stat-ids-flagged',   s.ids_flagged_1h);
        setStat('stat-ratelim-hits',  s.ratelim_hits_1h);
        if (!d.rows.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:2rem">No active bans.</td></tr>'; return; }
        tbody.innerHTML = d.rows.map(function(row){
            return '<tr>'
                + '<td><code>' + esc(row.ip) + '</code></td>'
                + '<td>' + esc(row.reason || '—') + '</td>'
                + '<td>' + esc(fmtRel(row.banned_at)) + '</td>'
                + '<td>' + esc(fmtRel(row.banned_until)) + '</td>'
                + '<td><button class="dash-btn-secondary dash-btn-sm" data-unban="' + esc(row.ip) + '"><i class="fas fa-unlock"></i> Lift</button></td>'
                + '</tr>';
        }).join('');
    }

    /* SYSTEM MONITOR */
    var sysmonInterval = null;
    function fmtUptime(s){
        s = parseInt(s, 10) || 0;
        var d = Math.floor(s / 86400); s %= 86400;
        var h = Math.floor(s / 3600);  s %= 3600;
        var m = Math.floor(s / 60);
        return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm';
    }
    async function loadSysmon(){
        var r = await api('GET', '/api/admin/system');
        if (!r.ok || !r.body || !r.body.success) return;
        var d = r.body.data;
        var setText = function(id, v){ var el = document.getElementById(id); if (el) el.textContent = v; };
        setText('sys-uptime',     fmtUptime(d.uptime_s));
        setText('sys-db-latency', d.db_latency_ms + ' ms');
        setText('sys-mem',        d.mem_rss_mb + ' MB');
        setText('sys-pool',       (d.pg_pool.total || 0) + '/' + 20 + ' (' + (d.pg_pool.waiting || 0) + ' wait)');
        var eob = d.email_outbox || {}, evob = d.event_outbox || {}, sec = d.security_1h || {};
        setText('eob-pending', eob.pending || 0);
        setText('eob-sent',    eob.sent_24h || 0);
        setText('eob-failed',  eob.failed_24h || 0);
        setText('evob-pending',    evob.pending || 0);
        setText('evob-processing', evob.processing || 0);
        setText('evob-done',       evob.done_24h || 0);
        setText('evob-dlq',        evob.dlq || 0);
        setText('cnt-login-fail',    sec.login_fail || 0);
        setText('cnt-rate-limited',  sec.rate_limited || 0);
        setText('cnt-ids-flagged',   sec.ids_flagged || 0);
        setText('cnt-csrf-rejected', sec.csrf_rejected || 0);
        var tbody = document.getElementById('db-sizes-tbody');
        if (tbody && d.table_sizes) {
            tbody.innerHTML = d.table_sizes.length ? d.table_sizes.map(function(t){
                return '<tr><td><code>' + esc(t.table_name) + '</code></td><td>' + esc(t.rows) + '</td><td>' + esc(t.size) + '</td><td>' + esc(t.last_autovacuum ? fmtRel(t.last_autovacuum) : '—') + '</td></tr>';
            }).join('') : '<tr><td colspan="4" style="text-align:center;color:#888">No table stats.</td></tr>';
        }
    }
    function startSysmonAutoRefresh(){ if (sysmonInterval) return; sysmonInterval = setInterval(loadSysmon, 10000); }
    function stopSysmonAutoRefresh(){ if (sysmonInterval) { clearInterval(sysmonInterval); sysmonInterval = null; } }

    /* Wire up nav clicks → load data on page show */
    document.addEventListener('click', function(e){
        var link = e.target.closest('.dash-nav-link[data-page]');
        if (link) {
            var page = link.getAttribute('data-page');
            stopSysmonAutoRefresh();
            if (page === 'audit-log')        setTimeout(loadAuditLog, 50);
            else if (page === 'active-sessions') setTimeout(loadSessions, 50);
            else if (page === 'ip-bans')         setTimeout(loadBans, 50);
            else if (page === 'system-monitor')  { setTimeout(loadSysmon, 50); startSysmonAutoRefresh(); }
            return;
        }

        var revoke = e.target.closest('[data-revoke]');
        if (revoke) {
            if (!confirm('Revoke this session?')) return;
            api('POST', '/api/admin/sessions/revoke', { session_id: revoke.getAttribute('data-revoke') })
                .then(function(r){ toast(r.ok ? 'Session revoked.' : 'Revoke failed.', !r.ok); loadSessions(); });
            return;
        }
        var unban = e.target.closest('[data-unban]');
        if (unban) {
            if (!confirm('Lift ban for ' + unban.getAttribute('data-unban') + '?')) return;
            api('POST', '/api/admin/bans/remove', { ip: unban.getAttribute('data-unban') })
                .then(function(r){ toast(r.ok ? 'Ban lifted.' : 'Failed.', !r.ok); loadBans(); });
            return;
        }
        if (e.target.closest('#audit-refresh'))     loadAuditLog();
        if (e.target.closest('#sessions-refresh'))  loadSessions();
        if (e.target.closest('#bans-refresh'))      loadBans();
        if (e.target.closest('#sysmon-refresh'))    loadSysmon();
        if (e.target.closest('#sessions-revoke-all')) {
            if (confirm('Revoke ALL sessions except yours? Users will need to sign in again.'))
                api('POST', '/api/admin/sessions/revoke-all').then(function(r){ toast(r.ok ? ('Revoked ' + (r.body.data.revoked) + ' sessions.') : 'Failed.', !r.ok); loadSessions(); });
        }
        if (e.target.closest('#dlq-replay')) {
            if (confirm('Replay all dead-letter events?'))
                api('POST', '/api/admin/dlq/replay').then(function(r){ toast(r.ok ? ('Replayed ' + (r.body.data.replayed) + ' events.') : 'Failed.', !r.ok); loadSysmon(); });
        }
        if (e.target.closest('#audit-export')) {
            window.location.href = '/api/admin/audit/export';
        }
        if (e.target.closest('#ban-add')) {
            var ip = (document.getElementById('ban-ip-input') || {}).value || '';
            var dur = parseInt((document.getElementById('ban-duration') || {}).value || '86400', 10);
            var reason = (document.getElementById('ban-reason') || {}).value || 'manual';
            if (!ip) { toast('Enter an IP.', true); return; }
            api('POST', '/api/admin/bans/add', { ip: ip, duration_s: dur, reason: reason })
                .then(function(r){
                    if (r.ok) { toast('IP banned.'); document.getElementById('ban-ip-input').value=''; document.getElementById('ban-reason').value=''; loadBans(); }
                    else toast((r.body && r.body.data && r.body.data.message) || 'Ban failed.', true);
                });
        }
    });

    document.addEventListener('change', function(e){
        if (e.target && e.target.id === 'audit-filter-event') loadAuditLog();
    });
})();
