$(function () {
	// CREATE CIRKULERO
	var defaultDate = moment();
	defaultDate.date(5);
	defaultDate.hour(12);
	defaultDate.minute(0);
	defaultDate.add(1, 'month');
	$('#create-cirkulero-form-deadline').datetimepicker({
		locale: 'eo',
		minDate: moment(),
		defaultDate: defaultDate
	});
	autosize($('#create-cirkulero-form-note'));
	$('#create-cirkulero-form').submit(function (e) {
		e.preventDefault();

		var apiData = {
			id: parseInt($('#create-cirkulero-form-id').val(), 10),
			name: $('#create-cirkulero-form-name').val(),
			deadline: $('#create-cirkulero-form-deadline').data('DateTimePicker').date().unix(),
			reminders: $('#create-cirkulero-form-reminders').prop('checked'),
			open: $('#create-cirkulero-form-open').prop('checked'),
			note: $('#create-cirkulero-form-note').val() || null
		};

		var submitButton = $('#create-cirkulero-form-button');

		var modalText = '';
		if (apiData.reminders) {
			modalText = 'Memorigoj kiuj devus esti senditaj antaŭ la nuna horo ne estos senditaj.';
		}
		swal({
			title: 'Ĉu vi certas, ke vi volas krei novan cirkuleron?',
			text: modalText,
			buttons: [
				'Nuligi',
				{
					text: 'Krei',
					closeModal: false
				}
			]
		}).then(function (modalE) {
			if (!modalE) { return; }

			submitButton.attr('disabled', true);

			performAPIRequest('post', '/api/cirkuleroj/create', apiData, false)
				.then(function () {
					swal.stopLoading();
					swal.close();
					tableData.table.draw();

					// Clean up the form
					var form = $('#create-cirkulero-form');
					form[0].reset();
					$('#create-cirkulero-form-deadline').data('DateTimePicker').date(defaultDate);
					// Reactive the inputs
					form.find('input,textarea').blur();
				})
				.catch(function (err) {
					if (err.error === 'ID_TAKEN') {
						swal({
							title: 'Cirkulernumero jam uzata',
							icon: 'error',
							button: 'Bone'
						});
					} else {
						showError(err);
					}
				})
				.finally(function () {
					submitButton.removeAttr('disabled');
				});
		});
	});

	// EXISTING CIRKULEROJ
	var tableData = setUpDataTable({
		el: '#cirkuleroj-table',
		method: 'post'	,
		url: '/api/cirkuleroj/list',
		select: [ 'id', 'name', 'deadline', 'open', 'reminders', 'note' ],
		defaultOrder: [ 0, 'asc' ],
		options: {
			searching: false
		},
		globalWhere: [{
			col: 'published',
			type: '=',
			val: 0
		}],
		dataFormatter: function (val, col) {
			if (col.name === 'deadline') {
				val = moment.unix(val).format('LLL');
			}

			return val;
		}
	});
	var table = tableData.table;
	var loaderTemplate = cloneTemplate('#template-loader');
	$('#cirkuleroj-table-reload').click(function () {
		table.draw();
	});
	table.on('draw', function () {
		// Apply click listeners to all rows
		var rows = table.rows().nodes().to$();
		rows.addClass('clickable');
		rows.on('click', function () { // The listener is automatically removed upon the next draw
			var row = table.row(this);
			var rowData = tableData.getRowData(row, 'id');

			var modalTitle = 'Cirkulero n-ro ' + rowData.id + ', ' + rowData.name;

			swal({
				title: modalTitle,
				content: loaderTemplate[0],
				buttons: false
			});

			// Obtain contributions
			performAPIRequest('post', '/api/cirkuleroj/get_contributions', { cirkulero_id: rowData.id })
				.then(function (res) {
					if (!res.success) { return; }

					var template = cloneTemplate('#template-cirkulero-modal');

					// Actions
					template.find('.cirkulero-modal-prepare').click(function () {
						window.location.href = '/cirkuleroj/' + rowData.id + '/pretigi';
					});

					var toggleOpenBtn = template.find('.cirkulero-modal-toggle-open');
					if (rowData.open) {
						toggleOpenBtn.children('i').text('lock');
						toggleOpenBtn.children('span').text('Fermi kontribuojn');
						var toggleOpenModalTitle = 'Fermo de kontribuoj';
						var toggleOpenModalText = 'Ĉu vi certas, ke vi volas fermi la eblon kontribui al cirkulero n-ro ' + rowData.id + '?';
						var toggleOpenModalConfirmBtn = 'Fermi';
						var toggleOpenModalAPIMethod = '/api/cirkuleroj/close';
					} else {
						toggleOpenBtn.children('i').text('lock_open');
						toggleOpenBtn.children('span').text('Malfermi cirkuleron');
						var toggleOpenModalTitle = 'Malfermo de kontribuoj';
						var toggleOpenModalText = 'Ĉu vi certas, ke vi volas malfermi la eblon kontribui al cirkulero n-ro ' + rowData.id + '?';
						var toggleOpenModalConfirmBtn = 'Malfermi';
						var toggleOpenModalAPIMethod = '/api/cirkuleroj/open';
					}
					toggleOpenBtn.click(function () {
						swal({
							title: toggleOpenModalTitle,
							text: toggleOpenModalText,
							buttons: [
								'Nuligi',
								{
									text: toggleOpenModalConfirmBtn,
									closeModal: false
								}
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							performAPIRequest('post', toggleOpenModalAPIMethod, { cirkulero_id: rowData.id })
								.then(function (res) {
									swal.stopLoading();
									table.draw();
									if (!res.success) { return; }
									swal.close();
								});
						});
					});

					var toggleRemindersBtn = template.find('.cirkulero-modal-toggle-reminders');
					if (rowData.reminders) {
						toggleRemindersBtn.children('i').text('notifications_off');
						toggleRemindersBtn.children('span').text('Malaktivigi sciigojn');
						var toggleRemindersModalTitle = 'Malaktivigo de sciigoj';
						var toggleRemindersModalText = 'Ĉu vi certas, ke vi volas malaktivigi sciigojn por cirkulero n-ro ' + rowData.id + '?';
						var toggleRemindersModalConfirmBtn = 'Malaktivigi';
						var toggleRemindersModalAPIMethod = '/api/cirkuleroj/reminders_disable';
					} else {
						toggleRemindersBtn.children('i').text('notifications_active');
						toggleRemindersBtn.children('span').text('Aktivigi sciigojn');
						var toggleRemindersModalTitle = 'Aktivigo de sciigoj';
						var toggleRemindersModalText = 'Ĉu vi certas, ke vi volas aktivigi sciigojn por cirkulero n-ro ' + rowData.id + '?';
						var toggleRemindersModalConfirmBtn = 'Aktivigi';
						var toggleRemindersModalAPIMethod = '/api/cirkuleroj/reminders_enable';
					}
					toggleRemindersBtn.click(function () {
						swal({
							title: toggleRemindersModalTitle,
							text: toggleRemindersModalText,
							buttons: [
								'Nuligi',
								{
									text: toggleRemindersModalConfirmBtn,
									closeModal: false
								}
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							performAPIRequest('post', toggleRemindersModalAPIMethod, { cirkulero_id: rowData.id })
								.then(function (res) {
									swal.stopLoading();
									table.draw();
									if (!res.success) { return; }
									swal.close();
								});
						});
					});

					template.find('.cirkulero-modal-rename').click(function () {
						var modalTemplate = cloneTemplate('#template-rename-cirkulero-modal');

						var form = modalTemplate.find('form');
						var input = modalTemplate.find('input');
						input.val(rowData.name);
						input.on('input', function () {
							var valid = form[0].checkValidity();
							$('.swal-button--confirm').attr('disabled', !valid);
						});
						$.AdminBSB.input.activate(form);

						form.submit(function (e) {
							e.preventDefault();
							$('.swal-button--confirm').click();
						});

						swal({
							title: 'Renomi cirkuleron n-ro ' + rowData.id,
							content: modalTemplate[0],
							buttons: [
								'Nuligi',
								'Renomi'
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							swal({
								title: 'Renomi cirkuleron n-ro ' + rowData.id,
								text: 'Ĉu vi certas, ke vi volas renomi la cirkuleron?',
								buttons: [
									'Nuligi',
									{
										text: 'Renomi',
										closeModal: false
									}
								]
							}).then(function (isConfirm) {
								if (!isConfirm) { return; }

								performAPIRequest('post', '/api/cirkuleroj/rename', { cirkulero_id: rowData.id, name: input.val() })
									.then(function (res) {
										swal.stopLoading();
										table.draw();
										if (!res.success) { return; }
										swal.close();
									});
							});
						});
					});

					template.find('.cirkulero-modal-change-note').click(function () {
						var modalTemplate = cloneTemplate('#template-change-note-modal');

						var form = modalTemplate.find('form');
						var input = modalTemplate.find('textarea');
						input.val(rowData.note);
						input.on('input', function () {
							var valid = form[0].checkValidity();
							$('.swal-button--confirm').attr('disabled', !valid);
						});
						$.AdminBSB.input.activate(form);

						form.submit(function (e) {
							e.preventDefault();
							$('.swal-button--confirm').click();
						});

						swal({
							title: 'Ŝanĝi noton de cirkulero n-ro ' + rowData.id,
							content: modalTemplate[0],
							buttons: [
								'Nuligi',
								'Ŝanĝi'
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							swal({
								title: 'Ŝanĝi noton de cirkulero n-ro ' + rowData.id,
								text: 'Ĉu vi certas, ke vi volas ŝanĝi la noton de la cirkulero?',
								buttons: [
									'Nuligi',
									{
										text: 'Ŝanĝi',
										closeModal: false
									}
								]
							}).then(function (isConfirm) {
								if (!isConfirm) { return; }

								performAPIRequest('post', '/api/cirkuleroj/update_note', { cirkulero_id: rowData.id, note: input.val() })
									.then(function (res) {
										swal.stopLoading();
										table.draw();
										if (!res.success) { return; }
										swal.close();
									});
							});
						});

						window.setTimeout(function () {
							autosize(input);
						}, 0);
					});

					template.find('.cirkulero-modal-change-deadline').click(function () {
						var modalTemplate = cloneTemplate('#template-change-deadline-modal');

						var form = modalTemplate.find('form');
						var input = modalTemplate.find('input');

						var dateNow = moment();
						var deadlineDate = moment.unix(rowData.deadline);
						if (deadlineDate < dateNow) {
							deadlineDate = dateNow;
						}

						input.datetimepicker({
							locale: 'eo',
							minDate: dateNow,
							defaultDate: deadlineDate
						});
						input.on('input', function () {
							var valid = form[0].checkValidity();
							$('.swal-button--confirm').attr('disabled', !valid);
						});
						$.AdminBSB.input.activate(form);

						form.submit(function (e) {
							e.preventDefault();
							$('.swal-button--confirm').click();
						});

						swal({
							title: 'Movi limdaton de cirkulero n-ro ' + rowData.id,
							content: modalTemplate[0],
							buttons: [
								'Nuligi',
								'Movi'
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							swal({
								title: 'Movi limdaton de cirkulero n-ro ' + rowData.id,
								text: 'Ĉu vi certas, ke vi volas movi la limdaton de la cirkulero?',
								buttons: [
									'Nuligi',
									{
										text: 'Movi',
										closeModal: false
									}
								]
							}).then(function (isConfirm) {
								if (!isConfirm) { return; }

								performAPIRequest('post', '/api/cirkuleroj/update_deadline', {
									cirkulero_id: rowData.id,
									deadline: input.data('DateTimePicker').date().unix()
								}).then(function (res) {
									swal.stopLoading();
									table.draw();
									if (!res.success) { return; }
									swal.close();
								});
							});
						});

						window.setTimeout(function () {
							autosize(input);
						}, 0);
					});

					template.find('.cirkulero-modal-send-direct-reminder').click(function () {
						var modalTemplate = cloneTemplate('#template-send-direct-reminder-modal');

						var form = modalTemplate.find('form');
						var input = modalTemplate.find('textarea');
						
						var deadline = moment.unix(rowData.deadline).format(pageData.dateFormat);
						var text = input.val();
						text = text.replace(/{{numero}}/g, rowData.id);
						text = text.replace(/{{monato}}/g, rowData.name);
						text = text.replace(/{{noto}}/g, rowData.note || '');
						text = text.replace(/{{limdato}}/g, deadline);

						// Remove consecutive newlines
						text = text.replace(/(?:\r?\n){3}((?:\r?\n)*)/g, '\n\n');
						input.val(text);

						input.on('input', function () {
							var valid = form[0].checkValidity();
							$('.swal-button--confirm').attr('disabled', !valid);
						});
						$.AdminBSB.input.activate(form);

						form.submit(function (e) {
							e.preventDefault();
							$('.swal-button--confirm').click();
						});

						swal({
							title: 'Sendi rektan memorigon pri cirkulero n-ro ' + rowData.id,
							content: modalTemplate[0],
							buttons: [
								'Nuligi',
								'Sendi'
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							swal({
								title: 'Sendi rektan memorigon pri cirkulero n-ro ' + rowData.id,
								text: 'Ĉu vi certas, ke vi volas sendi rektan memorigon pri la cirkulero?',
								buttons: [
									'Nuligi',
									{
										text: 'Sendi',
										closeModal: false
									}
								]
							}).then(function (isConfirm) {
								if (!isConfirm) { return; }

								performAPIRequest('post', '/api/cirkuleroj/send_reminder_direct', {
									cirkulero_id: rowData.id,
									message: input.val()
								}).then(function (res) {
									swal.stopLoading();
									table.draw();
									if (!res.success) { return; }
									
									swal({
										icon: 'success',
										title: 'Sukcese sendis rektan memorigon',
										text: ' ', // To solve issues with missing body margin
										timer: 3000,
										button: false
									});
								});
							});
						});

						window.setTimeout(function () {
							autosize(input);
						}, 0);
					});

					template.find('.cirkulero-modal-delete').click(function () {
						swal({
							title: 'Forigo de cirkulero ' + rowData.id,
							text: 'Ĉu vi certas, ke vi volas forigi cirkuleron ' + rowData.id + '?',
							buttons: [
								'Nuligi',
								{
									text: 'Forigi',
									closeModal: false
								}
							]
						}).then(function (isConfirm) {
							if (!isConfirm) { return; }

							performAPIRequest('post', '/api/cirkuleroj/delete', { cirkulero_id: rowData.id })
								.then(function (res) {
									swal.stopLoading();
									table.draw();
									if (!res.success) { return; }
									swal.close();
								});
						});
					});

					// Statistics
					var createStatsHandler = function (group) {
						var contribs = [];
						for (var n in res.contributions) {
							var contrib = res.contributions[n];
							if (!group && contrib.hasStats) { continue; }
							if (!group) { // Remainder
								contrib.hasStats = true;
								contribs.push(contrib);
								continue;
							}
							// Not remainder
							if (group.id !== contrib.user.group_id && group.children.indexOf(contrib.user.group_id) === -1) {
								continue;
							}
							contrib.hasStats = true;
							contribs.push(contrib);
						}

						if (!contribs.length) { return; } // Group is empty, no action needed

						if (!group) { // Remainder
							group = {
								name: 'Aliaj'
							};
						}

						var totalUsers = contribs.length;
						var contributors = [];
						var nonContributors = [];

						for (var i in contribs) {
							var contrib = contribs[i];
							var name = contrib.user.long_name || contrib.user.email;
							if (contrib.user.role !== group.name) {
								name += ' – ' + contrib.user.role;
							}
							if (contrib.contrib) {
								contributors.push(name);
							} else {
								nonContributors.push(name);
							}
						}

						// Statistics
						var stats = template.find('.cirkulero-modal-statistics');
						var div = document.createElement('div');
						stats.append(div);

						var h4 = document.createElement('h4');
						div.appendChild(h4);
						h4.textContent = group.name + ' (' +  contributors.length + '/' + totalUsers + ')';

						if (totalUsers > 0) {
							var contribEl = document.createElement('p');
							div.appendChild(contribEl);
							var contribPreText = document.createTextNode('Kontribuis: ');
							if (contributors.length) {
								var contribText = document.createTextNode(contributors.join(', '));
							} else {
								var contribText = document.createElement('i');
								contribText.textContent = 'Neniu';
							}
							contribEl.appendChild(contribPreText);
							contribEl.appendChild(contribText);

							var noContribEl = document.createElement('p');
							div.appendChild(noContribEl);
							var noContribPreText = document.createTextNode('Ne kontribuis: ');
							if (nonContributors.length) {
								var noContribText = document.createTextNode(nonContributors.join(', '));
							} else {
								var noContribText = document.createElement('i');
								noContribText.textContent = 'Neniu';
							}
							noContribEl.appendChild(noContribPreText);
							noContribEl.appendChild(noContribText);
						} else {
							var el = document.createElement('i');
							div.appendChild(el);
							el.textContent = 'Neniuj membroj';
						}
					};
					for (var i in pageData.groups.statistics) {
						createStatsHandler(pageData.groups.statistics[i]);
					}
					createStatsHandler(null);

					swal({
						title: modalTitle,
						content: template[0],
						button: 'Fermi'
					});
				});
		});
	});
});
