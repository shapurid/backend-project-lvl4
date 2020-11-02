export const checkSignedIn = (req, reply, done) => {
  if (!req.signedIn) {
    reply.forbidden();
    return reply;
  }
  done();
  return reply;
};

export const checkProfileOwnership = (req, reply, done) => {
  const normalizedRouteId = Number.parseInt(req.params.id, 10);
  if (!req.signedIn || (normalizedRouteId !== req.session.get('userId'))) {
    reply.forbidden();
    return reply;
  }
  done();
  return reply;
};

export const checkTaskOwnership = (req, reply, done) => {
  const normalizedCreatorId = Number.parseInt(req.params.creatorId, 10);
  if (!req.signedIn || (normalizedCreatorId !== req.session.get('userId'))) {
    reply.forbidden();
    return reply;
  }
  done();
  return reply;
};
