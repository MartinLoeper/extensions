# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a fork of the [official Vicinae extensions repository](https://github.com/vicinaehq/extensions). The goal is to help mloeper develop and contribute new extensions to the official Vicinae store.

**Author**: When creating new extensions, use `MartinLoeper` as the `author` field in package.json.

Each extension lives in `extensions/<extension-name>/` and gets published to the Vicinae store when merged upstream.

## Extension Builder Skill

This repo contains a custom Claude Code skill called `extension-builder` (located in `.claude/skills/extension-builder.md`). Use this skill when creating new native Vicinae extensions. It contains all the guidance needed to build extensions using the `@vicinae/api` directly, rather than the Raycast compatibility layer.

## Common Commands

### Development (within an extension directory)

```bash
cd extensions/<extension-name>
pnpm install             # Install dependencies
pnpm run dev             # runs: vici develop
pnpm run build           # runs: vici build
```

### Validation

```bash
# Validate a single extension
make validate EXT=bluetooth

# Validate multiple extensions
make validate EXT="bluetooth port-killer"

# Skip GitHub user validation (faster for local dev)
bun scripts/validate-extension.ts bluetooth --skip-github-check
```

### Linting (within extension directory)

```bash
pnpm exec vici lint
```

### Nix Development Shell

```bash
nix develop
```

## Extension Structure

Each extension in `extensions/` follows this structure:

```text
extensions/<name>/
├── package.json          # Manifest with extension metadata, commands, preferences
├── package-lock.json     # Required for NixOS builds (npm install --package-lock-only)
├── src/
│   ├── <command>.tsx     # React components for each command (named to match commands in package.json)
│   └── *.ts              # Utility modules
├── assets/
│   └── extension_icon.png  # 512x512 or higher, 1:1 aspect ratio
└── tsconfig.json
```

## Key Conventions

- **Manifest**: `package.json` serves as both npm package config and extension manifest
- **API**: Use `@vicinae/api` (not `@raycast/api` directly). Import paths use `@/` alias for `src/`
- **Commands**: Each command in package.json maps to a `.tsx` file in `src/` with the same name
- **Validation**: All extensions must pass `pnpm exec vici lint` and manifest validation before merge
- **Authors**: The `author` and `contributors` fields must be valid GitHub usernames

## Store Submission Guidelines

From [GUIDELINES.md](./GUIDELINES.md):

- Extensions must pass `pnpm exec vici lint` validation
- Directory name must match the `name` field in manifest (e.g., `extensions/my-extension/` for `"name": "my-extension"`)
- Icon must be 512x512 or higher, 1:1 aspect ratio, placed in `assets/`
- Use `@vicinae/api` as dependency (avoid `@raycast/api` directly; `@raycast/utils` is acceptable)
- Generate `package-lock.json` with `npm install --package-lock-only` (required for NixOS builds)
- Extensions must not download binaries from arbitrary websites
- If a CLI tool is required, check for its presence and show an error prompting users to install it
- Provide clear error messages for API failures, missing tools, and unsupported environments
