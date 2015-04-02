# Banana Slug **[Employee Only]**

![mascot](https://github.com/facebook/babanaslug_internal/blob/master/mascot.jpg?raw=true "mascot")

## About

Banana Slug is the Chrome extension that helps you to observe React components updates

## DEMO

* Video https://www.facebook.com/pxlcld/m9v4

## Quick Start Guide for Tester

* First verify that your Chrome is update-to-date
* Install the **React Dev Tool** from `https://fburl.com/react-dev-tool` if you haven't, and make sure that that extension is enabled.
* Download the extension file `build.crx` from https://fburl.com/bananaslug-intern
* Open the URL `chrome://extensions/` in your browser.
* Manually drag the file `build.crx` to teh page `chrome://extensions/`, then confirm the installation.
* Navigate to http://todomvc.com/examples/react/ to test the extension or you may try any web site that uses React JS

## Quick Installation Guide for Developer

* Clone the GitHub repository.
* Open the URL `chrome://extensions/` in your browser.
* Check the box for **Developer Mode**
* Select the folder `build` from where you downloaded the repository.
* The extension is now installed.

## Quick Dev Guide for Developer
* Install **webpack** http://webpack.github.io/docs/installation.html
* Install **babel-loader** https://github.com/babel/babel-loader
* **NOTE:** You must run `npm install babel-runtime --save` to include this in your project.
* run command `./webpack-build.sh` from where you downloaded the repository.
* You may edit the files inside the directory `src`.
