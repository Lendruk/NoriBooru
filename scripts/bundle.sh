
# Remove old build
rm -rf ./build

mkdir ./build
mkdir ./build/temp

cp ./src-tauri/target/release/bundle/appimage/*.AppImage ./build/temp
cp ./scripts/runProdServer.sh ./build/temp/
cp -r ./backend/dist/ ./build/temp/
mv ./build/temp/dist/ ./build/temp/server

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
echo $PACKAGE_VERSION

tar cvzf ./build/nori-booru-$PACKAGE_VERSION-x64.tar.gz -C ./build/temp .
rm -rf ./build/temp