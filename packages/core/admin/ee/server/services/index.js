'use strict';

module.exports = {
  passport: require('./passport'),
  role: require('./role'),
  user: require('./user'),
  'seat-enforcement': require('./seat-enforcement'),
  workflows: require('./review-workflows/workflows'),
  stages: require('./review-workflows/stages'),
  'review-workflows': require('./review-workflows/review-workflows'),
  'review-workflows-decorator': require('./review-workflows/entity-service-decorator'),
};
