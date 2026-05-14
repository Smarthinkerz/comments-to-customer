<?php
/**
 * Template Name: Login
 */
if (!defined('ABSPATH')) exit;
get_header();
?>

<div class="cc-login-page">
    <div class="cc-login-container">
        <div class="cc-login-card">
            <div class="cc-login-header">
                <div class="cc-logo">
                    <div class="logo-icon"><i class="fas fa-robot"></i></div>
                    <span class="logo-text">Comment<span class="logo-highlight">Customer</span>.ai</span>
                </div>
                <h1>Welcome Back</h1>
                <p>Sign in to your dashboard</p>
            </div>

            <form class="cc-admin-form" id="loginPageForm">
                <div class="cc-form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" placeholder="admin@commentcustomer.ai" required autocomplete="email" autocapitalize="off" spellcheck="false">
                </div>
                <div class="cc-form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" placeholder="Enter your password" required autocomplete="current-password">
                </div>
                <div class="cc-form-error" id="loginPageError" style="display:none;"></div>
                <button type="submit" class="btn-admin-login">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            </form>

            <div class="cc-login-footer">
                <a href="<?php echo home_url(); ?>">Back to Home</a>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('loginPageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    var btn = this.querySelector('.btn-admin-login');
    var errorEl = document.getElementById('loginPageError');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;
    errorEl.style.display = 'none';

    var ajaxUrl = (window.ccData && window.ccData.ajaxUrl) || '/api/ajax';
    var nonce   = (window.ccData && window.ccData.nonce)   || 'preview';

    fetch(ajaxUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'cc_admin_login', nonce: nonce, email: email, password: password }).toString()
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            btn.innerHTML = '<i class="fas fa-check"></i> Success!';
            btn.style.background = 'linear-gradient(135deg, #00FF88, #00CC6A)';
            setTimeout(function(){ window.location.href = (data.data && data.data.redirect) || '/dashboard/'; }, 800);
        } else {
            errorEl.textContent = (data.data && data.data.message) || 'Invalid credentials. Please try again.';
            errorEl.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            btn.disabled = false;
        }
    })
    .catch(function() {
        errorEl.textContent = 'Connection error. Please try again.';
        errorEl.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        btn.disabled = false;
    });
});
</script>

<?php get_footer(); ?>
