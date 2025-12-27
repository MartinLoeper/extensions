import { execPromise } from "./exec";

export interface AudioDevice {
	index: number;
	name: string;
	description: string;
	volume: number;
	mute: boolean;
	isDefault: boolean;
}

interface PactlSink {
	index: number;
	name: string;
	description: string;
	mute: boolean;
	volume: {
		[channel: string]: {
			value_percent: string;
		};
	};
}

interface PactlSource {
	index: number;
	name: string;
	description: string;
	mute: boolean;
	volume: {
		[channel: string]: {
			value_percent: string;
		};
	};
}

function parseVolumePercent(volume: PactlSink["volume"]): number {
	const channels = Object.values(volume);
	if (channels.length === 0) return 0;

	const percentages = channels.map((ch) => {
		const match = ch.value_percent.match(/(\d+)%/);
		return match ? Number.parseInt(match[1], 10) : 0;
	});

	return Math.round(
		percentages.reduce((a, b) => a + b, 0) / percentages.length,
	);
}

export async function checkPactlAvailable(): Promise<boolean> {
	try {
		await execPromise("pactl --version");
		return true;
	} catch {
		return false;
	}
}

export async function getDefaultSink(): Promise<string> {
	const { stdout } = await execPromise("pactl get-default-sink");
	return stdout.trim();
}

export async function getDefaultSource(): Promise<string> {
	const { stdout } = await execPromise("pactl get-default-source");
	return stdout.trim();
}

export async function listSinks(): Promise<AudioDevice[]> {
	const [{ stdout }, defaultSink] = await Promise.all([
		execPromise("pactl -f json list sinks"),
		getDefaultSink(),
	]);

	const sinks: PactlSink[] = JSON.parse(stdout);

	return sinks.map((sink) => ({
		index: sink.index,
		name: sink.name,
		description: sink.description,
		volume: parseVolumePercent(sink.volume),
		mute: sink.mute,
		isDefault: sink.name === defaultSink,
	}));
}

export async function listSources(): Promise<AudioDevice[]> {
	const [{ stdout }, defaultSource] = await Promise.all([
		execPromise("pactl -f json list sources"),
		getDefaultSource(),
	]);

	const sources: PactlSource[] = JSON.parse(stdout);

	// Filter out monitor sources (they end with .monitor)
	const filteredSources = sources.filter(
		(source) => !source.name.endsWith(".monitor"),
	);

	return filteredSources.map((source) => ({
		index: source.index,
		name: source.name,
		description: source.description,
		volume: parseVolumePercent(source.volume),
		mute: source.mute,
		isDefault: source.name === defaultSource,
	}));
}

export async function setDefaultSink(name: string): Promise<void> {
	await execPromise(`pactl set-default-sink "${name}"`);
}

export async function setDefaultSource(name: string): Promise<void> {
	await execPromise(`pactl set-default-source "${name}"`);
}

export async function toggleSinkMute(name: string): Promise<void> {
	await execPromise(`pactl set-sink-mute "${name}" toggle`);
}

export async function toggleSourceMute(name: string): Promise<void> {
	await execPromise(`pactl set-source-mute "${name}" toggle`);
}
