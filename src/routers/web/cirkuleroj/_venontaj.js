import * as cirkulero from '../../../api/cirkulero';

async function venontaj (req, res, next) { // eslint-disable-line no-unused-vars
	const groupsRaw = await cirkulero.getGroups(true);
	const groups = {};
	for (let purpose in groupsRaw) {
		groups[purpose] = await Promise.all(groupsRaw[purpose].map(async group => {
			const children = await group.getAllChildGroups();
			return {
				id: group.id,
				name: group.nameBase,
				children: children.map(x => x.id)
			};
		}));
	}

	const data = {
		title: 'Venontaj cirkuleroj',
		scripts: [
			'/js/cr/main/cirkuleroj/venontaj.js',
			'/plugins/jquery-datatable/datatables.min.js',
			'/js/jquery.dataTables.eo.js',
			'/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
			'/plugins/autosize/autosize.min.js'
		],
		stylesheets: [
			'/plugins/jquery-datatable/datatables.min.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css',
			'/plugins/bootstrap-tagsinput/bootstrap-tagsinput-typeahead.css',
			'/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css'
		],
		pageDataObj: {
			groups: groups,
			dateFormat: CR.timeFormats.dateTimeFull
		}
	};
	await res.sendRegularPage('cirkuleroj/venontaj', data);
}

export default venontaj;
