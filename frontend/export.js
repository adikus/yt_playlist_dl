import $ from 'jquery'

$(function() {
    let renumber = function(start, startIndex) {
        let index = -1;
        $('.js-change-index').each(function() {
            let pos = parseInt($(this).siblings('.js-change-start').val());
            if(start == pos){
                index = startIndex;
                $(this).prop('readonly', false);
            } else $(this).prop('readonly', true);
            $(this).val(index);
            if(index > 0) index++;
        });
    };

    $('.js-change-start').click(function() {
        let start = parseInt($(this).val());
        renumber(start, 1);
    });

    $('.js-change-index').change(function() {
        let startIndex = parseInt($(this).val());
        let start = parseInt($(this).siblings('.js-change-start').val());
        renumber(start, startIndex);
    });
});
