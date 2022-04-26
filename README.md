# @joyu/svn-modules
> Command-line tool for installing node module dependencies from SVN repositories

I am open to suggestions, improvements, and pull requests for those interested. This is currently very much a minimally viable (yet functional) approach.

### Requirements
  - __svn__ command-line tools
  - __node__ >= 4.0.0
  - __npm__ >= 3.0.0

### Installation

 - #### Globally
        npm install svn-modules --global

 - #### Locally
        npm install svn-modules --save-dev

### Adding SVN Dependencies
Append an object named `svnDependencies` to your `package.json` file. Each property of the object will reference a node package dependency stored in a SVN repository.

Example:

    "svnDependencies": {
      "my-first-package": "svn://path/to/my/repo/my-first-package/trunk",
      "my-other-package": "svn://path/to/my/repo/my-other-package/trunk"
    }

### Installing SVN Dependencies

- #### Automatic Installation (via npm scripts)
It is recommended to add the following npm scripts to your `package.json` file.

        "scripts": {
          "install": "svn-modules install",
          "uninstall": "svn-modules uninstall"
        }

  This will cause npm to automatically install your SVN dependencies before your package is installed, as well as uninstalling them before your package is uninstalled. You can simply run `npm install` and your SVN dependencies will also be installed.

- #### Manual Installation
Alternatively, you can install your SVN dependencies manually via `svn-modules install`. You can uninstall them via `svn-modules uninstall`.

  **NOTE:** Similar to npm, you should be inside your project folder when executing these commands.

### What are these `svn_modules`? Do I need them?
Installing SVN dependencies will temporarily create a `svn_modules` local cache in your project folder. This folder is deleted upon completing an install or uninstall operation. If it is not deleted automatically, you can safely delete it manually. It is recommended to add this folder to your source control's ignore list (`.gitignore`) as a precaution.

### Will my SVN dependencies be under source control upon installation?
No. The `svn export` command is used to copy the remote repo to your local computer. Unlike the `svn checkout` command, `svn export` does not create SVN source control folders (`.svn`). This acts as a simple copy operation rather than a full checkout.

### Will my SVN dependencies integrate with `node_modules` properly?
Yes. They will be installed (along with their own dependencies) insides your project's `node_modules` folder as you would expect any other node package. This follows npm 3.x convention.

### TODO Items
  * Add revision support (`-r --revision <rev>` option) to install
  * Add branch support (`-b --branch <name>` option) to install
  * Add tag support (`-t --tag <name>` option) to install
  * Add trunk support (`-k --trunk` option) to install
  * Organize code (sync -> async code?)
