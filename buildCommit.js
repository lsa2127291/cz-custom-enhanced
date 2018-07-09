'use strict';


var wrap = require('word-wrap');


module.exports = function buildCommit(answers, config) {

  var maxLineWidth = 100;
  var entry = config.entry
  var wrapOptions = {
    trim: true,
    newline: '\n',
    indent:'',
    width: maxLineWidth
  };

  function addScope(scope) {
    if (!scope) return '\n'; //it could be type === WIP. So there is no scope

    return ': ' + scope.trim() + '\n';
  }

  function addSubject(subject) {
    var subjectPrefix = (entry[answers.type].subject && entry[answers.type].subject.prefix) || ''
    return subjectPrefix + subject.trim();
  }

  function escapeSpecialChars(result) {
    var specialChars = ['\`'];

    specialChars.map(function (item) {
      // For some strange reason, we have to pass additional '\' slash to commitizen. Total slashes are 4.
      // If user types "feat: `string`", the commit preview should show "feat: `\\string\\`".
      // Don't worry. The git log will be "feat: `string`"
      result = result.replace(new RegExp(item, 'g'), '\\\\`');
    });
    return result;
  }

  // Hard limit this line
  var head = (answers.type + addScope(answers.scope) + addSubject(answers.subject)).slice(0, maxLineWidth);
  // Wrap these lines at 100 characters
  var body = wrap(answers.body, wrapOptions) || '';
  body = body.split('|').join('\n');

  var breaking = wrap(answers.breaking, wrapOptions);
  var footer = wrap(answers.footer, wrapOptions);

  var result = head;
  if (body) {
    var bodyPrefix = (entry[answers.type].body && entry[answers.type].body.prefix) || ''
    result += '\n' + bodyPrefix + body;
  }
  if (breaking) {
    var breakingPrefix = entry && entry[answers.type].breaking && entry[answers.type].breaking.prefix ? entry[answers.type].breaking.prefix : 'BREAKING CHANGE:';
    result += '\n' + breakingPrefix + '\n' + breaking;
  }
  if (footer) {
    var footerPrefix = entry && entry[answers.type].footer.prefix ? entry[answers.type].footer.prefix : 'ISSUES CLOSED:';
    result += '\n' + footerPrefix + footer;
  }
  return escapeSpecialChars(result);
};
