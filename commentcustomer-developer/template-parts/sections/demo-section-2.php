<section class="cc-demo-section cc-product-demo-section cc-glaze-overlay" id="product-demo">
    <div class="cc-container">
        <div class="section-header-center">
            <h2 class="cc-section-title" data-i18n="demo2.title">Product Demo</h2>
            <p class="cc-section-subtitle" data-i18n="demo2.subtitle">See how AI analyzes and responds to comments in real time.</p>
        </div>

        <div class="demo-split-layout">
            <div class="demo-media-column">
                <div class="demo-video-wrapper">
                    <video class="demo-video hover-play" muted preload="metadata" playsinline aria-label="AI replies live demo">
                        <source src="<?php echo cc_media_url('videos/ai-replies-demo.mp4'); ?>" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-hover-overlay">
                        <i class="fas fa-play-circle"></i>
                        <span data-i18n="demo2.hover">Hover to play</span>
                    </div>
                </div>
                <div class="demo-flow-steps">
                    <div class="flow-step">
                        <i class="fas fa-eye"></i>
                        <span data-i18n="demo2.step1">AI Scans</span>
                    </div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-step">
                        <i class="fas fa-brain"></i>
                        <span data-i18n="demo2.step2">Intent Scored</span>
                    </div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-step">
                        <i class="fas fa-reply"></i>
                        <span data-i18n="demo2.step3">Smart Reply</span>
                    </div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-step">
                        <i class="fas fa-chart-line"></i>
                        <span data-i18n="demo2.step4">Lead Scored</span>
                    </div>
                </div>
            </div>

            <div class="demo-interactive-column">
                <div class="demo-box" id="demo-box-2">
                    <div class="demo-box-header">
                        <i class="fas fa-brain"></i>
                        <span data-i18n="demo2.box.header">AI Demo - Live Analysis</span>
                        <div class="demo-counter">
                            <span class="counter-text"><span id="demo2-count">3</span> <span data-i18n="demo2.tries">free tries left</span></span>
                        </div>
                    </div>

                    <div class="demo-chat-area" id="demo-chat-2">
                        <div class="demo-placeholder-msg">
                            <i class="fas fa-comment-dots"></i>
                            <p data-i18n="demo2.box.placeholder">Ask about delivery or availability to see lead scoring in action</p>
                        </div>
                    </div>

                    <div class="demo-input-area">
                        <input type="text" class="demo-input" id="demo-input-2" data-i18n-placeholder="demo2.input.placeholder" placeholder='Ask about delivery... e.g. "Do you deliver to Muscat?"' maxlength="100">
                        <button class="demo-submit-btn" id="demo-submit-2" data-demo="delivery">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>

                    <div class="demo-upgrade-overlay" id="demo-overlay-2" style="display: none;">
                        <div class="upgrade-content">
                            <i class="fas fa-lock"></i>
                            <h3 data-i18n="demo2.unlock.h">Unlock Full Demo</h3>
                            <p data-i18n="demo2.unlock.p">Sign up to try unlimited demos and see the full power of our AI</p>
                            <a href="#" class="btn-upgrade btn-open-register" data-plan="trial" data-i18n="demo2.unlock.btn">Start Free Trial</a>
                        </div>
                    </div>
                </div>

                <div class="demo-scoring-display" id="demo-scoring-2" style="display: none;">
                    <div class="scoring-header">
                        <i class="fas fa-chart-line"></i>
                        <span data-i18n="demo2.scoring.h">Lead Scoring Analysis</span>
                    </div>
                    <div class="scoring-bar-wrapper">
                        <div class="scoring-bar">
                            <div class="scoring-fill" id="scoring-fill-2" style="width: 0%"></div>
                        </div>
                        <div class="scoring-label">
                            <span class="score-value" id="score-value-2">0</span><span class="score-max">/100</span>
                        </div>
                    </div>
                    <div class="scoring-result" id="scoring-result-2">
                        <i class="fas fa-fire"></i>
                        <span data-i18n="demo2.scoring.result">High Intent Lead</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="cc-pricing-section cc-glaze-overlay" id="pricing-section">
    <div class="cc-container">
        <div class="section-header-center">
            <h2 class="cc-section-title" data-i18n="price.title">Simple, Transparent Pricing</h2>
            <p class="cc-section-subtitle" data-i18n="price.subtitle">Start free, upgrade when you're ready. No hidden fees.</p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card">
                <div class="pricing-header">
                    <h4 data-i18n="price.starter.name">Starter</h4>
                    <div class="pricing-price"><span data-i18n="price.starter.price">$29</span><span data-i18n="price.starter.period">/month</span></div>
                    <p class="pricing-desc" data-i18n="price.starter.desc">Perfect for small businesses</p>
                </div>
                <ul class="pricing-features-list">
                    <li><i class="fas fa-check"></i> <span data-i18n="price.starter.f1">1 connected page</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.starter.f2">1,000 automated replies</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.starter.f3">Basic AI model</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.starter.f4">Lead capture</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.starter.f5">Dashboard analytics</span></li>
                </ul>
                <a href="#" class="btn-pricing btn-open-register" data-plan="starter" data-i18n="price.starter.btn">Get Started</a>
            </div>

            <div class="pricing-card pricing-featured">
                <div class="pricing-badge" data-i18n="price.popular">Most Popular</div>
                <div class="pricing-header">
                    <h4 data-i18n="price.growth.name">Growth</h4>
                    <div class="pricing-price"><span data-i18n="price.growth.price">$79</span><span data-i18n="price.growth.period">/month</span></div>
                    <p class="pricing-desc" data-i18n="price.growth.desc">For growing businesses</p>
                </div>
                <ul class="pricing-features-list">
                    <li><i class="fas fa-check"></i> <span data-i18n="price.growth.f1">3 connected pages</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.growth.f2">5,000 automated replies</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.growth.f3">Advanced AI replies</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.growth.f4">Auto-DM sequences</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.growth.f5">Priority support</span></li>
                </ul>
                <a href="#" class="btn-pricing btn-pricing-featured btn-open-register" data-plan="growth" data-i18n="price.growth.btn">Get Started</a>
            </div>

            <div class="pricing-card">
                <div class="pricing-header">
                    <h4 data-i18n="price.pro.name">Pro</h4>
                    <div class="pricing-price"><span data-i18n="price.pro.price">$149</span><span data-i18n="price.pro.period">/month</span></div>
                    <p class="pricing-desc" data-i18n="price.pro.desc">For high-volume brands</p>
                </div>
                <ul class="pricing-features-list">
                    <li><i class="fas fa-check"></i> <span data-i18n="price.pro.f1">7 connected pages</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.pro.f2">15,000 automated replies</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.pro.f3">Lead scoring AI</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.pro.f4">Multi-team access</span></li>
                    <li><i class="fas fa-check"></i> <span data-i18n="price.pro.f5">Full analytics suite</span></li>
                </ul>
                <a href="#" class="btn-pricing btn-open-register" data-plan="pro" data-i18n="price.pro.btn">Get Started</a>
            </div>
        </div>
    </div>
</section>
