import Boom from 'boom';
import Joi from 'joi';
import _ from 'lodash';
import { findRelationships } from '../../../../lib/management/saved_objects/relationships';

export function registerRelationships(server) {
  server.route({
    path: '/api/kibana/management/saved_objects/relationships/{type}/{id}',
    method: ['GET'],
    config: {
      validate: {
        params: Joi.object().keys({
          type: Joi.string(),
          id: Joi.string(),
        }),
        query: Joi.object().keys({
          size: Joi.number(),
        })
      },
    },

    handler: async (req, reply) => {
      const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');
      const boundCallWithRequest = _.partial(callWithRequest, req);

      const type = req.params.type;
      const id = req.params.id;
      const size = req.query.size || 10;

      try {
        const response = await findRelationships(
          type,
          id,
          size,
          boundCallWithRequest,
          req.getSavedObjectsClient(),
        );

        reply(response);
      }
      catch (err) {
        reply(Boom.boomify(err, { statusCode: 500 }));
      }
    }
  });
}
