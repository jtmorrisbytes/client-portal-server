function getUser(req, res) {
  res.json({ user: req.session.user || null });
}
module.exports = { getUser };
