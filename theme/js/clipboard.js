//= = Class definition
toastr.options = {
    'closeButton': true,
    'debug': false,
    'newestOnTop': true,
    'progressBar': false,
    'positionClass': 'toast-top-right',
    'preventDuplicates': false,
    'onclick': null,
    'showDuration': '300',
    'hideDuration': '1000',
    'timeOut': '5000',
    'extendedTimeOut': '1000',
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
};

var ClipboardDemo = (function () {
    //= = Private functions
    var demos = function () {
        // basic example
        new Clipboard('[data-clipboard=true]').on('success', function (e) {
            e.clearSelection();
            toastr.info('Bookmark URL was copied.');
        });
    };

    return {
        // public functions
        init: function () {
            demos();
        }
    };
}());

jQuery(document).ready(function () {
    ClipboardDemo.init();
});
