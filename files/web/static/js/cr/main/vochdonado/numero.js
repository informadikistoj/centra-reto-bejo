
$(function () {
	var submitButton = $('#vote-button');

	$('#vote-form').submit(function (e) {
		e.preventDefault();

		var apiData = {
			id: pageData.vote.id
		};

		if (pageData.vote.type === 'jns') {
			apiData.ballot = $('[name=vote]:checked').val();
		} else { // pr, utv
			var inputs = $('.vote');
			var values = [];
			for (var i = 0; i < inputs.length; i++) {
				var val = inputs[i].value;
				if (!val.length) {
					if (pageData.isTieBreaker) {
						return swal({
							icon: 'warning',
							title: 'Voto inválido',
							text: 'O voto do rompedor de empates deve listar todas as opções.',
							button: 'OK'
						});
					} else {
						continue;
					}
				}
				val = parseInt(val, 10);
				if (!Number.isSafeInteger(val)) {
					return swal({
						icon: 'warning',
						title: 'Voto inválido',
						text: 'Por favor, utilize apenas números inteiros.',
						button: 'OK'
					});
				}
				values.push({
					i: i,
					val: val
				});
			}
			values.sort(function (a, b) {
				return a.val - b.val;
			});

			var ballot = apiData.ballot = [];

			var lastVal = null;
			var n = -1;
			for (var i in values) {
				var val = values[i];
				if (val.val !== lastVal) { n++; }
				lastVal = val.val;
				if (!(n in ballot)) { ballot[n] = []; }
				ballot[n].push(val.i);
			}

			if (pageData.vote.type === 'utv' || pageData.isTieBreaker) {
				for (var i in ballot) {
					var entry = ballot[i];
					if (entry.length > 1) {
						return swal({
							icon: 'warning',
							title: 'Voto inválido',
							text: 'Não é possível dar o mesmo número para mais de uma opção.',
							button: 'OK'
						});
					}
				}
			}
		}

		swal({
			title: 'Você tem certeza da sua escolha?',
			buttons: [
				'Cancelar',
				{
					text: 'Votar',
					closeModal: false
				}
			]
		}).then(function (isConfirm) {
			if (!isConfirm) { return; }

			submitButton.attr('disabled', true);

			performAPIRequest('post', '/api/votes/vote', apiData)
				.then(function (res) {
					if (!res.success) {
						return submitButton.attr('disabled', false);
					}
					
					swal.stopLoading();
					swal({
						icon: 'success',
						title: 'Voto registrado com sucesso!',
						buttons: 'Voltar'
					}).then(function () {
						location.href = '/vochdonado/retaj';
					});
				});
		});
	});
});
