$(function() {

    // Fade title in
    $('#name-title').fadeIn(500);

    $('.main-content').fadeIn(500);

    // Learn more button click
    $('#learn-more-btn').click(() => {
        $('#name-title').fadeOut(500, () => {
            window.location.href = "/about";
        })
    });

    $('#nav-home').click(() => {
        $('.main-content').fadeOut(500, () => {
            window.location.href = "/";
        });
    });

    $('#nav-about').click(() => {
        $('.main-content').fadeOut(500, () => {
            window.location.href = "/about";
        });
    });

    $('#nav-projects').click(() => {
        $('.main-content').fadeOut(500, () => {
            window.location.href = "/projects";
        });
    });

    $('#nav-contact').click(() => {
        $('.main-content').fadeOut(500, () => {
            window.location.href = "/contact";
        });
    });
});
