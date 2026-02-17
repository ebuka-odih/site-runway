import React from 'react';
import LandingLegalPage from './LandingLegalPage';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LandingLegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      summary="This policy explains how RunwayAlgo collects, uses, stores, and protects personal and account data when you use the platform."
      lastUpdated="February 17, 2026"
      sections={[
        {
          heading: 'Information We Collect',
          paragraphs: [
            'We collect account identity data, profile details, transaction records, and platform activity needed to operate your account.',
            'We may process technical usage data such as device metadata, session information, and security logs.',
          ],
        },
        {
          heading: 'How We Use Data',
          paragraphs: [
            'Data is used for account access, trading services, compliance checks, fraud prevention, and support operations.',
            'We use operational telemetry to improve platform performance and maintain system reliability.',
          ],
        },
        {
          heading: 'Data Protection and Rights',
          paragraphs: [
            'Sensitive data is protected with layered access controls and security monitoring.',
            'You may request profile updates or account-related support through official support channels where applicable by law.',
          ],
        },
      ]}
    />
  );
};

export default PrivacyPolicyPage;
