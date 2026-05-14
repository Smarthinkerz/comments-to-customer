<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>{{CODE}} — {{TITLE}} | CommentCustomer.ai</title>
    <link rel="icon" type="image/svg+xml" href="<?php echo CC_THEME_URI; ?>/assets/images/favicon.svg">
    <meta name="theme-color" content="#141B2D">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap">
    <style>
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body{
            font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
            background:linear-gradient(135deg,#141B2D 0%,#1A1F35 50%,#151928 100%);
            color:#E8EAF1;min-height:100vh;
            display:flex;align-items:center;justify-content:center;padding:1.5rem;
            position:relative;overflow:hidden;
        }
        body::before,body::after{content:"";position:absolute;border-radius:50%;filter:blur(80px);opacity:.35;pointer-events:none}
        body::before{width:520px;height:520px;background:#7C3AED;top:-180px;left:-120px}
        body::after{width:480px;height:480px;background:#06B6D4;bottom:-160px;right:-120px}
        .err-card{
            position:relative;z-index:1;
            background:rgba(20,27,45,.65);
            backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
            border:1px solid rgba(124,58,237,.25);border-radius:24px;
            padding:3rem 2.5rem;max-width:520px;width:100%;text-align:center;
            box-shadow:0 24px 64px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.04);
        }
        .err-code{
            font-size:6rem;line-height:1;font-weight:800;
            background:linear-gradient(135deg,#7C3AED 0%,#06B6D4 100%);
            -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
            margin-bottom:.5rem;letter-spacing:-.04em;
        }
        .err-title{font-size:1.5rem;font-weight:600;margin-bottom:.75rem;color:#fff}
        .err-msg{color:#A0A6B8;line-height:1.6;margin-bottom:2rem;font-size:.95rem}
        .err-id{font-family:ui-monospace,SF Mono,Menlo,monospace;font-size:.75rem;color:#6B7280;margin-bottom:1.5rem;background:rgba(0,0,0,.25);padding:.5rem .75rem;border-radius:8px;display:inline-block}
        .err-actions{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
        .err-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.875rem 1.5rem;border-radius:12px;font-weight:600;font-size:.95rem;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease;border:1px solid transparent;cursor:pointer}
        .err-btn-primary{background:linear-gradient(135deg,#7C3AED 0%,#06B6D4 100%);color:#fff;box-shadow:0 8px 24px rgba(124,58,237,.35)}
        .err-btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(124,58,237,.45)}
        .err-btn-ghost{background:transparent;color:#E8EAF1;border-color:rgba(255,255,255,.15)}
        .err-btn-ghost:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.3)}
        @media(max-width:480px){.err-code{font-size:4.5rem}.err-title{font-size:1.25rem}.err-card{padding:2rem 1.5rem}}
        @media(prefers-reduced-motion:reduce){.err-btn{transition:none}}
    </style>
</head>
<body>
    <main class="err-card" role="main">
        <div class="err-code" aria-hidden="true">{{CODE}}</div>
        <h1 class="err-title">{{TITLE}}</h1>
        <p class="err-msg">{{MSG}}</p>
        {{ID_BLOCK}}
        <div class="err-actions">
            <a href="/" class="err-btn err-btn-primary" data-testid="link-error-home">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>
                Back to Home
            </a>
            <a href="javascript:history.back()" class="err-btn err-btn-ghost" data-testid="link-error-back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                Go Back
            </a>
        </div>
    </main>
</body>
</html>
