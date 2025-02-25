const webstoreUpload = require('chrome-webstore-upload');
const fs = require('fs');
const path = require('path');

// Create a config.json file in the same directory as this script with the following content:
/* {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "your-refresh-token",
    "appId": "your-app-id"
  } */  


const configPath = path.resolve(__dirname, './config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const CLIENT_ID = config.clientId;
const CLIENT_SECRET = config.clientSecret;
const REFRESH_TOKEN = config.refreshToken;
const APP_ID = config.appId;

const zipFilePath = path.resolve(__dirname, './zip/OpenSwitchMaps.zip');

const webStore = webstoreUpload({
  extensionId: APP_ID,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  refreshToken: REFRESH_TOKEN,
});

async function upload() {
  try {
    const token = await webStore.fetchToken();
    const uploadResponse = await webStore.uploadExisting(zipFilePath, token);
    console.log('Upload Response:', uploadResponse);

    const publishResponse = await webStore.publish('default', token);
    console.log('Publish Response:', publishResponse);
  } catch (error) {
    console.error('Error uploading to Chrome Web Store:', error);
  }
}

upload();
