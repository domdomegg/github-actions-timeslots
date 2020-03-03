const { execSync } = require('child_process');

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
	userAgent: 'domdomegg/github-actions-timeslots'
});

const event = require(process.env.GITHUB_EVENT_PATH)

const main = () => {
	if (event.issue && event.issue.body && event.issue.body) {
		if (event.issue.labels.every(label => label.name != "reset")) {
			console.log("Not labelled with 'reset', ignoring issue") 
			return
		}

		if (event.issue.user.login != "domdomegg") {
			throw new Error(`Only @domdomegg can perform resets! 🚨`)
		}

		execSync(`cp state_reset.json state.json`)
		require('./updateReadme.js')
		require('./commit.js')(`Reset bookings`)

		octokit.issues.createComment({
			owner: event.repository.owner.login,
			repo: event.repository.name,
			issue_number: event.issue.number,
			body: `Successfully reset bookings 🎉`
		});
		octokit.issues.update({
			owner: event.repository.owner.login,
			repo: event.repository.name,
			issue_number: event.issue.number,
			state: "closed"
		});
	}
}

try {
	main();
} catch (error) {
	console.error(error.message)

	Promise.all([
		octokit.issues.createComment({
			owner: event.repository.owner.login,
			repo: event.repository.name,
			issue_number: event.issue.number,
			body: error.message
		}),
		octokit.issues.update({
			owner: event.repository.owner.login,
			repo: event.repository.name,
			issue_number: event.issue.number,
			state: "closed"
		}),
	]).then(() => {
		process.exit(1)
	}).catch(() => {
		console.error("Failed to post comment and close issue")
		process.exit(1)
	})
}