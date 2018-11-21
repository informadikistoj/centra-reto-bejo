import crypto from 'pn/crypto';
import moment from 'moment-timezone';
import url from 'url';
import path from 'path';

class User {
	constructor (id, email, enabled, pass) {
		this.id = id;
		this.email = email;
		this.enabled = enabled;
		this.pass = pass;

		this.activationKey = undefined;
	}

	/**
	 * Creates a new user
	 * @param  {string} email The user's primary email address
	 * @return {User} The new user
	 */
	static async createUser (email) {
		// Generate activation key
		const activationKeyBytes = await crypto.randomBytes(CR.conf.activationKeySize);
		const activationKey = activationKeyBytes.toString('hex');

		const activationKeyTime = moment().unix();

		const stmt = CR.db.users.prepare("insert into users (email, activation_key, activation_key_time) values (?, ?, ?)");
		const info = stmt.run(email, activationKey, activationKeyTime);

		const user = new User(info.lastInsertRowId, email, true, null);
		user.activationKey = activationKey;
		return user;
	}

	/**
	 * Checks whether a primary email address is taken
	 * @param  {string}  email The email address to check
	 * @return {Boolean} Whether the primary email address is taken
	 */
	static isEmailTaken (email) {
		return CR.db.users.prepare("select 1 from users where email = ?").get(email) != undefined;
	}

	getActivationURL () {
		return url.resolve(CR.conf.addressPrefix, path.join('alighi', this.email, this.activationKey));
	}
}

export default User;