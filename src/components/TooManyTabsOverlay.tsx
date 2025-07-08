import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const TooManyTabsOverlay: React.FC<{ handoffPending?: boolean }> = ({ handoffPending }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90">
    {handoffPending ? (
      <>
        <Loader2 className="w-20 h-20 text-blue-500 animate-spin mb-6" />
        <h1 className="text-3xl font-bold mb-2">Switching Tabs...</h1>
        <p className="text-lg text-gray-700 mb-4 max-w-md text-center">
          This tab will become active in a few seconds.<br/>
          Please wait...
        </p>
        <div className="text-2xl">🔄</div>
      </>
    ) : (
      <>
        <AlertTriangle className="w-20 h-20 text-yellow-500 animate-bounce mb-6" />
        <h1 className="text-3xl font-bold mb-2">Whoa! Too Many Tabs!</h1>
        <p className="text-lg text-gray-700 mb-4 max-w-md text-center">
          Looks like you have this app open in more than one tab.<br/>
          Only one tab can be active at a time.<br/>
          <span className="text-sm text-gray-500">(Just like Snapchat Web!)</span>
        </p>
        <div className="text-2xl">😅</div>
        <p className="mt-6 text-gray-500 text-sm">Switch to this tab to make it active, or close other tabs.</p>
      </>
    )}
  </div>
);

export default TooManyTabsOverlay; 