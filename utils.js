const axios = require('axios');

const STATUS_SORTING = ['design', 'pipeline', 'in progress', 'review'];

function getColors(totalDaysInProgress, totalDaysInReview, daysLeftInSprint) {
  if ((totalDaysInProgress + totalDaysInReview) <= daysLeftInSprint) {
      return ":large_green_circle:";
  }

  if ((totalDaysInProgress + (totalDaysInReview / 2)) <= daysLeftInSprint) {
    return ":large_yellow_circle:";
  }

  if (totalDaysInProgress <= daysLeftInSprint) {
    return ":large_orange_circle:";
  }

  return ":red_circle:";
}

function formatMessage(assigneeDisplayName, statusMap, totalDaysInProgress, totalDaysInReview, jiraHost, daysInSprint, daysPassed) {
  let message = `*${assigneeDisplayName}*\n`;

  for (const status of STATUS_SORTING) {
    let issues = statusMap[status];
    if (issues) {
      message += `\`${status}\`\n`;
      issues.forEach((issue) => {
        let remainingDays = getRemainingDays(issue);
        message += `<https://${jiraHost}/browse/${issue.key}|${issue.fields.summary}> - \`${remainingDays}\` days left\n`
      });
    }
  }

  message += `*${getColors(totalDaysInProgress, totalDaysInReview, daysInSprint - daysPassed)} Total days left: ${totalDaysInProgress + totalDaysInReview}*\n\n`;
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

function getCurrentDate() {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();

  return dd + '/' + mm + '/' + yyyy;
}

/**
 * Create a pretty message to print
 * @param {String} jiraHost Jira hostname
 * @param {Object} issuesByAssignee Array of issues
 * @param {String} channel Channel to send the message
 * @param {Date} sprintStartDate Sprint start date
 * @param {Date} sprintEndDate Sprint end date
 * @return {object} Response object from Jira API
 */
function formatSlackMessage(jiraHost, issuesByAssignee, channel, sprintStartDate, sprintEndDate) {
  let blocks = [
      {
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": `Board Summary - ${getCurrentDate()}`,
				"emoji": true
			}
		}
  ];


  const daysInSprint = Math.round((sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24));
  const workDaysInSprint = daysInSprint - (daysInSprint * 2 / 7);
  let daysRemaining = Math.ceil((sprintEndDate - new Date()) / (1000 * 60 * 60 * 24));
  daysRemaining = daysRemaining - (Math.floor(daysRemaining / 7) * 2);

  for (let [assignee, issues] of Object.entries(issuesByAssignee)) {
    let totalDaysInProgress = 0;
    let totalDaysInReview = 0;

    let assigneeDisplayName = issues[0].fields.assignee.displayName;

    let statusMap = {};

    for (const issue of issues) {
      let issueFields = issue.fields;
      let timeTrackingDays = issueFields.timetracking;

      if (timeTrackingDays.originalEstimateSeconds === undefined) {
        // Skip issues without estimation
        continue;
      }

      let status = issueFields.status.name.toLowerCase();
      if (!statusMap[status]) {
        statusMap[status] = [];
      }
      statusMap[status].push(issue);

      let remainingDays = getRemainingDays(issue);
      if (status === 'review') {
        totalDaysInReview += remainingDays;
      } else {
        totalDaysInProgress += remainingDays;
      }
    }

    blocks.push(
        {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": formatMessage(assigneeDisplayName, statusMap, totalDaysInProgress, totalDaysInReview, jiraHost, workDaysInSprint, daysRemaining),
			},
		},
    );
    blocks.push({type: 'divider'});
  }

  blocks.pop();

  return {
    channel: channel,
    username: 'Jira board summarize',
    blocks: blocks,
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


