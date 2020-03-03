const fs = require('fs');
/** @type {{ columns: string[], rows: string[], bookings: { by: string, column: string, row: string }[] }} */
const state = require("./state.json")
const DIVIDER = "<!-- ⁕ -->"
const NEW_ISSUE_LINK = "https://github.com/domdomegg/github-actions-timeslots/issues/new";

const currentReadme = fs.readFileSync("../README.md", "utf8")

const bits = currentReadme.split(DIVIDER);
if (bits.length != 3) {
	throw new Error(`Readme is wonky, has ${bits.length - 1} divider${bits.length - 1 == 1 ? '' : 's'} but expected 2!`) 
}

const table = [
	`|Time|${state.columns.map(column => `${column}`).join('|')}|`,
	`|-|${state.columns.map(_ => `-`).join('|')}|`,
	...state.rows.map(row => `|${row}|${state.columns.map(column => {
		const booking = state.bookings.find(b => b.column == column && b.row == row)
		if (booking) return `[\`@${booking.by}\`](https://github.com/${booking.by})`
		
		return `[Available](${encodeURI(`${NEW_ISSUE_LINK}?labels=booking&title=Booking for ${column} ${row}&body=This is a booking for ${column} ${row}\n\n\n<!-- Do not change the line below, or use the flower punctuation mark anywhere else -->\n<!-- ⁕${JSON.stringify({ column, row })}⁕ -->)`)}`
	}).join('|')}|`)
].join("\n")

fs.writeFileSync('../README.md', `${bits[0]}${DIVIDER}\n\n${table}\n\n${DIVIDER}${bits[2]}`);