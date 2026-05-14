<div class="dash-content">
    <div class="dash-card">
        <div class="dash-card-header">
            <h3><i class="fas fa-heartbeat"></i> System Monitor</h3>
            <div class="dash-card-actions">
                <button class="dash-btn-secondary" id="sysmon-refresh" data-testid="button-sysmon-refresh"><i class="fas fa-sync"></i> Refresh</button>
                <span id="sysmon-autorefresh" style="color:#888;font-size:.85rem">Auto-refresh: 10s</span>
            </div>
        </div>

        <div class="dash-stats-row">
            <div class="dash-stat-card"><div class="stat-value" id="sys-uptime">—</div><div class="stat-label">Uptime</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="sys-db-latency">—</div><div class="stat-label">DB Latency</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="sys-mem">—</div><div class="stat-label">Memory (RSS)</div></div>
            <div class="dash-stat-card"><div class="stat-value" id="sys-pool">—</div><div class="stat-label">PG Pool</div></div>
        </div>

        <div class="dash-grid-2col" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">
            <div class="dash-card-inner">
                <h4><i class="fas fa-envelope"></i> Email Outbox</h4>
                <div class="dash-table-wrapper">
                    <table class="dash-table">
                        <tbody id="email-outbox-tbody">
                            <tr><td>Pending</td><td id="eob-pending">—</td></tr>
                            <tr><td>Sent (24h)</td><td id="eob-sent">—</td></tr>
                            <tr><td>Failed (24h)</td><td id="eob-failed">—</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="dash-card-inner">
                <h4><i class="fas fa-bolt"></i> Event Outbox (Workers)</h4>
                <div class="dash-table-wrapper">
                    <table class="dash-table">
                        <tbody id="event-outbox-tbody">
                            <tr><td>Pending</td><td id="evob-pending">—</td></tr>
                            <tr><td>Processing</td><td id="evob-processing">—</td></tr>
                            <tr><td>Done (24h)</td><td id="evob-done">—</td></tr>
                            <tr><td>Dead Letter Queue</td><td id="evob-dlq" style="color:#ff5050">—</td></tr>
                        </tbody>
                    </table>
                </div>
                <button class="dash-btn-secondary" id="dlq-replay" style="margin-top:.75rem" data-testid="button-dlq-replay"><i class="fas fa-redo"></i> Replay DLQ</button>
            </div>
        </div>

        <div class="dash-card-inner" style="margin-top:1.5rem">
            <h4><i class="fas fa-shield-alt"></i> Security Counters (Last Hour)</h4>
            <div class="dash-stats-row">
                <div class="dash-stat-card"><div class="stat-value" id="cnt-login-fail">—</div><div class="stat-label">Login Failures</div></div>
                <div class="dash-stat-card"><div class="stat-value" id="cnt-rate-limited">—</div><div class="stat-label">Rate-Limited</div></div>
                <div class="dash-stat-card"><div class="stat-value" id="cnt-ids-flagged">—</div><div class="stat-label">IDS Flagged</div></div>
                <div class="dash-stat-card"><div class="stat-value" id="cnt-csrf-rejected">—</div><div class="stat-label">CSRF Rejected</div></div>
            </div>
        </div>

        <div class="dash-card-inner" style="margin-top:1.5rem">
            <h4><i class="fas fa-database"></i> Table Sizes</h4>
            <div class="dash-table-wrapper">
                <table class="dash-table" data-testid="table-db-sizes">
                    <thead><tr><th>Table</th><th>Rows</th><th>Size</th><th>Last Vacuum</th></tr></thead>
                    <tbody id="db-sizes-tbody">
                        <tr><td colspan="4" style="text-align:center;padding:2rem;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
