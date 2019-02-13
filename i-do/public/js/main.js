$( function () {
  $( '<img/>' ).attr( 'src', 'public/images/eye-to-eye.jpg' ).on( 'load',
    function () {
      $( this ).remove();
    } );

  setTimeout( function () {
    $( "#page-title" ).css( "opacity", 1 );
  }, 0 );
  setTimeout( function () {
    $( "#page-subtitle" ).css( {
      "opacity": 1,
      "transform": "translateY(0)"
    } );
  }, 500 );
  setTimeout( function () {
    $( "#details-link" ).css( {
      "opacity": 1,
      "transform": "scale(1)"
    } );
  }, 1000 );
  setTimeout( function () {
    $( '#image-div' ).css( "opacity", 0.15 );
  }, 1500 );

  // Go to detail
  $( "#details-link" ).click( function () {
    $( "body" ).css( {
      "transform": "scale(1.3)",
      "opacity": 0
    } );

    setTimeout( function () {
      window.location.href = "/i-do/details";
    }, 300 );
  } );
} );