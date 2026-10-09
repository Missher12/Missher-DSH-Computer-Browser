# Third-party components

The Bundle's MIT license does not replace the licenses of its dependencies. This notice distinguishes source compiled into `lib/index.js` from external packages installed by the package manager. The archive does not embed `node_modules`, a Desktop application or Cua platform binaries.

## Derived DeepSeek Harness source

Four of the eight runtime source modules originate in DeepSeek Harness, copyright (c) 2026 DeepSeek, under the MIT License. The checked upstream reference is [`dsh-v0.2.0-rc.2`](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2), commit `639ed015397290b3745d163aafe02ffee4aa3f84`. The original MIT notice is retained in [LICENSE](LICENSE).

| Original path | Extraction relationship |
| --- | --- |
| `packages/experimental/browser-use-runtime/src/index.ts` | Unmodified upstream source at extraction |
| `packages/experimental/browser-use-runtime/src/mcp.ts` | Upstream source with local lifecycle, control and tool-policy changes |
| `packages/experimental/browser-use-playwright-mcp/src/index.ts` | Upstream source with local browser policy changes |
| `packages/experimental/computer-use-cua-driver-native/src/index.ts` | Upstream source with local authorization, lifecycle, result and tool-catalog changes |

The Electron browser provider, native session authority module, native result adapter and Bundle composition entry were added by this project. They were not present at that upstream reference. They are distributed under MIT with the project's modifications. [SOURCE_ORIGINS.json](SOURCE_ORIGINS.json) records all eight original paths, their extraction hashes and their relationship to upstream. This repository maintains the extracted code; it does not publish copied upstream plugins as separate dependency packages.

Cordis, Agent, ToolRuntime, BrowserUse, ComputerUse and the MCP client remain external Host services. Their implementations are not copied into this Bundle.

## External packages

| Component | Version audited | License and attribution |
| --- | --- | --- |
| [`@playwright/mcp`](https://github.com/microsoft/playwright-mcp) | 0.0.80 | Apache-2.0; Microsoft Corporation. Its installed package includes the full `LICENSE`. |
| [`@trycua/cua-driver`](https://github.com/trycua/cua) | 0.28.0 | MIT SDK; Cua AI, Inc. Platform components have additional notices, described below. |
| [`@deepseek-ai/schemastery`](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2/vendor/schemastery) | 3.18.4 | MIT; copyright (c) 2021-present Shigma. This is the Harness-maintained scoped package. |
| [`zod`](https://github.com/colinhacks/zod) | 4.4.3 | MIT; copyright (c) 2025 Colin McDonnell. |
| [`@ubjs/core`, `@ubjs/node`](https://github.com/jhugman/uniffi-bindgen-react-native) | 0.31.0-3 | MPL-2.0; upstream contributors. These are Cua SDK runtime dependencies, not Bundle source. |

Versions in the current package manifest and lockfile determine the installed dependency set. Direct dependencies resolve to their original published packages; this project does not re-upload them under its own account. Preserve each installed package's own license and notices when redistributing it.

## Cua native runtime

The audited `@trycua/cua-driver-darwin-x64@0.28.0` package declares `MIT AND MPL-2.0`. Its `cua_driver_node_runtime.node` is a compatibility build derived from the N-API runtime in `uniffi-bindgen-react-native@0.31.0-3`, copyright its contributors, under the [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/). Calling the entire native delivery MIT-only would omit this component.

That package's `node-runtime-NOTICE.md` identifies the corresponding source as the pinned npm development dependency together with the deterministic transformations in `scripts/build-node-runtime.mjs` in the matching Cua release source. Retain this notice and its source instructions when redistributing the binary; inspect each platform package's own metadata and notices rather than extrapolating the macOS x64 audit to every platform. This Bundle obtains native packages as external npm dependencies and does not change or repackage those binaries.

Cua's [license](https://github.com/trycua/cua/blob/main/LICENSE.md) and [licensing map](https://github.com/trycua/cua/blob/main/LICENSING.md) distinguish the MIT driver from other products and optional components. This Bundle does not include Cua Spaces, a perception extension, OCR model weights or a separately installed ffmpeg binary. Installing another optional component creates a separate dependency and license review; the driver name alone does not determine its terms.

An offline distribution or Desktop package that includes these dependencies is a different distribution scope from this `.tgz`. Its distributor must carry the applicable complete license texts, notices and corresponding-source information; this short notice does not substitute for those materials.

The rc.4 native diagnostic projection was checked against Cua tag `cua-driver-rs-v0.28.0` (`libs/cua-driver/rust/crates/platform-macos/src/tools/type_text.rs`). No Rust implementation was copied. Existing source copyrights and extraction hashes remain unchanged.
