const { cpSync, rmSync } = require('fs');

// Replace 'dist' with the actual build output folder
const sourceFolder = 'dist';

// Replace '/path/to/production/folder' with the target production folder
const targetFolder = '/Users/guntherbosch/Chrome.Extensions/OpenMapSwitcher/dist-v2/';

try {
    // Empty the target folder before copying
    rmSync(targetFolder, { recursive: true, force: true });
    console.log(`Successfully emptied ${targetFolder}`);

    // Copy files from source folder to target folder
    cpSync(sourceFolder, targetFolder, { recursive: true });
    console.log(`Successfully copied files from ${sourceFolder} to ${targetFolder}`);
} catch (error) {
    console.error('Error copying files:', error.message);
}