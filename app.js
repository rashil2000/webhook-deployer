require('dotenv').config();
var express = require('express');
var GithubWebHook = require('express-github-webhook');
var exec = require('child_process').exec;

var app = express();

app.use(require('morgan')('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(require('cookie-parser')());

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

const numHandler = Number(process.env.HANDLER_COUNT);
const handlerObj = {};

for (var i = 1; i <= numHandler; i++) {
  handlerObj[process.env[`REPO_${i}`]] = {
    hook: GithubWebHook({ path: '/' + process.env[`REPO_${i}`], secret: process.env[`SECRET_${i}`] }),
    command: process.env[`COMMAND_${i}`],
    commitUrl: process.env[`COMMITS_${i}`]
  };
  app.use(handlerObj[process.env[`REPO_${i}`]].hook);
  handlerObj[process.env[`REPO_${i}`]].hook.on('push', function (repo, data) {
    logPushEvent(repo);
    exec(handlerObj[repo].command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: \n${error}`);
        return;
      }
      console.log(`stdout: \n${stdout}`);
      console.error(`stderr: \n${stderr}`);
      slackPost(repo, data.commits, handlerObj[repo].commitUrl);
    });
  });
}

app.use(express.static(require('path').join(__dirname, 'public')));

module.exports = app;
