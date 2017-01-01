$(function() {
    $('.js-metadata-save').click(function(event) {
        event.preventDefault();

        var $form = $(this).parent();
        var metadata = {
            artist: $("[name='artist']", $form).val(),
            title: $("[name='title']", $form).val(),
            genre: $("[name='genre']", $form).val()
        };

        $.post($form.attr('action'), metadata, function(res) {
            console.log(res);
        }, 'json');
    });
});