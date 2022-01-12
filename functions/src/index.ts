import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp({ databaseURL: 'https://cloud-functions-231022.firebaseio.com' });

const db = admin.database();

export const queryGithub = functions.https.onRequest(async (request, response) => {
	const username = request.query.username;

	const userRef = db.ref(`users/${username}`);

	const userSnapshot = await userRef.once('value');
	const userData = userSnapshot.val();

	if (userData) {
		response.json(userData);
	} else {
		const githubResponse = await axios.get(`https://api.github.com/users/${username}`);
		const githubUserData = githubResponse.data;

		userRef.set(githubUserData);
		response.json(githubUserData);
	}
});

export const countUsers = functions.database
	.instance('cloud-functions-231022')
	.ref('/users/{username}')
	.onWrite(async change => {
		let increment: number;
		if (change.after.exists() && !change.before.exists()) {
			increment = 1;
		} else if (!change.after.exists() && change.before.exists()) {
			increment = -1;
		} else {
			return null;
		}

		await db.ref('/users-count').transaction(currentCount => {
			return (currentCount || 0) + increment;
		});

		return null;
	});
