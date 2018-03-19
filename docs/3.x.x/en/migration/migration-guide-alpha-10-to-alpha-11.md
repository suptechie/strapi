# Migrating from 3.0.0-alpha.10 to 3.0.0-alpha.11

**Here are the major changes:**

- Add plugin upload

> Feel free to [join us on Slack](http://slack.strapi.io) and ask questions about the migration process.


## Getting started

Install Strapi `alpha.11.1` globally on your computer. To do so run `npm install strapi@3.0.0-alpha.11.1 -g`.

When it's done, generate a new empty project `strapi new myNewProject` (don't pay attention to the database configuration).

## Configurations

You will have to update just 1 file: `package.json`

- Edit the Strapi's dependencies version: (move Strapi's dependencies to `3.0.0-alpha.11.1` version) in `package.json` file

```json
{
  "dependencies": {
    "lodash": "4.x.x",
    "strapi": "3.0.0-alpha.11.1",
    "strapi-mongoose": "3.0.0-alpha.11.1"
  }
}
```


## Update the Admin

Delete your old admin folder and replace it by the new one.


## Update the Plugins

Copy this file `/plugins/users-permissions/config/jwt.json` **from your old project** and paste it in the corresponding one in your new project.

Copy the fields and relations you had in your `/plugins/users-permissions/models/User.settings.json` file in the new one.

Then, delete your old `plugins` folder and replace it by the new one.


That's all, you have now upgraded to Strapi `alpha.11`.
