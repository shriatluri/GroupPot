exports.calculatePayouts = (req, res) => {
    const { players } = req.body;
  
    if (!players || players.length === 0) {
      return res.status(400).json({ message: "Players data is required." });
    }
  
    const payouts = calculatePayouts(players);
    res.json({ message: "Payouts calculated successfully", payouts });
  };
  
  function calculatePayouts(players) {
    // Minimalistic logic to balance payouts
    const totalIn = players.reduce((sum, p) => sum + (p.amountIn || 0), 0);
    const totalOut = players.reduce((sum, p) => sum + (p.amountOut || 0), 0);
    const balance = totalIn - totalOut;
  
    return players.map((player) => ({
      name: player.name,
      payout: player.amountOut - player.amountIn - balance / players.length,
    }));
  }