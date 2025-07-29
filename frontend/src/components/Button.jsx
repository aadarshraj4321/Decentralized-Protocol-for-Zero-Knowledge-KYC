// frontend/src/components/Button.jsx
import React from 'react';

function Button({ type = 'submit', children, ...props }) {
  return (
    <button
      type={type}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;