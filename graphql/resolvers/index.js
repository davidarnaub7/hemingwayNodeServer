const authResolver = require('./auth');
const postResolver = require('./post');
const verifyResolver = require('./verify');
const profileResolver = require('./profile');
const suggestionResolver = require('./suggestions');
const interactionsResolver = require('./interactions');
const serveResolver = require('./serve');

const rootResolver = {
  ...authResolver,
  ...postResolver,
  ...verifyResolver,
  ...profileResolver,
  ...suggestionResolver,
  ...interactionsResolver,
  ...serveResolver,
};

module.exports = rootResolver;