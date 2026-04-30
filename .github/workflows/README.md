# GitHub Workflows

## Build Desktop App (`build-desktop.yml`)

Automatically builds the Folkhart desktop app for Windows, Linux, and macOS.

### Triggers

- **Push to main branch**: Builds all platforms
- **Pull requests to main**: Tests the build process
- **Tagged releases** (v*): Creates a draft release with downloadable installers
- **Manual trigger**: Can be run manually from Actions tab

### Platforms

**Windows:**
- NSIS installer (.exe)
- Portable executable (.exe)
- MSI installer (.msi)

**macOS:**
- DMG disk image (.dmg) - Universal (Intel + Apple Silicon)
- ZIP archive (.zip) - Universal (Intel + Apple Silicon)

**Linux:**
- AppImage (.AppImage) - Universal format
- Debian package (.deb) - For Ubuntu/Debian
- RPM package (.rpm) - For Fedora/RHEL

### Artifacts

Build artifacts are stored for 30 days and can be downloaded from:
1. Go to **Actions** tab
2. Click on the workflow run
3. Download artifacts from the bottom of the page

### Creating a Release

To create a new release with installers:

1. Tag your commit:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The workflow will automatically:
   - Build for all platforms
   - Create a draft GitHub release
   - Attach all installers to the release

3. Edit the draft release on GitHub and publish it

### Environment Variables

The build uses these environment variables:
- `VITE_API_URL`: https://backend-glre.onrender.com
- `VITE_WS_URL`: wss://backend-glre.onrender.com

### Requirements

- Node.js 20
- GitHub secrets (automatically provided):
  - `GITHUB_TOKEN`: For creating releases

### Local Building

To build locally:

```bash
cd frontend

# Install dependencies
npm install

# Build for your platform
npm run electron:build        # Current platform
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

Output will be in `frontend/dist-electron/`

### Troubleshooting

**macOS code signing:**
- Auto-discovery is disabled (`CSC_IDENTITY_AUTO_DISCOVERY: false`)
- Apps are unsigned by default
- Users may need to allow the app in System Preferences

**Windows SmartScreen:**
- Unsigned builds may trigger SmartScreen warnings
- Consider code signing for production releases

**Linux permissions:**
- AppImage may need execute permissions: `chmod +x Folkhart-*.AppImage`
