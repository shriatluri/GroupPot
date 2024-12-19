const groups = [];

exports.getGroup = (req, res) => {
  const group = groups.find(g => g.id === req.params.groupId);
  res.json(group);
};

exports.createGroup = (req, res) => {
  const { name, createdBy } = req.body;
  const newGroup = { id: Date.now(), name, createdBy, players: [], games: [] };
  groups.push(newGroup);
  res.status(201).json(newGroup);
};

exports.addPlayerToGroup = (req, res) => {
  const { groupId } = req.params;
  const { playerId } = req.body;
  const group = groups.find(g => g.id === groupId);
  group.players.push(playerId);
  res.json(group);
};

exports.recordBuyIn = (req, res) => {
  const { groupId } = req.params;
  const { playerId, amount } = req.body;
  const group = groups.find(g => g.id === groupId);
  const player = group.players.find(p => p.id === playerId);
  player.buyIns.push(amount);
  player.totalBuyIn += amount;
  res.json(player);
};