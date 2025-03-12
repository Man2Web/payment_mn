const adminAuthMiddleware = (req, res, next) => {
  if (req.session && req.session.token) return next();
  res.redirect("/admin/auth?error=Please log in");
};

module.exports = adminAuthMiddleware;
