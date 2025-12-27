import { useEffect, useState } from "react";
import { Detail, List } from "@vicinae/api";
import { checkPactlAvailable } from "../utils/pactl";

interface CliCheckProps {
	onSuccess: React.ReactNode;
	onFail: React.ReactNode;
}

export function CliCheck({ onSuccess, onFail }: CliCheckProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isAvailable, setIsAvailable] = useState(false);

	useEffect(() => {
		checkPactlAvailable()
			.then(setIsAvailable)
			.finally(() => setIsLoading(false));
	}, []);

	if (isLoading) {
		return <List isLoading={true} />;
	}

	if (isAvailable) {
		return onSuccess;
	}

	return onFail;
}

export function PactlNotFoundView() {
	const markdown = `# PipeWire PulseAudio Not Found

The \`pactl\` command is not available. This extension requires PipeWire with PulseAudio compatibility.

## Installation

### NixOS
Add to your configuration:
\`\`\`nix
services.pipewire = {
  enable = true;
  pulse.enable = true;
};
\`\`\`

### Arch Linux
\`\`\`bash
sudo pacman -S pipewire pipewire-pulse
\`\`\`

### Fedora
\`\`\`bash
sudo dnf install pipewire pipewire-pulseaudio
\`\`\`

### Ubuntu/Debian
\`\`\`bash
sudo apt install pipewire pipewire-pulse
\`\`\`

After installation, restart your session or run:
\`\`\`bash
systemctl --user restart pipewire pipewire-pulse
\`\`\`
`;

	return <Detail markdown={markdown} />;
}
