/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from 'expect';
import { FtrProviderContext } from '../../../ftr_provider_context';

import { enrichPoliciesApi } from './lib/enrich_policies.api';
import { enrichPoliciesHelpers } from './lib/enrich_policies.helpers';

export default function ({ getService }: FtrProviderContext) {
  const log = getService('log');

  const { createIndex, deleteIndex, createEnrichPolicy } = enrichPoliciesHelpers(getService);

  const { getAllEnrichPolicies, removeEnrichPolicy, executeEnrichPolicy } =
    enrichPoliciesApi(getService);

  describe('Enrich policies', function () {
    const INDEX_NAME = `index-${Math.random()}`;
    const POLICY_NAME = `policy-${Math.random()}`;

    before(async () => {
      try {
        await createIndex(INDEX_NAME);
        await createEnrichPolicy(POLICY_NAME, INDEX_NAME);
      } catch (err) {
        log.debug('[Setup error] Error creating test index and policy');
        throw err;
      }
    });

    after(async () => {
      try {
        await deleteIndex(INDEX_NAME);
      } catch (err) {
        log.debug('[Cleanup error] Error deleting test index');
        throw err;
      }
    });

    it('should list all policies', async () => {
      const { body } = await getAllEnrichPolicies().expect(200);

      expect(body).toStrictEqual([
        {
          enrichFields: ['firstName'],
          matchField: 'email',
          name: POLICY_NAME,
          sourceIndices: [INDEX_NAME],
          type: 'match',
        },
      ]);
    });

    it('should be able to execute a policy', async () => {
      await executeEnrichPolicy(POLICY_NAME).expect(200);

      // Wait for a little bit for the policy to be executed, so that it can
      // be deleted in the next test.
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should be able to delete a policy', async () => {
      const { body } = await removeEnrichPolicy(POLICY_NAME).expect(200);

      expect(body).toStrictEqual({ acknowledged: true });
    });
  });
}
