import React from 'react';

const EndAmountTracker = ({ totalPotSize, endAmounts }) => {
  const totalEntered = Object.values(endAmounts)
    .reduce((sum, amount) => sum + (Number(amount) || 0), 0);
  
  const remaining = totalPotSize - totalEntered;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Pot</div>
          <div className="font-semibold">${totalPotSize}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Entered</div>
          <div className="font-semibold">${totalEntered}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Remaining</div>
          <div className={`font-semibold ${remaining === 0 ? 'text-green-600' : 'text-blue-600'}`}>
            ${remaining}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndAmountTracker;