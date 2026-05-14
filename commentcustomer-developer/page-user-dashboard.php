<?php
/**
 * Template Name: User Dashboard
 */
if (!defined('ABSPATH')) exit;
get_header();
?>

<div class="ud-layout">
    <aside class="ud-sidebar" id="userDashSidebar">
        <div class="ud-sidebar-header">
            <div class="cc-logo">
                <div class="logo-icon"><i class="fas fa-robot"></i></div>
                <span class="logo-text">Comment<span class="logo-highlight">Customer</span></span>
            </div>
            <button class="ud-sidebar-toggle" id="udSidebarToggle"><i class="fas fa-bars"></i></button>
        </div>

        <div class="ud-user-info">
            <div class="ud-avatar"><i class="fas fa-user"></i></div>
            <div class="ud-user-details">
                <span class="ud-username" id="udUsername">User Name</span>
                <span class="ud-tier" id="udTierLabel"><i class="fas fa-bolt"></i> Free Plan</span>
            </div>
        </div>

        <nav class="ud-nav">
            <a href="#" class="ud-nav-link active" data-page="home"><i class="fas fa-home"></i><span>Dashboard</span></a>
            <a href="#" class="ud-nav-link" data-page="accounts"><i class="fab fa-instagram"></i><span>Connected Pages</span></a>
            <a href="#" class="ud-nav-link" data-page="replies"><i class="fas fa-robot"></i><span>AI Replies</span></a>
            <a href="#" class="ud-nav-link" data-page="leadcapture"><i class="fas fa-magnet"></i><span>Lead Capture</span></a>
            <a href="#" class="ud-nav-link" data-page="analytics"><i class="fas fa-chart-bar"></i><span>Analytics</span></a>
            <a href="#" class="ud-nav-link" data-page="dm" data-tier-min="growth"><i class="fas fa-paper-plane"></i><span>Auto-DM</span></a>
            <a href="#" class="ud-nav-link" data-page="leads" data-tier-min="pro"><i class="fas fa-star"></i><span>Lead Scoring</span></a>
            <a href="#" class="ud-nav-link" data-page="multiteam" data-tier-min="pro"><i class="fas fa-users"></i><span>Multi-Team</span></a>
            <a href="#" class="ud-nav-link" data-page="usage"><i class="fas fa-tachometer-alt"></i><span>Usage</span></a>

            <div class="ud-nav-divider"></div>
            <span class="ud-nav-label">Settings</span>
            <a href="#" class="ud-nav-link" data-page="profile"><i class="fas fa-user-cog"></i><span>Profile</span></a>
            <a href="#" class="ud-nav-link" data-page="billing"><i class="fas fa-credit-card"></i><span>Billing</span></a>
        </nav>

        <div class="ud-sidebar-footer">
            <a href="/" class="ud-nav-link"><i class="fas fa-arrow-left"></i><span>Back to Site</span></a>
        </div>
    </aside>

    <main class="ud-main">
        <div class="ud-topbar">
            <button class="ud-mobile-menu" id="udMobileToggle"><i class="fas fa-bars"></i></button>
            <h2 class="ud-page-title" id="udPageTitle">Dashboard</h2>
            <div class="ud-topbar-actions">
                <button class="ud-icon-btn" data-testid="btn-ud-notifications"><i class="fas fa-bell"></i></button>
                <div class="ud-user-badge">
                    <span class="ud-tier-badge" id="udTierBadge">TRIAL</span>
                </div>
            </div>
        </div>

        <!-- ══════ HOME ══════ -->
        <div class="ud-page active" id="ud-page-home">
            <div class="ud-two-col">
                <div class="ud-col-left">
                    <h3 class="ud-section-title"><i class="fas fa-bolt"></i> <span id="udDashTitle">Dashboard</span></h3>

                    <div class="ud-card ud-card-instagram">
                        <h4 class="ud-card-title">Connected Pages</h4>
                        <div class="ud-instagram-row">
                            <div class="ud-ig-icon"><i class="fab fa-instagram"></i></div>
                            <div class="ud-ig-info">
                                <p class="ud-ig-status"><span id="udPagesConnected">1</span> connected <span class="ud-limit-tag" id="udPagesLimitTag">of 1</span></p>
                                <div class="ud-ig-active"><span class="ud-dot-green"></span> <span id="udPagesActiveLabel">Active</span></div>
                            </div>
                        </div>
                        <button class="ud-btn ud-btn-cyan" data-testid="btn-ud-manage-ig">Manage</button>
                    </div>

                    <div class="ud-card ud-card-usage">
                        <h4 class="ud-card-title">Daily Usage</h4>
                        <div class="ud-usage-display">
                            <span class="ud-usage-count" id="udHomeUsageCount">20/30</span>
                            <span class="ud-usage-pct" id="udHomeUsagePct">67% used</span>
                        </div>
                        <div class="ud-progress-bar">
                            <div class="ud-progress-fill" id="udHomeProgressFill" style="width:67%"></div>
                        </div>
                        <div class="ud-usage-note">
                            <i class="fas fa-bolt"></i>
                            <span id="udHomeUsageNote">30/day limit — Upgrade for more</span>
                        </div>
                    </div>

                    <div class="ud-card ud-card-ai" id="udHomeAiCard">
                        <span class="ud-badge-viewonly" id="udAiBadge">VIEW-ONLY</span>
                        <h4 class="ud-card-title" id="udAiTitle">AI Suggested Replies</h4>
                        <div class="ud-ai-previews" id="udAiPreviews">
                            <div class="ud-ai-bubble">Great photo!</div>
                            <div class="ud-ai-bubble">Thanks for sharing!</div>
                            <div class="ud-ai-bubble">Love this!</div>
                        </div>
                        <button class="ud-btn ud-btn-gradient" id="udAiBtn" data-testid="btn-ud-upgrade-ai"><i class="fas fa-lock"></i> Upgrade to use</button>
                    </div>

                    <div class="ud-card ud-card-analytics">
                        <div class="ud-card-header-row">
                            <h4 class="ud-card-title">Analytics</h4>
                            <span class="ud-badge-purple" id="udAnalyticsRangeBadge">Last 7 days</span>
                        </div>
                        <div class="ud-bar-chart">
                            <div class="ud-bar" style="height:40%"></div>
                            <div class="ud-bar" style="height:65%"></div>
                            <div class="ud-bar" style="height:45%"></div>
                            <div class="ud-bar" style="height:80%"></div>
                            <div class="ud-bar" style="height:55%"></div>
                            <div class="ud-bar" style="height:70%"></div>
                            <div class="ud-bar" style="height:50%"></div>
                        </div>
                        <button class="ud-btn ud-btn-purple" id="udAnalyticsBtn" data-testid="btn-ud-unlock-analytics">Unlock Full Analytics →</button>
                    </div>
                </div>

                <div class="ud-col-right">
                    <h3 class="ud-section-title-center" id="udFeaturesHeading">Premium Features</h3>
                    <div class="ud-features-grid">
                        <!-- ── Starter features ── -->
                        <div class="ud-feature-card" data-feature="aimodel" data-tier-min="starter" data-testid="card-feature-aimodel">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-robot"></i></div>
                            <h4>Basic AI Model</h4>
                            <p>1,000 automated replies per month</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-aimodel">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <div class="ud-feature-card" data-feature="leadcapture" data-tier-min="starter" data-testid="card-feature-leadcapture">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-magnet"></i></div>
                            <h4>Lead Capture</h4>
                            <p>Capture leads from comment interactions</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-leadcapture">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <div class="ud-feature-card" data-feature="dashanalytics" data-tier-min="starter" data-testid="card-feature-dashanalytics">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-chart-bar"></i></div>
                            <h4>Dashboard Analytics</h4>
                            <p>Track performance &amp; engagement metrics</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-dashanalytics">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <!-- ── Growth features ── -->
                        <div class="ud-feature-card" data-feature="autodm" data-tier-min="growth" data-testid="card-feature-autodm">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-paper-plane"></i></div>
                            <h4>Auto-DM Sequences</h4>
                            <p>Start conversations with high-value leads</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-autodm">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <div class="ud-feature-card" data-feature="priority" data-tier-min="growth" data-testid="card-feature-priority">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-headset"></i></div>
                            <h4>Priority Support</h4>
                            <p>Dedicated support with faster response times</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-priority">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <!-- ── Pro features ── -->
                        <div class="ud-feature-card" data-feature="leadscore" data-tier-min="pro" data-testid="card-feature-leadscore">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-star"></i></div>
                            <h4>Lead Scoring AI</h4>
                            <p>AI ranks leads by purchase intent</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-leadscore">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <div class="ud-feature-card" data-feature="multiteam" data-tier-min="pro" data-testid="card-feature-multiteam">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-users"></i></div>
                            <h4>Multi-Team Access</h4>
                            <p>Collaborate across teams seamlessly</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-multiteam">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                        <div class="ud-feature-card" data-feature="fullanalytics" data-tier-min="pro" data-testid="card-feature-fullanalytics">
                            <div class="ud-lock-badge"><i class="fas fa-lock"></i></div>
                            <div class="ud-feature-icon"><i class="fas fa-chart-line"></i></div>
                            <h4>Full Analytics Suite</h4>
                            <p>Complete insights, reports &amp; exports</p>
                            <button class="ud-btn ud-btn-upgrade" data-testid="btn-upgrade-fullanalytics">Upgrade <i class="fas fa-crown"></i></button>
                            <div class="ud-tech-line"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════ ACCOUNTS ══════ -->
        <div class="ud-page" id="ud-page-accounts">
            <div class="ud-card ud-card-instagram" style="max-width:600px;">
                <h4 class="ud-card-title"><i class="fab fa-instagram"></i> Connected Accounts</h4>
                <div class="ud-instagram-row" style="margin-bottom:16px;">
                    <div class="ud-ig-icon"><i class="fab fa-instagram"></i></div>
                    <div class="ud-ig-info">
                        <p class="ud-ig-status">@brand_handle</p>
                        <div class="ud-ig-active"><span class="ud-dot-green"></span> Connected &amp; Active</div>
                    </div>
                </div>
                <div class="ud-locked-section" id="udAccountsLocked">
                    <p id="udAccountsLockText"><i class="fas fa-lock"></i> Your plan: <span id="udAccountsLimit">1</span> account limit</p>
                    <div class="ud-locked-platforms" id="udLockedPlatforms">
                        <span class="ud-platform-locked"><i class="fab fa-tiktok"></i> TikTok</span>
                        <span class="ud-platform-locked"><i class="fab fa-facebook"></i> Facebook</span>
                    </div>
                    <button class="ud-btn ud-btn-gradient" data-testid="btn-ud-upgrade-accounts"><i class="fas fa-lock"></i> Upgrade to connect more</button>
                </div>
            </div>
        </div>

        <!-- ══════ AI REPLIES ══════ -->
        <div class="ud-page" id="ud-page-replies">
            <div class="ud-card ud-card-ai" style="max-width:600px;">
                <span class="ud-badge-viewonly" id="udRepliesBadge">VIEW-ONLY</span>
                <h4 class="ud-card-title"><i class="fas fa-robot"></i> <span id="udRepliesTitle">AI Suggested Replies</span></h4>
                <p class="ud-desc" id="udRepliesDesc">Preview how AI generates context-aware replies to your comments.</p>
                <div class="ud-ai-previews" id="udRepliesPreviews">
                    <div class="ud-ai-bubble">"Great photo! Love your content"</div>
                    <div class="ud-ai-bubble">"Thanks for sharing! Check out our latest collection"</div>
                    <div class="ud-ai-bubble">"Love this! Would you like a special discount? DM us!"</div>
                    <div class="ud-ai-bubble">"Amazing work! We'd love to collaborate"</div>
                </div>
                <button class="ud-btn ud-btn-gradient" id="udRepliesBtn" data-testid="btn-ud-upgrade-replies"><i class="fas fa-lock"></i> Upgrade to Enable AI Replies</button>
            </div>
        </div>

        <!-- ══════ LEAD CAPTURE (Starter+) ══════ -->
        <div class="ud-page" id="ud-page-leadcapture">
            <div class="ud-card" style="max-width:650px;">
                <h4 class="ud-card-title"><i class="fas fa-magnet"></i> Lead Capture</h4>
                <p class="ud-desc">Automatically capture leads from comment interactions and track their journey.</p>
                <div class="ud-leads-list">
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">@fashion_lover_92</span>
                            <span class="ud-lead-comment">"How much is this? Can I order?"</span>
                        </div>
                        <div class="ud-lead-score ud-score-warm">Captured</div>
                    </div>
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">@shopper_jane</span>
                            <span class="ud-lead-comment">"Do you ship internationally?"</span>
                        </div>
                        <div class="ud-lead-score ud-score-warm">Captured</div>
                    </div>
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">@curious_carl</span>
                            <span class="ud-lead-comment">"Where can I buy this?"</span>
                        </div>
                        <div class="ud-lead-score ud-score-warm">Captured</div>
                    </div>
                </div>
                <div class="ud-stats-row" style="margin-top:20px;">
                    <div class="ud-stat-box">
                        <span class="ud-stat-val">47</span>
                        <span class="ud-stat-label">Total Leads</span>
                    </div>
                    <div class="ud-stat-box">
                        <span class="ud-stat-val">12</span>
                        <span class="ud-stat-label">This Week</span>
                    </div>
                    <div class="ud-stat-box">
                        <span class="ud-stat-val">34%</span>
                        <span class="ud-stat-label">Conversion</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════ AUTO-DM (Growth+) ══════ -->
        <div class="ud-page" id="ud-page-dm">
            <div class="ud-card" style="max-width:650px;">
                <h4 class="ud-card-title"><i class="fas fa-paper-plane"></i> Auto-DM Sequences</h4>
                <p class="ud-desc">Automatically send DM sequences to commenters who show purchase intent.</p>
                <div class="ud-dm-sequences">
                    <div class="ud-dm-item">
                        <div class="ud-dm-header">
                            <span class="ud-dm-name">Welcome Sequence</span>
                            <span class="ud-dot-green" style="width:8px;height:8px;display:inline-block;border-radius:50;margin-left:8px;"></span>
                        </div>
                        <p class="ud-dm-desc">Sent to new commenters showing interest</p>
                        <div class="ud-dm-stats">
                            <span><i class="fas fa-paper-plane"></i> 124 sent</span>
                            <span><i class="fas fa-envelope-open"></i> 67% opened</span>
                            <span><i class="fas fa-mouse-pointer"></i> 23% clicked</span>
                        </div>
                    </div>
                    <div class="ud-dm-item">
                        <div class="ud-dm-header">
                            <span class="ud-dm-name">Price Inquiry Follow-up</span>
                            <span class="ud-dot-green" style="width:8px;height:8px;display:inline-block;border-radius:50;margin-left:8px;"></span>
                        </div>
                        <p class="ud-dm-desc">Sent when a comment mentions pricing</p>
                        <div class="ud-dm-stats">
                            <span><i class="fas fa-paper-plane"></i> 56 sent</span>
                            <span><i class="fas fa-envelope-open"></i> 72% opened</span>
                            <span><i class="fas fa-mouse-pointer"></i> 31% clicked</span>
                        </div>
                    </div>
                </div>
                <button class="ud-btn ud-btn-cyan" style="margin-top:16px;" data-testid="btn-ud-create-dm"><i class="fas fa-plus"></i> Create New Sequence</button>
            </div>
        </div>

        <!-- ══════ ANALYTICS ══════ -->
        <div class="ud-page" id="ud-page-analytics">
            <div class="ud-card ud-card-analytics" style="max-width:700px;">
                <div class="ud-card-header-row">
                    <h4 class="ud-card-title"><i class="fas fa-chart-bar"></i> Analytics</h4>
                    <span class="ud-badge-purple" id="udAnalyticsPageRange">Last 7 days</span>
                </div>
                <div class="ud-stats-row">
                    <div class="ud-stat-box">
                        <span class="ud-stat-val" id="udStatComments">142</span>
                        <span class="ud-stat-label">Comments</span>
                    </div>
                    <div class="ud-stat-box">
                        <span class="ud-stat-val" id="udStatReplies">20</span>
                        <span class="ud-stat-label">Replies Sent</span>
                    </div>
                    <div class="ud-stat-box">
                        <span class="ud-stat-val" id="udStatRate">14%</span>
                        <span class="ud-stat-label">Reply Rate</span>
                    </div>
                    <div class="ud-stat-box" id="udStatLeads" style="display:none;">
                        <span class="ud-stat-val">38</span>
                        <span class="ud-stat-label">Leads Scored</span>
                    </div>
                </div>
                <div class="ud-bar-chart ud-bar-chart-lg">
                    <div class="ud-bar" style="height:40%"><span>Mon</span></div>
                    <div class="ud-bar" style="height:65%"><span>Tue</span></div>
                    <div class="ud-bar" style="height:45%"><span>Wed</span></div>
                    <div class="ud-bar" style="height:80%"><span>Thu</span></div>
                    <div class="ud-bar" style="height:55%"><span>Fri</span></div>
                    <div class="ud-bar" style="height:70%"><span>Sat</span></div>
                    <div class="ud-bar" style="height:50%"><span>Sun</span></div>
                </div>
                <button class="ud-btn ud-btn-purple" id="udAnalyticsPageBtn" data-testid="btn-ud-full-analytics">Unlock Full Analytics →</button>
            </div>
        </div>

        <!-- ══════ LEAD SCORING (Pro) ══════ -->
        <div class="ud-page" id="ud-page-leads">
            <div class="ud-card" style="max-width:700px;">
                <h4 class="ud-card-title"><i class="fas fa-star"></i> Lead Scoring AI</h4>
                <p class="ud-desc">AI automatically scores commenters based on purchase intent, engagement history and profile data.</p>
                <div class="ud-leads-list">
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">@fashion_lover_92</span>
                            <span class="ud-lead-comment">"How much is this? Can I order 3?"</span>
                        </div>
                        <div class="ud-lead-score ud-score-hot">95 <small>HOT</small></div>
                    </div>
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">@shopper_jane</span>
                            <span class="ud-lead-comment">"Love this! Do you ship internationally?"</span>
                        </div>
                        <div class="ud-lead-score ud-score-warm">72 <small>WARM</small></div>
                    </div>
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">@curious_carl</span>
                            <span class="ud-lead-comment">"Nice colors"</span>
                        </div>
                        <div class="ud-lead-score ud-score-cold">28 <small>COOL</small></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════ MULTI-TEAM (Pro) ══════ -->
        <div class="ud-page" id="ud-page-multiteam">
            <div class="ud-card" style="max-width:650px;">
                <h4 class="ud-card-title"><i class="fas fa-users"></i> Multi-Team Access</h4>
                <p class="ud-desc">Manage multiple team members with role-based permissions across your connected pages.</p>
                <div class="ud-leads-list">
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar" style="background:linear-gradient(135deg,rgba(0,240,255,0.3),rgba(0,255,136,0.3));"><i class="fas fa-user-shield"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">You (Owner)</span>
                            <span class="ud-lead-comment">Full access to all pages and settings</span>
                        </div>
                        <div class="ud-lead-score" style="color:#00FF88;font-size:12px;">OWNER</div>
                    </div>
                    <div class="ud-lead-item">
                        <div class="ud-lead-avatar"><i class="fas fa-user"></i></div>
                        <div class="ud-lead-info">
                            <span class="ud-lead-name">team@example.com</span>
                            <span class="ud-lead-comment">Can manage replies and view analytics</span>
                        </div>
                        <div class="ud-lead-score" style="color:#00F0FF;font-size:12px;">EDITOR</div>
                    </div>
                </div>
                <button class="ud-btn ud-btn-cyan" style="margin-top:16px;" data-testid="btn-ud-invite-team"><i class="fas fa-plus"></i> Invite Team Member</button>
            </div>
        </div>

        <!-- ══════ USAGE ══════ -->
        <div class="ud-page" id="ud-page-usage">
            <div class="ud-card ud-card-usage" style="max-width:600px;">
                <h4 class="ud-card-title"><i class="fas fa-tachometer-alt"></i> Usage Overview</h4>
                <div class="ud-usage-display">
                    <span class="ud-usage-count" id="udUsageCount">20/30</span>
                    <span class="ud-usage-pct" id="udUsagePct">67% used</span>
                </div>
                <div class="ud-progress-bar ud-progress-lg">
                    <div class="ud-progress-fill" id="udUsageProgressFill" style="width:67%"></div>
                </div>
                <div class="ud-usage-breakdown">
                    <div class="ud-usage-item"><span>Comments today</span><span id="udUsageToday">20</span></div>
                    <div class="ud-usage-item"><span>Daily limit</span><span id="udUsageDailyLimit">30</span></div>
                    <div class="ud-usage-item"><span>Monthly total</span><span id="udUsageMonthly">500</span></div>
                    <div class="ud-usage-item"><span>Monthly limit</span><span id="udUsageMonthlyLimit">500</span></div>
                    <div class="ud-usage-item"><span>Resets in</span><span>4h 23m</span></div>
                </div>
                <div class="ud-usage-note" style="margin-top:16px;">
                    <i class="fas fa-bolt"></i>
                    <span id="udUsageUpgradeNote">Upgrade for more replies</span>
                </div>
                <button class="ud-btn ud-btn-gradient" style="margin-top:12px;" id="udUsageUpgradeBtn" data-testid="btn-ud-upgrade-usage"><i class="fas fa-crown"></i> Upgrade Plan</button>
            </div>
        </div>

        <!-- ══════ PROFILE ══════ -->
        <div class="ud-page" id="ud-page-profile">
            <div class="ud-card" style="max-width:600px;">
                <h4 class="ud-card-title"><i class="fas fa-user-cog"></i> Profile Settings</h4>
                <div class="ud-form-group">
                    <label>Display Name</label>
                    <input type="text" class="ud-input" value="User Name" data-testid="input-ud-name">
                </div>
                <div class="ud-form-group">
                    <label>Email</label>
                    <input type="email" class="ud-input" value="user@commentcustomer.ai" data-testid="input-ud-email" readonly>
                </div>
                <div class="ud-form-group">
                    <label>Business Name</label>
                    <input type="text" class="ud-input" value="brand_handle" data-testid="input-ud-business">
                </div>
                <button class="ud-btn ud-btn-cyan" data-testid="btn-ud-save-profile">Save Changes</button>
            </div>
        </div>

        <!-- ══════ BILLING ══════ -->
        <div class="ud-page" id="ud-page-billing">
            <div class="ud-card" style="max-width:700px;">
                <h4 class="ud-card-title"><i class="fas fa-credit-card"></i> Billing &amp; Plan</h4>
                <div class="ud-current-plan" id="udCurrentPlanBox">
                    <div class="ud-plan-badge" id="udBillingBadge">TRIAL</div>
                    <div class="ud-plan-details">
                        <h5 id="udBillingPlanName">Free Trial</h5>
                        <p id="udBillingPlanDesc">30 comments/day &bull; 1 page &bull; 7-day analytics</p>
                    </div>
                </div>

                <h5 class="ud-card-title" style="margin-top:24px;">Available Plans</h5>
                <div class="ud-pricing-grid">
                    <div class="ud-pricing-card" id="udBillingStarter" data-billing-plan="starter">
                        <h5 class="ud-pricing-name ud-teal">Starter</h5>
                        <div class="ud-pricing-price">$29<span>/month</span></div>
                        <ul class="ud-pricing-features">
                            <li><i class="fas fa-check"></i> 1 connected page</li>
                            <li><i class="fas fa-check"></i> 1,000 automated replies</li>
                            <li><i class="fas fa-check"></i> Basic AI model</li>
                            <li><i class="fas fa-check"></i> Lead capture</li>
                            <li><i class="fas fa-check"></i> Dashboard analytics</li>
                        </ul>
                        <button class="ud-btn ud-btn-teal" data-testid="btn-ud-select-starter">Select Plan</button>
                    </div>
                    <div class="ud-pricing-card ud-pricing-popular" id="udBillingGrowth" data-billing-plan="growth">
                        <span class="ud-popular-tag">MOST POPULAR</span>
                        <h5 class="ud-pricing-name ud-cyan">Growth</h5>
                        <div class="ud-pricing-price">$79<span>/month</span></div>
                        <ul class="ud-pricing-features">
                            <li><i class="fas fa-check"></i> 3 connected pages</li>
                            <li><i class="fas fa-check"></i> 5,000 automated replies</li>
                            <li><i class="fas fa-check"></i> Advanced AI replies</li>
                            <li><i class="fas fa-check"></i> Auto-DM sequences</li>
                            <li><i class="fas fa-check"></i> Priority support</li>
                        </ul>
                        <button class="ud-btn ud-btn-gradient" data-testid="btn-ud-select-growth">Select Plan</button>
                    </div>
                    <div class="ud-pricing-card" id="udBillingPro" data-billing-plan="pro">
                        <h5 class="ud-pricing-name ud-gold">Pro</h5>
                        <div class="ud-pricing-price">$149<span>/month</span></div>
                        <ul class="ud-pricing-features">
                            <li><i class="fas fa-check"></i> 7 connected pages</li>
                            <li><i class="fas fa-check"></i> 15,000 automated replies</li>
                            <li><i class="fas fa-check"></i> Lead scoring AI</li>
                            <li><i class="fas fa-check"></i> Multi-team access</li>
                            <li><i class="fas fa-check"></i> Full analytics suite</li>
                        </ul>
                        <button class="ud-btn ud-btn-gold" data-testid="btn-ud-select-pro">Select Plan</button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>

