// Gamification Dashboard mailer — paste this over the whole existing script (Code.gs).
// Deploy: Deploy > Manage deployments > pencil > Version: New version > Execute as: Me, Who has access: Anyone in talabat.com.
//
// SENDER: every email is sent From TEAM_FROM only. The script refuses to send if it cannot do that,
// so it never falls back to a manager's own address. Ways to make it work (pick one):
//   A) Deploy this script while signed in as the gamification.team@talabat.com account, or
//   B) In the deploying account's Gmail: Settings > Accounts > "Send mail as" > add gamification.team@talabat.com.
// Reply-To is the assigning manager (must be listed in MANAGERS below).
var TEAM_FROM = 'gamification.team@talabat.com';
var TEAM_NAME = 'Gamification Dashboard';
var ALLOWED_DOMAIN = '@talabat.com'; // only send to company addresses
var MANAGERS = ['anoud.shehata@talabat.com', 'rawan.kamaleldin@talabat.com']; // allowed Reply-To addresses
// true = refuse to send unless From is TEAM_FROM. While the team mailbox does not exist yet, keep false:
// mail is then sent from the deploying account but shows the name TEAM_NAME (set true once TEAM_FROM is set up).
var REQUIRE_TEAM_SENDER = false;

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var to = String(d.to || '').trim().toLowerCase();
    if (!to || to.slice(-ALLOWED_DOMAIN.length) !== ALLOWED_DOMAIN) {
      return ContentService.createTextOutput('rejected');
    }
    var subject = String(d.subject || 'Dashboard update');
    var body = String(d.body || '');
    var opts = { name: TEAM_NAME };
    var replyTo = String(d.replyTo || '').trim().toLowerCase();
    opts.replyTo = MANAGERS.indexOf(replyTo) > -1 ? replyTo : TEAM_FROM;
    if (d.htmlBody) opts.htmlBody = String(d.htmlBody);

    // Server-side duplicate guard: the same eventKey is only sent once per 6 hours.
    var cache = CacheService.getScriptCache();
    var cacheKey = d.eventKey ? 'sent:' + Utilities.base64EncodeWebSafe(String(d.eventKey + '|' + to)).slice(0, 240) : '';
    if (cacheKey && cache.get(cacheKey)) return ContentService.createTextOutput('duplicate-skipped');

    // Must go out as TEAM_FROM: either the script runs as that account, or it is a "Send mail as" alias.
    var me = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
    if (me !== TEAM_FROM) {
      if (GmailApp.getAliases().indexOf(TEAM_FROM) > -1) opts.from = TEAM_FROM;
      else if (REQUIRE_TEAM_SENDER) return ContentService.createTextOutput('error: sender ' + TEAM_FROM + ' is not set up (see header of this script)');
    }

    GmailApp.sendEmail(to, subject, body, opts);
    if (cacheKey) cache.put(cacheKey, '1', 21600);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

// Test from the Apps Script editor: pick testEmails and press Run. Sends two sample emails to you.
// Scenario: Anoud is the team member, Rawan is the manager who assigned the article.
function testEmails() {
  var member = 'anoud.shehata@talabat.com', manager = 'rawan.kamaleldin@talabat.com';
  var mk = function (o) { return { postData: { contents: JSON.stringify(o) } }; };
  // Email 1 -> member. From = team address, Reply-To = Rawan, body says "Assigned by: Rawan".
  Logger.log(doPost(mk({ to: member, replyTo: manager, eventKey: 'test-assign-' + Date.now(), subject: 'TEST New article assigned: Sample',
    body: 'Hi Anoud,\n\nA new article was assigned to you.\n\nArticle: Sample\nAssigned date: today\nAssigned by: Rawan' })).getContent());
  // Email 2 -> the assigning manager (Rawan in a real run; sent to Anoud here so you can see it).
  Logger.log(doPost(mk({ to: member, eventKey: 'test-done-' + Date.now(), subject: 'TEST Article completed: Sample',
    body: 'Hi Rawan,\n\nAnoud marked an article as Done.\n\nTeam member: Anoud\nArticle: Sample\nDone date: today\nAssigned date: today' })).getContent());
}

function doGet() {
  return ContentService.createTextOutput('Gamification mailer is running');
}

// Run once: removes every time trigger in this project (old weekly / notification email jobs).
function removeOldTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
}
