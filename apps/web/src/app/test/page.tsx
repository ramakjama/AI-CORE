'use client';

import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">TEST PAGE</h1>
      <p className="text-lg mb-4">This is a simple test page.</p>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Counter: {count}</h2>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Click Me
        </button>
      </div>

      <div className="mt-8 bg-green-100 border border-green-400 p-6 rounded">
        <h3 className="font-bold text-green-900">If you can click the button and see the counter increase, JavaScript is working!</h3>
      </div>
    </div>
  );
}
