# RunwayAlgo Product Video Plan

Target output range: 1 to 3 minutes  
Primary edit preset: 2:00 (`RunwayFeatureTour120`)

## Story objective

Show the complete user journey from landing page trust + positioning into dashboard utility, with special focus on card-based data clarity, smooth transitions, and premium motion.

## Scene-by-scene plan (2:00 baseline)

1. **Intro Brand Snapshot (00:00-00:08)**
   - Route context: `landing /`
   - Focus: Brand reveal, value signal, high-level metrics.
   - Transition in/out: Fade in, fade to hero.

2. **Landing Hero + CTA (00:08-00:20)**
   - Route context: `landing /`
   - Focus: Headline, "Access Terminal" CTA, floating market motifs.
   - Transition in/out: Directional slide to market scanner.

3. **Market Scanner Block (00:20-00:34)**
   - Route context: `/#markets`
   - Focus: US stocks + crypto + ETF visibility.
   - Transition in/out: Wipe into features grid.

4. **Core Feature Cards (00:34-00:48)**
   - Route context: `/#copy-trading` and `#security-node`
   - Focus: Lightning execution, copy trading, military-grade safety.
   - Transition in/out: Slide into authenticated dashboard.

5. **Dashboard Home (00:48-01:04)**
   - Route context: `/dashboard/home`
   - Focus: `PortfolioCard`, `AssetList`, `Analytics` card data.
   - Transition in/out: Slide to trade flow.

6. **Trade Hub (01:04-01:18)**
   - Route context: `/dashboard/trade`
   - Focus: Live tabs, asset rows, trading desk CTA.
   - Transition in/out: Fade into copy module.

7. **Copy Trading (01:18-01:32)**
   - Route context: `/dashboard/copy`
   - Focus: Discover/follow/history tabs + summary cards.
   - Transition in/out: Slide into wallet/security.

8. **Wallet + Profile Trust Layer (01:32-01:46)**
   - Route context: `/dashboard/wallet` + `/dashboard/profile`
   - Focus: Funding lifecycle, status steps, account/security controls.
   - Transition in/out: Wipe into final CTA.

9. **Outro + Final CTA (01:46-02:00)**
   - Route context: landing CTA recap
   - Focus: Positioning summary, closing action line.
   - Transition in/out: Controlled fade out.

## Duration strategy

- **1:00 version**: Keep all 9 scenes but reduce hold times per scene.
- **2:00 version**: Recommended default for balanced storytelling.
- **3:00 version**: Extend dashboard scenes (Home, Trade, Copy, Wallet/Profile) for deeper feature explanation.

## Card-focused coverage plan

Prioritize these card-heavy modules in footage captures and overlays:

1. `web/components/PortfolioCard.tsx`
2. `web/components/Analytics.tsx`
3. `web/components/AssetList.tsx`
4. `web/components/CopyTrading.tsx`
5. `web/components/WalletPage.tsx`

## Transition and animation language

- Scene transitions: alternating fade, directional slide, and wipe.
- In-scene animation:
  - Staggered bullet reveals for narrative pacing.
  - Spring entrance for metric cards.
  - Dynamic chart-bar movement to avoid static UI moments.
- Keep camera movement minimal and deliberate (no aggressive zoom jitter).

## Capture order recommendation

1. Landing: hero, markets, features, CTA.
2. Dashboard Home.
3. Trade tab.
4. Copy tab.
5. Wallet and Profile.
6. Closing CTA on landing.

This order minimizes re-navigation overhead and keeps motion continuity coherent in post.
