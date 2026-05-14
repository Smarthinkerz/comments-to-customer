document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        var trigger = e.target.closest('[data-modal]');
        if (trigger) {
            if (trigger.closest('.cc-dropdown-item')) return;
            e.preventDefault();
            var modalId = 'modal-' + trigger.getAttribute('data-modal');
            var modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    function closeAllModals() {
        document.querySelectorAll('.cc-modal.active').forEach(function(m) {
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    document.addEventListener('click', function(e) {
        if (e.target.closest('.cc-modal-close')) {
            var modal = e.target.closest('.cc-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
        if (e.target.classList && e.target.classList.contains('cc-modal-overlay')) {
            var modal = e.target.closest('.cc-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    var sectionMap = {
        '#features': '#features',
        '#all-features': '#all-features',
        '#pricing-section': '#pricing-section',
        '#product-demo': '#product-demo',
        '#see-it-in-action': '#see-it-in-action',
        '#footer': '#footer',
        '#hero': '#hero',
        '#solutions': '#all-features',
        '#integrations': '#all-features',
        '#smart-reply': '#all-features',
        '#intent-detection': '#all-features',
        '#auto-dm': '#all-features',
        '#multi-channel': '#all-features',
        '#lead-scoring': '#all-features',
        '#crm': '#all-features',
        '#crm-sync': '#all-features',
        '#team': '#all-features',
        '#team-collab': '#all-features',
        '#human-fallback': '#all-features',
        '#analytics': '#all-features',
        '#ecommerce': '#all-features',
        '#agencies': '#all-features',
        '#small-business': '#all-features',
        '#influencers': '#all-features',
        '#enterprise': '#all-features',
        '#unified-inbox': '#all-features',
        '#blog': '#footer',
        '#case-studies': '#footer',
        '#templates': '#all-features',
        '#insights': '#footer',
        '#documentation': '#footer',
        '#video-tutorials': '#see-it-in-action',
        '#glossary': '#footer',
        '#contact': '#footer',
        '#community': '#footer',
        '#success-stories': '#footer',
        '#api-docs': '#footer'
    };

    document.addEventListener('click', function(e) {
        var expandBtn = e.target.closest('.btn-expand-more');
        if (expandBtn) {
            e.preventDefault();
            e.stopPropagation();
            var cta = expandBtn.closest('.cc-modal-cta');
            if (cta) {
                var expanded = cta.nextElementSibling;
                if (expanded && expanded.classList.contains('modal-expanded-content')) {
                    var isAR = window.CC_I18N && window.CC_I18N.current && window.CC_I18N.current() === 'ar';
                    if (expanded.style.display === 'none' || !expanded.style.display) {
                        expanded.style.display = 'block';
                        expandBtn.textContent = isAR ? 'عرض أقل' : 'Show Less';
                    } else {
                        expanded.style.display = 'none';
                        var origText = expandBtn.getAttribute('data-original-text') || (isAR ? 'عرض المزيد' : 'Show More');
                        expandBtn.textContent = isAR ? (expandBtn.getAttribute('data-ar-text') || 'عرض المزيد') : origText;
                    }
                }
            }
            return;
        }

        var actionBtn = e.target.closest('.btn-action-confirm');
        if (actionBtn) {
            e.preventDefault();
            e.stopPropagation();
            var confirmMsg = actionBtn.getAttribute('data-confirm');
            if (confirmMsg) {
                var toast = document.createElement('div');
                toast.className = 'cc-toast';
                toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + confirmMsg;
                document.body.appendChild(toast);
                setTimeout(function() { toast.classList.add('active'); }, 10);
                setTimeout(function() {
                    toast.classList.remove('active');
                    setTimeout(function() { toast.remove(); }, 400);
                }, 3500);
            }
            return;
        }

        var btn = e.target.closest('.btn-modal');
        if (!btn) return;

        var href = btn.getAttribute('href');
        if (!href) return;

        if (href.indexOf('mailto:') === 0) return;

        e.preventDefault();
        closeAllModals();

        var targetId = sectionMap[href] || href;
        if (targetId && targetId.charAt(0) === '#') {
            var target = null;
            try { target = document.querySelector(targetId); } catch(err) {}
            if (target) {
                setTimeout(function() {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
        }
    });

    document.querySelectorAll('.btn-expand-more').forEach(function(btn) {
        btn.setAttribute('data-original-text', btn.textContent);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            var adminPopup = document.getElementById('adminPopup');
            if (adminPopup) adminPopup.classList.remove('active');
            var userPopup = document.getElementById('userLoginPopup');
            if (userPopup) userPopup.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
