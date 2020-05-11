async function getUser(req, res) {
  if ((req.session.user || {}).id) {
    const db = req.app.get("db");
    try {
      let result = await db.user.getLoggedIn(req.session.user.id);
      let user = result[0];
      res.json(user || {});
      return;
    } catch (e) {
      console.log(e);
      res.status(500).json({});
    }
  }
  res.json({ user: null });
}
async function getClients(req, res) {
  try {
    res.json((await req.app.get("db").user.getClients()) || []);
  } catch (e) {
    res.status(500).json([]);
  }
}
module.exports = { getUser, getClients };
