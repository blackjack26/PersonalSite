$(function() {

    // Fade title in
    $('#name-title').fadeIn(500);

    // Learn more button click
    $('#learn-more-btn').click(function() {
        $('#name-title').fadeOut(500, function() {
            window.location.href = "about";
        })
    });

});