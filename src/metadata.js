$(function() {
    $('.js-metadata-save').click(function(event) {
        event.preventDefault();

        let $this = $(this);
        let $form = $(this).parents('form');
        let metadata = {
            artist: $("[name='artist']", $form).val(),
            title: $("[name='title']", $form).val(),
            genre: $("[name='genre']", $form).val()
        };

        $this.addClass('submitting');
        $.post($form.attr('action'), metadata, function(res) {
            if(res.status == 'ok') {
                $this.parents('.metadata-cell').removeClass('no-metadata').addClass('has-metadata');
                $this.val('Saved');
            }
            $this.removeClass('submitting');

        }, 'json');
    });
});
