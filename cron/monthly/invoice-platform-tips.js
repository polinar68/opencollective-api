#!/usr/bin/env node
import '../../server/env';

import config from 'config';
import debugLib from 'debug';
import { entries, groupBy, round, sumBy } from 'lodash';
import moment from 'moment';

import expenseStatus from '../../server/constants/expense_status';
import expenseTypes from '../../server/constants/expense_type';
import { FEES_ON_TOP_SETTLEMENT_EXPENSE_PROPERTIES, TransactionTypes } from '../../server/constants/transactions';
import models, { sequelize } from '../../server/models';

// Only run on the first of the month
const today = new Date();
if (config.env === 'production' && today.getDate() !== 1) {
  console.log('OC_ENV is production and today is not the first of month, script aborted!');
  process.exit();
}

const debug = debugLib('invoice-platform-tips');

export async function run() {
  const [monthTransactions] = await sequelize.query(`
    select
      ot.description,
      ot."createdAt",
      ot."CollectiveId",
      ot."OrderId",
      ot."HostCollectiveId",
      h."name" as "HostName",
      h."currency" as "HostCurrency",
      t."netAmountInCollectiveCurrency" as "amount",
      t.id,
      t.data,
      t."PlatformTipForTransactionGroup",
      c."slug" as "CollectiveSlug",
      pm."service"
    from "Transactions" t
    left join "Transactions" ot on t."PlatformTipForTransactionGroup"::uuid = ot."TransactionGroup" and ot.type = 'CREDIT' and ot."PlatformTipForTransactionGroup" is null
    left join "Collectives" h on ot."HostCollectiveId" = h.id
    left join "Collectives" c on ot."CollectiveId" = c.id
    left join "PaymentMethods" pm on t."PaymentMethodId" = pm.id
    where t."createdAt" >= date_trunc('month', now() - interval '1 month') and t."createdAt" < date_trunc('month', now())
    and t."deletedAt" is null
    and t."CollectiveId" = 1
    and t."PlatformTipForTransactionGroup" is not null
    and t."type" = 'CREDIT'
    and pm.service != 'stripe';
  `);
  const byHost = groupBy(monthTransactions, 'HostCollectiveId');
  const today = moment.utc();

  for (const [hostId, hostTransactions] of entries(byHost)) {
    const { HostName, HostCurrency } = hostTransactions[0];
    debug(`Host ${HostName} (#${hostId}) owes ${hostTransactions.length} transactions (${HostCurrency})`);
    let items = hostTransactions.map(t => ({
      incurredAt: t.createdAt,
      amount: round(t.amount / (t.data.hostToPlatformFxRate || 1)),
      description: `Platform Tip from order ${t.CollectiveSlug}/${t.OrderId}`,
    }));
    const transactionIds = hostTransactions.map(t => t.id);
    const totalAmount = sumBy(items, i => i.amount);

    // Credit the Host with platform tips collected during the month
    await models.Transaction.create({
      amount: totalAmount,
      amountInHostCurrency: totalAmount,
      CollectiveId: hostId,
      CreatedByUserId: 30,
      currency: HostCurrency,
      description: `Collected Platform Tips in ${moment.utc().subtract(1, 'month').format('MMMM')}`,
      FromCollectiveId: FEES_ON_TOP_SETTLEMENT_EXPENSE_PROPERTIES.FromCollectiveId,
      HostCollectiveId: hostId,
      hostCurrency: HostCurrency,
      netAmountInCollectiveCurrency: totalAmount,
      type: TransactionTypes.CREDIT,
    });

    // Create the Expense
    const expense = await models.Expense.create({
      ...FEES_ON_TOP_SETTLEMENT_EXPENSE_PROPERTIES,
      amount: totalAmount,
      CollectiveId: hostId,
      currency: HostCurrency,
      data: { isPlatformTipSettlement: true, transactionIds },
      description: `Platform Tips settlement for ${moment.utc().subtract(1, 'month').format('MMMM')}`,
      incurredAt: today,
      lastEditedById: 30,
      status: expenseStatus.APPROVED,
      type: expenseTypes.INVOICE,
      UserId: 30,
      // privateMessage
      // invoiceInfo
      // vat
    });
    // Create Expense Items
    items = items.map(i => ({ ...i, ExpenseId: expense.id }));
    await models.ExpenseItem.bulkCreate(items);
  }
  process.exit();
}

if (require.main === module) {
  run();
}
