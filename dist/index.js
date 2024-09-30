/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 327:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const axios = __nccwpck_require__(160);

/**
 * Get Jira issues using Jira API
 * @param {String} username Jira username
 * @param {String} password Jira API Key
 * @param {String} jiraHost Jira hostname
 * @param {String} jiraBoardId Jira board ID
 * @param {String} jiraCustomFilter Jira custom filter for the query URL
 * @return {object} Response object from Jira API
 */
async function getJiraIssues(username, password, jiraHost, jiraBoardId, jiraCustomFilter) {
  let url = `https://${jiraHost}/rest/agile/1.0/board/${jiraBoardId}/issue`;
  if (jiraCustomFilter) {
    url += `?maxResults=1000&jql=${jiraCustomFilter}`;
  }
  const authorization = Buffer.from(`${username}:${password}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${authorization}`,
  }

  // console.log(`Jira API URL: ${url}`);
  // console.log(`Headers: ${JSON.stringify(headers)}`);

  try {
    return await axios({method: 'GET', url: url, headers: headers});
  } catch (error) {
    console.error(`Failed to get Jira issues: ${error}`);
    console.error(error.response.data);
    throw new Error(error);
  }
}

module.exports = {
  getJiraIssues,
};


/***/ }),

/***/ 722:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const axios = __nccwpck_require__(160);

function formatMessage(assigneeDisplayName, statusMap, totalDaysLeft, daysInSprint, daysPassed) {
  let message = `*${assigneeDisplayName}*\n`;
  for (const [status, issues] of Object.entries(statusMap)) {
    message += `${status}:\n`;
    issues.forEach((issue) => {
      message += ` - ${issue.key} - ${issue.fields.summary}\n`
    });
  }

  message += `Total days left: ${totalDaysLeft}\n\n`;
  return message;
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
  const daysPassed = 3;

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

      let estimationDays = timeTrackingDays.originalEstimateSeconds / 3600 / 8;

      let remainingDays;
      if (timeTrackingDays.remainingEstimateSeconds === undefined) {
        remainingDays = estimationDays;
      } else {
        remainingDays = timeTrackingDays.remainingEstimateSeconds / 3600 / 8;
      }

      totalDaysLeft += remainingDays;
    }

    message += formatMessage(assigneeDisplayName, statusMap, totalDaysLeft, daysInSprint, daysPassed);
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




/***/ }),

/***/ 859:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 160:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(859);

const {
  getJiraIssues,
} = __nccwpck_require__(327);
const {
  formatSlackMessage,
  sendNotification,
  stringToObject,
} = __nccwpck_require__(722);


/**
 * Main function for the GitHub Action
 */
async function main() {
  try {
    const webhookUrl = core.getInput('webhook-url');
    const channel = core.getInput('channel');
    const jiraToGithubMapping = core.getInput('jira-github-map');
    const jiraUsername = core.getInput('jira-username');
    const jiraPassword = core.getInput('jira-password');
    const jiraHost = core.getInput('jira-host');
    const jiraBoardId = core.getInput('jira-board-id');
    const jiraCustomFilter = core.getInput('jira-custom-filter');

    // Get jira issues
    core.info('Getting jira issues...');
    const jiraResponse = await getJiraIssues(jiraUsername, jiraPassword, jiraHost, jiraBoardId, jiraCustomFilter);
    const issues = jiraResponse.data.issues;

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

    if (issuesByAssignee.length) {
      const usersMap = stringToObject(jiraToGithubMapping);

      core.info('Users map:');
      for (const [github, provider] of Object.entries(usersMap)) {
        core.info(`${github} => ${provider}`);
      }

      const message = formatSlackMessage(
          jiraHost, issuesByAssignee, usersMap, channel
      );
      const response = await sendNotification(webhookUrl, message);
      core.info(`Request message: ${JSON.stringify(message)}`);
      core.info(`Response status: ${response.status}`);
      core.info(`Response data: ${JSON.stringify(response.data)}`);
      core.info(`Notification was sent successfully!`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();

module.exports = __webpack_exports__;
/******/ })()
;