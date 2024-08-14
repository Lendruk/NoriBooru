
# Remove old build
echo "Starting app bundle"

echo "Removing old build"
rm -rf ./build

mkdir ./build
mkdir ./build/temp

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
echo $PACKAGE_VERSION

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  cp ./src-tauri/target/release/bundle/appimage/*.AppImage ./build/temp
  cp ./scripts/runProdServer.sh ./build/temp/
  cp -r ./backend/dist/ ./build/temp/
  mv ./build/temp/dist/ ./build/temp/server

  tar cvzf ./build/nori-booru-$PACKAGE_VERSION-x64.tar.gz -C ./build/temp .
elif [[ "$OSTYPE" == "msys" ]]; then
  cp ./src-tauri/target/release/bundle/nsis/*.exe ./build/temp
  cp ./scripts/runProdServer.sh ./build/temp/
  cp -r ./backend/dist/ ./build/temp/
  mv ./build/temp/dist/ ./build/temp/server

  tar cvzf ./build/nori-booru-$PACKAGE_VERSION\_x64.windows.tar.gz -C ./build/temp .
fi

rm -rf ./build/temp