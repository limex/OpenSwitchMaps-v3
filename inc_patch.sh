#!/bin/bash

# Increment version number in manifest.json

manifest_file="src/manifest.json"
package_file="package.json"
package_lock_file="package-lock.json"

version=$(sed -n 's/.*"version": "\(.*\)",/\1/p' $manifest_file)
a=(${version//./ })
((a[2]++))
new_version="${a[0]}.${a[1]}.${a[2]}"

echo -e "Version updated from $version to \033[1;33m$new_version\033[0m"
echo "Write to $manifest_file" 

# sed -i "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file
# macos version
sed -i "" "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file

echo "Write to $package_file" 
# sed -i "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file
# macos version
sed -i "" "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $package_file

echo "Write to $package_lock_file" 
node -e '
const fs = require("fs");
const [file, version] = process.argv.slice(1);
const lockfile = JSON.parse(fs.readFileSync(file, "utf8"));
lockfile.version = version;
lockfile.packages[""].version = version;
fs.writeFileSync(file, `${JSON.stringify(lockfile, null, 2)}\n`);
' "$package_lock_file" "$new_version"

