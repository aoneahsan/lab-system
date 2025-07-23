# LabFlow Chrome Extension

This Chrome extension enables seamless integration between Electronic Medical Record (EMR) systems and LabFlow.

## Features

- **Auto-detection** of popular EMR systems (Epic, Cerner, Allscripts, etc.)
- **Patient data extraction** from EMR pages
- **Lab order extraction** and submission
- **Real-time connection status** monitoring
- **Context menu integration** for quick data extraction
- **Secure API key** configuration

## Installation

### Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` directory from this project

### Production

The extension will be published to the Chrome Web Store once approved.

## Configuration

1. Click on the LabFlow extension icon in Chrome
2. Enter your LabFlow API key
3. Optionally configure the server URL (defaults to `http://localhost:5173`)
4. Click "Save Configuration"
5. Test the connection

## Usage

### Automatic Detection

The extension automatically detects when you're on a supported EMR system and adds "Send to LabFlow" buttons to relevant sections.

### Manual Extraction

1. Right-click on any page with patient or order information
2. Select "Send Patient to LabFlow" or "Send Lab Order to LabFlow"
3. The extension will attempt to extract and send the data

### Supported EMR Systems

- Epic (MyChart)
- Cerner (PowerChart)
- Allscripts
- AthenaHealth
- NextGen
- eClinicalWorks
- Practice Fusion
- Generic EMR detection for other systems

## Icon Generation

To generate the required icon sizes from the SVG source:

```bash
# Install dependencies (one time)
npm install -g sharp-cli

# Generate icons (requires Node.js)
node generate-icons.js
```

Or manually create PNG files at these sizes:
- 16x16 pixels → icon16.png
- 32x32 pixels → icon32.png
- 48x48 pixels → icon48.png
- 128x128 pixels → icon128.png

## Development

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── src/
│   ├── background.js      # Background service worker
│   ├── content.js         # Content script for EMR pages
│   └── injected.js        # (Optional) Page-injected scripts
├── public/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup functionality
│   └── icon*.png          # Extension icons
└── README.md              # This file
```

### Testing

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the LabFlow extension card
4. Test on EMR pages or use test data

### API Endpoints

The extension communicates with these LabFlow API endpoints:

- `POST /api/emr-integration/test` - Test connection
- `POST /api/emr-integration/patient` - Submit patient data
- `POST /api/emr-integration/order` - Submit lab order

## Security

- API keys are stored securely in Chrome's local storage
- All communication uses HTTPS in production
- No patient data is stored locally
- Extension only activates on whitelisted EMR domains

## Troubleshooting

### Extension not detecting EMR

1. Check if the EMR URL is in the supported list
2. Ensure the extension has permission for the site
3. Check the console for errors (F12 → Console)

### Connection issues

1. Verify your API key is correct
2. Check if LabFlow server is running
3. Ensure no firewall/proxy is blocking requests

### Data extraction issues

1. EMR layouts may have changed
2. Try manual extraction via right-click menu
3. Report the issue with EMR system details

## Support

For issues or feature requests, please contact the LabFlow support team or create an issue in the project repository.