import { get } from 'lodash';

import { types } from '../constants/collectives';
import FEATURE from '../constants/feature';

// Please refer to and update https://docs.google.com/spreadsheets/d/15ppKaZJCXBjvY7-AjjCj3w5D-4ebLQdEowynJksgDXE/edit#gid=0

const FeatureAllowedForTypes = {
  // 1. Contribute
  [FEATURE.CONTRIBUTE]: [types.USER, types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  [FEATURE.CONTRIBUTIONS]: [types.USER, types.ORGANIZATION, types.COLLECTIVE,  types.FUND],
  [FEATURE.RECURRING_CONTRIBUTIONS]: [types.USER, types.ORGANIZATION, types.COLLECTIVE,  types.FUND],
  // 2. Events/Projects
  [FEATURE.EVENTS]: [types.ORGANIZATION, types.COLLECTIVE],
  [FEATURE.PROJECTS]: [types.FUND],
  // 3. Budget
  [FEATURE.BUDGET]: [types.USER, types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  [FEATURE.TRANSACTIONS]: [types.USER, types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  [FEATURE.EXPENSES]: [types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  [FEATURE.COLLECTIVE_GOALS]: [types.COLLECTIVE, types.ORGANIZATION],
  [FEATURE.TOP_FINANCIAL_CONTRIBUTORS]: [types.COLLECTIVE, types.ORGANIZATION, types.FUND],
  [FEATURE.ALL_FINANCIAL_CONTRIBUTORS]:[types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  // 4. Connect
  [FEATURE.CONNECT]: [types.ORGANIZATION, types.COLLECTIVE],
  [FEATURE.CONVERSATIONS]: [types.COLLECTIVE, types.ORGANIZATION],
  [FEATURE.UPDATES]: [types.COLLECTIVE, types.ORGANIZATION],
  // 5. About
  [FEATURE.ABOUT]: [types.USER, types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  [FEATURE.TEAM]: [types.ORGANIZATION, types.COLLECTIVE, types.EVENT, types.FUND, types.PROJECT],
  // Other
  [FEATURE.CONTACT_FORM]: [types.COLLECTIVE, types.EVENT],
};

/**
 * A map of paths to retrieve the value of a feature flag from a collective
 */
export const OPT_OUT_FEATURE_FLAGS = {
  [FEATURE.CONTACT_FORM]: 'settings.features.contactForm',
  [FEATURE.CONVERSATIONS]: 'settings.features.conversations', 
  [FEATURE.UPDATES]: 'settings.features.updates', 
};

export const OPT_IN_FEATURE_FLAGS = {
  [FEATURE.CROSS_CURRENCY_MANUAL_TRANSACTIONS]: 'settings.features.crossCurrencyManualTransactions',
  [FEATURE.COLLECTIVE_GOALS]: 'settings.features.showGoals', 
};

// const OPT_OUT_COLLECTIVE_PAGE_FEATURE_FLAGS = [FEATURE.CONVERSATIONS, FEATURE.UPDATES]
// const OPT_IN_COLLECTIVE_PAGE_FEATURE_FLAGS = [FEATURE.COLLECTIVE_GOALS]


/**
 * Returns true if feature is allowed for this collective type, false otherwise.
 */
export const isFeatureAllowedForCollectiveType = (  collectiveType: types,
  isHost: boolean,
  feature: FEATURE,): boolean => {
    console.log('isFeatureAllowedForCollectiveType', 'collectiveType', collectiveType, 'isHost', isHost,'feature',feature)
  const allowedTypes = FeatureAllowedForTypes[feature];
  const allowedForType = allowedTypes ? allowedTypes.includes(collectiveType) : true;
  console.log('allowed?', allowedForType)
  const orgFeaturesOnlyAllowedForHostOrgs = [
    FEATURE.EXPENSES,
    FEATURE.COLLECTIVE_GOALS,
    FEATURE.TOP_FINANCIAL_CONTRIBUTORS,
  ]

  if (!allowedForType) {
    console.log('not allowed for type')
    return false;
  }

  // Check if allowed for host orgs but not normal orgs
  if (collectiveType === types.ORGANIZATION && orgFeaturesOnlyAllowedForHostOrgs.includes(feature) && !isHost) {
    console.log('ths feature only allowed for hosts')
    return false;
  }

  return true;
};

export const hasOptedOutOfFeature = (collective, feature): boolean => {
  const optOutFlag = OPT_OUT_FEATURE_FLAGS[feature];
  return optOutFlag ? get(collective, optOutFlag) === false : false;
};

export const hasOptedInForFeature = (collective, feature): boolean => {
  const optOutFlag = OPT_IN_FEATURE_FLAGS[feature];
  return get(collective, optOutFlag) === true;
};

// const hasOptedOutOfCollectivePageFeature = (collective, feature): boolean => {
//   const collectivePageSettings = get(collective, 'settings.collectivePage.sections')
//   const section = collectivePageSettings.find(s => s.section === feature);
//   console.log(section)
//   return section?.isEnabled || false;
// }

// const hasOptedInForCollectivePageFeature = (collective, feature): boolean => {
//   const collectivePageSettings = get(collective, 'settings.collectivePage.sections')
//   const section = collectivePageSettings.find(s => s.section === feature);
//   console.log(section)
//   return section?.isEnabled || false;
// }

/**
 * If a given feature is allowed for the collective type, check if it is activated for collective.
 */
export const hasFeature = (collective, feature: FEATURE): boolean => {
  if (!collective) {
    return false;
  }

  // // Check collective type
  // if (!isFeatureAllowedForCollectiveType(collective.type, collective.isHostAccount, feature)) {
  //   return false;
  // }


  // Check opt-out flags
  if (feature in OPT_OUT_FEATURE_FLAGS) {
    return !hasOptedOutOfFeature(collective, feature);
  }

  // Check opt-in flags
  if (feature in OPT_IN_FEATURE_FLAGS) {
    return hasOptedInForFeature(collective, feature);
  }

  // // Check collective page optional flags
  // if (OPT_OUT_COLLECTIVE_PAGE_FEATURE_FLAGS.includes(feature)) {
  //   return hasOptedOutOfCollectivePageFeature(collective, feature);
  // }

  // if (OPT_IN_COLLECTIVE_PAGE_FEATURE_FLAGS.includes(feature)) {
  //   return hasOptedInForCollectivePageFeature(collective, feature);
  // }

  return true;
  
};

export { FEATURE };