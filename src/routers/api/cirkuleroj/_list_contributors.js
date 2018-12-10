import * as cirkulero from '../../../api/cirkulero';
import { promiseAllObject } from '../../../util';

async function list_contributors (req, res, next) {
	/**
	 * POST /list_contributors
	 * Lists which users have contributed to a given cirkulero and which have not
	 *
	 * Login required
	 * Initial setup required
	 *
	 * Permissions required:
	 * cirkuleroj.manage
	 *
	 * Parameters:
	 *   cirkulero_id (number)
	 *
	 * Returns:
	 *   groups (Object[])
	 *     id    (string|null) The id of the group or null if this is the “remainder” group
	 *     name  (string|null) The name of the group or null if this is the “remainder” group
	 *     users (Object[])
	 *       id                   (number)  The id of the user
	 *       long_name            (string)  The long name of the user
	 *       full_name_latin_sort (string)  The user's name for sorting purposes
	 *       group_name           (string)  The user's formatted group name
	 *       contributed          (boolean) Whether the user has contributed to the cirkulero within in this group
	 *
	 * Throws:
	 * INVALID_ARGUMENT [argument]
	 */
	
	if (!await req.requirePermissions('cirkuleroj.manage')) { return; }

	const fields = [
		'cirkulero_id'
	];
	if (!req.handleRequiredFields(fields)) { return; }

	if (!Number.isSafeInteger(req.body.cirkulero_id)) {
		res.sendAPIError('INVALID_ARGUMENT', ['cirkulero_id']);
		return;
	}

	// Get all existing cirkulero contributions
	const contribsRaw = cirkulero.getAllContributions(req.body.cirkulero_id);
	const contribs = new Map();
	for (let row of contribsRaw) {
		if (!contribs.has(row.group_id)) { contribs.set(row.group_id, new Map()); }
		contribs.get(row.group_id).set(row.user_id, row);
	}

	// Get all users allowed to contribute
	const cirkGroups = await cirkulero.getGroups();
	const childrenObjPromises = {};
	for (let group of cirkGroups.contribute) {
		childrenObjPromises[group.id] = group.getAllChildGroups();
	}
	const childrenObj = await promiseAllObject(childrenObjPromises);
	const children = [].concat(...Object.values(childrenObj));
	const groups = cirkGroups.contribute.concat(children);

	const groupUsersMap = await Promise.all(groups.map(async group => {
		const users = await group.getAllUsers(true);
		
		let usersDetails = await Promise.all(users.map(async user => {
			const settings = await group.getForUser(user);

			// If this is a parent group you cannot contribute directly to it
			// Thus we need to find all the child groups of this group that the user is a member of 
			// Then we need to check if the user has contributed to all of them
			const userGroups = await user.getGroups();
			let contributed = true;
			let indirectGroups = [];
			let indirectContribs = [];
			if (childrenObj[group.id]) {
				for (let childGroup of childrenObj[group.id]) {
					let found = false;
					let userGroup;
					for (userGroup of userGroups.values()) {
						if (childGroup.id === userGroup.group.id) {
							found = true;
							break;
						}
					}
					if (!found) { continue; }
					indirectGroups.push(userGroup);
					let contrib = null;
					if (contribs.has(childGroup.id) && contribs.get(childGroup.id).has(user.id)) {
						contrib = contribs.get(childGroup.id).get(user.id);
					}
					if (contrib) {
						indirectContribs.push(contrib);
					} else {
						contributed = false;
					}
				}
			}

			// However if this is not a parent group we'll still want to find the direct contribution
			let contrib = null;
			if (contribs.has(group.id) && contribs.get(group.id).has(user.id)) {
				contrib = contribs.get(group.id).get(user.id);
			}
			// If this isn't a parent group then we need to check if a direct contribution is found
			if (childrenObj[group.id] && childrenObj[group.id].length === 0) {
				contributed = !!contrib;
			}

			let groupName;
			if (contrib) {
				groupName = contrib.user_role;
			} else if (indirectGroups.length > 0) {
				groupName = indirectGroups.map(group => group.user.name).join(', ');
			} else {
				groupName = settings.user.name;
			}

			return {
				id: user.id,
				long_name: user.getLongName(),
				full_name_latin_sort: user.getNameDetails().fullNameLatinSort,
				group_name: groupName,
				contributed: contributed
			};
		}));

		return {
			group: {
				id: group.id,
				name: group.nameBase
			},
			users: usersDetails
		};
	}));

	res.sendAPIResponse({
		groups: groupUsersMap
	});
}

export default list_contributors;