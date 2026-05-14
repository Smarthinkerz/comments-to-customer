<?php
/**
 * CommentCustomer Developer Theme Functions
 */

if (!defined('ABSPATH')) exit;

define('CC_THEME_VERSION', '1.0.0');
define('CC_THEME_DIR', get_template_directory());
define('CC_THEME_URI', get_template_directory_uri());

/* CDN-aware media URL helpers (cc_media_url, cc_picture). When CC_MEDIA_BASE_URL
   env var is set, video/image assets resolve to the CDN; otherwise they fall
   back to the local theme directory — no template changes required. */
require_once CC_THEME_DIR . '/inc/cdn.php';

function cc_theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
    add_theme_support('custom-logo', array(
        'height' => 60,
        'width' => 200,
        'flex-height' => true,
        'flex-width' => true,
    ));
    add_theme_support('responsive-embeds');
    add_theme_support('wp-block-styles');
    add_theme_support('editor-styles');
    add_theme_support('automatic-feed-links');

    register_nav_menus(array(
        'primary' => __('Primary Navigation', 'commentcustomer'),
        'footer' => __('Footer Navigation', 'commentcustomer'),
    ));
}
add_action('after_setup_theme', 'cc_theme_setup');

function cc_register_sidebars() {
    register_sidebar(array(
        'name' => __('Primary Sidebar', 'commentcustomer'),
        'id' => 'primary-sidebar',
        'description' => __('Main sidebar widget area', 'commentcustomer'),
        'before_widget' => '<div class="cc-widget %2$s" id="%1$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="cc-widget-title">',
        'after_title' => '</h3>',
    ));
}
add_action('widgets_init', 'cc_register_sidebars');

function cc_enqueue_scripts() {
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', array(), null);
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css', array(), '6.5.0');
    wp_enqueue_style('cc-landing', CC_THEME_URI . '/assets/css/landing.css', array(), CC_THEME_VERSION);
    wp_enqueue_style('cc-responsive', CC_THEME_URI . '/assets/css/responsive.css', array('cc-landing'), CC_THEME_VERSION);

    if (is_page_template('page-dashboard.php') || is_page_template('page-login.php')) {
        wp_enqueue_style('cc-dashboard', CC_THEME_URI . '/assets/css/dashboard.css', array(), CC_THEME_VERSION);
    }

    if (is_page_template('page-user-dashboard.php')) {
        wp_enqueue_style('cc-user-dashboard', CC_THEME_URI . '/assets/css/user-dashboard.css', array(), CC_THEME_VERSION);
    }

    wp_enqueue_script('cc-i18n', CC_THEME_URI . '/assets/js/i18n.js', array(), CC_THEME_VERSION, false);
    wp_enqueue_script('cc-landing', CC_THEME_URI . '/assets/js/landing.js', array('cc-i18n'), CC_THEME_VERSION, true);
    wp_enqueue_script('cc-modals', CC_THEME_URI . '/assets/js/modals.js', array('cc-landing'), CC_THEME_VERSION, true);
    wp_enqueue_script('cc-modal-translations', CC_THEME_URI . '/assets/js/modal-translations.js', array('cc-modals'), CC_THEME_VERSION, true);
    wp_add_inline_script('cc-modal-translations', 'if(window.CC_I18N){var _sl=localStorage.getItem("cc-lang");if(_sl&&_sl!=="en"){CC_I18N.apply(_sl);}}', 'after');

    if (is_page_template('page-dashboard.php')) {
        wp_enqueue_script('cc-dashboard', CC_THEME_URI . '/assets/js/dashboard.js', array('cc-landing'), CC_THEME_VERSION, true);
    }

    if (is_page_template('page-user-dashboard.php')) {
        wp_enqueue_script('cc-user-dashboard', CC_THEME_URI . '/assets/js/user-dashboard.js', array('cc-landing'), CC_THEME_VERSION, true);
    }

    wp_localize_script('cc-landing', 'ccData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('cc_nonce'),
        'themeUrl' => CC_THEME_URI,
    ));
}
add_action('wp_enqueue_scripts', 'cc_enqueue_scripts');

function cc_user_login_handler() {
    check_ajax_referer('cc_nonce', 'nonce');

    $email    = sanitize_email($_POST['email']);
    $password = sanitize_text_field($_POST['password']);

    if (empty($email) || empty($password)) {
        wp_send_json_error(array('message' => __('Please enter your email and password.', 'commentcustomer')));
    }

    $user = get_user_by('email', $email);

    if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
        wp_send_json_error(array('message' => __('Invalid credentials. Please check your email and password.', 'commentcustomer')));
    }

    if (array_intersect(array('administrator', 'editor'), $user->roles)) {
        wp_send_json_error(array('message' => __('Please use the admin login for administrator accounts.', 'commentcustomer')));
    }

    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);
    do_action('wp_login', $user->user_login, $user);

    wp_send_json_success(array('redirect' => home_url('/user-dashboard/')));
}
add_action('wp_ajax_cc_user_login',        'cc_user_login_handler');
add_action('wp_ajax_nopriv_cc_user_login', 'cc_user_login_handler');

function cc_admin_login_handler() {
    check_ajax_referer('cc_nonce', 'nonce');

    $email    = sanitize_email($_POST['email']);
    $password = sanitize_text_field($_POST['password']);

    if (empty($email) || empty($password)) {
        wp_send_json_error(array('message' => __('Please enter your email and password.', 'commentcustomer')));
    }

    $user = get_user_by('email', $email);

    if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
        wp_send_json_error(array('message' => __('Invalid credentials. Please try again.', 'commentcustomer')));
    }

    if (!array_intersect(array('administrator', 'editor'), $user->roles)) {
        wp_send_json_error(array('message' => __('Access denied. Admin privileges required.', 'commentcustomer')));
    }

    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);
    do_action('wp_login', $user->user_login, $user);

    wp_send_json_success(array('redirect' => home_url('/dashboard/')));
}
add_action('wp_ajax_cc_admin_login',        'cc_admin_login_handler');
add_action('wp_ajax_nopriv_cc_admin_login', 'cc_admin_login_handler');

