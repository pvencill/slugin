# moorea-mongoose-slugin

[![Dependency Status](https://david-dm.org/pdesterlich/moorea-mongoose-slugin.svg?theme=shields.io)](https://david-dm.org/pdesterlich/moorea-mongoose-slugin) [![devDependency Status](https://david-dm.org/pdesterlich/moorea-mongoose-slugin/dev-status.svg?theme=shields.io)](https://david-dm.org/pdesterlich/moorea-mongoose-slugin#info=devDependencies)

Unique URL-friendly slugs plugin for mongoose that is lightweight, concurrency safe, but also follows the normal mongoose plugin pattern. Unlike some of the other offerings in NPM, this one also requires minimal effort on your part by using the standard mongoose plugin syntax.

based on Paul Vencill's [slugin](https://github.com/pvencill/slugin) plugin

## Getting started
Install the plugin with npm:

```sh
npm install mongoose-slugin
```

Add the plugin to your schema:

```javascript
var slugin = require('moorea-mongoose-slugin');

// Your awesome schema building here

YourSchema.plugin(slugin);
```

That's it!  Slugin overrides the built-in `document.save` function to catch the mongodb duplicate key error and appends (or updates) an iterator on the end of the slug to ensure the slug is unique without requiring the user to update it.  By default it keys off the `title` property in your document, but you can override that in the options.  For example if you save three blog posts all with the title 'Winter is Coming', you'll get three slugs that are different from each other by the number at the end (or lack thereof):

```
winter-is-coming // first one
winter-is-coming-5 // second one got a random number '5' assigned to it
winter-is-coming-8  // third one got a random number '3' added to the previously largest number '5'
```

Why the random numbers?  Well, I decided that for a few edge cases if you had two docs try to save at the exact same time with the exact same title, you could wind up with infinite flapping as each increments by 1, so to be safe we increment by a random number between 1 and 10 instead.  

## API
### slugin(schema,options)
In most cases you'll use the Schema syntax of YourSchema.plugin(slugin, options) instead.  Options are, as one would expect, optional.

* `slugName` - What property you want created on your schema to store the completed slug.  Defaults to 'slug'.  Also creates a pair of properties to hold the string and numeric parts of the slug for more efficient querying. Those will be {slugName}_base and {slugName}_it respectively.
* `source` - The property or properties on your schema that you want to use as the source of the slug. Can be a string property name or array of properties. Defaults to 'title'.
* `modelName` - The name you use to store your schema in mongoose when you call mongoose.model('modelName', schema). Defaults to pascal-casing the mongodb collection name for your model (e.g. the mongodb collection name "posts" will be interpreted as a modelName 'Posts').  
