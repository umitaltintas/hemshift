
import React from 'react';

interface ErrorProps {
  message: string;
}

const Error: React.FC<ErrorProps> = ({ message }) => {
  return (
    <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded">
      {message}
    </div>
  );
};

export default Error;
