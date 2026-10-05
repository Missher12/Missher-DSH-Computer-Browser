# Computer Browser Use

English | [中文](README.zh.md)

`@missher/dsh-computer-browser` provides session-owned browser control and Cua desktop tools for the matching Missher Desktop integration. Choose the visible Electron sidebar browser or a separate visible Playwright browser. Only one Browser Use provider is active at a time.

This repository is the sole maintenance source for the independent Bundle. The earlier Computer Browser Use candidate checkout remains a historical implementation and verification record; it is not a second maintained source. Version `0.1.0-rc.1` packages that implementation for independent distribution. It is not an official DeepSeek Desktop release.

## Required host

Installing this Bundle alone does not add the required Desktop features. Use a Missher Desktop / Host build with all of the following:

- The Desktop browser bridge with `automationVersion: 1` and its matching sidebar client, for the default `electron` backend.
- Host adapters for native authorization and stop / takeover / resume controls.
- MCP `excludedTools` support, for the `playwright` backend.
- `runProfile.prepareContext` startup integration, which installs the trusted Desktop adapters before the plugin tree loads.

Official Desktop `0.2.0-rc.2` does not provide these additions. An existing Missher Desktop download is not sufficient evidence either: an older published asset may lack them despite the same base version. The known local installation is the `latest-cbu-20261004` integration, based on `0.2.0-rc.2`. Check the matching host's release notes and [COMPATIBILITY.json](COMPATIBILITY.json) before installation; broad peer dependency ranges do not certify compatibility.

Shared Cordis, Agent, ToolRuntime, MCP, BrowserUse and ComputerUse services come from the Host. This package does not install a second Host or require a separate compatibility Bundle. It rejects competing providers and rolls back its browser provider if native startup fails.

## Browser and desktop behavior

| Backend | Visible page | Ownership and storage |
| --- | --- | --- |
| `electron` — default | The same actual sidebar guest used by `browser_use` | Exact live session activation; temporary storage by default |
| `playwright` | A separately launched visible Chromium window | Private temporary profile and working directory for each live session activation |

Observe the owned page, act using its current references, then inspect the result. Stops reject new actions and settle admitted work. Takeover hands control to the user; resuming requires a new observation. Cancellation and timeout do not undo input already delivered, and uncertain actions are not replayed automatically. Session isolation protects target ownership; it is not an operating-system sandbox.

Electron uploads require native user file selection and use a private staged copy. Downloads require approval for one transfer and a selected destination. Persistent login requires explicit native confirmation and applies to future tabs, rather than changing an existing guest. A saved conversation, a saved URL, live page state and login storage are separate: restarting does not restore old handles, snapshots or pending actions. Uninstalling does not delete user-selected persistent login data.

The Playwright backend always launches a visible isolated browser. This Bundle does not attach to an existing browser or reuse a daily profile. Arbitrary script execution, model-selected host file paths, arbitrary uploads and drop operations are excluded; screenshots use managed temporary output.

Cua Driver runs in Standard mode. Browser subtools, including legacy `page`, are disabled so browser control has one owner. Raw SDK session management, global configuration writes, helper installation, recording and trajectory replay are not model tools. Existing-profile attachment decisions use a trusted Host dialog, never a model or page approval. OS Screen Recording and Accessibility permissions remain system-managed and are not requested automatically. A refused background action does not authorize a foreground retry.

Screenshots use the Host's image and attachment pipeline. Image-capable routes can receive actual images; text-only routes use actual accessibility text. This package does not invent OCR or treat base64 text as visual understanding. Native desktop coordination covers one Host; users and other processes can still change the physical desktop.

## Install, disable and remove

Use the fixed-version `.tgz` and its SHA-256 file from this repository's [Releases](https://github.com/Missher12/Missher-DSH-Computer-Browser/releases). A release link is usable only after the coordinator publishes and verifies the asset; this README does not imply that every candidate already has a public download.

1. Verify that the Desktop / Host provides the capabilities above and that no competing Browser Use or Computer Use provider is enabled. Do not remove unrelated plugins or change model settings.
2. In that Desktop's Plugin Manager, install the downloaded archive and restart when requested. The reserved `desktop` profile must be managed through the Desktop's normal carrier, not an unrelated CLI writing its files.
3. Check that the Bundle is active. In a test conversation, ask it to open a harmless page, read the title and verify the observed result.

Disable the Bundle through the same Plugin Manager and restart when requested. Removing `@missher/dsh-computer-browser` removes its configuration layer and releases its owned tools, sessions and temporary resources. Existing conversations, credentials, other plugins and explicitly retained login storage are not removed. Deleting retained login data is a separate user action.

For an update, retain the previous archive and a fresh backup of the affected application and profile. Host bridge changes and the Bundle must remain compatible during rollback; restoring only one side can leave an unusable combination. Restore new user data separately rather than overwriting it with an old backup.

## Configuration

Edit the `computer-browser` Loader entry through the Host's configuration flow:

```yaml
backend: electron # or playwright
sessionTtlSeconds: 3600
idleTtlSeconds: 600
# Playwright only; optionally select an installed Chromium executable:
# executablePath: /path/to/chromium
# toolCallTimeoutMs: 60000
```

The idle TTL cannot exceed the session TTL. Switching backend closes the previous activation's resources; it does not migrate a live page or its grants. The Bundle fixes Playwright to `mode: launch` and `headless: false`.

## Validation and limits

The `0.1.0-candidate.1` implementation was installed and loaded in the local macOS Intel `latest-cbu-20261004` Desktop integration on 2026-10-04. That installation included the cold-start adapter ordering fix. It does not establish installation or verification of this `0.1.0-rc.1` archive. This release candidate is a packaging candidate; its own build, installation and artifact results belong in [VALIDATION.md](VALIDATION.md).

The earlier implementation has separate real-browser evidence for visible Playwright automation and a real Electron 44 guest, including form read-back, target isolation, takeover, staged uploads and controlled downloads. These checks used owned, account-free fixtures. They do not establish arbitrary website behavior or real paid-model performance.

Native Cua acceptance remains partial. In a Node 25.6.0 SDK host on macOS Intel, foreground input, an AX click and independent renderer read-back passed; background input did not, and the final SDK PNG still showed old pixels. Fresh post-action screenshots and a complete visual loop are unverified. Electron was the target application in that test, not the SDK host; independent Electron SDK-host TCC and input acceptance are also unverified.

No real paid-model visual task was run for these checks. Apple Silicon, Windows and Linux native behavior has not been accepted. Upstream SDK platform packages do not imply this Bundle has been tested on those platforms. The native SDK declares macOS 13 or later; the exercised machine was macOS 15.7.4 Intel.

## Source and licenses

Build and test from this repository using the scripts declared in [package.json](package.json); no sibling Harness checkout is a runtime installation source. The source extraction baseline and hashes are recorded in [SOURCE_ORIGINS.json](SOURCE_ORIGINS.json). Package and source updates are maintained here; Desktop / Host bridge changes remain in their owning repository.

```sh
npm ci --ignore-scripts
npm run check
npm run pack:candidate
```

These commands validate and package locally; they do not publish a Release or install into a daily profile. The coordinator publishes the accepted archive from a fixed source revision after validation.

The Bundle is MIT-licensed and retains DeepSeek's notice for derived Harness source. External dependencies keep their own licenses: Playwright MCP is Apache-2.0; Cua's native delivery also includes an MPL-2.0 Node runtime. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The package archive does not embed external npm dependencies or a Desktop application.
