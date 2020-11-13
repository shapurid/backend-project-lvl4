export const checkSignedIn = (req, reply, done) => {
  if (!req.signedIn) {
    reply.forbidden();
    return reply;
  }
  return done();
};

export const checkProfileOwnership = (req, reply, done) => {
  const normalizedUserId = Number.parseInt(req.params.id, 10);
  if (normalizedUserId !== req.session.get('userId')) {
    reply.forbidden();
    return reply;
  }
  return done();
};

export const checkTaskOwnership = (req, reply, done) => {
  const normalizedCreatorId = Number.parseInt(req.params.creatorId, 10);
  if (normalizedCreatorId !== req.session.get('userId')) {
    reply.forbidden();
    return reply;
  }
  return done();
};
