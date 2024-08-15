#!/bin/bash

# Increment version number in manifest.json

manifest_file="src/manifest.json"
package_file="package.json"
package_lock_file="package-lock.json"

version=$(sed -n 's/.*"version": "\(.*\)",/\1/p' $manifest_file)
a=(${version//./ })
((a[1]++))
new_version="${a[0]}.${a[1]}.0"

echo "Version updated from $version to $new_version"
echo "Write to $manifest_file" 

# sed -i "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file
# macos version
sed -i "" "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file

echo "Write to $package_file" 
# sed -i "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file
# macos version
sed -i "" "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $package_file

echo "Write to $package_lock_file" 
# sed -i "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $manifest_file
# macos version
# TODO: Limit to only the first 2 occurances
sed -i "" "s/\"version\": \"$version\"/\"version\": \"$new_version\"/g" $package_lock_file


