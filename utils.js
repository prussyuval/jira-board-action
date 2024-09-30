const axios = require('axios');

const STATUS_SORTING = ['Design', 'In Progress', 'Review'];

function getColors(daysGap) {
  if (daysGap <= 0) {
      return ":large_green_circle:";
  }

  if (daysGap === 1) {
    return ":large_yellow_circle:";
  }

  if (daysGap === 2) {
    return ":large_orange_circle:";
  }

  return ":red_circle:";
}

function formatMessage(assigneeDisplayName, statusMap, totalDaysLeft, jiraHost, daysInSprint, daysPassed) {
  let message = `*${assigneeDisplayName}*\n`;

  for (const status of STATUS_SORTING) {
    let issues = statusMap[status];
    if (issues) {
      message += `\`${status}\`\n`;
      issues.forEach((issue) => {
        let remainingDays = getRemainingDays(issue);
        message += `https://${jiraHost}/browse/${issue.key} - ${issue.fields.summary} (\`${remainingDays}\` days left) \n`
      });
    }
  }

  message += `*${getColors(totalDaysLeft - (daysInSprint - daysPassed))} Total days left: ${totalDaysLeft}*\n\n`;
  return message;
}

function getRemainingDays(issue) {
  let issueFields = issue.fields;

  if (issueFields.aggregatetimeoriginalestimate !== null) {
     return issueFields.aggregatetimeoriginalestimate / 3600 / 8;
  }

  let timeTrackingDays = issueFields.timetracking;

  let estimationDays = timeTrackingDays.originalEstimateSeconds / 3600 / 8;

  if (timeTrackingDays.remainingEstimateSeconds === undefined) {
    return estimationDays;
  }
  return timeTrackingDays.remainingEstimateSeconds / 3600 / 8;
}

/**
 * Create a pretty message to print
 * @param {String} jiraHost Jira hostname
 * @param {Object} issuesByAssignee Array of issues
 * @param {Object} jiraToGithubMapping Object with the mapping between Jira and GitHub users
 * @param {String} channel Channel to send the message
 * @return {object} Response object from Jira API
 */
function formatSlackMessage(jiraHost, issuesByAssignee, jiraToGithubMapping, channel) {
  let message = '';

  const daysInSprint = 10;
  const daysPassed = 9;

  for (let [assignee, issues] of Object.entries(issuesByAssignee)) {
    let totalDaysLeft = 0;
    let assigneeDisplayName = issues[0].fields.assignee.displayName;

    let statusMap = {};

    for (const issue of issues) {
      let issueFields = issue.fields;
      let timeTrackingDays = issueFields.timetracking;

      if (timeTrackingDays.originalEstimateSeconds === undefined) {
        // Skip issues without estimation
        continue;
      }

      let status = issueFields.status.name;
      if (!statusMap[status]) {
        statusMap[status] = [];
      }
      statusMap[status].push(issue);
      totalDaysLeft += getRemainingDays(issue);
    }

    message += formatMessage(assigneeDisplayName, statusMap, totalDaysLeft, jiraHost, daysInSprint, daysPassed);
  }

  return {
    channel: channel,
    username: 'Jira board summarize',
    text: message,
  };
}

/**
 * Send notification to a channel
 * @param {String} webhookUrl Webhook URL
 * @param {Object} messageData Message data object to send into the channel
 * @return {Promise} Axios promise
 */
async function sendNotification(webhookUrl, messageData) {
  return await axios({
    method: 'POST',
    url: webhookUrl,
    data: messageData,
  });
}

/**
 * Convert a string like "name1->ID123,name2->ID456" to an Object { name1: "ID123", name2: "ID456"}
 * @param {String} str String to convert to Object
 * @return {Object} Object with Account IDs as properties and IDs as values
 */
function stringToObject(str) {
  const map = {};
  if (!str) {
    return map;
  }

  const userPattern = /([\w-:]+->\w+)/g;
  let users = [];
  let match = null;
  do {
      match = userPattern.exec(str);
      if(match) {
          users.push(match[0]);
      }
  } while (match);

  users.forEach((user) => {
    const [github, provider] = user.split('->');
    map[github] = provider;
  });
  return map;
}

module.exports = {
  formatSlackMessage,
  sendNotification,
  stringToObject,
};


