<?php get_header(); ?>

<main class="cc-page">
    <div class="cc-container" style="padding: 100px 20px; max-width: 900px; margin: 0 auto;">
        <?php while (have_posts()) : the_post(); ?>
            <h1 style="font-size: 36px; font-weight: 700; color: #FFFFFF; margin-bottom: 24px;"><?php the_title(); ?></h1>
            <div style="color: #C4C9D9; font-size: 16px; line-height: 1.8;">
                <?php the_content(); ?>
            </div>
        <?php endwhile; ?>
    </div>
</main>

<?php get_footer(); ?>
