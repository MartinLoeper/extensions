import { useCallback, useEffect, useState } from "react";
import {
	Action,
	ActionPanel,
	Icon,
	List,
	showToast,
	Toast,
	Color,
} from "@vicinae/api";
import { CliCheck, PactlNotFoundView } from "./components/cli-check";
import { type AudioDevice, listSinks, setDefaultSink, toggleSinkMute } from "./utils/pactl";

function OutputDeviceList() {
	const [devices, setDevices] = useState<AudioDevice[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadDevices = useCallback(async () => {
		setIsLoading(true);
		try {
			const sinks = await listSinks();
			setDevices(sinks);
		} catch (error) {
			await showToast({
				style: Toast.Style.Failure,
				title: "Failed to load audio devices",
				message: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDevices();
	}, [loadDevices]);

	const handleSetDefault = useCallback(
		async (device: AudioDevice) => {
			try {
				await setDefaultSink(device.name);
				await showToast({
					style: Toast.Style.Success,
					title: "Default output changed",
					message: device.description,
				});
				await loadDevices();
			} catch (error) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to set default output",
					message: error instanceof Error ? error.message : String(error),
				});
			}
		},
		[loadDevices],
	);

	const handleToggleMute = useCallback(
		async (device: AudioDevice) => {
			try {
				await toggleSinkMute(device.name);
				await showToast({
					style: Toast.Style.Success,
					title: device.mute ? "Unmuted" : "Muted",
					message: device.description,
				});
				await loadDevices();
			} catch (error) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to toggle mute",
					message: error instanceof Error ? error.message : String(error),
				});
			}
		},
		[loadDevices],
	);

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search audio output devices..."
		>
			{devices.length === 0 && !isLoading ? (
				<List.EmptyView
					title="No audio output devices found"
					description="Make sure PipeWire is running and audio devices are connected"
					icon={Icon.SpeakerOff}
				/>
			) : (
				devices.map((device) => (
					<List.Item
						key={device.name}
						title={device.description}
						subtitle={device.name}
						icon={
							device.isDefault
								? { source: Icon.CheckCircle, tintColor: Color.Green }
								: Icon.SpeakerHigh
						}
						accessories={[
							...(device.mute
								? [{ icon: Icon.SpeakerOff, tooltip: "Muted" }]
								: []),
							{ text: `${device.volume}%` },
							...(device.isDefault ? [{ tag: "Default" }] : []),
						]}
						actions={
							<ActionPanel>
								<Action
									title="Set as Default"
									icon={Icon.CheckCircle}
									onAction={() => handleSetDefault(device)}
								/>
								<Action
									title={device.mute ? "Unmute" : "Mute"}
									icon={device.mute ? Icon.SpeakerHigh : Icon.SpeakerOff}
									shortcut={{ modifiers: ["shift"], key: "m" }}
									onAction={() => handleToggleMute(device)}
								/>
								<Action
									title="Refresh"
									icon={Icon.ArrowClockwise}
									shortcut={{ modifiers: ["cmd"], key: "r" }}
									onAction={loadDevices}
								/>
								<Action.CopyToClipboard
									title="Copy Device Name"
									content={device.name}
									shortcut={{ modifiers: ["cmd"], key: "c" }}
								/>
							</ActionPanel>
						}
					/>
				))
			)}
		</List>
	);
}

export default function Command() {
	return (
		<CliCheck
			onSuccess={<OutputDeviceList />}
			onFail={<PactlNotFoundView />}
		/>
	);
}
