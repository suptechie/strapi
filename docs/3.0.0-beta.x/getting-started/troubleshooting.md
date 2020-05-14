# 💬 Troubleshooting

Below are solutions to some common issues that you may experience when working with Strapi. You can also post questions to [Github Discussions](https://github.com/strapi/strapi/discussions) or reach out to the members of our [Slack](https://slack.strapi.io) community!

[[toc]]

## Technical Support

Strapi is offered as free and open-source for users who wish to self-host the software.

### Community Support

[Github Discussions](https://github.com/strapi/strapi/discussions) is great first place to reach out for help. Our community and Core developers often check this platform and answer posts.

Another option to get help is our [Community Slack](https://slack.strapi.io). Please keep all questions on the `#help` channel, be considerate, and remember that _you are getting free help for a free product_.

### Enterprise support

Looking for enterprise support?

Fill out the form on the [Support page](https://strapi.io/support) of the Strapi website.

## Frequently Asked Questions

### Why can't I create or update content-types in production/staging

Strapi stores model configuration files (what defines the model schema) in files such as `api/restaurant/models/restaurant.settings.json`. Due to how Node.js works, in order for changes to take effect, that would require Node to restart the server. This could potentionally cause downtime of your production service and likewise these changes should be tracked in some kind of source control.

Generally your "flow" of development would follow the following path:

- Development - Develop your Strapi application locally on your host machine, then push changes into source control
- Staging - Deploy changes from source control to a "production-like" environment for testing
- Production - If no other changes are needed, deploy into production
- Repeat as needed, it is recommended that you properly version and test your application as you go

At this time and in the future there is no plan to allow model creating or updating while in a production environment, and there is currently no plans to move model settings into the database. There is no known nor recommended workarounds for this.

### Does Strapi handle deploying or migrating of content

Strapi does not currently provide any tools for migrating or deploying your data changes between different environments (_ie. from development to production_).

With the release of the stable version (current ETA end of May 2020), there will be a CLI based migration command, and eventually this will be expanded into the AdminUI [migration feature](https://portal.productboard.com/strapi/1-public-roadmap/c/12-migrate-across-environments) as well as a [data import and export](https://portal.productboard.com/strapi/1-public-roadmap/c/23-import-export-data) option in the future, current ETA is around Q3 of 2020.

### User can't login to the admin panel

With the release of the Strapi beta version a fundamental change occurred in that the "end-users" (REST and GraphQL users) were split from the Administrators (admin panel users) in such a way that normal users can not be given access to the admin panel. If you would like to read more on why this change was done, you can read the Strapi [blog post](https://strapi.io/blog/why-we-split-the-management-of-the-admin-users-and-end-users) about it.

In the future Strapi does plan to implement a solution where Administrators could use the REST and GraphQL routes like a standard 3rd party provider, but there is no intention of allowing for the reverse. Instead within Q1/Q2 2020 we plan to offer a plugin called [Administrators Roles & Permissions](https://portal.productboard.com/strapi/1-public-roadmap/c/8-administrators-roles-permissions) that will allow you to control access to Administrators within the admin panel. As of right now there is no work around to currently do this, anyone with access to the admin panel will have full access to all parts of it.

When this new plugin release, there will be two versions:

- Community Edition
- Enterprise Edition

By default, the Community Edition will be limited to 3 pre-defined roles (Super Admin, Editor & Author). The roles can be customized to restrict the permissions' scope on specific collections or single types. Upgrading to the Enterprise Edition will unlock an unlimited number of roles, increase the permissions granularity to the field-level and allow full customization of roles.

### Relations aren't maintaining their sort order

With the components there is a hidden field called `order` that allows entries to maintain their sort, however with relations there is no such field. If you consider the typical count of of component entries vs relational based entries (in retrospect they function in the backend the same) there is generally a much higher number of relations. If relations were to have an `order` field applied to them as well it could cause significant performance degradation when trying to update the order, and likewise in the case where a relation could be attached to multiple entries it would be quite difficult to maintain the order.

For the time being there is no recommended way to handle this automatically and instead it may be required for you to create custom controllers to handle this within your own project.

### Why is my app's database and uploads resetting on Heroku

If you used `--quickstart` to create your Strapi project, by default this uses the SQLite database. Heroku's file system is [ephemeral](https://devcenter.heroku.com/articles/dynos#ephemeral-filesystem) meaning that each time a dyno (container) is reset all filesystem changes are lost. And since both SQLite and local uploads are stored on the filesystem, any changes made to these since the last dyno reset will be deleted. Typically dynos are reset at least once a day, and in most cases multiple times per day or when new code is pushed to Heroku.

It is recommended you use the Heroku PostgreSQL plugin or use something like MongoDB's Atlas for your database. For file uploads, you will need to use one of the 3rd party providers such as Cloudinary or AWS S3. **Even if you are not using SQLite as your database, you will still need some 3rd party upload provider** as Strapi does not store binary files in any database.

### How do I customize a plugin

Strapi uses a system called [extensions](../concepts/customization.md#plugin-extensions) as plugins are stored in the `node_modules` folder. Due to this extensions work by Strapi detecting newer versions of files and using that as a replacement for the ones stored within the `node_modules`. If you are familiar with React and "ejecting" a file, the concept is similar.

You gain the ability to modify these files without forking the plugin package, however you lose the ability to easily update. After each version release you will need to compare your changes to those in the new version and modify your version of the files accordingly.

### Can I add my own 3rd party auth provider

Yes you can either follow the following [guide](../plugins/users-permissions.md#adding-a-new-provider-to-your-project) or you can take a look at the [users-permissions](https://github.com/strapi/strapi/tree/master/packages/strapi-plugin-users-permissions) and submit a pull request to include the provider for everyone. Eventually Strapi does plan to move from the current grant/purest provider to a split natured system similar to the upload providers.

There is currently no ETA on this migration however.

### How do I setup SSL with Strapi

Strapi implements no SSL solution natively, this is due to the fact that it is extremely insecure to directly offer a Node.js application to the public web on a low port.

On Linux based operating systems you need root permissions to bind to any port below 1024 and with typical SSL being port 443 you would need to run your application as root.

Likewise since Strapi is Node.js based, in order for changes with the SSL certificate to take place (say when it expires) you would need to restart your application for that change to take effect.

Due to these two issues, it is recommended you use a proxy application such as Nginx, Apache, Traefik, or many others to handle your edge routing to Strapi. You can view some example options on the [deployment](./deployment.md#optional-software-guides) documentation, and likewise you will need to make Strapi aware of the proxy, please see the [server configuration](../concepts/configurations.md#server) documentation.

### Does Strapi allow me to change the default ID type or name

No, currently does not have the ability to allow for changing the default `id` name nor does it allow you to switch the data type (such as UUID on bookshelf and integer on mongoose), support for this is being looked at for Strapi v4.

### Is X feature available yet

You can see the [ProductBoard roadmap](https://portal.productboard.com/strapi) to see which feature requests are currently being worked on and which have not been started yet.
