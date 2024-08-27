const authUserDB = {
  users: require('../data/userAuth.json'),
  setUsers(data) {
    this.users = data;
  },
};

const authHandler = (req, res) => {
  const { username } = req.body;

  const foundUser = authUserDB.users.find(
    (person) => person.username === username
  );

  if (!foundUser)
    return res
      .status(404)
      .json({ error: 'pls enter correct username or password' });

  res.status(200).json({
    message: `${foundUser.username} your logged in`,
    accessToken: foundUser.accessToken,
  });
};

module.exports = { authHandler };
