<div class="dash-content">
    <div class="dash-card">
        <div class="dash-card-header">
            <h3><i class="fas fa-paint-brush"></i> Site Editor</h3>
            <div class="dash-card-actions">
                <button class="dash-btn-sm" id="btnTogglePreview" data-testid="btn-toggle-preview"><i class="fas fa-eye"></i> <span>Show Preview</span></button>
                <button class="dash-btn-primary" data-testid="btn-site-save"><i class="fas fa-save"></i> Save Changes</button>
            </div>
        </div>
    </div>

    <div class="site-editor-layout" id="siteEditorLayout">
        <div class="site-editor-panels">
            <div class="dash-card">
                <div class="dash-card-header">
                    <h3><i class="fas fa-heading"></i> Header Editor</h3>
                </div>
                <div class="dash-editor-section">
                    <div class="dash-form-group">
                        <label>Site Title</label>
                        <input type="text" class="dash-input live-edit" data-target="site-title" value="CommentCustomer.ai" data-testid="input-site-title">
                    </div>
                    <div class="dash-form-group">
                        <label>Tagline</label>
                        <input type="text" class="dash-input live-edit" data-target="site-tagline" value="Comment-to-Customer AI Engine" data-testid="input-site-tagline">
                    </div>
                    <div class="dash-form-group">
                        <label>Navigation Links</label>
                        <div class="dash-nav-editor">
                            <div class="dash-nav-edit-item">
                                <input type="text" class="dash-input live-edit" data-target="nav-1" value="Features">
                                <button class="dash-btn-icon" data-testid="btn-edit-nav-1"><i class="fas fa-edit"></i></button>
                            </div>
                            <div class="dash-nav-edit-item">
                                <input type="text" class="dash-input live-edit" data-target="nav-2" value="Pricing">
                                <button class="dash-btn-icon" data-testid="btn-edit-nav-2"><i class="fas fa-edit"></i></button>
                            </div>
                            <div class="dash-nav-edit-item">
                                <input type="text" class="dash-input live-edit" data-target="nav-3" value="Resources">
                                <button class="dash-btn-icon" data-testid="btn-edit-nav-3"><i class="fas fa-edit"></i></button>
                            </div>
                        </div>
                        <button class="dash-btn-sm" data-testid="btn-add-nav-link"><i class="fas fa-plus"></i> Add Link</button>
                    </div>
                </div>
            </div>

            <div class="dash-card">
                <div class="dash-card-header">
                    <h3><i class="fas fa-file-alt"></i> Content Sections</h3>
                </div>
                <div class="dash-editor-section">
                    <div class="dash-section-list">
                        <div class="dash-section-item" data-section="hero">
                            <i class="fas fa-grip-vertical"></i>
                            <span>Hero Section</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="hero" data-testid="btn-edit-hero"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="hero" data-testid="btn-toggle-hero"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="dash-section-item" data-section="features">
                            <i class="fas fa-grip-vertical"></i>
                            <span>Features Overview</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="features" data-testid="btn-edit-features"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="features" data-testid="btn-toggle-features"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="dash-section-item" data-section="all-features">
                            <i class="fas fa-grip-vertical"></i>
                            <span>All Features (Tabs)</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="all-features" data-testid="btn-edit-allfeatures"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="all-features" data-testid="btn-toggle-allfeatures"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="dash-section-item" data-section="demo1">
                            <i class="fas fa-grip-vertical"></i>
                            <span>Demo Section 1</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="demo1" data-testid="btn-edit-demo1"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="demo1" data-testid="btn-toggle-demo1"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="dash-section-item" data-section="demo2">
                            <i class="fas fa-grip-vertical"></i>
                            <span>Demo Section 2</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="demo2" data-testid="btn-edit-demo2"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="demo2" data-testid="btn-toggle-demo2"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="dash-section-item" data-section="pricing">
                            <i class="fas fa-grip-vertical"></i>
                            <span>Pricing</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="pricing" data-testid="btn-edit-pricing"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="pricing" data-testid="btn-toggle-pricing"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="dash-section-item" data-section="footer">
                            <i class="fas fa-grip-vertical"></i>
                            <span>Footer</span>
                            <div class="dash-section-actions">
                                <button class="dash-btn-icon btn-highlight-section" data-section="footer" data-testid="btn-edit-footer"><i class="fas fa-crosshairs"></i></button>
                                <button class="dash-btn-icon btn-toggle-section" data-section="footer" data-testid="btn-toggle-footer"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dash-card">
                <div class="dash-card-header">
                    <h3><i class="fas fa-palette"></i> Theme & Design</h3>
                    <button class="dash-btn-primary" data-testid="btn-apply-theme"><i class="fas fa-check"></i> Apply Theme</button>
                </div>
                <div class="dash-theme-grid">
                    <div class="dash-theme-option">
                        <label>Primary Color</label>
                        <div class="dash-color-picker">
                            <input type="color" value="#00F0FF" class="live-edit" data-target="color-primary" data-testid="input-color-primary">
                            <span>#00F0FF</span>
                        </div>
                    </div>
                    <div class="dash-theme-option">
                        <label>Accent Color</label>
                        <div class="dash-color-picker">
                            <input type="color" value="#8B5CF6" class="live-edit" data-target="color-accent" data-testid="input-color-accent">
                            <span>#8B5CF6</span>
                        </div>
                    </div>
                    <div class="dash-theme-option">
                        <label>Background</label>
                        <div class="dash-color-picker">
                            <input type="color" value="#111827" class="live-edit" data-target="color-bg" data-testid="input-color-bg">
                            <span>#111827</span>
                        </div>
                    </div>
                    <div class="dash-theme-option">
                        <label>Font Family</label>
                        <select class="dash-select live-edit" data-target="font-family" data-testid="select-font">
                            <option selected>Inter</option>
                            <option>Poppins</option>
                            <option>Roboto</option>
                            <option>Plus Jakarta Sans</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="dash-card">
                <div class="dash-card-header">
                    <h3><i class="fas fa-search"></i> SEO & Meta</h3>
                    <button class="dash-btn-primary" data-testid="btn-save-seo"><i class="fas fa-save"></i> Save SEO</button>
                </div>
                <div class="dash-editor-section">
                    <div class="dash-form-group">
                        <label>Meta Title</label>
                        <input type="text" class="dash-input" value="CommentCustomer.ai - Comment-to-Customer AI Engine" data-testid="input-seo-title">
                    </div>
                    <div class="dash-form-group">
                        <label>Meta Description</label>
                        <textarea class="dash-textarea" rows="3" data-testid="input-seo-desc">Transform social media comments into customers with AI-powered automation. Auto-reply, lead scoring, DM automation for Instagram, TikTok, Facebook.</textarea>
                    </div>
                    <div class="dash-form-group">
                        <label>OG Image URL</label>
                        <input type="text" class="dash-input" value="/assets/images/og-image.jpg" data-testid="input-seo-og">
                    </div>
                </div>
            </div>
        </div>

        <div class="site-editor-preview" id="siteEditorPreview">
            <div class="preview-panel">
                <div class="preview-toolbar">
                    <div class="preview-title">
                        <i class="fas fa-eye"></i>
                        <span>Live Preview</span>
                        <span class="preview-badge" id="previewEditingBadge"></span>
                    </div>
                    <div class="preview-controls">
                        <div class="preview-viewport-toggle">
                            <button class="preview-vp-btn active" data-viewport="desktop" data-testid="btn-vp-desktop"><i class="fas fa-desktop"></i></button>
                            <button class="preview-vp-btn" data-viewport="tablet" data-testid="btn-vp-tablet"><i class="fas fa-tablet-alt"></i></button>
                            <button class="preview-vp-btn" data-viewport="mobile" data-testid="btn-vp-mobile"><i class="fas fa-mobile-alt"></i></button>
                        </div>
                        <div class="preview-zoom-controls">
                            <button class="preview-zoom-btn" id="zoomOut" data-testid="btn-zoom-out"><i class="fas fa-search-minus"></i></button>
                            <span class="preview-zoom-label" id="zoomLabel">100%</span>
                            <button class="preview-zoom-btn" id="zoomIn" data-testid="btn-zoom-in"><i class="fas fa-search-plus"></i></button>
                            <button class="preview-zoom-btn" id="zoomReset" data-testid="btn-zoom-reset"><i class="fas fa-undo"></i></button>
                        </div>
                        <button class="preview-close-btn" id="previewCloseBtn" data-testid="btn-close-preview"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="preview-viewport-info" id="previewViewportInfo">1200 × 800 (desktop)</div>
                <div class="preview-frame-wrapper" id="previewFrameWrapper">
                    <iframe id="sitePreviewFrame" src="/" class="preview-iframe" data-testid="iframe-preview"></iframe>
                </div>
            </div>
        </div>
    </div>
</div>
