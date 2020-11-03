import { GraphQLNonNull, GraphQLString } from 'graphql';

import { activities } from '../../../constants';
import { purgeCacheForCollective } from '../../../lib/cache';
import { handleHostCollectivesLimit } from '../../../lib/plans';
import { stripHTML } from '../../../lib/sanitize-html';
import models from '../../../models';
import { NotFound, Unauthorized, ValidationFailed } from '../../errors';
import { ProcessHostApplicationAction } from '../enum/ProcessHostApplicationAction';
import { AccountReferenceInput, fetchAccountWithReference } from '../input/AccountReferenceInput';
import { Account } from '../interface/Account';

const HostApplicationMutations = {
  processHostApplication: {
    type: new GraphQLNonNull(Account),
    description: 'Reply to a host application',
    args: {
      account: {
        type: new GraphQLNonNull(AccountReferenceInput),
        description: 'The account that applied to the host',
      },
      host: {
        type: new GraphQLNonNull(AccountReferenceInput),
        description: 'The host concerned by the application',
      },
      action: {
        type: new GraphQLNonNull(ProcessHostApplicationAction),
        description: 'What to do with the application',
      },
      message: {
        type: GraphQLString,
        description: 'A message to attach as a reason for the action',
      },
    },
    resolve: async (_, args, req): Promise<Record<string, unknown>> => {
      const account = await fetchAccountWithReference(args.account, { throwIfMissing: true });
      const host = await fetchAccountWithReference(args.host, { throwIfMissing: true });

      if (!req.remoteUser?.isAdmin(host.id)) {
        throw new Unauthorized();
      } else if (account.HostCollectiveId !== host.id) {
        throw new NotFound(`No application found for ${account.slug} in ${host.slug}`);
      } else if (account.approvedAt) {
        throw new ValidationFailed('It looks like this collective application has already been approved');
      }

      switch (args.action) {
        case 'APPROVE':
          return approveApplication(host, account, req.remoteUser);
        case 'REJECT':
          return rejectApplication(host, account, req.remoteUser, args.message);
        default:
          throw new ValidationFailed(`Action ${args.action} is not supported yet`);
      }
    },
  },
};

const approveApplication = async (host, collective, remoteUser) => {
  await handleHostCollectivesLimit(host, { throwHostException: true, notifyAdmins: true });

  await models.Activity.create({
    type: activities.COLLECTIVE_APPROVED,
    UserId: remoteUser.id,
    CollectiveId: host.id,
    data: {
      collective: collective.info,
      host: host.info,
      user: {
        email: remoteUser.email,
      },
    },
  });

  // Approve all events and projects created by this collective
  const events = await collective.getEvents();
  const projects = await collective.getProjects();
  await Promise.all(
    [...events, ...projects].map(event => {
      event.update({ isActive: true, approvedAt: new Date() });
    }),
  );

  purgeCacheForCollective(collective.slug);

  // Approve the collective and return it
  return collective.update({ isActive: true, approvedAt: new Date() });
};

const rejectApplication = async (host, collective, remoteUser, reason: string) => {
  const cleanReason = reason && stripHTML(reason).trim();
  await models.Activity.create({
    type: activities.COLLECTIVE_REJECTED,
    UserId: remoteUser.id,
    CollectiveId: host.id,
    data: {
      collective: collective.info,
      host: host.info,
      user: {
        email: remoteUser.email,
      },
      rejectionReason: cleanReason || null,
    },
  });

  purgeCacheForCollective(collective.slug);
  return collective.changeHost(null, remoteUser);
};

export default HostApplicationMutations;
