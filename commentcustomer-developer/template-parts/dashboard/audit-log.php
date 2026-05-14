<div class="dash-content">
    <div class="dash-card">
        <div class="dash-card-header">
            <h3><i class="fas fa-clipboard-list"></i> Security Audit Log</h3>
            <div class="dash-card-actions">
                <select id="audit-filter-event" class="dash-input" style="width:auto" data-testid="select-audit-event">
                    <option value="">All Events</option>
                    <option value="login_success">Login Success</option>
                    <option value="login_failure">Login Failure</option>
                    <option value="account_locked">Account Locked</option>
                    <option value="password_reset_requested">Password Reset Requested</option>
                    <option value="password_changed">Password Changed</option>
                    <option value="2fa_enabled">2FA Enabled</option>
                    <option value="2fa_disabled">2FA Disabled</option>
                    <option value="admin_action">Admin Action</option>
                    <option value="webhook_received">Webhook Received</option>
                </select>
                <button class="dash-btn-secondary" id="audit-refresh" data-testid="button-audit-refresh"><i class="fas fa-sync"></i> Refresh</button>
                <button class="dash-btn-secondary" id="audit-export" data-testid="button-audit-export"><i class="fas fa-download"></i> Export CSV</button>
            </div>
        </div>
        <div class="dash-stats-row" id="audit-summary">
            <div class="dash-stat-card"><div class="stat-value" id="stat-events-24h">—</div><div class="stat-label">Events (24h)</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-failures-24h">—</div><div class="stat-label">Failures (24h)</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-unique-users">—</div><div class="stat-label">Unique Users (24h)</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-unique-ips">—</div><div class="stat-label">Unique IPs (24h)</div></div>
        </div>
        <div class="dash-table-wrapper">
            <table class="dash-table" data-testid="table-audit-log">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Event</th>
                        <th>User</th>
                        <th>IP</th>
                        <th>Request ID</th>
                        <th>Metadata</th>
                    </tr>
                </thead>
                <tbody id="audit-log-tbody">
                    <tr><td colspan="6" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading audit log…</td></tr>
                </tbody>
            </table>
        </div>
        <div class="dash-pagination" id="audit-pagination" style="margin-top:1rem;text-align:center"></div>
    </div>
</div>
