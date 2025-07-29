import React from 'react';

function RequestCard({ verifierName, policy, onApprove, onDeny }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">Request from:</p>
        <p className="text-lg font-bold text-gray-900">{verifierName}</p>
        <p className="text-sm text-gray-500 mt-1">Policy: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{policy}</span></p>
      </div>
      <div className="flex space-x-3">
        <button 
          onClick={onDeny}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Deny
        </button>
        <button 
          onClick={onApprove}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
          Approve
        </button>
      </div>
    </div>
  );
}
export default RequestCard;