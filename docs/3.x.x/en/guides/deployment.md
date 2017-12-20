# Deployment

#### #1 - Configurate

Update the `production` settings with the IP and domain name where the project will be running.

**Path —** `./config/environments/production/server.json`.
```js
{
  "host": "domain.io", // IP or domain
  "port": 1337,
  "autoReload": {
    "enabled": false
  },
  "admin": {
    "build": {
      "path": "/dashboard" // We highly recommend to change the default `/admin` path for security reasons.
    }
  }
}
```

#### #2 - Setup

Run this following command to install the dependencies and build the project.

```bash
cd /path/to/the/project
npm run setup
```

> Note: The `build` folders are ignored (.gitignore). If you're cloning your git repository on your server, you need to run this command on your server.

#### #3 - Launch the server

Run the server with the `production` settings.

```bash
NODE_ENV=production npm start
```

> We highly recommend to use [pm2](https://github.com/Unitech/pm2/) to manage your process.

### Advanced configurations

If you want to host the administration on another server than the API, [please take a look at this dedicated section](advanced/customize-admin.md#deployment).
