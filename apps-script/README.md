# Mailer deployment

`Code.gs` is deployed to Google Apps Script by `.github/workflows/deploy-mailer.yml` on every push to `main` that changes this folder (or run it by hand from the Actions tab).

One-time setup:
1. Turn on the Apps Script API: https://script.google.com/home/usersettings
2. On your machine: `npm i -g @google/clasp`, then `clasp login` (sign in as the account that should send the emails).
3. GitHub repo > Settings > Secrets and variables > Actions > New repository secret:
   - `CLASPRC_JSON` = full contents of `~/.clasprc.json` (Windows: `%USERPROFILE%\.clasprc.json`)
   - `APPS_SCRIPT_ID` = Apps Script > Project Settings > Script ID
   - `APPS_SCRIPT_DEPLOYMENT_ID` = Deploy > Manage deployments > the web app's Deployment ID
Never commit these values.

The emails are sent as the account used in `clasp login`; the sender address is set by `TEAM_FROM` in `Code.gs`.

Deploys run automatically from GitHub Actions.
