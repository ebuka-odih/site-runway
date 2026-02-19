# RunwayAlgo Video Studio (Remotion)

This is an isolated Remotion workspace for marketing/product videos. It does not modify or run inside the existing platform app code.

## What is included

- 3 ready-to-render compositions:
  - `RunwayFeatureTour60` (1:00)
  - `RunwayFeatureTour120` (2:00)
  - `RunwayFeatureTour180` (3:00)
- 3 centered mission compositions (new single-column layout):
  - `RunwayMissionCentered60` (1:00)
  - `RunwayMissionCentered120` (2:00)
  - `RunwayMissionCentered180` (3:00)
- Scene transitions (fade/slide/wipe)
- Animated data cards to highlight card-centric platform metrics
- A detailed production blueprint in `VIDEO_PLAN.md`
- Centered mission blueprint in `VIDEO_PLAN_CENTERED.md`

## Commands

```bash
cd /Users/gnosis/Herd/runwayalgo/video-studio
npm run studio
```

Render outputs:

```bash
npm run render:60
npm run render:120
npm run render:180
```

Centered mission renders:

```bash
npm run render:centered60
npm run render:centered120
npm run render:centered180
```

Generated files are saved in:

- `/Users/gnosis/Herd/runwayalgo/video-studio/out`

## Next production steps

1. Replace placeholder metric values/text per campaign goal.
2. Record/capture exact UI footage from the live landing page + dashboard tabs.
3. Swap in branded assets (logo lockups, testimonials, CTA line) listed in `ASSET_REQUEST.md`.
4. Add voiceover/music pass after visual lock.
