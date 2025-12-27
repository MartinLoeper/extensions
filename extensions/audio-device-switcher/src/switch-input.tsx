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
import { type AudioDevice, listSources, setDefaultSource } from "./utils/pactl";

function InputDeviceList() {
	const [devices, setDevices] = useState<AudioDevice[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadDevices = useCallback(async () => {
		setIsLoading(true);
		try {
			const sources = await listSources();
			setDevices(sources);
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
				await setDefaultSource(device.name);
				await showToast({
					style: Toast.Style.Success,
					title: "Default input changed",
					message: device.description,
				});
				await loadDevices();
			} catch (error) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Failed to set default input",
					message: error instanceof Error ? error.message : String(error),
				});
			}
		},
		[loadDevices],
	);

	return (
		<List
			isLoading={isLoading}
			searchBarPlaceholder="Search audio input devices..."
		>
			{devices.length === 0 && !isLoading ? (
				<List.EmptyView
					title="No audio input devices found"
					description="Make sure PipeWire is running and audio devices are connected"
					icon={Icon.MicrophoneDisabled}
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
								: Icon.Microphone
						}
						accessories={[
							...(device.mute
								? [{ icon: Icon.MicrophoneDisabled, tooltip: "Muted" }]
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
			onSuccess={<InputDeviceList />}
			onFail={<PactlNotFoundView />}
		/>
	);
}
