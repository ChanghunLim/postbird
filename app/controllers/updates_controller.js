var libs = {};
var loadedModules = {};
var remote = require('electron').remote;

['semver', 'needle', 'strftime'].forEach((lib) => {
  Object.defineProperty(libs, lib, {
    get: function() {
      if (!loadedModules[lib]) {
        loadedModules[lib] = require(lib);
      }
      return loadedModules[lib];
    }
  });
});


global.UpdatesController = jClass.extend({
  releasesUrl: "https://api.github.com/repos/paxa/Postbird/releases",
  releasesPage: "https://github.com/Paxa/postbird/releases",

  checkUpdates: function (options) {
    if (options && options.showLoading) {
      App.startLoading("Getting latest version number");
    }

    this.fetchLatestRelease((err, release) => {
      if (options && options.showLoading) {
        App.stopLoading();
      }
      if (release) {
        var current = this.currentVersion();
        var remote = release.tag_name;
        if (libs.semver.gt(remote, current)) {
          var date = new Date(release.published_at);
          var msg = `Newer version is available. ${remote} (You are currently using: ${current})
                     <br>Released at: ${libs.strftime("%d %B %Y, %H:%M", date)}<br>`;
          window.alertify.labels.ok = "Install";
          window.alertify.confirm(msg, (answer) => {
            window.alertify.labels.ok = "OK";
            if (answer) {
              electron.shell.openExternal(this.releasesPage);
            }
          }, 'grey-cancel-button');
        } else {
          if (options && options.showAlreadyLatest) {
            window.alertify.alert("You are using latest version");
          }
        }
      }

      //if (err) console.error(err);
      //if (release) console.log(release);

    });
  },

  fetchLatestRelease: function (callback) {
    libs.needle.get(this.releasesUrl, {}, (err, resp) => {
      if (err) {
        callback(err);
      } else {
        var stableRelease = resp.body.filter((rel) => {
          return !rel.prerelease;
        })[0];
        callback(undefined, stableRelease);
      }
    });
  },

  currentVersion: function () {
    return remote.app.getVersion();
  }
});
