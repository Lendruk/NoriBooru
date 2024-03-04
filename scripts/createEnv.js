const fs = require('fs');
const packageFile = fs.readFileSync('./package.json');
const packageObj = JSON.parse(packageFile);
const version = packageObj.version;
fs.writeFileSync('./frontend/.env', `PUBLIC_VERSION=${version}`);
