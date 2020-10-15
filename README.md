# Webhooks

## [webhooks.rashil2000.me](https://webhooks.rashil2000.me)

### Endpoint for GitHub webhook notifications

An [Express.js](https://expressjs.com/) server using the [express-github-webhook](https://www.npmjs.com/package/express-github-webhook/) package that listens for webhook events on personal repositories, pulls changes into the remote server and redeploys the projects automatically. Also sends notifications regarding the latest changes to a Slack workspace using Slack's Hooks API.
