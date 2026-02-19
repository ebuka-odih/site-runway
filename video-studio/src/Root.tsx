import React from 'react';
import {Composition, Folder} from 'remotion';
import {FeatureTourVideo, type FeatureTourProps} from './compositions/FeatureTour';
import {
  MissionCenteredTourVideo,
  type MissionCenteredTourProps,
} from './compositions/MissionCenteredTour';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const makeDuration = (seconds: number): number => seconds * FPS;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="RunwayAlgo-Tours">
        <Composition
          id="RunwayFeatureTour60"
          component={FeatureTourVideo}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={makeDuration(60)}
          defaultProps={{targetSeconds: 60} satisfies FeatureTourProps}
        />
        <Composition
          id="RunwayFeatureTour120"
          component={FeatureTourVideo}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={makeDuration(120)}
          defaultProps={{targetSeconds: 120} satisfies FeatureTourProps}
        />
        <Composition
          id="RunwayFeatureTour180"
          component={FeatureTourVideo}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={makeDuration(180)}
          defaultProps={{targetSeconds: 180} satisfies FeatureTourProps}
        />
      </Folder>

      <Folder name="RunwayAlgo-Centered-Mission">
        <Composition
          id="RunwayMissionCentered60"
          component={MissionCenteredTourVideo}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={makeDuration(60)}
          defaultProps={{targetSeconds: 60} satisfies MissionCenteredTourProps}
        />
        <Composition
          id="RunwayMissionCentered120"
          component={MissionCenteredTourVideo}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={makeDuration(120)}
          defaultProps={{targetSeconds: 120} satisfies MissionCenteredTourProps}
        />
        <Composition
          id="RunwayMissionCentered180"
          component={MissionCenteredTourVideo}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={makeDuration(180)}
          defaultProps={{targetSeconds: 180} satisfies MissionCenteredTourProps}
        />
      </Folder>
    </>
  );
};
