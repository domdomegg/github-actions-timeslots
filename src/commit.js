module.exports = message => {
	const { execSync } = require('child_process');

	execSync(`git config --global user.name "GitHub Actions"`)
	execSync(`git config --global user.email "actions@github.com"`)
	execSync(`git checkout master`)
	execSync(`git add ..`)
	execSync(`git commit -m "${message}"`)
	execSync(`git push --set-upstream origin "HEAD:master"`)
}