# Jira Issues Reminder Action

## Automatically send notifications for Jira issues in Slack.

### Description
This GitHub Action allows you to automatically send notifications for Jira issues to a specified Slack channel. It integrates with Jira, Slack, and GitHub to help you stay informed about important issues waiting for your attention.

### Inputs
#### webhook-url (required)
The Webhook URL for your Slack workspace.

#### channel (optional, default: '#general')
The Slack channel name where notifications will be sent.

#### jira-username (required)
Your Jira username.

#### jira-password (required)
Your Jira API token.

#### jira-host (required)
The hostname of your Jira instance.

#### jira-board-id (required)
The Jira board ID, e.g., 12.

#### jira-custom-filter (optional)
A custom JQL filter to specify which issues to be notified about, e.g., "project = TEST".

### Usage
To use this GitHub Action, you can add it to your workflow as follows:

```yaml
name: Jira Board Summarize

on:
  schedule:
    - cron: '0 0 * * *' # Schedule this action to run daily

jobs:
  jira-reminder:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Run Jira Issues Reminder
      uses: your-username/jira-board-action@v1
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
        jira-username: ${{ secrets.JIRA_USERNAME }}
        jira-password: ${{ secrets.JIRA_API_TOKEN }}
        jira-host: your-jira-hostname
        jira-board-id: 12
```
Remember to set up the necessary secrets in your GitHub repository for secure access to sensitive information.
