# Computer Browser Use

## Recorded rc.5 delivery status (2026-10-09)

The frozen rc.5 archive was installed on macOS Intel on 2026-10-07. Its ten package files remained identical after the matching Desktop update on 2026-10-08; Loader and client checks passed. The later Host fix passed isolated sustained-occlusion and reopened-canvas pixel tests. These results do not complete real-model acceptance: P0 Playwright, P1 Electron and native Chinese input remain separate, unfinished checks for this combination.

The latest maintained Computer Use attempt on 2026-10-08 stopped before any native tool call because the Context Manager could not parse a generated summary (`CONTEXT_MANAGER_BLOCKED`). No current permission, screenshot or input result was obtained. Earlier permission failures and rc.4 successes are historical; later Context updates do not themselves certify Computer Use.

The release candidate keeps the original archive unchanged. The repository's dated status notes were updated after that archive was frozen; its packaged documentation preserves the earlier evidence date. This is a prerelease with explicit acceptance limits, not a production-readiness claim.

## Production stability candidate rc.5

Version `0.1.0-rc.5` requires the matching Desktop stability update. Electron waits have a 30-second ceiling (120 seconds for user file selection); stop and takeover cancel waiting promptly. Interrupted input may have completed and is never replayed automatically. Resume refuses while a native command is still settling; inspect the page manually, or close and reopen the owned tab. New tabs require their task to be open in Desktop; an unmounted Sidebar receives an immediate diagnosis without switching tasks.

Native `get_window_state` defaults to screenshot-only and rejects full AX scanning. `verify_state` and `invoke_menu`, which enter unsafe menu AX paths in Cua 0.28, are excluded. Failed refreshes revoke the old input permit; only a usable PNG delivered through the Host image pipeline permits the next action. Prefer an authorized click, a new screenshot, then `type_text` without coordinates, followed by readback. Browser Use still supplies browser accessibility structure.

The matched Host passed an isolated Electron 44 test with a genuinely backgrounded webview: scrolling moved the page 450 pixels and an immediate screenshot contained the new canvas pixels without activating the window. Native ASCII and Chinese typing on rc.4 passed the separate-focus path; combined focus-and-type remains unconfirmed. This rc.5 archive requires separate post-freeze installation and real-model acceptance. P0 Playwright and P1 Electron are verified separately; this macOS Intel evidence does not certify other platforms.

English | [中文](README.zh.md)

`@missher/dsh-computer-browser` provides session-owned browser control and Cua desktop tools for the matching Missher Desktop integration. Choose the visible Electron sidebar browser or a separate visible Playwright browser. Only one Browser Use provider is active at a time.

This repository is the sole maintenance source for the independent Bundle. The earlier Computer Browser Use candidate checkout remains a historical implementation and verification record; it is not a second maintained source. Version `0.1.0-rc.5` retains the object-root tool schema and requires valid native screenshots. It is not an official DeepSeek Desktop release.

## Required host

Installing this Bundle alone does not add the required Desktop features. Use a Missher Desktop / Host build with all of the following:

- The Desktop browser bridge with `automationVersion: 1` and its matching sidebar client, for the default `electron` backend.
- Host adapters for native authorization and stop / takeover / resume controls.
- MCP `excludedTools` support, for the `playwright` backend.
- `runProfile.prepareContext` startup integration, which installs the trusted Desktop adapters before the plugin tree loads.
- The 2026-10-05 Host and Sidebar attachment fix: reservation state must be readable before the guest attaches, with main-process lease binding and explicit initialization failures.
- The final Host screenshot fix for sustained window occlusion and reopened canvas content: keep the owning window painting while an operation is active, restore its prior throttling state, and retain cancellation, fresh-frame and no-focus-steal protections.

Official Desktop `0.2.0-rc.2` does not provide these additions. An existing Missher Desktop download is not sufficient evidence either: an older published asset may lack them despite the same base version. The user reproduced repeated Electron `open` failures on the local `latest-cbu-20261004` integration on 2026-10-05. That integration is not a working Browser Use baseline; updating this Bundle alone does not repair attachment. Check the matching host's release notes and [COMPATIBILITY.json](COMPATIBILITY.json) before installation; broad peer dependency ranges do not certify compatibility.

Shared Cordis, Agent, ToolRuntime, MCP, BrowserUse and ComputerUse services come from the Host. This package does not install a second Host or require a separate compatibility Bundle. It rejects competing providers and rolls back its browser provider if native startup fails.

## Browser and desktop behavior

| Backend | Visible page | Ownership and storage |
| --- | --- | --- |
| `electron` — default | The same actual sidebar guest used by `browser_use` | Exact live session activation; temporary storage by default |
| `playwright` | A separately launched visible Chromium window | Private temporary profile and working directory for each live session activation |

`open` and `navigate` require an absolute HTTP(S) `url` without embedded credentials. Missing, blank or invalid URLs are rejected before IPC and before creating activation ownership; the Host still checks its navigation policy. The object-root tool schema describes the required fields for each action. The same requirements map validates conditional target, snapshot and input fields before ownership or IPC; these conditional requirements are not represented by a top-level schema union.

