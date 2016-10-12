# You found the plugins directory
From here you can customize much of the behavior of the service. This is how we do
custom things on [pwhaas.com](https://www.pwhaas.com) like persist accounts outside 
of config, account management, more routes for views, etc.

This plugins directory is automatically compiled and included in the build that happens
during `npm start` so you can just drop your TypeScript modules in here and customize
the config files to use your plugins where appropriate instead of the defaults. Easy as pie!

So, fork this repo, or add it as a [subtree](https://developer.atlassian.com/blog/2015/05/the-power-of-git-subtree/),
and drop TypeScript modules in here. Alternatively, you can implement plugins in separate
repos using whatever tooling you want and use those in the configuration. Just make sure
you expose the full interface for the type of plugin you are implementing.