import { parseInt } from 'lodash';

export const checkSignedIn = (req, reply, done) => {
  if (!req.signedIn) {
    reply.forbidden();
  }
  done();
};

export const checkProfileOwnership = (req, reply, done) => {
  const normalizedUserId = parseInt(req.currentUser.id);
  const normalizedRouteId = parseInt(req.params.id);
  if (!req.signedIn || normalizedRouteId !== normalizedUserId) {
    reply.forbidden();
  }
  done();
};
