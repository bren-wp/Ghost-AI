# Ghost AI by Brendigo — launch and recovery

Official publisher: Brendigo · https://brendigo.com

## If the application doesn't open

Use the newest **verified** Ghost AI release published through the official website. Ghost AI v0.1.1 has a confirmed launch failure on a clean Windows environment; upgrading is preferable to reinstalling the same affected version.

On Windows, extract the entire Portable.zip into a normal folder before opening Ghost-AI.exe. The self-extracting Portable.exe is an alternative for systems that allow executables launched from the temporary folder. The setup installer is intended for users who want a traditional installation.

On Windows 10, confirm that the system WebView2 runtime is installed and up to date. The standard setup package can provision it where required; a portable application cannot always provision system prerequisites.

## Keep existing work safe

Do not delete the application data directory or `data.db` to troubleshoot an initial launch error. Do not remove configuration and keychain entries unless you have a verified backup and understand how encrypted data is recovered.

## Local diagnostic records

If Ghost AI exits during startup, recent versions save a short local failure report to:

- Windows: `%LOCALAPPDATA%\com.brendigo.ghostai\logs\ghost-ai-startup.log`
- Linux: `~/.local/share/com.brendigo.ghostai/logs/ghost-ai-startup.log` where the operating system uses the standard local data directory
- macOS: the per-user application data directory's `com.brendigo.ghostai/logs/ghost-ai-startup.log`

Application logs might also be stored in the operating system's application-data folder.

Before sharing any diagnostic file, review it for private paths, access tokens, account data or conversation content. Never send API keys or passwords to support. Submit issues through https://brendigo.com.

## Update behavior

The installed app can be maintained using Update.exe after Setup.exe has installed Ghost AI. Portable builds should be replaced with the new verified Portable package; the installer updater does not rewrite a separate portable copy.

Automatic in-app updates only operate once Brendigo has provisioned a trusted signing key and a signed HTTPS update manifest. Untrusted or unsigned automatic updates are intentionally disabled.
