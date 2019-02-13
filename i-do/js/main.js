$(function() {
  var imgLoaded = false;
  $('<img/>').attr('src', 'images/eye-to-eye.jpg').on('load', function() {
    $(this).remove();
  });
  
  setTimeout(function() { $("#page-title").css("opacity", 1); }, 0);
  setTimeout(function() { $("#page-subtitle").css( {"opacity": 1, "transform": "translateY(0)" }); }, 500);
  setTimeout(function() { $("#details-link").css( {"opacity": 1, "transform": "scale(1)"} ); }, 1000);
  setTimeout(function() { $('#image-div').fadeIn(2000); }, 1500);
});