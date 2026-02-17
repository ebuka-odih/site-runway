import React from 'react';
import LandingLegalPage from './LandingLegalPage';

const RiskDisclosurePage: React.FC = () => {
  return (
    <LandingLegalPage
      eyebrow="Risk Notice"
      title="Risk Disclosure"
      summary="Trading financial instruments involves significant risk. Review this disclosure carefully before using the platform or funding a trading account."
      lastUpdated="February 17, 2026"
      sections={[
        {
          heading: 'Market Risk',
          paragraphs: [
            'Prices for stocks, ETFs, crypto assets, and related instruments can move rapidly and without warning.',
            'You may lose part or all of your invested capital, including capital allocated to copied strategies.',
          ],
        },
        {
          heading: 'Execution and Liquidity Risk',
          paragraphs: [
            'Execution prices may differ from expected prices during volatility, reduced liquidity, or network delays.',
            'Past performance metrics shown for traders or assets are informational and do not guarantee future returns.',
          ],
        },
        {
          heading: 'User Responsibility',
          paragraphs: [
            'You are responsible for your trading decisions, position sizing, and risk controls.',
            'Only trade with funds you can afford to lose, and consider professional financial advice where appropriate.',
          ],
        },
      ]}
    />
  );
};

export default RiskDisclosurePage;
