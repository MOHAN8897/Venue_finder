import React from 'react';

const EnvironmentCheck: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  if (isDevelopment) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-xs z-50">
        <div>ENV Check:</div>
        <div>SUPABASE_URL: {supabaseUrl ? '✅' : '❌'}</div>
        <div>SUPABASE_KEY: {supabaseAnonKey ? '✅' : '❌'}</div>
        <div>MODE: {isDevelopment ? 'DEV' : isProduction ? 'PROD' : 'UNKNOWN'}</div>
      </div>
    );
  }
  
  return null;
};

export default EnvironmentCheck; 