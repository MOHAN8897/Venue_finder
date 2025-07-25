import React from 'react';

const About: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center justify-center">
    <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">About Us</h1>
      <p className="text-lg text-gray-700 mb-4">
        <strong>VenueFinder</strong> is your trusted platform for discovering, booking, and managing event venues with ease. Our mission is to connect venue owners and customers, making the process of finding the perfect space for any occasion simple, transparent, and secure.
      </p>
      <p className="text-gray-600 mb-2">
        Whether you're planning a cricket match, a family gathering, a corporate event, or a celebration, VenueFinder offers a curated selection of venues to suit every need. We prioritize quality, convenience, and customer satisfaction at every step.
      </p>
      <p className="text-gray-600">
        Thank you for choosing VenueFinder. If you have any questions or feedback, please <a href="/contactus" className="text-blue-600 underline">contact us</a>.
      </p>
    </div>
  </div>
);

export default About; 