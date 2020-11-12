import { expect } from 'chai';

import FEATURE from '../../../../server/constants/feature';
import FEATURE_STATUS from '../../../../server/constants/feature-status';
import { getFeatureStatusResolver } from '../../../../server/graphql/common/features';
import { fakeCollective, fakeConnectedAccount, fakeHost, fakeUpdate } from '../../../test-helpers/fake-data';

describe('server/graphql/common/features', () => {
  describe('getFeatureStatusResolver', () => {
    describe('UPDATES', () => {
      it('Returns UNSUPPORTED when the feature is not supported', async () => {
        const collective = await fakeCollective({ type: 'USER' });
        const result = await getFeatureStatusResolver(FEATURE.UPDATES)(collective);
        expect(result).to.eq(FEATURE_STATUS.UNSUPPORTED);
      });

      it('Returns DISABLED when the feature is disabled', async () => {
        const collective = await fakeCollective({ type: 'COLLECTIVE', settings: { features: { updates: false } } });
        const result = await getFeatureStatusResolver(FEATURE.UPDATES)(collective);
        expect(result).to.eq(FEATURE_STATUS.DISABLED);
      });

      it('Returns AVAILABLE if enabled but no update yet', async () => {
        const collective = await fakeCollective({ type: 'COLLECTIVE', settings: { features: { updates: true } } });
        const result = await getFeatureStatusResolver(FEATURE.UPDATES)(collective);
        expect(result).to.eq(FEATURE_STATUS.AVAILABLE);
      });

      it("Returns ACTIVE if enabled and there's data", async () => {
        const collective = await fakeCollective({ type: 'COLLECTIVE', settings: { features: { updates: true } } });
        await fakeUpdate({ CollectiveId: collective.id, publishedAt: Date.now() });
        const result = await getFeatureStatusResolver(FEATURE.UPDATES)(collective);
        expect(result).to.eq(FEATURE_STATUS.ACTIVE);
      });
    });
  });
});
