const fs = require('fs');

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN,
	userAgent: 'domdomegg/github-actions-timeslots'
});

const event = require(process.env.GITHUB_EVENT_PATH)
/** @type {{ columns: string[], rows: string[], bookings: { by: string, column: string, row: string }[] }} */
const state = require("./state.json")

const main = () => {
	if (event.issue && event.issue.body && event.issue.body) {
		if (event.issue.labels.every(label => label.name != "booking")) {
			console.log("Not labelled with 'booking', ignoring issue") 
			return
		}
	
		const bits = event.issue.body.split('⁕');
		if (bits.length != 3) {
			throw new Error(`Not a valid booking, has ${bits.length - 1} ⁕${bits.length - 1 == 1 ? '' : '\'s'} but should have 2 😕`) 
		}

		/** @type {{ column: string, row: string }} */
		const booking = JSON.parse(bits[1]);
		if (!booking.column) throw new Error(`Booking is missing a column 😕`) 
		if (!booking.row) throw new Error(`Booking is missing a row 😕`) 

		if (!state.columns.includes(booking.column)) throw new Error(`The column ${booking.column} does not exist 😕`)
		if (!state.rows.includes(booking.row)) throw new Error(`The column ${booking.row} does not exist 😕`)

		const conflictingBooking = state.bookings.find(b => b.column == booking.column && b.row == booking.row)
		if (conflictingBooking) throw new Error(`That timeslot is already booked by ${conflictingBooking.by} 😞`)

		state.bookings.push({ column: booking.column, row: booking.row, by: event.issue.user.login })
		fs.writeFileSync('./state.json', JSON.stringify(state, null, 4));

		require('./updateReadme.js')
		
		try {
			require('./commit.js')(`Add booking for @${event.issue.user.login} at ${booking.column} ${booking.row}`)
		} catch {
			throw new Error("Failed to commit booking - this usually happens because the desired slot has just been booked by someone else 😞")
		}

		octokit.issues.createComment({
			owner: event.repository.owner.login,
			repo: event.repository.name,
			issue_number: event.issue.number,
			body: `Successfully booked at ${booking.column} ${booking.row} 🎉`
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