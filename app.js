require('dotenv').config();
var express = require('express');
var GithubWebHook = require('express-github-webhook');
var exec = require('child_process').exec;

var webhookHandler1 = GithubWebHook({ path: '/' + process.env.REPO_1, secret: process.env.SECRET_1 });
var webhookHandler2 = GithubWebHook({ path: '/' + process.env.REPO_2, secret: process.env.SECRET_2 });
var webhookHandler3 = GithubWebHook({ path: '/' + process.env.REPO_3, secret: process.env.SECRET_3 });
var webhookHandler4 = GithubWebHook({ path: '/' + process.env.REPO_4, secret: process.env.SECRET_4 });

var app = express();

app.use(require('morgan')('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(require('cookie-parser')());

app.use(webhookHandler1);
app.use(webhookHandler2);
app.use(webhookHandler3);
app.use(webhookHandler4);

var logPushEvent = repo => console.log(` ${(new Date((new Date()).toISOString().replace('Z', '-05:30'))).toISOString().slice(0, -1)} : 'push' event on repository : ${repo}\n`);

var slackPost = async (project, commitsArray, commitsUrl) => {
  var changeLog = '_';
  for (var item of commitsArray) changeLog += '⋆ ' + item.message + '_\n_';
  changeLog += '_';

  const messageBody = {
    "text": `Redeployment of ${project} complete`,
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Pulled most recent changes and redeployed ${project}`
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": " - Changes: "
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": changeLog
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Visit <https://github.com/${commitsUrl}|github.com/${commitsUrl}> for a complete list of commits.`
        }
      }
    ]
  };

  try {
    const response = await require('node-fetch')(process.env.SLACK_URL, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageBody),
      redirect: 'follow'
    });
    const result = await response.text();
    return console.log(result);
  } catch (err) {
    return console.log('Error', err);
  }
}

webhookHandler1.on('push', function (repo, data) {
  logPushEvent(repo);
  slackPost(repo, data.commits, process.env.COMMITS_1);
  exec(process.env.COMMAND_1);
});

webhookHandler2.on('push', function (repo, data) {
  logPushEvent(repo);
  slackPost(repo, data.commits, process.env.COMMITS_2);
  exec(process.env.COMMAND_2);
});

webhookHandler3.on('push', function (repo, data) {
  logPushEvent(repo);
  slackPost(repo, data.commits, process.env.COMMITS_3);
  exec(process.env.COMMAND_3);
});

webhookHandler4.on('push', function (repo, data) {
  logPushEvent(repo);
  slackPost(repo, data.commits, process.env.COMMITS_4);
  exec(process.env.COMMAND_3);
});

app.use(express.static(require('path').join(__dirname, 'public')));

module.exports = app;
