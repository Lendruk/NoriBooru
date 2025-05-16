# NoriBooru

Self-hosted media database and management system.
Uses the concept of vaults as a media database. A server can keep track of multiple vaults at the same time.

Currently NoriBooru is **NOT PRODUCTION READY**. The current build is far from optimized and very buggy
## Current Features

- Tagged Image / Video storage and gallery / inbox
- Media Item playlists
- Optional Stable diffusion integration via the [Automatic1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) backend (currently only supports text2img)
- Stable diffusion resource management interface (checkpoints / loras only for now)
- Allow direct importing of Civitai models with their metadata

## Getting Started

### Requirements

- ffmpeg
- node >= 20.11.0

### Development

In the project root directory run:

```sh
npm run prepare:dev
```

And

```sh
npm run dev
```

### Docker

In the project root directory run:

```sh
docker compose up
```

### Desktop App

Additionally you can bundle the app into a front-end executable binary and a seperate node server using:

```sh
npm run bundle
```

This will create a `build` directory with the bundled app.
Once you have unpacked the tarball you can start the backend using the shell script `runProdServer.sh`.
This will start the backend server on port 8080.

## Releases

You can download the latest release from the [releases page](https://github.com/Lendruk/NoriBooru/releases).
Currently only AppImage builds are available. Windows builds will be added in the future.

## Firefox extension

There is also a Firefox [extension](https://github.com/Lendruk/NoriBooru-media-uploader) that allows you to directly upload images to your NoriBooru instance.
This extension adds a new right-click option to every image which will send it directly to your inbox on the vault selected in the extension.
