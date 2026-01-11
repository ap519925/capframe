# Installer Return Codes

Capframe uses NSIS (Nullsoft Scriptable Install System) for its installer. Below are the standard return codes used by the installer executable.

## Standard Return Codes

| Scenario | Return Code | Description |
| :--- | :--- | :--- |
| **Success** | `0` | The installation completed successfully. |
| **Standard Failure** | `1` | The installation failed due to a generic error or was cancelled by the system. |
| **Cancelled by User** | `2` | The user actively cancelled the installation (e.g., clicked "Cancel"). |
| **Already In Progress** | `1618` | Another installation is already in progress. (Windows Installer / MSI standard code). |
| **Reboot Required** | `3010` | The installation succeeded but a reboot is required to complete it. |

## Error Specific Return Codes

| Scenario | Return Code | Description |
| :--- | :--- | :--- |
| **Disk Full** | `112` | There is not enough space on the disk. (ERROR_DISK_FULL) |
| **Network Failure** | `12007` | The server name or address could not be resolved. (ERROR_INTERNET_NAME_NOT_RESOLVED) |
| **Security Policy Rejection** | `1260` | This program is blocked by group policy. (ERROR_ACCESS_DISABLED_BY_POLICY) |
| **Application Already Exists** | `1638` | Another version of this product is already installed. |

## Troubleshooting

If you encounter a return code not listed here, it is likely a standard Windows System Error Code. Please refer to the [Microsoft System Error Codes documentation](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes).
