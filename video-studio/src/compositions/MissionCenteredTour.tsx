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

export type MissionCenteredTourProps = {
	targetSeconds: number;
};

type TransitionKind = 'fade' | 'slide-left' | 'slide-right' | 'wipe-left';

type MissionScene = {
	id: string;
	layout?: 'welcome' | 'standard';
	routeHint: string;
	focus: string;
	title: string;
	subtitle: string;
	chartLabel: string;
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

type RuntimeScene = MissionScene & {
	index: number;
	durationInFrames: number;
	startFrame: number;
	endFrame: number;
};

const FPS = 30;
const TRANSITION_DURATION_IN_FRAMES = 18;
const MIN_SCENE_FRAMES = 90;

const BASE_SCENES: MissionScene[] = [
	{
		id: 'welcome-screen',
		layout: 'welcome',
		routeHint: '/welcome',
		focus: 'Welcome',
		title: 'Welcome to RunwayAlgo',
		subtitle:
			'You are about to see how RunwayAlgo delivers stock and crypto execution, copy-trading intelligence, and trusted operations.',
		chartLabel: 'RunwayAlgo',
		bullets: [
			'Mission-first opening',
			'Platform value before feature details',
			'Clear path into the core trading story',
		],
		cards: [
			{label: 'Platform', value: 'RunwayAlgo', delta: 'Welcome'},
			{label: 'Mission', value: 'Trade with Clarity', delta: 'Focused'},
			{label: 'Flow', value: 'Intro -> Value', delta: 'Structured'},
		],
		palette: {
			backgroundA: '#050f14',
			backgroundB: '#0e1a2a',
			panel: '#0f1d24',
			accent: '#10b981',
			accentSoft: '#18404d',
		},
		baseSeconds: 6,
		transitionAfter: 'fade',
	},
	{
		id: 'mission-open',
		routeHint: '/',
		focus: 'Mission',
		title: 'RunwayAlgo: Built for Real Trading',
		subtitle:
			'Trade stocks and crypto with speed, discipline, and strategic execution from one platform.',
		chartLabel: 'Stocks + Crypto + Copy Trading',
		bullets: [
			'Mission-first opening before product details',
			'Execution clarity and decision speed',
			'Trust and control as core standards',
		],
		cards: [
			{label: 'Market Scope', value: 'Stocks + Crypto', delta: 'Unified'},
			{label: 'Execution', value: 'Low Latency', delta: 'Fast'},
			{label: 'Edge', value: 'Copy Trading', delta: 'Scalable'},
		],
		palette: {
			backgroundA: '#07120f',
			backgroundB: '#0b1823',
			panel: '#0d1b1a',
			accent: '#10b981',
			accentSoft: '#173d35',
		},
		baseSeconds: 10,
		transitionAfter: 'fade',
	},
	{
		id: 'stock-crypto-value',
		routeHint: '/#markets',
		focus: 'Coverage',
		title: 'One Engine for Stocks and Crypto',
		subtitle:
			'Scan opportunity across asset classes and move from analysis to action without changing workflow.',
		chartLabel: 'Cross-Market Opportunity Flow',
		bullets: [
			'Stocks and crypto monitored side-by-side',
			'Market movement surfaced in real time',
			'Seamless shift from visibility to execution',
		],
		cards: [
			{label: 'Asset Classes', value: 'Multi-Asset', delta: 'Flexible'},
			{label: 'Market Read', value: 'Live', delta: 'Timely'},
			{label: 'Decision Path', value: 'Direct', delta: 'Efficient'},
		],
		palette: {
			backgroundA: '#081021',
			backgroundB: '#1b140d',
			panel: '#151e2b',
			accent: '#38bdf8',
			accentSoft: '#1a3f55',
		},
		baseSeconds: 13,
		transitionAfter: 'slide-right',
	},
	{
		id: 'execution-speed',
		routeHint: '/dashboard/trade',
		focus: 'Execution',
		title: 'Fast Execution Wins Timing',
		subtitle:
			'When markets move quickly, trade routing speed and low-friction actions become a competitive advantage.',
		chartLabel: 'Decision -> Order -> Execution',
		bullets: [
			'Rapid trade initiation from active market views',
			'Lower delay between signal and filled action',
			'Built for repeatable, high-tempo execution',
		],
		cards: [
			{label: 'Trade Access', value: 'Immediate', delta: '1 Flow'},
			{label: 'Latency', value: 'Low', delta: 'Faster'},
			{label: 'Precision', value: 'Higher', delta: 'Controlled'},
		],
		palette: {
			backgroundA: '#14100a',
			backgroundB: '#0f1710',
			panel: '#1d1a13',
			accent: '#f59e0b',
			accentSoft: '#49371a',
		},
		baseSeconds: 14,
		transitionAfter: 'wipe-left',
	},
	{
		id: 'copy-trading-core',
		routeHint: '/dashboard/copy',
		focus: 'Strategy',
		title: 'Copy Trading, Built for Actionable Alpha',
		subtitle:
			'Follow disciplined traders, allocate capital intentionally, and track performance with clear accountability.',
		chartLabel: 'Discover -> Allocate -> Track',
		bullets: [
			'Find traders aligned with your risk profile',
			'Configure allocation with explicit control',
			'Measure ongoing outcomes and adjust',
		],
		cards: [
			{label: 'Trader Discovery', value: 'Ranked', delta: 'Curated'},
			{label: 'Allocation', value: 'Configurable', delta: 'Controlled'},
			{label: 'Performance', value: 'Tracked', delta: 'Measured'},
		],
		palette: {
			backgroundA: '#130f1f',
			backgroundB: '#0e1718',
			panel: '#1c1830',
			accent: '#a78bfa',
			accentSoft: '#31254b',
		},
		baseSeconds: 14,
		transitionAfter: 'slide-left',
	},
	{
		id: 'portfolio-discipline',
		routeHint: '/dashboard/home',
		focus: 'Control',
		title: 'Trade with Portfolio Discipline',
		subtitle:
			'Maintain clear visibility into exposure, allocation, and risk posture before every execution decision.',
		chartLabel: 'Exposure + Risk + Allocation',
		bullets: [
			'Capital awareness before each trade',
			'Risk signals reduce emotional execution',
			'Allocation clarity supports consistency',
		],
		cards: [
			{label: 'Exposure', value: 'Visible', delta: 'Clear'},
			{label: 'Risk State', value: 'Readable', delta: 'Guided'},
			{label: 'Allocation', value: 'Balanced', delta: 'Disciplined'},
		],
		palette: {
			backgroundA: '#091713',
			backgroundB: '#0d1723',
			panel: '#13221e',
			accent: '#22c55e',
			accentSoft: '#1b4336',
		},
		baseSeconds: 13,
		transitionAfter: 'fade',
	},
	{
		id: 'trust-layer',
		routeHint: '/dashboard/wallet + /dashboard/profile',
		focus: 'Trust',
		title: 'Operational Trust for Serious Traders',
		subtitle:
			'Secure funding flows, account controls, and support reliability protect continuity in live trading environments.',
		chartLabel: 'Funding + Security + Support',
		bullets: [
			'Funding states are transparent and trackable',
			'Account controls reinforce operational confidence',
			'Support access remains visible when needed',
		],
		cards: [
			{label: 'Funding', value: 'Trackable', delta: 'Reliable'},
			{label: 'Security', value: 'Layered', delta: 'Protected'},
			{label: 'Support', value: 'Accessible', delta: 'Responsive'},
		],
		palette: {
			backgroundA: '#0a1120',
			backgroundB: '#1a130b',
			panel: '#16222d',
			accent: '#38bdf8',
			accentSoft: '#1a3b52',
		},
		baseSeconds: 12,
		transitionAfter: 'slide-right',
	},
	{
		id: 'mission-close',
		routeHint: '/ (CTA)',
		focus: 'Positioning',
		title: 'RunwayAlgo: Execute with Confidence',
		subtitle:
			'Close with clear positioning: stocks + crypto access, fast execution, and copy-trading intelligence.',
		chartLabel: 'Speed + Market Coverage + Strategy Edge',
		bullets: [
			'What it stands for: speed, discipline, trust',
			'What it enables: better timing and execution',
			'What it offers: one coherent trading mission',
		],
		cards: [
			{label: 'Stand For', value: 'Speed + Trust', delta: 'Clear'},
			{label: 'Trade Scope', value: 'Stocks + Crypto', delta: 'Unified'},
			{label: 'Strategic Edge', value: 'Copy Trading', delta: 'Actionable'},
		],
		palette: {
			backgroundA: '#0b1014',
			backgroundB: '#122014',
			panel: '#161d23',
			accent: '#10b981',
			accentSoft: '#1c4138',
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

const CenterChart: React.FC<{
	scene: RuntimeScene;
}> = ({scene}) => {
	const frame = useCurrentFrame();

	return (
		<div
			style={{
				position: 'relative',
				width: '100%',
				maxWidth: 1040,
				margin: '0 auto',
				borderRadius: 24,
				padding: 24,
				backgroundColor: 'rgba(2, 6, 23, 0.56)',
				border: `1px solid ${scene.palette.accentSoft}`,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(22, minmax(0, 1fr))',
					alignItems: 'end',
					gap: 6,
					height: 180,
				}}
			>
				{new Array(22).fill(true).map((_, index) => {
					const wave = Math.sin(frame / 7 + index * 0.47);
					const drift = Math.cos(frame / 11 + index * 0.29);
					const height = interpolate(wave + drift * 0.45, [-1.45, 1.45], [18, 168]);

					return (
						<div
							// eslint-disable-next-line react/no-array-index-key
							key={index}
							style={{
								height,
								borderRadius: 5,
								background: `linear-gradient(180deg, ${scene.palette.accent} 0%, ${scene.palette.accentSoft} 100%)`,
								opacity: 0.88,
							}}
						/>
					);
				})}
			</div>

			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: 'none',
				}}
			>
				<div
					style={{
						padding: '12px 18px',
						borderRadius: 999,
						backgroundColor: 'rgba(2, 6, 23, 0.8)',
						border: `1px solid ${scene.palette.accentSoft}`,
						fontSize: 18,
						fontWeight: 700,
						color: '#f8fafc',
						letterSpacing: 0.4,
					}}
				>
					{scene.chartLabel}
				</div>
			</div>
		</div>
	);
};

const CenteredScene: React.FC<{
	scene: RuntimeScene;
	totalScenes: number;
}> = ({scene, totalScenes}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const containerIn = spring({
		frame,
		fps,
		config: {
			damping: 20,
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

	const timelineStart = toClock(scene.startFrame / fps);
	const timelineEnd = toClock(scene.endFrame / fps);
	const isWelcome = scene.layout === 'welcome';

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(circle at 50% 0%, ${scene.palette.backgroundA} 0%, ${scene.palette.backgroundB} 68%)`,
				color: '#f8fafc',
				fontFamily: '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: -120,
					top: -120,
					width: 420,
					height: 420,
					borderRadius: '999px',
					backgroundColor: scene.palette.accentSoft,
					filter: 'blur(100px)',
					opacity: 0.55,
				}}
			/>

			<div
				style={{
					position: 'absolute',
					right: -160,
					bottom: -170,
					width: 480,
					height: 480,
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
					borderRadius: 36,
					padding: '30px 42px',
					backgroundColor: scene.palette.panel,
					border: `1px solid ${scene.palette.accentSoft}`,
					display: 'flex',
					flexDirection: 'column',
					gap: 22,
					justifyContent: 'center',
					textAlign: 'center',
					opacity: containerIn * containerOut,
					transform: `translateY(${interpolate(containerIn, [0, 1], [40, 0])}px) scale(${interpolate(containerIn, [0, 1], [0.97, 1])})`,
				}}
			>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
					<div
						style={{
							padding: '8px 12px',
							borderRadius: 999,
							backgroundColor: scene.palette.accentSoft,
							color: scene.palette.accent,
							fontSize: 13,
							fontWeight: 700,
							textTransform: 'uppercase',
							letterSpacing: 0.8,
						}}
					>
						{scene.focus}
					</div>
					<div style={{fontSize: 14, color: '#cbd5e1', fontWeight: 700}}>
						Scene {scene.index + 1}/{totalScenes}
					</div>
				</div>

				{isWelcome ? (
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 22,
							paddingTop: 8,
							paddingBottom: 8,
						}}
					>
						<div
							style={{
								width: 120,
								height: 120,
								borderRadius: 28,
								display: 'grid',
								placeItems: 'center',
								backgroundColor: scene.palette.accentSoft,
								border: `1px solid ${scene.palette.accent}`,
								fontSize: 44,
								fontWeight: 900,
								color: scene.palette.accent,
							}}
						>
							RA
						</div>

						<h1
							style={{
								margin: 0,
								fontSize: 82,
								lineHeight: 1,
								letterSpacing: -1.4,
								fontWeight: 900,
							}}
						>
							RunwayAlgo
						</h1>

						<p
							style={{
								margin: 0,
								fontSize: 28,
								lineHeight: 1.3,
								color: '#cbd5e1',
								maxWidth: 1020,
							}}
						>
							Welcome. Let&apos;s walk through what this platform stands for.
						</p>

						<div
							style={{
								padding: '12px 18px',
								borderRadius: 999,
								border: `1px solid ${scene.palette.accentSoft}`,
								backgroundColor: 'rgba(2, 6, 23, 0.52)',
								fontSize: 16,
								fontWeight: 700,
								color: '#e2e8f0',
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}
						>
							Preparing Mission Brief
						</div>
					</div>
				) : (
					<>
						<h1
							style={{
								margin: 0,
								fontSize: 58,
								lineHeight: 1.04,
								letterSpacing: -1.2,
								fontWeight: 800,
							}}
						>
							{scene.title}
						</h1>

						<p
							style={{
								margin: 0,
								fontSize: 24,
								lineHeight: 1.34,
								color: '#cbd5e1',
								maxWidth: 1160,
								marginLeft: 'auto',
								marginRight: 'auto',
							}}
						>
							{scene.subtitle}
						</p>

						<CenterChart scene={scene} />

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
								gap: 12,
								maxWidth: 1020,
								margin: '0 auto',
								width: '100%',
							}}
						>
							{scene.cards.map((card, cardIndex) => {
								const cardIn = spring({
									fps,
									frame: frame - (8 + cardIndex * 4),
									config: {
										damping: 18,
										stiffness: 150,
									},
								});

								return (
									<div
										key={card.label}
										style={{
											padding: '14px 12px',
											borderRadius: 14,
											border: `1px solid ${scene.palette.accentSoft}`,
											backgroundColor: 'rgba(2, 6, 23, 0.52)',
											opacity: cardIn,
											transform: `translateY(${interpolate(cardIn, [0, 1], [16, 0])}px)`,
										}}
									>
										<div
											style={{
												fontSize: 11,
												fontWeight: 700,
												letterSpacing: 0.9,
												textTransform: 'uppercase',
												color: '#94a3b8',
											}}
										>
											{card.label}
										</div>
										<div style={{fontSize: 24, marginTop: 4, fontWeight: 700}}>{card.value}</div>
										<div style={{fontSize: 13, marginTop: 4, color: scene.palette.accent, fontWeight: 700}}>
											{card.delta}
										</div>
									</div>
								);
							})}
						</div>

						<div
							style={{
								display: 'grid',
								gap: 9,
								maxWidth: 980,
								margin: '0 auto',
								width: '100%',
							}}
						>
							{scene.bullets.map((bullet, index) => {
								const bulletIn = spring({
									fps,
									frame: frame - (10 + index * 5),
									config: {
										damping: 16,
										stiffness: 140,
									},
								});

								return (
									<div
										key={bullet}
										style={{
											display: 'grid',
											gridTemplateColumns: '16px 1fr',
											columnGap: 10,
											alignItems: 'center',
											opacity: bulletIn,
											transform: `translateX(${interpolate(bulletIn, [0, 1], [14, 0])}px)`,
										}}
									>
										<div
											style={{
												width: 12,
												height: 12,
												borderRadius: '999px',
												backgroundColor: scene.palette.accent,
												justifySelf: 'end',
											}}
										/>
										<div style={{textAlign: 'left', fontSize: 19, color: '#e2e8f0'}}>{bullet}</div>
									</div>
								);
							})}
						</div>
					</>
				)}

				<div
					style={{
						marginTop: 4,
						maxWidth: 980,
						marginLeft: 'auto',
						marginRight: 'auto',
						width: '100%',
						padding: '12px 14px',
						borderRadius: 14,
						border: '1px solid rgba(148, 163, 184, 0.25)',
						backgroundColor: 'rgba(2, 6, 23, 0.5)',
						textAlign: 'left',
					}}
				>
					<div style={{display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center'}}>
						<div style={{fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: '#94a3b8'}}>
							Story window
						</div>
						<div style={{fontSize: 15, fontWeight: 700, color: '#e2e8f0'}}>
							{timelineStart} - {timelineEnd}
						</div>
					</div>
					<div
						style={{
							marginTop: 8,
							height: 7,
							borderRadius: 999,
							backgroundColor: 'rgba(148, 163, 184, 0.2)',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								height: '100%',
								width: `${((scene.index + 1) / totalScenes) * 100}%`,
								backgroundColor: scene.palette.accent,
							}}
						/>
					</div>
				</div>

				<div
					style={{
						fontSize: 14,
						color: '#cbd5e1',
						fontWeight: 700,
						textTransform: 'uppercase',
						letterSpacing: 0.7,
					}}
				>
					{scene.routeHint}
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const MissionCenteredTourVideo: React.FC<MissionCenteredTourProps> = ({targetSeconds}) => {
	const {fps} = useVideoConfig();
	const scenes = useMemo(() => buildRuntimeScenes(targetSeconds, fps), [targetSeconds, fps]);

	return (
		<AbsoluteFill style={{backgroundColor: '#030712'}}>
			<TransitionSeries>
				{scenes.map((scene, index) => {
					return (
						<React.Fragment key={scene.id}>
							<TransitionSeries.Sequence durationInFrames={scene.durationInFrames} name={scene.id}>
								<CenteredScene scene={scene} totalScenes={scenes.length} />
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