/* ── Registration handler ── */
function cc_register_user_handler() {
    check_ajax_referer('cc_nonce', 'nonce');

    $name     = sanitize_text_field($_POST['name']     ?? '');
    $email    = sanitize_email(     $_POST['email']    ?? '');
    $password =                     $_POST['password'] ?? '';
    $plan     = sanitize_text_field($_POST['plan']     ?? 'trial');

    if (!$name || !$email || !$password) {
        wp_send_json_error(['message' => 'All fields are required.']);
    }
    if (strlen($password) < 8) {
        wp_send_json_error(['message' => 'Password must be at least 8 characters.']);
    }
    if (!is_email($email)) {
        wp_send_json_error(['message' => 'Please enter a valid email address.']);
    }
    if (email_exists($email)) {
        wp_send_json_error(['message' => 'An account with this email already exists. Please login.']);
    }

    $user_id = wp_create_user($email, $password, $email);
    if (is_wp_error($user_id)) {
        wp_send_json_error(['message' => $user_id->get_error_message()]);
    }

    wp_update_user(['ID' => $user_id, 'display_name' => $name, 'first_name' => $name]);
    $user = new WP_User($user_id);
    $user->set_role('subscriber');

    if ($plan === 'trial') {
        $trial_ends = date('Y-m-d H:i:s', strtotime('+7 days'));
        update_user_meta($user_id, 'cc_plan',       'trial');
        update_user_meta($user_id, 'cc_trial_ends', $trial_ends);
        wp_set_auth_cookie($user_id, false);
        wp_send_json_success(['redirect' => home_url('/user-dashboard/')]);
    } else {
        update_user_meta($user_id, 'cc_plan',         'pending');
        update_user_meta($user_id, 'cc_pending_plan', $plan);
        wp_set_auth_cookie($user_id, false);
        wp_send_json_success(['redirect' => home_url('/checkout/?plan=' . urlencode($plan) . '&email=' . urlencode($email))]);
    }
}
add_action('wp_ajax_cc_register',        'cc_register_user_handler');
add_action('wp_ajax_nopriv_cc_register', 'cc_register_user_handler');

function cc_demo_ai_handler() {
    check_ajax_referer('cc_nonce', 'nonce');

    $message = sanitize_text_field($_POST['message']);
    $demo_type = sanitize_text_field($_POST['demo_type']);

    if ($demo_type === 'price') {
        $responses = array(
            "Great question! We'd love to help. Could you tell us which product or plan you're interested in? We have Starter ($29/mo), Growth ($79/mo), and Pro ($149/mo) tiers.",
            "Thanks for your interest! Our pricing starts at $29/month for the Starter plan. What specific features are you looking for?",
            "I'd be happy to help with pricing! For the best recommendation, could you share what size business you're running?",
        );
    } else {
        $responses = array(
            "We serve businesses globally with our cloud-based platform. No physical delivery needed - setup takes just 5 minutes! Where are you located?",
            "Great question! Our platform is available worldwide. Since it's cloud-based, you can start using it immediately from anywhere.",
            "We're available in your area! Our SaaS platform works from any location. Would you like to start a free trial?",
        );
    }

    $response = $responses[array_rand($responses)];
    $score = rand(75, 98);

    wp_send_json_success(array(
        'response' => $response,
        'score' => $score,
        'intent' => $score >= 80 ? 'high' : 'medium',
    ));
}
add_action('wp_ajax_cc_demo_ai', 'cc_demo_ai_handler');
add_action('wp_ajax_nopriv_cc_demo_ai', 'cc_demo_ai_handler');

function cc_create_pages() {
    $pages = array(
        'Dashboard' => 'page-dashboard.php',
        'User Dashboard' => 'page-user-dashboard.php',
        'Login' => 'page-login.php',
    );

    foreach ($pages as $title => $template) {
        $existing = get_posts(array(
            'post_type' => 'page',
            'title' => $title,
            'posts_per_page' => 1,
        ));
        if (empty($existing)) {
            wp_insert_post(array(
                'post_title' => $title,
                'post_status' => 'publish',
                'post_type' => 'page',
                'page_template' => $template,
            ));
        }
    }
}
add_action('after_switch_theme', 'cc_create_pages');

function cc_show_front_page() {
    update_option('show_on_front', 'page');
    $existing = get_posts(array(
        'post_type' => 'page',
        'title' => 'Home',
        'posts_per_page' => 1,
    ));
    if (empty($existing)) {
        $front_id = wp_insert_post(array(
            'post_title' => 'Home',
            'post_status' => 'publish',
            'post_type' => 'page',
        ));
        update_option('page_on_front', $front_id);
    } else {
        update_option('page_on_front', $existing[0]->ID);
    }
}
add_action('after_switch_theme', 'cc_show_front_page');

function cc_body_classes($classes) {
    if (is_front_page()) {
        $classes[] = 'cc-front-page';
    }
    if (is_page_template('page-dashboard.php')) {
        $classes[] = 'cc-dashboard-page';
    }
    return $classes;
}
add_filter('body_class', 'cc_body_classes');

function cc_theme_custom_mime_types($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    $mimes['mp4'] = 'video/mp4';
    $mimes['webp'] = 'image/webp';
    return $mimes;
}
add_filter('upload_mimes', 'cc_theme_custom_mime_types');
