const express = require('express');
const { calculatePayouts } = require('./payout');
const { getGroup, createGroup, addPlayerToGroup, recordBuyIn } = require('./groupService');

const app = express();
app.use(express.json());

// Group management routes
app.get('/api/groups/:groupId', getGroup);
app.post('/api/groups', createGroup);
app.put('/api/groups/:groupId/players', addPlayerToGroup);
app.post('/api/groups/:groupId/buy-in', recordBuyIn);

// Payout calculation route
app.post('/api/payouts', calculatePayouts);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});