Observe the owned page, act using its current references, then inspect the result. Stops reject new actions; previously dispatched native work may still be settling. Takeover hands control to the user; resuming requires a new observation. Cancellation and timeout do not undo input already delivered, and uncertain actions are not replayed automatically. Session isolation protects target ownership; it is not an operating-system sandbox.

Electron uploads require native user file selection and use a private staged copy. Downloads require approval for one transfer and a selected destination. Persistent login requires explicit native confirmation and applies to future tabs, rather than changing an existing guest. A saved conversation, a saved URL, live page state and login storage are separate: restarting does not restore old handles, snapshots or pending actions. Uninstalling does not delete user-selected persistent login data.

The Playwright backend always launches a visible isolated browser. This Bundle does not attach to an existing browser or reuse a daily profile. Arbitrary script execution, model-selected host file paths, arbitrary uploads and drop operations are excluded; screenshots use managed temporary output.

Cua Driver runs in Standard mode. Browser subtools, including legacy `page`, are disabled so browser control has one owner. Raw SDK session management, global configuration writes, helper installation, recording and trajectory replay are not model tools. Existing-profile attachment decisions use a trusted Host dialog, never a model or page approval. OS Screen Recording and Accessibility permissions remain system-managed and are not requested automatically. A refused background action does not authorize a foreground retry.

Screenshots use the Host's image and attachment pipeline. Image-capable routes can receive actual images; text-only routes can use Browser Use accessibility text but cannot authorize native screenshot-based input. This package does not invent OCR or treat base64 text as visual understanding. Native desktop coordination covers one Host; users and other processes can still change the physical desktop.

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

On 2026-10-06 the repaired Desktop and rc.2 Bundle were installed, but a real `deepseek-flash` request rejected the root `oneOf` tool schema before any browser action. Version rc.3 uses an explicit object root without changing the flat `{ action, url, ... }` invocation format. Missing conditional fields and unsupported action fields still fail before activation or IPC. Post-freeze installation and real-model retest results belong to the maintainer delivery receipt.

The historical `0.1.0-candidate.1` installation and cold-start checks passed on 2026-10-04. The later user report demonstrates that its production Electron `open` path was broken: Sidebar tabs appeared, but no guest target attached. The earlier `0.1.0-rc.1` fixture used synthetic Host adapters and bypassed the production claim/state attachment path, so those results did not establish a working sidebar browser.

`0.1.0-rc.2` fixes the Bundle argument mismatch. The matching Host and Sidebar repair remains required. On 2026-10-05 an isolated Electron 44 fixture traversed the production page/frame/presentation, preload, reservation IPC and guest modules: open, observation, fill, click, independent DOM read-back, cross-session denial and concurrent guest isolation passed. It also reproduced the old pre-attachment state failure and verified prompt initialization/partition failure diagnostics. Both fixture processes exited with code 0. The captured PNG showed an earlier frame, so screenshot freshness is not accepted. This Host-path test did not install this archive or validate the complete Desktop application. Archive installation and combined-app results are recorded in the maintainer delivery receipt after the archive is frozen; rc.1 results cannot be inherited. Real-model use and daily installation are not established by this fixture. See [VALIDATION.md](VALIDATION.md) for the precise evidence and limits.

The earlier implementation has separate real-browser evidence for visible Playwright automation and a real Electron 44 guest, including form read-back, target isolation, takeover, staged uploads and controlled downloads. These historical checks used owned, account-free fixtures; the guest checks did not cover the failing production claim/state sequence. They do not establish arbitrary website behavior or real paid-model performance.

The following results belong to the earlier isolated Node-host test; current daily Electron-host evidence is described at the top of this page. In that Node 25.6.0 SDK host on macOS Intel, foreground input, an AX click and independent renderer read-back passed; background input did not, and the final SDK PNG still showed old pixels. That historical test did not confirm fresh post-action screenshots or a complete visual loop. Electron was the target application in that test, not the SDK host; it did not establish independent Electron SDK-host TCC and input acceptance.

The newer user report includes working Cua diagnostics and screenshots in that session; it does not refresh the full native acceptance matrix. No real paid-model visual task was run for the checks recorded here. Apple Silicon, Windows and Linux native behavior has not been accepted. Upstream SDK platform packages do not imply this Bundle has been tested on those platforms. The native SDK declares macOS 13 or later; the exercised machine was macOS 15.7.4 Intel.

## Source and licenses

Build and test from this repository using the scripts declared in [package.json](package.json); no sibling Harness checkout is a runtime installation source. The source extraction baseline and hashes are recorded in [SOURCE_ORIGINS.json](SOURCE_ORIGINS.json). Package and source updates are maintained here; Desktop / Host bridge changes remain in their owning repository.

```sh
npm ci --ignore-scripts
npm run check
npm run pack:candidate
```

These commands validate and package locally; they do not publish a Release or install into a daily profile. The coordinator publishes the accepted archive from a fixed source revision after validation.

The Bundle is MIT-licensed and retains DeepSeek's notice for derived Harness source. External dependencies keep their own licenses: Playwright MCP is Apache-2.0; Cua's native delivery also includes an MPL-2.0 Node runtime. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The package archive does not embed external npm dependencies or a Desktop application.
