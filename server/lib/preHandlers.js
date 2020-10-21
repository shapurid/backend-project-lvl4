export const checkSignedIn = (req, reply, done) => {
  if (!req.signedIn) {
    reply.forbidden();
  }
  done();
};

export const checkProfileOwnership = (req, reply, done) => {
  const normalizedUserId = Number.parseInt(req.currentUser.id, 10);
  const normalizedRouteId = Number.parseInt(req.params.id, 10);
  if (!req.signedIn || (normalizedRouteId !== normalizedUserId)) {
    reply.forbidden();
  }
  done();
};

export const checkTaskOwnership = (req, reply, done) => {
  const normalizedCreatorId = Number.parseInt(req.params.creatorId, 10);
  const normalizedUserId = Number.parseInt(req.currentUser.id, 10);
  console.log(normalizedCreatorId, normalizedUserId);
  if (!req.signedIn || (normalizedCreatorId !== normalizedUserId)) {
    reply.forbidden();
  }
  done();
};
