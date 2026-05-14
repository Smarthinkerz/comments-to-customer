<div class="dash-content">
    <div class="dash-card">
        <div class="dash-card-header"><h3>Security Settings</h3></div>
        <div class="dash-form-section">
            <div class="settings-group">
                <h4><i class="fas fa-lock"></i> Change Password</h4>
                <div class="dash-form-grid">
                    <div class="dash-form-group">
                        <label>Current Password</label>
                        <input type="password" class="dash-input" placeholder="Enter current password">
                    </div>
                    <div class="dash-form-group">
                        <label>New Password</label>
                        <input type="password" class="dash-input" placeholder="Enter new password">
                    </div>
                    <div class="dash-form-group">
                        <label>Confirm Password</label>
                        <input type="password" class="dash-input" placeholder="Confirm new password">
                    </div>
                </div>
                <button class="dash-btn-primary"><i class="fas fa-key"></i> Update Password</button>
            </div>

            <div class="settings-group">
                <h4><i class="fas fa-shield-alt"></i> Two-Factor Authentication</h4>
                <div class="settings-toggle-list">
                    <div class="settings-toggle-item">
                        <div><strong>Enable 2FA</strong><p>Add an extra layer of security to your account</p></div>
                        <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <h4><i class="fas fa-history"></i> Login History</h4>
                <div class="dash-table-wrapper">
                    <table class="dash-table">
                        <thead>
                            <tr><th>Date</th><th>IP Address</th><th>Device</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Today, 10:23 AM</td><td>192.168.1.***</td><td>Chrome / Windows</td><td><span class="status-badge replied">Success</span></td></tr>
                            <tr><td>Yesterday, 3:45 PM</td><td>192.168.1.***</td><td>Safari / macOS</td><td><span class="status-badge replied">Success</span></td></tr>
                            <tr><td>Mar 8, 9:12 AM</td><td>10.0.0.***</td><td>Chrome / Android</td><td><span class="status-badge replied">Success</span></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
