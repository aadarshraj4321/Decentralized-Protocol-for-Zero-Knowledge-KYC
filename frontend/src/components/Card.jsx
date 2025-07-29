import React from 'react';

function Card({ title, children }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {title && <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>}
      <div>{children}</div>
    </div>
  );
}
export default Card;