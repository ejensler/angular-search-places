# angular-search-places

[https://github.com/ejensler/angular-search-places](https://github.com/ejensler/angular-search-places)

An angular module that searches a city with results from Google Maps PlacesService.

[Live Example](http://codepen.io/ejensler/full/ZGegxj)

### Usage

Right now the repo is structured as an app (shown in the example above). However, `app.js` contains a custom directive that (I hope) you may find well-documented for your modification. There is some Sass and an html template as well. These will all be extracted into an installable module at some point.

```
<input type="text"
    ej-search-places-input
    search-results-limit="15"
    complete-result="searchResult"
    placeholder="e.g., Mission Dolores Park, Chinese food, etc..."
    ng-model="searchTerms" />
```

### Installation/Development

If you want to run the live app and hack around (probably a bit easier than hacking on CodePen), then clone/fork/copy-pasta-all-the-files to wherever you want, and run `npm install`. Once dependencies have been downloaded, run `gulp` to build. Load up the app in the browser at `localhost:5000`. It will livereload when you make changes