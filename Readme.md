# NoriBooru
Self-hosted media database and management system.
Uses the concept of vaults as a media database. A server can keep track of multiple vaults at the same time.

Currently NoriBooru is **NOT PRODUCTION READY**. All future versions released before `1.0.0` will be experimental versions and subject to breaking changes. For now there is no optimized production build.

## Getting Started

### Requirements
- ffmpeg
- node >= 20.0.0

### Locally
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
docker-compose up
```

## Firefox extension
There is also a Firefox [extension](https://github.com/Lendruk/NoriBooru-media-uploader) that allows you to directly upload images to your NoriBooru instance.
This extension adds a new right-click option to every image which will send it directly to your inbox on the vault selected in the extension.
