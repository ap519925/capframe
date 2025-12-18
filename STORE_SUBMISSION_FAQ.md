# Microsoft Store Submission FAQ

## Error: "The package URL redirects to another URL"

If you see this error when providing a Package URL (e.g., for an MSIX or EXE installer) in the Microsoft Partner Center, it usually means you are using a link that performs a generic redirect (like GitHub's "latest" link).

### Solution 1: Use a Specific Version Link
Do **not** use: 
`https://github.com/ap519925/capframe/releases/latest/download/Capframe-Setup.exe`

**DO** use the specific tag link:
`https://github.com/ap519925/capframe/releases/download/v1.0.0/Capframe-Setup-1.0.0.exe`

### Solution 2: GitHub Raw/CDN (Not recommended for EXE)
GitHub release assets always redirect to a CDN (AWS/Azure storage). If the Microsoft Store validator is extremely strict and rejects the internal CDN redirect (302 Found), you cannot use GitHub Releases as your direct package host for the Store's "Package URL" field.

**Alternative Hosting Options:**
1.  **Azure Blob Storage**: Create a public container, upload your `.exe`/`.msix`, and use that direct URL.
2.  **AWS S3**: Upload to a public bucket.
3.  **Your Own Website**: Host the file on your own web server.
4.  **Dropbox/Google Drive**: (Often tricky due to bandwidth limits and query parameters).

### Recommended Workflow
For most Windows Store submissions using the "Your own installer" method, pointing to a **GitHub Release specific version link** (Solution 1) usually works. Ensure you are copying the link address directly from the "Assets" section of your published release.
