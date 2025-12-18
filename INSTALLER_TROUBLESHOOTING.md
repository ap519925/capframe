# Installer Troubleshooting & Return Codes

## Installer Return Codes (NSIS)

Capframe uses NSIS (Nullsoft Scriptable Install System) for its Windows installer. When running the installer, particularly in automation or scripts, you may encounter the following return codes:

| Return Code | Meaning | Description |
| :--- | :--- | :--- |
| **0** | **Success** | Normal execution. The installation completed successfully without errors. |
| **1** | **Cancelled** | The user cancelled the installation (e.g., clicked the "Cancel" button). |
| **2** | **Aborted** | The installation was aborted by the installation script itself (e.g., a prerequisite check failed). |

### Official Documentation
For more details on NSIS Error Levels, refer to the official documentation:
[NSIS Error Legend](https://nsis.sourceforge.io/Docs/Chapter3.html#errorlevels)

## Windows System Error Codes

In rare cases, or if the installer crashes due to a system-level issue, it may return a standard Windows System Error Code. These are miscellaneous codes defined by the operating system.

**Complete List of Windows System Error Codes:**
[System Error Codes (Microsoft Learn)](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes)

## Common Build & Install Issues

### Installer Freezes or Fails to Launch
*   **Anti-Virus**: Windows Defender or other AV software may flag unsigned installers. Check the "Protection History" and allow the app.
*   **Permissions**: Ensure you have administrative privileges if installing to `C:\Program Files`.
*   **Corrupted Download**: Verify the file size and integrity.

### Build Errors (during `npm run dist`)
*   **File Locked**: Ensure the application is CLOSED before running the build command.
*   **Icon Missing**: Verify `build/icon.png` exists.
*   **Signing Error**: If you configured code signing, ensure your certificate is valid and the path is correct.

See `WINDOWS_STORE_GUIDE.md` for specific instructions on packaging for the Microsoft Store.
