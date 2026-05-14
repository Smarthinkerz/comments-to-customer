<div class="dash-content">
    <div class="dash-card">
        <div class="dash-card-header">
            <h3><i class="fas fa-desktop"></i> Active Sessions</h3>
            <div class="dash-card-actions">
                <button class="dash-btn-secondary" id="sessions-refresh" data-testid="button-sessions-refresh"><i class="fas fa-sync"></i> Refresh</button>
                <button class="dash-btn-danger" id="sessions-revoke-all" data-testid="button-sessions-revoke-all"><i class="fas fa-power-off"></i> Revoke All</button>
            </div>
        </div>
        <div class="dash-stats-row">
            <div class="dash-stat-card"><div class="stat-value" id="stat-sessions-active">—</div><div class="stat-label">Active Sessions</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-sessions-users">—</div><div class="stat-label">Unique Users</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-sessions-expiring">—</div><div class="stat-label">Expiring &lt; 1h</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-sessions-stale">—</div><div class="stat-label">Idle &gt; 12h</div></div>
        </div>
        <div class="dash-table-wrapper">
            <table class="dash-table" data-testid="table-active-sessions">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>IP</th>
                        <th>Device / Browser</th>
                        <th>Last Activity</th>
                        <th>Expires</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="sessions-tbody">
                    <tr><td colspan="6" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading sessions…</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
