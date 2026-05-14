<?php
/**
 * Template Name: Dashboard
 */
if (!defined('ABSPATH')) exit;
get_header();
?>

<div class="cc-dashboard-layout">
    <aside class="dash-sidebar" id="dashboardSidebar">
        <div class="dash-sidebar-header">
            <div class="cc-logo">
                <div class="logo-icon"><i class="fas fa-robot"></i></div>
                <span class="logo-text">Comment<span class="logo-highlight">Customer</span></span>
            </div>
            <button class="dash-sidebar-toggle" id="sidebarToggle"><i class="fas fa-bars"></i></button>
        </div>

        <nav class="dash-nav">
            <a href="#" class="dash-nav-link active" data-page="comments"><i class="fas fa-comments"></i><span>Comments</span></a>
            <a href="#" class="dash-nav-link" data-page="leads"><i class="fas fa-magnet"></i><span>Leads</span></a>
            <a href="#" class="dash-nav-link" data-page="analytics"><i class="fas fa-chart-line"></i><span>Analytics</span></a>
            <a href="#" class="dash-nav-link" data-page="inbox"><i class="fas fa-inbox"></i><span>Inbox</span></a>
            <a href="#" class="dash-nav-link" data-page="workflows"><i class="fas fa-project-diagram"></i><span>Workflows</span></a>
            <a href="#" class="dash-nav-link" data-page="templates"><i class="fas fa-copy"></i><span>Templates</span></a>

            <div class="dash-nav-divider"></div>
            <span class="dash-nav-label">CRM & Site</span>

            <a href="#" class="dash-nav-link" data-page="crm"><i class="fas fa-tachometer-alt"></i><span>CRM Overview</span></a>
            <a href="#" class="dash-nav-link" data-page="site-editor"><i class="fas fa-paint-brush"></i><span>Site Editor</span></a>
            <a href="#" class="dash-nav-link" data-page="media"><i class="fas fa-images"></i><span>Media Library</span></a>

            <div class="dash-nav-divider"></div>
            <span class="dash-nav-label">Account</span>

            <a href="#" class="dash-nav-link" data-page="profile"><i class="fas fa-user"></i><span>Profile</span></a>
            <a href="#" class="dash-nav-link" data-page="settings"><i class="fas fa-cog"></i><span>Account Settings</span></a>
            <a href="#" class="dash-nav-link" data-page="security"><i class="fas fa-shield-alt"></i><span>Security</span></a>
            <a href="#" class="dash-nav-link" data-page="connected"><i class="fas fa-plug"></i><span>Connected Accounts</span></a>
            <a href="#" class="dash-nav-link" data-page="billing"><i class="fas fa-credit-card"></i><span>Billing</span></a>
            <a href="#" class="dash-nav-link" data-page="team"><i class="fas fa-users"></i><span>Team</span></a>

            <div class="dash-nav-divider"></div>
            <span class="dash-nav-label">Security Center</span>

            <a href="#" class="dash-nav-link" data-page="system-monitor"><i class="fas fa-heartbeat"></i><span>System Monitor</span></a>
            <a href="#" class="dash-nav-link" data-page="audit-log"><i class="fas fa-clipboard-list"></i><span>Audit Log</span></a>
            <a href="#" class="dash-nav-link" data-page="active-sessions"><i class="fas fa-desktop"></i><span>Active Sessions</span></a>
            <a href="#" class="dash-nav-link" data-page="ip-bans"><i class="fas fa-ban"></i><span>IP Bans &amp; IDS</span></a>
        </nav>

        <div class="dash-sidebar-footer">
            <a href="<?php echo home_url(); ?>" class="dash-nav-link"><i class="fas fa-arrow-left"></i><span>Back to Site</span></a>
        </div>
    </aside>

    <main class="dash-main">
        <div class="dash-topbar">
            <button class="dash-mobile-menu" id="mobileSidebarToggle"><i class="fas fa-bars"></i></button>
            <h2 class="dash-page-title" id="dashPageTitle">Comments</h2>
            <div class="dash-topbar-actions">
                <button class="dash-icon-btn"><i class="fas fa-bell"></i></button>
                <div class="dash-user-avatar">
                    <i class="fas fa-user"></i>
                </div>
            </div>
        </div>

        <div class="dash-page" id="page-comments" style="display:block;">
            <?php get_template_part('template-parts/dashboard/comments'); ?>
        </div>
        <div class="dash-page" id="page-leads" style="display:none;">
            <?php get_template_part('template-parts/dashboard/leads'); ?>
        </div>
        <div class="dash-page" id="page-analytics" style="display:none;">
            <?php get_template_part('template-parts/dashboard/analytics'); ?>
        </div>
        <div class="dash-page" id="page-inbox" style="display:none;">
            <?php get_template_part('template-parts/dashboard/inbox'); ?>
        </div>
        <div class="dash-page" id="page-workflows" style="display:none;">
            <?php get_template_part('template-parts/dashboard/workflows'); ?>
        </div>
        <div class="dash-page" id="page-templates" style="display:none;">
            <?php get_template_part('template-parts/dashboard/templates'); ?>
        </div>
        <div class="dash-page" id="page-profile" style="display:none;">
            <?php get_template_part('template-parts/dashboard/profile'); ?>
        </div>
        <div class="dash-page" id="page-settings" style="display:none;">
            <?php get_template_part('template-parts/dashboard/settings'); ?>
        </div>
        <div class="dash-page" id="page-security" style="display:none;">
            <?php get_template_part('template-parts/dashboard/security'); ?>
        </div>
        <div class="dash-page" id="page-connected" style="display:none;">
            <?php get_template_part('template-parts/dashboard/connected'); ?>
        </div>
        <div class="dash-page" id="page-billing" style="display:none;">
            <?php get_template_part('template-parts/dashboard/billing'); ?>
        </div>
        <div class="dash-page" id="page-team" style="display:none;">
            <?php get_template_part('template-parts/dashboard/team'); ?>
        </div>
        <div class="dash-page" id="page-crm" style="display:none;">
            <?php get_template_part('template-parts/dashboard/crm'); ?>
        </div>
        <div class="dash-page" id="page-site-editor" style="display:none;">
            <?php get_template_part('template-parts/dashboard/site-editor'); ?>
        </div>
        <div class="dash-page" id="page-media" style="display:none;">
            <?php get_template_part('template-parts/dashboard/media'); ?>
        </div>
        <div class="dash-page" id="page-system-monitor" style="display:none;">
            <?php get_template_part('template-parts/dashboard/system-monitor'); ?>
        </div>
        <div class="dash-page" id="page-audit-log" style="display:none;">
            <?php get_template_part('template-parts/dashboard/audit-log'); ?>
        </div>
        <div class="dash-page" id="page-active-sessions" style="display:none;">
            <?php get_template_part('template-parts/dashboard/active-sessions'); ?>
        </div>
        <div class="dash-page" id="page-ip-bans" style="display:none;">
            <?php get_template_part('template-parts/dashboard/ip-bans'); ?>
        </div>
    </main>
</div>

<?php get_footer(); ?>
