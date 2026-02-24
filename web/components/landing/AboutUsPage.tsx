import React from 'react';
import LandingLegalPage from './LandingLegalPage';

const AboutUsPage: React.FC = () => {
  return (
    <LandingLegalPage
      eyebrow="Company"
      title="About PrologezPrime"
      summary="PrologezPrime is a trading platform focused on clear market access, practical automation, and execution tools designed for both developing and experienced traders."
      lastUpdated="February 17, 2026"
      sections={[
        {
          heading: 'Who We Are',
          paragraphs: [
            'PrologezPrime is built to simplify complex market workflows without removing the depth needed by active traders.',
            'Our product combines multi-asset market visibility, portfolio controls, and copy-trading workflows inside one dashboard.',
          ],
        },
        {
          heading: 'What We Build',
          paragraphs: [
            'We provide tools for order placement, account funding, watchlists, and strategy monitoring across supported markets.',
            'Our design approach prioritizes speed, reliability, and clear decision support rather than cluttered interfaces.',
          ],
        },
        {
          heading: 'How We Operate',
          paragraphs: [
            'PrologezPrime maintains operational controls for account verification, transaction review, and security monitoring.',
            'Platform policies and legal disclosures are maintained as separate documents so users can review obligations and risks before trading.',
          ],
        },
      ]}
    />
  );
};

export default AboutUsPage;
