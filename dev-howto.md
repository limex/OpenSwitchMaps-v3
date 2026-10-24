This extension uses Node.js

1. Install Node.js
2. Install the dependencies: `npm install`
3. Build the extension: `npm run build`
4. The extension is built in the `dist` directory
5. Add to your Chrome
   - Chrome: chrome://extensions/ -> Load unpacked
6. Additional
   1. Build Script copies the /dist folder to your Chrome Extension Folder
   2. A script increases the version number.
   3. There are legacy PowerShell scripts that might be outdated.

## Deployment

## Scripts in package.json

`dev`: Watches for changes in the source files and rebuilds the extension automatically.  

`build`: Cleans the `dist` directory, increments the version number, builds the extension, copies necessary files to `dist`, and runs the deployment script. Also copies files to your chrome's extension folder (adopt to your path!)  

`zip`: Creates a zip file of the `dist` directory for publishing.

To Publishing to chrome marketplace, get some settings following this [Use the Chrome Web Store Publish API](https://developer.chrome.com/docs/webstore/using-api).
You get settings for `clientId, clientSecret, refreshToken & extensionId`


`publish-init`: Initializes the `publish-browser-extension` configuration. You enter the values above, it creates a `.env.submit` file, needed for `publish`

`publish`: Uses `publish-browser-extension` to publish the extension to the Chrome Web Store.

## Extract Supported maps to MD

`node extract-maps.js` creates `maps-list.md` from `src/map-metadata.json`.

## Map definitions

Names, categories, domains, descriptions, and default visibility live in
`src/map-metadata.json`. URL generators and parsers live in `src/maps.js`,
joined to that metadata by the exact map name. Add entries to both files when
adding a service. Options and storage import the lightweight `src/map-catalog.js`
so they do not load URL conversion code or `proj4`.

Run `npm test` and the browser round trips described in `tests/README.md` after
changing map definitions.
