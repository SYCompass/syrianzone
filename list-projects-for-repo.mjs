// list-projects-for-repo.js
// List all projects for a given repository
// Usage: node list-projects-for-repo.js <owner> <repo>

import { Octokit } from "@octokit/rest";
import fs from 'fs';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const owner = 'SYCompass';
const repo = 'syrianzone';

const issuesResponse = await octokit.rest.issues.listForRepo({
    owner,
    repo,
});

const board = {
    todo: [],
    inProgress: [],
    done: [],
}

// add issues to the board
for (const issue of issuesResponse.data) {
    const labels = issue.labels.map(label => label.description);
    // remove the label from the issue
    issue.labels = issue.labels.filter(label => label.description !== 'in_progress' && label.description !== 'todo' && label.description !== 'done');
    if (labels.includes('in_progress')) {
        board.inProgress.push(issue);
    } else if (labels.includes('todo')) {
        board.todo.push(issue);
    } else if (labels.includes('done')) {
        board.done.push(issue);
    }
}

fs.writeFileSync('board/board.json', JSON.stringify(board, null, 2));