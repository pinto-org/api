const typeDefs = `
  type Query {
    health: String!
  }
`;

const resolvers = {
  Query: {
    health: () => 'oks'
  }
};

module.exports = { typeDefs, resolvers };
