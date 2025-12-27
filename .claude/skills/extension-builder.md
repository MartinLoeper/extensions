# Extension Builder Skill

Use this skill when creating new native Vicinae extensions using `@vicinae/api`.

**Default Author**: Use `MartinLoeper` as the `author` field.

## Documentation Links

- **API Reference**: https://api-reference.vicinae.com (fetch for detailed component props and methods)
- **Extension Docs**: https://docs.vicinae.com/extensions/introduction
- **File Structure**: https://docs.vicinae.com/extensions/file-structure
- **Manifest**: https://docs.vicinae.com/extensions/manifest

## Environment Requirements

**Important**: Before running any script commands (`pnpm install`, `pnpm run dev`, `pnpm run build`, etc.), ensure direnv is active to have all required build tools available.

```bash
# Allow direnv in the project root (run once)
direnv allow

# Verify the environment is loaded (should show nix-shell prompt or direnv output)
echo $IN_NIX_SHELL
```

If direnv is not active, commands like `vici`, `pnpm`, and `node` may not be available or may use incorrect versions.

## Creating a New Extension

### 1. Create Feature Branch

Before creating a new extension, create and switch to a new branch named after the extension:

```bash
git checkout -b <extension-name>
```

Use hyphens as separators (e.g., `my-new-extension`).

### 2. Directory Setup

```bash
mkdir -p extensions/<extension-name>/src extensions/<extension-name>/assets
cd extensions/<extension-name>
```

Required structure:

```text
my-extension/
├── assets/
│   └── extension_icon.png    # 512x512, 1:1 aspect ratio
├── package.json              # Manifest with Vicinae-specific fields
├── package-lock.json         # Required for NixOS (generate with npm install)
├── src/
│   ├── my-command.tsx        # View commands use .tsx
│   └── my-no-view-cmd.ts     # No-view commands can use .ts
└── tsconfig.json
```

**Important**: Each command in the manifest's `commands` array must have a corresponding file in `src/` with the same name.

### 3. package.json (Manifest)

Create `package.json` with required fields:

```json
{
  "$schema": "https://raw.githubusercontent.com/vicinaehq/vicinae/refs/heads/main/extra/schemas/extension.json",
  "name": "my-extension",
  "title": "My Extension",
  "description": "A clear description of what the extension does (min 16 chars)",
  "categories": ["Developer Tools"],
  "license": "MIT",
  "author": "MartinLoeper",
  "contributors": [],
  "pastContributors": [],
  "icon": "extension_icon.png",
  "commands": [
    {
      "name": "my-command",
      "title": "My Command",
      "description": "What this command does",
      "mode": "view"
    }
  ],
  "preferences": [],
  "scripts": {
    "build": "vici build",
    "dev": "vici develop"
  },
  "dependencies": {
    "@vicinae/api": "^0.16.8"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

### 4. Install Dependencies

Use pnpm for development, but generate package-lock.json for NixOS builds:

```bash
pnpm install                # For development
npm install --package-lock-only  # Generate package-lock.json for NixOS
```

### 5. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

### 6. Icon

Place a 512x512 (or higher) 1:1 aspect ratio icon at `assets/extension_icon.png`. Generate at [ray.so/icon](https://ray.so/icon).

## Command Modes

The `name` field in each command maps directly to a source file:
- `"name": "my-command"` → `src/my-command.tsx` (or `.ts` for no-view)

### `view` - Interactive UI

Export a React component as default. Use for List, Grid, Form, or Detail views. Use `.tsx` extension.

```tsx
import { List } from "@vicinae/api";

export default function MyCommand() {
  return (
    <List>
      <List.Item title="Hello" />
    </List>
  );
}
```

### `no-view` - Background Action

Export an async function as default. Runs without UI, shows toast feedback. Can use `.ts` extension (`.tsx` also supported).

```tsx
import { showToast, Toast } from "@vicinae/api";

export default async function Command() {
  await showToast({
    style: Toast.Style.Success,
    title: "Action completed",
  });
}
```

### `menu-bar` - System Tray

Renders in macOS menu bar. Uses `MenuBarExtra` component.

## Core API Components

### List View

```tsx
import { Action, ActionPanel, Icon, List, showToast, Toast } from "@vicinae/api";
import { useState, useEffect } from "react";

