import webstoreUpload from 'chrome-webstore-upload';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Create a config.json file in the same directory as this script 
// with the following content (https://github.com/fregante/chrome-webstore-upload-keys):
/* {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "your-refresh-token",
    "appId": "your-app-id"
  } */  


const configPath = resolve(__dirname, './config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const CLIENT_ID = config.clientId;
const CLIENT_SECRET = config.clientSecret;
const REFRESH_TOKEN = config.refreshToken;
const APP_ID = config.appId;

const zipFilePath = resolve(__dirname, './zip/OpenSwitchMaps.zip');

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
