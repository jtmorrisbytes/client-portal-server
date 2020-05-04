async function getUser(req, res) {
  if ((req.session.user || {}).id) {
    const db = req.app.get("db");
    try {
      let result = await db.user.getLoggedIn(req.session.user.id);
      let user = result[0];
      res.json(user || {});
    } catch (e) {
      console.log(e);
      res.status(500).json({});
    }
  }
  res.json({ user: null });
}
module.exports = { getUser };
