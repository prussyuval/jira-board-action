const core = require('@actions/core');

const {
  getJiraIssues,
} = require('./jira');
const {
  formatSlackMessage,
  sendNotification,
  stringToObject,
} = require('./utils');


/**
 * Main function for the GitHub Action
 */
async function main() {
  try {
    const webhookUrl = core.getInput('webhook-url');
    const channel = core.getInput('channel');
    const jiraUsername = core.getInput('jira-username');
    const jiraPassword = core.getInput('jira-password');
    const jiraHost = core.getInput('jira-host');
    const jiraBoardId = core.getInput('jira-board-id');
    const jiraCustomFilter = core.getInput('jira-custom-filter');

    // Get jira issues
    core.info('Getting jira issues...');
    const jiraResponse = await getJiraIssues(jiraUsername, jiraPassword, jiraHost, jiraBoardId, jiraCustomFilter);
    const issues = jiraResponse.data.issues;

    console.log(issues.length);

    let issuesByAssignee = {};
    for (const issue of issues) {
      const issueFields = issue.fields;

      if ('assignee' in issueFields && issueFields.assignee !== null) {
        let assignee = issueFields.assignee;
        if (!issuesByAssignee[assignee.accountId]) {
          issuesByAssignee[assignee.accountId] = [];
        }
        issuesByAssignee[assignee.accountId].push(issue);
      }
    }

    const message = formatSlackMessage(
        jiraHost, issuesByAssignee, channel
    );
    const response = await sendNotification(webhookUrl, message);
    core.info(`Request message: ${JSON.stringify(message)}`);
    core.info(`Response status: ${response.status}`);
    core.info(`Response data: ${JSON.stringify(response.data)}`);
    core.info(`Notification was sent successfully!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
