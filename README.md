# Checklist Plugin Example

This branch contains the necessary tools to build and display the checklist
plugin example. It contains simple instructions as well as a sample checklist.

## Installation

1. Checkout the TW5 repository

```
git clone https://github.com/Jermolene/TiddlyWiki5.git TW5
```

2. Create the plugin directory and clone this repo

```
cd TW5
mkdir plugins/tgrosinger
cd plugins/tgrosinger
git clone https://github.com/tgrosinger/tw5-checklist
```

3. Switch to the `gh-pages` branch (temporarily)

```
git co gh-pages
```

4. Copy the contents to the editions directory

```
cd ../..
# Should now be in the TW5 directory

cp -r plugins/tgrosinger/tw5-checklist/checklistdemo editions/.
```

5. Switch back to `master` for development

```
git co master
```

6. Perform a build

```
node ./tiddlywiki.js editions/checklistdemo --build index
```

When the build completes there will be a new file
`editions/checklistdemo/output/index.html` which can be run in a browser for
testing or copied back into the `gh-pages` branch to upload a new demo.

