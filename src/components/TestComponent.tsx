'use client';

import React from 'react';

export function TestComponent() {
  return (
    <div className="p-4 m-4 bg-blue-100 rounded-lg shadow" style={{padding: '16px', margin: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
      <h2 className="text-2xl text-blue-800 font-bold mb-2 test-text" style={{fontSize: '24px', color: '#1e40af', fontWeight: 'bold', marginBottom: '8px'}}>
        Test Component
      </h2>
      <p className="text-gray-700" style={{color: '#374151'}}>
        This component has Tailwind CSS classes. If you can see blue styling, Tailwind is working!
      </p>
      <button 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors test-bg" 
        style={{marginTop: '16px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px'}}
      >
        Test Button
      </button>
    </div>
  );
} 