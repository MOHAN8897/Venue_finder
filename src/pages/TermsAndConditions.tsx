import React from 'react';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                By accessing and using VenueFinder ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                VenueFinder is a platform that connects venue owners with individuals and organizations seeking to book venues for events. Our service includes venue listings, booking management, and related services.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">3. User Accounts</h2>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                </p>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                </p>
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">4. Venue Listings and Bookings</h2>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">4.1 Venue Owners</h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Venue owners are responsible for providing accurate and up-to-date information about their venues, including availability, pricing, and amenities. Venue owners must honor confirmed bookings and maintain the quality standards advertised.
                </p>
                
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">4.2 Venue Renters</h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Venue renters are responsible for providing accurate booking information and adhering to the venue's rules and policies. Payment must be made according to the agreed terms, and cancellations must follow the venue's cancellation policy.
                </p>
                
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">4.3 Booking Confirmation</h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Bookings are confirmed only after payment is received and the venue owner accepts the booking. VenueFinder acts as an intermediary and is not responsible for disputes between venue owners and renters.
                </p>
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">5. Payment Terms</h2>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  All payments are processed through secure third-party payment processors. VenueFinder charges a service fee on bookings, which is clearly disclosed before payment.
                </p>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Refunds are subject to the venue's cancellation policy and VenueFinder's refund policy. Service fees are non-refundable unless the booking is cancelled due to a breach by the venue owner.
                </p>
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
              </p>
              <ul className="list-disc pl-4 sm:pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation</li>
                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
                <li>To introduce any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful</li>
              </ul>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                The Service and its original content, features, and functionality are and will remain the exclusive property of VenueFinder and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">8. Privacy Policy</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                In no event shall VenueFinder, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">10. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                Any disputes arising from the use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall be conducted in English and the seat of arbitration shall be New York, NY.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 text-sm sm:text-base">
                  <strong>Email:</strong> legal@venuefinder.com<br />
                  <strong>Phone:</strong> +1 (555) 123-4567<br />
                  <strong>Address:</strong> 123 Venue Street, Suite 100, New York, NY 10001
                </p>
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">13. Governing Law</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the State of New York, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">14. Severability</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">15. Entire Agreement</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">
                These Terms constitute the entire agreement between you and VenueFinder regarding the use of the Service, superseding any prior agreements between you and VenueFinder relating to your use of the Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 