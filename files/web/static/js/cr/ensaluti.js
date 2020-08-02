$(function () {
    $('#login').validate({
        highlight: function (input) {
            $(input).parents('.form-line').addClass('error');
        },
        unhighlight: function (input) {
            $(input).parents('.form-line').removeClass('error');
        },
        errorPlacement: function (error, element) {
            $(element).parents('.input-group').append(error);
        },
        submitHandler: function (form) {
            $('#submit-button').attr('disabled', true);
            // TODO: Some sort of indicator that something's going on
            var data = serializeToObj(form);

            performAPIRequest('post', '/api/user/login', data, false)
                .then(function (res) {
                    window.location = window.location.search.slice(1) || '/';
                })
                .catch(function (err) {
                    if (err.error === 'USER_NOT_FOUND') {
                        swal({
                            title: 'Falha ao entrar',
                            icon: 'error',
                            text: 'O endereço de e-mail ou a senha está incorreta.',
                            button: 'OK'
                        });
                    } else {
                        showError(err);
                    }
                })
                .finally(function () {
                    $('#submit-button').removeAttr('disabled');
                });
        }
    });
});
