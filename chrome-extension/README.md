# LabFlow EMR Integration Chrome Extension

## Overview
The LabFlow EMR Integration Chrome Extension seamlessly connects Electronic Medical Record (EMR) systems with LabFlow, enabling healthcare providers to order lab tests and view results directly from their EMR interface.

## Features
- **Auto-detection** of major EMR systems (Epic, Cerner, Allscripts, etc.)
- **Patient data extraction** from EMR pages
- **Quick lab ordering** with pre-filled patient information
- **Real-time results sync** between LabFlow and EMR
- **Secure authentication** with LabFlow credentials
- **Offline support** with sync queue
- **Context menu integration** for quick actions

## Supported EMR Systems
- Epic MyChart
- Cerner PowerChart
- Allscripts
- athenahealth
- NextGen
- eClinicalWorks
- Practice Fusion

## Installation

### From Source
1. Clone the repository
2. Navigate to `chrome-extension` directory
3. Install dependencies:
   ```bash
   cd chrome-extension
   yarn install
   ```
4. Build the extension:
   ```bash
   yarn build
   ```
5. Open Chrome and navigate to `chrome://extensions/`
6. Enable "Developer mode"
7. Click "Load unpacked" and select the `dist` directory

### From Chrome Web Store
(Coming soon)

## Usage

### Initial Setup
1. Click the LabFlow icon in your Chrome toolbar
2. Click "Login to LabFlow" and authenticate
3. Grant necessary permissions when prompted

### Ordering Lab Tests
1. Navigate to a patient record in your EMR
2. Click the LabFlow widget or use right-click menu
3. Select "Quick Order" to open the order dialog
4. Review patient information and select tests
5. Submit the order to LabFlow

### Viewing Results
1. Navigate to a patient record
2. Click "View Results" in the LabFlow widget
3. Results will be displayed with options to:
   - View detailed reports
   - Download PDFs
   - Push results back to EMR

### Patient Sync
- Automatic sync when navigating to patient records
- Manual sync available via "Sync Patient" button
- Bi-directional data flow between EMR and LabFlow

## Configuration

### EMR Field Mappings
The extension automatically maps EMR fields to LabFlow fields. Custom mappings can be configured in Settings.

### Permissions
- `activeTab` - Access current EMR page
- `storage` - Store authentication and settings
- `notifications` - Show status updates
- `contextMenus` - Add right-click options

## Security
- All data transmitted over HTTPS
- OAuth 2.0 authentication with LabFlow
- No patient data stored locally
- Automatic session timeout
- HIPAA compliant

## Development

### Project Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Content scripts
│   └── popup/            # Extension popup
├── icons/                # Extension icons
├── scripts/              # Build scripts
└── dist/                 # Built extension
```

### Building
```bash
# Development build with source maps
yarn dev

# Production build
NODE_ENV=production yarn build

# Package for distribution
yarn package
```

### Testing
1. Load the extension in Chrome
2. Navigate to a supported EMR system
3. Verify the LabFlow widget appears
4. Test patient data extraction
5. Test order creation and result viewing

## Troubleshooting

### Extension not detecting EMR
- Verify you're on a supported EMR domain
- Check console for errors
- Try refreshing the page

### Authentication issues
- Clear extension storage
- Re-authenticate with LabFlow
- Check network connectivity

### Data not syncing
- Verify patient is selected in EMR
- Check sync queue in extension popup
- Review console logs for errors

## Support
For issues or questions, contact support@labflow.com or create an issue in the repository.
