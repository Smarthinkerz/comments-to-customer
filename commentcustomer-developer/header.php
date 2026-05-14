<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5">
    <meta name="description" content="CommentCustomer.ai - Transform social media comments into customers with AI-powered automation. Smart replies, lead scoring, and auto-DM workflows.">
    <meta name="theme-color" content="#141B2D">
    <meta name="color-scheme" content="dark">

    <!-- Canonical URL — prevents duplicate-content penalty -->
    <link rel="canonical" href="<?php echo esc_url( home_url( add_query_arg( null, null ) ) ); ?>">

    <!-- Open Graph -->
    <meta property="og:title" content="CommentCustomer.ai - Comment-to-Customer AI Engine">
    <meta property="og:description" content="Automate Comments. Capture Leads. Grow Your Business.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo esc_url( home_url('/') ); ?>">
    <meta property="og:site_name" content="CommentCustomer.ai">
    <meta property="og:image" content="<?php echo CC_THEME_URI; ?>/assets/images/all-features-hero.webp">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="CommentCustomer.ai - Comment-to-Customer AI Engine">
    <meta name="twitter:description" content="Automate Comments. Capture Leads. Grow Your Business.">

    <!-- Structured data: SoftwareApplication schema for rich snippets -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "CommentCustomer.ai",
      "description": "AI-powered social media comment automation that turns every comment into a potential customer. Auto-reply, lead scoring, auto-DM workflows.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "url": "<?php echo esc_url( home_url('/') ); ?>",
      "offers": [
        { "@type": "Offer", "name": "Starter", "price": "29",  "priceCurrency": "USD", "category": "subscription" },
        { "@type": "Offer", "name": "Growth",  "price": "79",  "priceCurrency": "USD", "category": "subscription" },
        { "@type": "Offer", "name": "Pro",     "price": "149", "priceCurrency": "USD", "category": "subscription" }
      ],
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "127" },
      "creator": { "@type": "Organization", "name": "CommentCustomer.ai" }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "CommentCustomer.ai",
      "url": "<?php echo esc_url( home_url('/') ); ?>",
      "logo": "<?php echo CC_THEME_URI; ?>/assets/images/favicon.svg",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+968-96737452",
        "contactType": "customer support",
        "areaServed": "Worldwide",
        "availableLanguage": ["English", "Arabic"]
      },
      "sameAs": [
        "https://facebook.com/commentcustomer",
        "https://instagram.com/commentcustomer",
        "https://linkedin.com/company/commentcustomer"
      ]
    }
    </script>

    <!-- Favicon set -->
    <link rel="icon" type="image/svg+xml" href="<?php echo CC_THEME_URI; ?>/assets/images/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="<?php echo CC_THEME_URI; ?>/assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="<?php echo CC_THEME_URI; ?>/assets/images/favicon-16x16.png">
    <link rel="shortcut icon" href="<?php echo CC_THEME_URI; ?>/assets/images/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="<?php echo CC_THEME_URI; ?>/assets/images/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">

    <!-- Performance: connect early to font + icon CDNs -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="dns-prefetch" href="https://js.stripe.com">

    <!-- Performance: preload critical fonts to eliminate FOIT/FOUT -->
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">

    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
