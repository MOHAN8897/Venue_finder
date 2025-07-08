import React from 'react';
import BookingApprovalManager from '../components/BookingApprovalManager';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BookingSettingsPage: React.FC = () => {
    const location = useLocation();
    const { venueName } = location.state || { venueName: 'Your Venue' };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <Link to="/owner-dashboard" className="flex items-center text-sm text-blue-600 hover:underline mb-2">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Booking Settings</h1>
                    <p className="text-lg text-gray-600">
                        Venue: <span className="font-semibold">{venueName}</span>
                    </p>
                </header>

                <main>
                    <BookingApprovalManager />
                </main>
            </div>
        </div>
    );
};

export default BookingSettingsPage; 