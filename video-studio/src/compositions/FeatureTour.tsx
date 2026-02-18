import React, {useMemo} from 'react';
import {springTiming, TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export type FeatureTourProps = {
	targetSeconds: number;
};

type TransitionKind = 'fade' | 'slide-left' | 'slide-right' | 'wipe-left';

type SceneBlueprint = {
	id: string;
	section: 'Landing Page' | 'User Dashboard';
	routeHint: string;
	title: string;
	subtitle: string;
	bullets: string[];
	cards: Array<{label: string; value: string; delta: string}>;
	palette: {
		backgroundA: string;
		backgroundB: string;
		panel: string;
		accent: string;
		accentSoft: string;
	};
	baseSeconds: number;
	transitionAfter: TransitionKind;
};

type RuntimeScene = SceneBlueprint & {
	index: number;
	durationInFrames: number;
	startFrame: number;
	endFrame: number;
};

const FPS = 30;
const TRANSITION_DURATION_IN_FRAMES = 18;
const MIN_SCENE_FRAMES = 90;

const BASE_SCENES: SceneBlueprint[] = [
	{
		id: 'intro',
		section: 'Landing Page',
		routeHint: '/',
		title: 'RunwayAlgo at a Glance',
		subtitle: 'Set the visual tone and establish platform value in the first 8 seconds.',
		bullets: [
			'Brand reveal with kinetic typography',
			'High-level value statement',
			'Animated metric cards to prime attention',
		],
		cards: [
			{label: 'Markets', value: '40+', delta: 'Global'},
			{label: 'Active Users', value: '850K+', delta: 'Growing'},
			{label: 'Uptime', value: '99.99%', delta: 'Stable'},
		],
		palette: {
			backgroundA: '#03140e',
			backgroundB: '#04191f',
			panel: '#0d1f19',
			accent: '#10b981',
			accentSoft: '#123d30',
		},
		baseSeconds: 8,
		transitionAfter: 'fade',
	},
	{
		id: 'landing-hero',
		section: 'Landing Page',
		routeHint: '/',
		title: 'Hero Narrative + CTA',
		subtitle: 'Highlight the hero message and Access Terminal CTA with motion-driven focus.',
		bullets: [
			'Animated hero headline sweep',
			'CTA pulse + directional arrow motion',
			'Floating market tickers for energy',
		],
		cards: [
			{label: 'Hero CTR Goal', value: '6.5%', delta: 'Target'},
			{label: 'Load Time', value: '<2.0s', delta: 'Fast'},
			{label: 'Primary Action', value: 'Login', delta: 'Visible'},
		],
		palette: {
			backgroundA: '#07130a',
			backgroundB: '#10161f',
			panel: '#141d14',
			accent: '#22c55e',
			accentSoft: '#14381f',
		},
		baseSeconds: 12,
		transitionAfter: 'slide-right',
	},
	{
		id: 'landing-markets',
		section: 'Landing Page',
		routeHint: '/#markets',
		title: 'Live Market Scanner Section',
		subtitle: 'Show real-time market monitoring from the landing page before account entry.',
		bullets: [
			'Charts animate with staggered bars',
			'Category chips: Stocks, Crypto, ETFs',
			'Transition into dashboard context',
		],
		cards: [
			{label: 'Symbols Tracked', value: '15+', delta: 'Visible'},
			{label: 'Data Blocks', value: '3', delta: 'Tabs'},
			{label: 'Section Role', value: 'Top Funnel', delta: 'Awareness'},
		],
		palette: {
			backgroundA: '#09111d',
			backgroundB: '#1b130a',
			panel: '#1a1e26',
			accent: '#38bdf8',
			accentSoft: '#14344a',
		},
		baseSeconds: 14,
		transitionAfter: 'wipe-left',
	},
	{
		id: 'landing-features',
		section: 'Landing Page',
		routeHint: '/#copy-trading',
		title: 'Features Grid: Speed, Copy, Security',
		subtitle: 'Use card-by-card spotlight transitions to emphasize your core ecosystem.',
		bullets: [
			'Card lift animation with subtle parallax',
			'One-feature-at-a-time light sweep',
			'Badge overlays for key value tags',
		],
		cards: [
			{label: 'Execution', value: 'Low Latency', delta: 'Fast'},
			{label: 'Copy Trading', value: 'Auto Mirror', delta: 'Smart'},
			{label: 'Security', value: 'Multi-Layer', delta: 'Safe'},
		],
		palette: {
			backgroundA: '#140b1f',
			backgroundB: '#091414',
			panel: '#1d1724',
			accent: '#a78bfa',
			accentSoft: '#2d2442',
		},
		baseSeconds: 14,
		transitionAfter: 'slide-left',
	},
	{
		id: 'dashboard-home',
		section: 'User Dashboard',
		routeHint: '/dashboard/home',
		title: 'Portfolio Home: Cards + Analytics',
		subtitle: 'Move into authenticated experience and showcase card-centric data hierarchy.',
		bullets: [
			'PortfolioCard value + trend animation',
			'Asset list with live flash states',
			'Analytics cards with risk/allocation bars',
		],
		cards: [
			{label: 'Portfolio Value', value: '$125,430', delta: '+2.4%'},
			{label: 'Risk Score', value: 'Moderate', delta: '55/100'},
			{label: 'Cash Share', value: '23.8%', delta: 'Balanced'},
		],
		palette: {
			backgroundA: '#04140e',
			backgroundB: '#101723',
			panel: '#0f1b17',
			accent: '#10b981',
			accentSoft: '#163a33',
		},
		baseSeconds: 16,
		transitionAfter: 'slide-right',
	},
	{
		id: 'dashboard-trade',
		section: 'User Dashboard',
		routeHint: '/dashboard/trade',
		title: 'Trade Hub + Asset Rows',
		subtitle: 'Demonstrate execution flow and dynamic symbol cards with status transitions.',
		bullets: [
			'Tab transition: Stocks -> Crypto -> History',
			'Open Trading Desk button focus pulse',
			'Live price freshness badge callout',
		],
		cards: [
			{label: 'Symbols', value: '100+', delta: 'Multi-asset'},
			{label: 'Desk Access', value: '1 Tap', delta: 'Immediate'},
			{label: 'Update Cycle', value: '30s', delta: 'Realtime'},
		],
		palette: {
			backgroundA: '#101013',
			backgroundB: '#132113',
			panel: '#1a1f1a',
			accent: '#22c55e',
			accentSoft: '#1f3c28',
		},
		baseSeconds: 14,
		transitionAfter: 'fade',
	},
	{
		id: 'dashboard-copy',
		section: 'User Dashboard',
		routeHint: '/dashboard/copy',
		title: 'Copy Trading Funnel',
		subtitle: 'Highlight discover/follow/history flows and summary KPI cards.',
		bullets: [
			'Discover cards animate with rank emphasis',
			'Following summary counters count up',
			'Modal transition for copy settings',
		],
		cards: [
			{label: 'Following', value: '12', delta: 'Active'},
			{label: 'Allocated', value: '$48,200', delta: 'Capital'},
			{label: 'Total P&L', value: '+$6,410', delta: 'Positive'},
		],
		palette: {
			backgroundA: '#13110b',
			backgroundB: '#0c1615',
			panel: '#1d1a14',
			accent: '#f59e0b',
			accentSoft: '#46351a',
		},
		baseSeconds: 14,
		transitionAfter: 'slide-left',
	},
	{
		id: 'dashboard-wallet-profile',
		section: 'User Dashboard',
		routeHint: '/dashboard/wallet + /dashboard/profile',
		title: 'Wallet + Profile Trust Layer',
		subtitle: 'Cover funding UX and identity/security controls as confidence-building scenes.',
		bullets: [
			'Deposit flow status-step visualization',
			'Withdrawal and proof handling cards',
			'Profile security settings with save states',
		],
		cards: [
			{label: 'Wallet Requests', value: 'Tracked', delta: 'Status'},
			{label: 'Verification', value: 'KYC Ready', delta: 'Compliant'},
			{label: 'Support', value: 'Live Chat', delta: 'Available'},
		],
		palette: {
			backgroundA: '#081120',
			backgroundB: '#18120a',
			panel: '#17222b',
			accent: '#38bdf8',
			accentSoft: '#17374d',
		},
		baseSeconds: 14,
		transitionAfter: 'wipe-left',
	},
	{
		id: 'outro',
		section: 'Landing Page',
		routeHint: '/ (CTA revisit)',
		title: 'Close: CTA + Product Positioning',
		subtitle: 'End with a clean value recap and final action invitation.',
		bullets: [
			'3-card recap of differentiators',
			'Logo lockup with motion blur fade',
			'Final CTA held for clear read time',
		],
		cards: [
			{label: 'Platform Focus', value: 'Speed + Trust', delta: 'Positioning'},
			{label: 'Format', value: '16:9 HD', delta: 'Ready'},
			{label: 'Length', value: '1-3 min', delta: 'Configurable'},
		],
		palette: {
			backgroundA: '#0a0f13',
			backgroundB: '#102011',
			panel: '#131a20',
			accent: '#10b981',
			accentSoft: '#173b33',
		},
		baseSeconds: 14,
		transitionAfter: 'fade',
	},
];

const BASE_TOTAL_SECONDS = BASE_SCENES.reduce((sum, scene) => sum + scene.baseSeconds, 0);

const clampSeconds = (seconds: number): number => {
	if (!Number.isFinite(seconds)) {
		return 120;
	}

	return Math.min(180, Math.max(60, Math.round(seconds)));
};

const toClock = (seconds: number): string => {
	const whole = Math.max(0, Math.round(seconds));
	const mins = Math.floor(whole / 60);
	const secs = whole % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const buildRuntimeScenes = (targetSeconds: number, fps: number): RuntimeScene[] => {
	const targetFrames = clampSeconds(targetSeconds) * fps;
	const overlapsTotal = TRANSITION_DURATION_IN_FRAMES * (BASE_SCENES.length - 1);
	const requiredSequenceFrames = targetFrames + overlapsTotal;
	const scale = requiredSequenceFrames / (BASE_TOTAL_SECONDS * fps);

	const durations = BASE_SCENES.map((scene) =>
		Math.max(MIN_SCENE_FRAMES, Math.round(scene.baseSeconds * fps * scale)),
	);

	let diff = requiredSequenceFrames - durations.reduce((sum, duration) => sum + duration, 0);
	let pointer = 0;

	while (diff !== 0) {
		const index = pointer % durations.length;
		if (diff > 0) {
			durations[index] += 1;
			diff -= 1;
		} else if (durations[index] > MIN_SCENE_FRAMES) {
			durations[index] -= 1;
			diff += 1;
		}
		pointer += 1;
	}

	let playbackCursor = 0;

	return BASE_SCENES.map((scene, index) => {
		const durationInFrames = durations[index];
		const startFrame = playbackCursor;
		const endFrame = startFrame + durationInFrames;

		playbackCursor += durationInFrames;
		if (index < BASE_SCENES.length - 1) {
			playbackCursor -= TRANSITION_DURATION_IN_FRAMES;
		}

		return {
			...scene,
			index,
			durationInFrames,
			startFrame,
			endFrame,
		};
	});
};

const transitionFor = (kind: TransitionKind) => {
	switch (kind) {
		case 'slide-left':
			return slide({direction: 'from-left'});
		case 'slide-right':
			return slide({direction: 'from-right'});
		case 'wipe-left':
			return wipe({direction: 'from-left'});
		case 'fade':
		default:
			return fade();
	}
};

const RuntimeSceneView: React.FC<{scene: RuntimeScene; totalScenes: number}> = ({
	scene,
	totalScenes,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const containerIn = spring({
		frame,
		fps,
		config: {
			damping: 22,
			stiffness: 130,
			mass: 0.9,
		},
	});
	const containerOut = interpolate(
		frame,
		[scene.durationInFrames - 14, scene.durationInFrames],
		[1, 0],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.out(Easing.quad),
		},
	);
	const containerOpacity = containerIn * containerOut;

	const timelineStart = toClock(scene.startFrame / fps);
	const timelineEnd = toClock(scene.endFrame / fps);

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 10% 0%, ${scene.palette.backgroundA} 0%, ${scene.palette.backgroundB} 65%)`,
				color: '#f8fafc',
				fontFamily: '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(110deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 40%)',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					right: -120,
					top: -120,
					width: 460,
					height: 460,
					borderRadius: '999px',
					backgroundColor: scene.palette.accentSoft,
					filter: 'blur(80px)',
					opacity: 0.55,
				}}
			/>

			<div
				style={{
					position: 'absolute',
					left: -140,
					bottom: -170,
					width: 520,
					height: 520,
					borderRadius: '999px',
					backgroundColor: scene.palette.accentSoft,
					filter: 'blur(110px)',
					opacity: 0.42,
				}}
			/>

			<div
				style={{
					position: 'absolute',
					inset: 56,
					display: 'grid',
					gridTemplateColumns: '1.35fr 1fr',
					gap: 34,
					padding: 36,
					borderRadius: 36,
					backgroundColor: scene.palette.panel,
					border: `1px solid ${scene.palette.accentSoft}`,
					opacity: containerOpacity,
					transform: `translateY(${interpolate(containerIn, [0, 1], [42, 0])}px) scale(${interpolate(containerIn, [0, 1], [0.97, 1])})`,
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 18,
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '14px 18px',
							borderRadius: 16,
							backgroundColor: 'rgba(3, 7, 18, 0.38)',
							border: '1px solid rgba(148, 163, 184, 0.18)',
						}}
					>
						<div style={{display: 'flex', gap: 8}}>
							{['#ef4444', '#f59e0b', '#22c55e'].map((dot) => (
								<div
									key={dot}
									style={{
										width: 10,
										height: 10,
										borderRadius: '999px',
										backgroundColor: dot,
									}}
								/>
							))}
						</div>
						<div
							style={{
								color: '#cbd5e1',
								fontSize: 16,
								fontWeight: 700,
								letterSpacing: 0.4,
							}}
						>
							{scene.routeHint}
						</div>
					</div>

					<div
						style={{
							flex: 1,
							borderRadius: 22,
							backgroundColor: 'rgba(2, 6, 23, 0.52)',
							border: '1px solid rgba(148, 163, 184, 0.2)',
							padding: 22,
							display: 'grid',
							gridTemplateRows: 'auto auto 1fr',
							gap: 14,
						}}
					>
						<div
							style={{
								height: 34,
								width: `${interpolate(Math.sin(frame / 14), [-1, 1], [48, 72])}%`,
								borderRadius: 10,
								backgroundColor: scene.palette.accentSoft,
							}}
						/>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
								gap: 10,
							}}
						>
							{scene.cards.map((card, cardIndex) => {
								const cardProgress = spring({
									fps,
									frame: frame - (4 + cardIndex * 4),
									config: {
										damping: 18,
										stiffness: 160,
									},
								});

								return (
									<div
										key={card.label}
										style={{
											borderRadius: 12,
											padding: '12px 10px',
											backgroundColor: 'rgba(15, 23, 42, 0.68)',
											border: `1px solid ${scene.palette.accentSoft}`,
											opacity: cardProgress,
											transform: `translateY(${interpolate(cardProgress, [0, 1], [20, 0])}px)`,
										}}
									>
										<div
											style={{
												fontSize: 11,
												letterSpacing: 0.9,
												textTransform: 'uppercase',
												color: '#94a3b8',
												fontWeight: 700,
											}}
										>
											{card.label}
										</div>
										<div
											style={{
												marginTop: 4,
												fontSize: 18,
												fontWeight: 700,
												color: '#f8fafc',
											}}
										>
											{card.value}
										</div>
									</div>
								);
							})}
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
								alignItems: 'end',
								gap: 5,
							}}
						>
							{new Array(16).fill(true).map((_, index) => {
								const wave = Math.sin(frame / 8 + index * 0.45);
								const height = interpolate(wave, [-1, 1], [22, 130]);

								return (
									<div
										// eslint-disable-next-line react/no-array-index-key
										key={index}
										style={{
											height,
											borderRadius: 5,
											background: `linear-gradient(180deg, ${scene.palette.accent} 0%, ${scene.palette.accentSoft} 100%)`,
											opacity: 0.82,
										}}
									/>
								);
							})}
						</div>
					</div>
				</div>

				<div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
					<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
						<div
							style={{
								padding: '8px 12px',
								borderRadius: 999,
								backgroundColor: scene.palette.accentSoft,
								color: scene.palette.accent,
								fontSize: 13,
								fontWeight: 700,
								letterSpacing: 0.9,
								textTransform: 'uppercase',
							}}
						>
							{scene.section}
						</div>
						<div style={{fontSize: 14, color: '#cbd5e1', fontWeight: 700}}>
							Scene {scene.index + 1}/{totalScenes}
						</div>
					</div>

					<div>
						<h1
							style={{
								margin: 0,
								fontSize: 52,
								lineHeight: 1.05,
								letterSpacing: -1.2,
								fontWeight: 800,
								color: '#f8fafc',
							}}
						>
							{scene.title}
						</h1>
						<p
							style={{
								marginTop: 14,
								fontSize: 23,
								lineHeight: 1.35,
								color: '#cbd5e1',
								fontWeight: 500,
							}}
						>
							{scene.subtitle}
						</p>
					</div>

					<div style={{display: 'grid', gap: 10}}>
						{scene.bullets.map((bullet, index) => {
							const bulletIn = spring({
								fps,
								frame: frame - (8 + index * 5),
								config: {
									damping: 17,
									stiffness: 145,
								},
							});

							return (
								<div
									key={bullet}
									style={{
										display: 'grid',
										gridTemplateColumns: '18px 1fr',
										alignItems: 'center',
										columnGap: 10,
										opacity: bulletIn,
										transform: `translateX(${interpolate(bulletIn, [0, 1], [22, 0])}px)`,
									}}
								>
									<div
										style={{
											width: 14,
											height: 14,
											borderRadius: '999px',
											backgroundColor: scene.palette.accent,
											boxShadow: `0 0 18px ${scene.palette.accent}`,
										}}
									/>
									<div style={{fontSize: 20, lineHeight: 1.3, color: '#e2e8f0'}}>
										{bullet}
									</div>
								</div>
							);
						})}
					</div>

					<div
						style={{
							marginTop: 'auto',
							display: 'grid',
							gap: 10,
							padding: '14px 16px',
							borderRadius: 14,
							backgroundColor: 'rgba(2, 6, 23, 0.52)',
							border: '1px solid rgba(148, 163, 184, 0.25)',
						}}
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr auto',
								alignItems: 'center',
								gap: 8,
							}}
						>
							<div style={{fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700}}>
								Timeline window
							</div>
							<div style={{fontSize: 16, fontWeight: 700, color: '#e2e8f0'}}>
								{timelineStart} - {timelineEnd}
							</div>
						</div>
						<div
							style={{
								height: 7,
								borderRadius: 999,
								backgroundColor: 'rgba(148, 163, 184, 0.25)',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									height: '100%',
									width: `${((scene.index + 1) / totalScenes) * 100}%`,
									backgroundColor: scene.palette.accent,
									boxShadow: `0 0 16px ${scene.palette.accent}`,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const FeatureTourVideo: React.FC<FeatureTourProps> = ({targetSeconds}) => {
	const {fps} = useVideoConfig();
	const scenes = useMemo(() => buildRuntimeScenes(targetSeconds, fps), [targetSeconds, fps]);

	return (
		<AbsoluteFill style={{backgroundColor: '#020617'}}>
			<TransitionSeries>
				{scenes.map((scene, index) => {
					return (
						<React.Fragment key={scene.id}>
							<TransitionSeries.Sequence durationInFrames={scene.durationInFrames} name={scene.id}>
								<RuntimeSceneView scene={scene} totalScenes={scenes.length} />
							</TransitionSeries.Sequence>
							{index < scenes.length - 1 ? (
								<TransitionSeries.Transition
									presentation={transitionFor(scene.transitionAfter) as never}
									timing={
										index % 2 === 0
											? linearTiming({durationInFrames: TRANSITION_DURATION_IN_FRAMES})
											: springTiming({
												durationInFrames: TRANSITION_DURATION_IN_FRAMES,
												config: {damping: 200},
											})
									}
								/>
							) : null}
						</React.Fragment>
					);
				})}
			</TransitionSeries>
		</AbsoluteFill>
	);
};

export const __INTERNALS__ = {
	BASE_SCENES,
	FPS,
	TRANSITION_DURATION_IN_FRAMES,
	buildRuntimeScenes,
};