<!-- Upgrade Modal -->
<div class="ud-upgrade-modal" id="udUpgradeModal">
    <div class="ud-modal-overlay"></div>
    <div class="ud-modal-content">
        <button class="ud-modal-close" data-testid="btn-ud-close-upgrade"><i class="fas fa-times"></i></button>
        <div class="ud-modal-header">
            <i class="fas fa-crown ud-crown-icon"></i>
            <h3>Upgrade Your Plan</h3>
            <p id="udModalUpgradeMsg">Unlock this feature by upgrading your plan</p>
        </div>
        <div class="ud-pricing-grid">
            <div class="ud-pricing-card" data-billing-plan="starter">
                <h5 class="ud-pricing-name ud-teal">Starter</h5>
                <div class="ud-pricing-price">$29<span>/month</span></div>
                <ul class="ud-pricing-features">
                    <li><i class="fas fa-check"></i> 1 connected page</li>
                    <li><i class="fas fa-check"></i> 1,000 automated replies</li>
                    <li><i class="fas fa-check"></i> Basic AI model</li>
                    <li><i class="fas fa-check"></i> Lead capture</li>
                    <li><i class="fas fa-check"></i> Dashboard analytics</li>
                </ul>
                <button class="ud-btn ud-btn-teal" data-testid="btn-modal-starter">Select Plan</button>
            </div>
            <div class="ud-pricing-card ud-pricing-popular" data-billing-plan="growth">
                <span class="ud-popular-tag">MOST POPULAR</span>
                <h5 class="ud-pricing-name ud-cyan">Growth</h5>
                <div class="ud-pricing-price">$79<span>/month</span></div>
                <ul class="ud-pricing-features">
                    <li><i class="fas fa-check"></i> 3 connected pages</li>
                    <li><i class="fas fa-check"></i> 5,000 automated replies</li>
                    <li><i class="fas fa-check"></i> Advanced AI replies</li>
                    <li><i class="fas fa-check"></i> Auto-DM sequences</li>
                    <li><i class="fas fa-check"></i> Priority support</li>
                </ul>
                <button class="ud-btn ud-btn-gradient" data-testid="btn-modal-growth">Select Plan</button>
            </div>
            <div class="ud-pricing-card" data-billing-plan="pro">
                <h5 class="ud-pricing-name ud-gold">Pro</h5>
                <div class="ud-pricing-price">$149<span>/month</span></div>
                <ul class="ud-pricing-features">
                    <li><i class="fas fa-check"></i> 7 connected pages</li>
                    <li><i class="fas fa-check"></i> 15,000 automated replies</li>
                    <li><i class="fas fa-check"></i> Lead scoring AI</li>
                    <li><i class="fas fa-check"></i> Multi-team access</li>
                    <li><i class="fas fa-check"></i> Full analytics suite</li>
                </ul>
                <button class="ud-btn ud-btn-gold" data-testid="btn-modal-pro">Select Plan</button>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>
