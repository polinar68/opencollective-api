enum FEATURE {
  // Collective page main sections (1-5)
  // 1. Contribute
  RECEIVE_FINANCIAL_CONTRIBUTIONS = 'RECEIVE_FINANCIAL_CONTRIBUTIONS',
  CONTRIBUTIONS = 'CONTRIBUTIONS', // show contributions the collective has made
  RECURRING_CONTRIBUTIONS = 'RECURRING_CONTRIBUTIONS',
  // 2. Events/Projects - no features/subsections at the moment
  EVENTS = 'EVENTS',
	PROJECTS = 'PROJECTS',
  // 3. Budget
  BUDGET = 'BUDGET',
  TRANSACTIONS = 'TRANSACTIONS',
  EXPENSES = 'EXPENSES',
  COLLECTIVE_GOALS = 'COLLECTIVE_GOALS',
  RECEIVE_EXPENSES = 'RECEIVE_EXPENSES',
  TOP_FINANCIAL_CONTRIBUTORS = 'TOP_FINANCIAL_CONTRIBUTORS',
  ALL_FINANCIAL_CONTRIBUTORS = 'ALL_FINANCIAL_CONTRIBUTORS',
  // 4. Connect
  CONNECT = 'CONNECT',
  CONVERSATIONS = 'CONVERSATIONS',
  UPDATES = 'UPDATES',
  // 5. About
  ABOUT = 'ABOUT',
  TEAM = 'TEAM',
  // Other
  CONTACT_COLLECTIVE = 'CONTACT_COLLECTIVE',
  CONTACT_FORM = 'CONTACT_FORM',
  CREATE_COLLECTIVE = 'CREATE_COLLECTIVE',
  CROSS_CURRENCY_MANUAL_TRANSACTIONS = 'CROSS_CURRENCY_MANUAL_TRANSACTIONS',
  CONTRIBUTE = 'CONTRIBUTE',
  ORDER = 'ORDER',
  TRANSFERWISE = 'TRANSFERWISE',
  PAYPAL_PAYOUTS = 'PAYPAL_PAYOUTS',
}

export const FeaturesList = Object.values(FEATURE);

export default FEATURE;
