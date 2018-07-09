'use strict';


var buildCommit = require('./buildCommit');
var log = require('winston');


var isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
};

module.exports = {

  getQuestions: function(config, cz) {

    // normalize config optional options
    var scopeOverrides = config.scopeOverrides || {};
    var messages = config.messages || {};
    var entry = config.entry
    var types = Object.keys(entry).map(key => {
      return {
        name: entry[key].name,
        value: entry[key].value
      }
    })

    messages.type = messages.type || 'Select the type of change that you\'re committing:';
    messages.scope = messages.scope || '\nDenote the SCOPE of this change (optional):';
    messages.customScope = messages.customScope || 'Denote the SCOPE of this change:';
    messages.subject = messages.subject || 'Write a SHORT, IMPERATIVE tense description of the change:\n';
    messages.body = messages.body || 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n';
    messages.breaking = messages.breaking || 'List any BREAKING CHANGES (optional):\n';
    messages.footer = messages.footer || 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n';
    messages.confirmCommit = messages.confirmCommit || 'Are you sure you want to proceed with the commit above?'
    var questions = [
      {
        type: 'list',
        name: 'type',
        message: messages.type,
        choices: types
      },
      {
        type: 'list',
        name: 'scope',
        message: function (answers) {
         return entry[answers.type].scope ? entry[answers.type].scope.message : message.scope
        },
        choices: function(answers) {
          var scopes = [];
          if (scopeOverrides[answers.type]) {
            scopes = scopes.concat(scopeOverrides[answers.type]);
          } else {
            scopes = scopes.concat(config.scopes);
          }
          if (entry[answers.type].scope.custom || scopes.length === 0) {
            scopes = scopes.concat([
              new cz.Separator(),
              { name: 'empty', value: false },
              { name: 'custom', value: 'custom' }
            ]);
          }
          return scopes;
        },
        when: function(answers) {
          if (!entry[answers.type].scope) {
            return false;
          }
          var hasScope = false;
          if (scopeOverrides[answers.type]) {
            hasScope = !!(scopeOverrides[answers.type].length > 0);
          } else {
            hasScope = !!(config.scopes && (config.scopes.length > 0));
          }
          if (!hasScope) {
            answers.scope = 'custom';
            return false;
          } else {
            return isNotWip(answers);
          }
        }
      },
      {
        type: 'input',
        name: 'scope',
        message: function (answers) {
          return entry[answers.type].scope ? entry[answers.type].scope.message : message.scope
        },
        when: function(answers) {
          return answers.scope === 'custom' && entry[answers.type].scope;
        }
      },
      {
        type: 'input',
        name: 'subject',
        message: function (answers) {
          return entry[answers.type].subject ? entry[answers.type].subject.message : message.subject
        },
        validate: function(value) {
          return !!value;
        },
        filter: function(value) {
          return value.charAt(0).toLowerCase() + value.slice(1);
        },
        when: (answers) => {
          return entry[answers.type].subject;
        }
      },
      {
        type: 'input',
        name: 'body',
        message: function (answers) {
          return entry[answers.type].body ? entry[answers.type].body.message : message.body
        },
        when: function (answers) {
          return entry[answers.type].body
        }
      },
      {
        type: 'input',
        name: 'breaking',
        message: function (answers) {
          return entry[answers.type].breaking ? entry[answers.type].breaking.message : message.breaking
        },
        when: function(answers) {
          if (config.allowBreakingChanges && config.allowBreakingChanges.indexOf(answers.type.toLowerCase()) >= 0) {
            return entry[answers.type].breaking;
          }
          return entry[answers.type].breaking; // no breaking changes allowed unless specifed
        }
      },
      {
        type: 'input',
        name: 'footer',
        message: function (answers) {
          return entry[answers.type].footer ? entry[answers.type].footer.message : message.footer
        },
        when: function (answers) {
          return isNotWip && entry[answers.type].footer;
        }
      },
      {
        type: 'expand',
        name: 'confirmCommit',
        choices: [
          { key: 'y', name: 'Yes', value: 'yes' },
          { key: 'n', name: 'Abort commit', value: 'no' },
          { key: 'e', name: 'Edit message', value: 'edit' }
        ],
        message: function(answers) {
          var SEP = '###--------------------------------------------------------###';
          log.info('\n' + SEP + '\n' + buildCommit(answers, config) + '\n' + SEP + '\n');
          return messages.confirmCommit;
        },
        when: function (answers) {
          return true;
        }
      }
    ];

    return questions;
  }
};