export default function MyList() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems().then(setItems).finally(() => setIsLoading(false));
  }, []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search items...">
      {items.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Items Found"
          description="Try a different search"
        />
      ) : (
        <List.Section title="Results" subtitle={`${items.length} items`}>
          {items.map((item) => (
            <List.Item
              key={item.id}
              title={item.name}
              subtitle={item.description}
              accessories={[{ text: item.status }]}
              actions={
                <ActionPanel>
                  <Action title="Do Something" onAction={() => handleAction(item)} />
                  <Action
                    title="Copy"
                    icon={Icon.CopyClipboard}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                    onAction={() => Clipboard.copy({ text: item.name })}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
```

### List with Detail Panel

```tsx
<List isShowingDetail={showingDetail}>
  <List.Item
    title="Item"
    detail={
      <List.Item.Detail
        metadata={
          <List.Item.Detail.Metadata>
            <List.Item.Detail.Metadata.Label title="Field" text="Value" />
            <List.Item.Detail.Metadata.Separator />
            <List.Item.Detail.Metadata.Label
              title="Status"
              text="Active"
              icon={{ source: Icon.Circle, tintColor: Color.Green }}
            />
          </List.Item.Detail.Metadata>
        }
      />
    }
  />
</List>
```

### Grid View

```tsx
import { Grid, Action, ActionPanel } from "@vicinae/api";

export default function MyGrid() {
  return (
    <Grid columns={4} aspectRatio="16/9" fit={Grid.Fit.Fill}>
      <Grid.Section title="Images">
        <Grid.Item
          content={{ source: "/path/to/image.png" }}
          title="Image Name"
          subtitle="480x270"
          actions={
            <ActionPanel>
              <Action title="Select" onAction={() => {}} />
            </ActionPanel>
          }
        />
      </Grid.Section>
    </Grid>
  );
}
```

### Form View

```tsx
import { Action, ActionPanel, Form, Icon, showToast, closeMainWindow } from "@vicinae/api";
import { useState } from "react";

export default function MyForm() {
  const [name, setName] = useState("");

  const handleSubmit = async (values: Record<string, unknown>) => {
    await doSomething(values.name as string);
    await showToast({ title: "Success", message: "Item created" });
    await closeMainWindow();
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" value={name} onChange={setName} />
      <Form.Dropdown id="type" title="Type">
        <Form.Dropdown.Item value="a" title="Option A" />
        <Form.Dropdown.Item value="b" title="Option B" />
      </Form.Dropdown>
      <Form.Checkbox id="enabled" label="Enable feature" />
      <Form.Separator />
      <Form.Description text="Additional help text here." />
    </Form>
  );
}
```

## Preferences

Define in `package.json`, access via `getPreferenceValues()`:

```json
{
  "preferences": [
    {
      "name": "apiKey",
      "type": "password",
      "title": "API Key",
      "description": "Your API key",
      "required": true
    },
    {
      "name": "showDetails",
      "type": "checkbox",
      "title": "Display",
      "label": "Show Details",
      "default": true
    },
    {
      "name": "outputFormat",
      "type": "dropdown",
      "title": "Output Format",
      "data": [
        { "title": "JSON", "value": "json" },
        { "title": "YAML", "value": "yaml" }
      ],
      "default": "json"
    }
  ]
}
```

```tsx
import { getPreferenceValues } from "@vicinae/api";

interface Preferences {
  apiKey: string;
  showDetails: boolean;
  outputFormat: string;
}

const prefs = getPreferenceValues<Preferences>();
```

Preference types: `textfield`, `password`, `checkbox`, `dropdown`, `appPicker`, `file`, `directory`

**Scope**: Extension-level preferences apply to all commands. Command-level preferences (defined within a command object) are command-specific and can override extension preferences with the same `name`.

## Common Utilities

### Toast Notifications

```tsx
import { showToast, Toast } from "@vicinae/api";

await showToast({ title: "Loading...", style: Toast.Style.Animated });
await showToast({ title: "Success", style: Toast.Style.Success });
await showToast({ title: "Error", message: "Details", style: Toast.Style.Failure });
```

### Clipboard

```tsx
import { Clipboard } from "@vicinae/api";

await Clipboard.copy({ text: "copied text" });
const content = await Clipboard.readText();
```

### Navigation

```tsx
import { closeMainWindow, popToRoot } from "@vicinae/api";

await closeMainWindow();  // Close Vicinae window
await popToRoot();        // Return to root search
```

### Deep Links

Open other extension commands:

```tsx
<Action.Open
  title="Open Other Command"
  target="vicinae://extensions/author/extension-name/command-name"
/>
```

### Running Shell Commands

```tsx
import { exec } from "node:child_process";
import util from "node:util";

const execPromise = util.promisify(exec);

async function runCommand() {
  const { stdout, stderr } = await execPromise("some-cli-tool --flag");
  return stdout;
}
```

## Import Alias

Use `@/` to reference files in `src/`:

```tsx
import { myUtil } from "@/utils";
import { MyComponent } from "@/components";
```

## Validation & Testing

```bash
# Validate manifest and structure
pnpm exec vici lint

# Validate from repo root
make validate EXT=my-extension

# Build extension
pnpm run build

# Development mode (hot reload)
pnpm run dev
```

## Submitting to Store

1. Ensure `pnpm exec vici lint` passes
2. Verify author/contributors are valid GitHub usernames
3. Include 512x512 icon in assets
4. Generate package-lock.json (`npm install --package-lock-only`)
5. **Clean up branch before PR**: Remove Claude-specific commits (CLAUDE.md, .claude/) via interactive rebase:
   ```bash
   git rebase -i origin/main
   # In the editor, delete (or mark with 'd') any lines containing Claude config commits
   # Save and close to apply
   ```
6. Create PR to upstream: https://github.com/vicinaehq/extensions

## Available Icons

Import from `@vicinae/api`:

```tsx
import { Icon, Color } from "@vicinae/api";

// Common icons
Icon.MagnifyingGlass, Icon.Plus, Icon.Trash, Icon.Pencil
Icon.CopyClipboard, Icon.ArrowClockwise, Icon.Eye, Icon.EyeDisabled
Icon.Wifi, Icon.WifiDisabled, Icon.Bluetooth
Icon.XMarkCircle, Icon.CheckCircle, Icon.Circle
Icon.Heart, Icon.HeartDisabled, Icon.Lock
Icon.Monitor, Icon.Image, Icon.ArrowsExpand

// Colors
Color.Green, Color.Red, Color.Orange, Color.Blue
```

## Action Shortcuts

```tsx
<Action
  title="Refresh"
  icon={Icon.ArrowClockwise}
  shortcut={{ modifiers: ["cmd"], key: "r" }}
  onAction={refresh}
/>
```

Modifiers: `"cmd"`, `"ctrl"`, `"opt"`, `"shift"`

## Categories

Choose from: `Applications`, `Communication`, `Data`, `Documentation`, `Design Tools`, `Developer Tools`, `Finance`, `Fun`, `Media`, `News`, `Productivity`, `Security`, `System`, `Web`, `Other`
