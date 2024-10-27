import { cpSync, rmSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Replace 'dist' with the actual build output folder
const sourceFolder = 'dist';

// Replace '/path/to/production/folder' with the target production folder
const targetFolder = '/Users/guntherbosch/Chrome.Extensions/OpenMapSwitcher/dist-v3/';

try {
    // Empty the target folder before copying
    rmSync(targetFolder, { recursive: true, force: true });
    console.log(`Successfully emptied ${targetFolder}`);

    // Copy files from source folder to target folder
    cpSync(sourceFolder, targetFolder, { recursive: true });
    console.log(`Successfully copied files from ${sourceFolder} to ${targetFolder}`);

    // Update manifest.json for v3 compliance
    const manifestPath = path.join(targetFolder, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    // Update manifest version
    manifest.manifest_version = 3;

    // Convert background scripts to service worker
    if (manifest.background && manifest.background.scripts) {
        manifest.background = {
            service_worker: manifest.background.scripts[0]
        };
    }

    // Update content_security_policy
    delete manifest.content_security_policy;

    // Convert browser_action to action
    if (manifest.browser_action) {
        manifest.action = manifest.browser_action;
        delete manifest.browser_action;
    }

    // Update permissions
    if (manifest.permissions) {
        const newPermissions = manifest.permissions.filter(p => !p.includes('://'));
        const hostPermissions = manifest.permissions.filter(p => p.includes('://'));
        manifest.permissions = newPermissions;
        if (hostPermissions.length > 0) {
            manifest.host_permissions = hostPermissions;
        }
    }

    // Write updated manifest
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('Successfully updated manifest.json for v3 compliance');

} catch (error) {
    console.error('Error processing files:', error.message);
}
