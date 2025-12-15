const { ApolloServer } = require('@apollo/server');
const { typeDefs, resolvers } = require('./schema');
const { koaMiddleware } = require('@as-integrations/koa');

const initGraphql = async (router) => {
  const apollo = new ApolloServer({
    typeDefs,
    resolvers
  });
  await apollo.start();

  router.all('/graphql', koaMiddleware(apollo));
};
module.exports = initGraphql;
