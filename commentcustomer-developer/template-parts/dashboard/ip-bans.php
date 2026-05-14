<div class="dash-content">
    <div class="dash-card">
        <div class="dash-card-header">
            <h3><i class="fas fa-ban"></i> IP Bans &amp; Intrusion Detection</h3>
            <div class="dash-card-actions">
                <button class="dash-btn-secondary" id="bans-refresh" data-testid="button-bans-refresh"><i class="fas fa-sync"></i> Refresh</button>
            </div>
        </div>

        <div class="dash-stats-row">
            <div class="dash-stat-card"><div class="stat-value" id="stat-bans-active">—</div><div class="stat-label">Active Bans</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-bans-24h">—</div><div class="stat-label">New (24h)</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-ids-flagged">—</div><div class="stat-label">IDS Flagged (1h)</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="stat-ratelim-hits">—</div><div class="stat-label">Rate-Limit Hits (1h)</div></div>
        </div>

        <div class="dash-form-section" style="margin-bottom:1.5rem">
            <h4><i class="fas fa-plus-circle"></i> Manually Ban IP</h4>
            <div class="dash-form-grid" style="grid-template-columns:2fr 1fr 2fr auto">
                <div class="dash-form-group">
                    <label>IP Address</label>
                    <input type="text" id="ban-ip-input" class="dash-input" placeholder="e.g. 192.0.2.1" data-testid="input-ban-ip">
                </div>
                <div class="dash-form-group">
                    <label>Duration</label>
                    <select id="ban-duration" class="dash-input" data-testid="select-ban-duration">
                        <option value="900">15 minutes</option>
                        <option value="3600">1 hour</option>
                        <option value="86400" selected>24 hours</option>
                        <option value="604800">7 days</option>
                        <option value="2592000">30 days</option>
                    </select>
                </div>
                <div class="dash-form-group">
                    <label>Reason</label>
                    <input type="text" id="ban-reason" class="dash-input" placeholder="e.g. brute-force, scraping" data-testid="input-ban-reason">
                </div>
                <div class="dash-form-group" style="display:flex;align-items:flex-end">
                    <button class="dash-btn-primary" id="ban-add" data-testid="button-ban-add"><i class="fas fa-shield-alt"></i> Ban</button>
                </div>
            </div>
        </div>

        <div class="dash-table-wrapper">
            <table class="dash-table" data-testid="table-ip-bans">
                <thead>
                    <tr>
                        <th>IP Address</th>
                        <th>Reason</th>
                        <th>Banned At</th>
                        <th>Expires</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="bans-tbody">
                    <tr><td colspan="5" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading bans…</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
