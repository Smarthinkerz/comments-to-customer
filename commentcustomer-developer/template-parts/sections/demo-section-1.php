<section class="cc-demo-section cc-glaze-overlay" id="see-it-in-action">
    <div class="cc-container">
        <div class="section-header-center">
            <h2 class="cc-section-title" data-i18n="demo1.title">See It In Action</h2>
            <p class="cc-section-subtitle" data-i18n="demo1.subtitle">Watch how our AI transforms comments into qualified leads.</p>
        </div>

        <div class="demo-split-layout">
            <div class="demo-media-column">
                <div class="demo-video-wrapper">
                    <video class="demo-video hover-play" muted preload="metadata" playsinline aria-label="Realtime lead capture demo">
                        <source src="<?php echo cc_media_url('videos/realtime-lead-demo.mp4'); ?>" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-hover-overlay">
                        <i class="fas fa-play-circle"></i>
                        <span data-i18n="demo1.hover">Hover to play</span>
                    </div>
                </div>
                <div class="demo-flow-steps">
                    <div class="flow-step">
                        <i class="fas fa-comment"></i>
                        <span data-i18n="demo1.step1">Comment Detected</span>
                    </div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-step">
                        <i class="fas fa-paper-plane"></i>
                        <span data-i18n="demo1.step2">Auto-DM Sent</span>
                    </div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-step">
                        <i class="fab fa-whatsapp"></i>
                        <span data-i18n="demo1.step3">WhatsApp Follow-up</span>
                    </div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-step">
                        <i class="fas fa-tag"></i>
                        <span data-i18n="demo1.step4">Buyer Tagged</span>
                    </div>
                </div>
            </div>

            <div class="demo-interactive-column">
                <div class="demo-box" id="demo-box-1">
                    <div class="demo-box-header">
                        <i class="fas fa-robot"></i>
                        <span data-i18n="demo1.box.header">Try It Yourself</span>
                        <div class="demo-counter">
                            <span class="counter-text"><span id="demo1-count">3</span> <span data-i18n="demo1.tries">free tries left</span></span>
                        </div>
                    </div>

                    <div class="demo-chat-area" id="demo-chat-1">
                        <div class="demo-placeholder-msg">
                            <i class="fas fa-comment-dots"></i>
                            <p data-i18n="demo1.box.placeholder">Type a comment below to see the AI respond in real-time</p>
                        </div>
                    </div>

                    <div class="demo-input-area">
                        <input type="text" class="demo-input" id="demo-input-1" data-i18n-placeholder="demo1.input.placeholder" placeholder='Type a comment... e.g. "What is the price?"' maxlength="100">
                        <button class="demo-submit-btn" id="demo-submit-1" data-demo="price">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>

                    <div class="demo-upgrade-overlay" id="demo-overlay-1" style="display: none;">
                        <div class="upgrade-content">
                            <i class="fas fa-lock"></i>
                            <h3 data-i18n="demo1.unlock.h">Unlock Full Demo</h3>
                            <p data-i18n="demo1.unlock.p">Sign up to try unlimited demos and see the full power of our AI</p>
                            <a href="#pricing-section" class="btn-upgrade" data-i18n="demo1.unlock.btn">Start Free Trial</a>
                        </div>
                    </div>
                </div>

                <div class="demo-animation-display" id="demo-animation-1" style="display: none;">
                    <div class="animation-step" data-step="1">
                        <i class="fas fa-paper-plane"></i>
                        <span data-i18n="demo1.anim1">Auto-DM Sent</span>
                    </div>
                    <div class="animation-step" data-step="2">
                        <i class="fab fa-whatsapp"></i>
                        <span data-i18n="demo1.anim2">WhatsApp Follow-up</span>
                    </div>
                    <div class="animation-step" data-step="3">
                        <i class="fas fa-tag"></i>
                        <span data-i18n="demo1.anim3">Buyer Tag Created</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
