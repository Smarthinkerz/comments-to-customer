<?php get_header(); ?>

<main class="cc-single-post">
    <div class="cc-container" style="padding: 100px 20px; max-width: 800px; margin: 0 auto;">
        <?php while (have_posts()) : the_post(); ?>
            <article>
                <h1 style="font-size: 36px; font-weight: 700; color: #FFFFFF; margin-bottom: 16px;"><?php the_title(); ?></h1>
                <div style="color: #7B8199; font-size: 14px; margin-bottom: 32px;">
                    <?php echo get_the_date(); ?> &bull; <?php the_author(); ?>
                </div>
                <div style="color: #C4C9D9; font-size: 16px; line-height: 1.8;">
                    <?php the_content(); ?>
                </div>
            </article>
        <?php endwhile; ?>
    </div>
</main>

<?php get_footer(); ?>
