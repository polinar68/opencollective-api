import { GraphQLEnumType } from 'graphql';

export const ProcessHostApplicationAction = new GraphQLEnumType({
  name: 'ProcessHostApplicationAction',
  description: 'Action taken for an account application to the host',
  values: {
    APPROVE: { description: 'Approve the account request to be hosted' },
    REJECT: { description: 'Rejects the account request to be hosted' },
  },
});
