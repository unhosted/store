/**
 * File: Apps
 *
 * Maintainer: Michiel de Jong <michiel@unhosted.org>
 * Version: -    0.1.0
 *
 */
RemoteStorage.defineModule('apps', function(privClient, pubClient) {
  var apps = {},
    defaultApps = {}, channelUrl, currentChannel;
  
  var changeHandler = function() {
    console.log('Please call remoteStorage.apps.onChange(handler)');
  };

  function fillInBlanks(key, obj) {
    obj.href = obj.href || 'https://'+key.toLowerCase()+'.5apps.com/';
    obj.img = obj.img || '/img/'+key.toLowerCase()+'.png';
    obj.name = obj.name || key;
    return obj;
  }

  function setAppChannel(channelUrl) {
    var promise = promising();
    privClient.storeFile('plain/txt', 'channel-url', channelUrl).then(function() {
      fetchDefaultApps(function(err) {
        if (err) {
          promise.reject(err);
        } else {
          promise.fulfill();
        }
      });
    }, function() {
      promise.reject();
    });
    return promise;
  }

  function fetchDefaultApps(cb) {
    privClient.getFile('channel-url').then(function(obj) {
      var channelUrl = obj.data;
      if (typeof channelUrl !== 'string') {
        channelUrl = 'https://store.unhosted.org/defaultApps.json';
        setAppChannel(channelUrl);
      }
      if (currentChannel === channelUrl) {
        cb();
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', channelUrl, true);
      xhr.responseType = 'json';
      xhr.onerror = function() {
        cb('error fetching app list');
      };
      xhr.onload = function() {
        if (xhr.response === null) {
          if (cb) {
            cb('not json');
          }
          return;
        }
        defaultApps = {};
        for (var i in xhr.response) {
          defaultApps[i] = fillInBlanks(i, xhr.response[i]);
        }
        currentChannel = channelUrl;
        if (cb) {
          cb();
        }
      };
      xhr.send();
    });
  }

  /**
   * Function: remoteStorage.apps.installApp
   *
   * Add an app to the user's list of installed apps. Will trigger
   * the change handler to be called if you previously set one using
   * `remoteStorage.apps.onChange(handler);`.
   *
   * Parameters:
   *   name - name of the app (key in the defaultApps dictionary)
   */
  function installApp(name) {
    apps[name] = defaultApps[name];
    privClient.storeObject('app', name, apps[name]);
  }

  /**
   * Function: remoteStorage.apps.uninstallApp
   *
   * Remove an app to the user's list of installed apps. Will trigger
   * the change handler to be called if you previously set one using
   * `remoteStorage.apps.onChange(handler);`.
   *
   * Parameters:
   *   name - name of the app (key in the defaultApps dictionary)
   */
  function uninstallApp(name) {
    delete apps[name];
    privClient.remove(name);
  }

  /**
   * Function: remoteStorage.apps.onChange
   *
   * Set the change event handler. This will be called, with the
   * dictionary of installed apps as the only argument, whenever the
   * list of installed apps changes. Example:
   *
   * remoteStorage.apps.onChange(function(apps) {
   *   myAppsView.reset();
   *   for (var i in apps) {
   *     myAppsView.add(apps[i]);
   *   }
   *   myAppsView.render();
   * });
   *
   * Parameters:
   *   handler - a Function that takes a dictionary of apps as its only argument
   */
  function onChange(handler) {
    changeHandler = handler;
  }

  function init() {
    RemoteStorage.config.changeEvents.window = true;
    privClient.cache('', 'ALL');
    privClient.on('change', function(evt) {
      if (evt.relativePath !== 'channel-url') {
        if (evt.newValue) {
          apps[evt.relativePath] = evt.newValue;
        } else {
          delete apps[evt.relativePath];
        }
      }
      changeHandler(apps);
    });
    
    /**
     * Schema: apps/app
     *
     * Info necessary for displaying a link to an app in an app store
     *
     * name - the name of the app that's being described here (string)
     * href - launch URL (string)
     * img - URL of a 128x128px app icon (string)
     */
    privClient.declareType('app', {
      type: 'object',
      properties: {
        name: { type: 'string' },
        href: { type: 'string' },
        img: { type: 'string' }
      },
      required: ['name']
    });
  }

  function getAsset(appName, assetBase, assetPath) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', assetBase+assetPath, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      pubClient.storeFile(xhr.getResponseHeader('Content-Type'), 'assets/'+appName+'/'+assetPath, xhr.response);
    };
    xhr.send();
  }

  function cloneApp(manifestUrl) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', manifestUrl, true);
    xhr.onload = function() {
      var obj = {};
      try {
        obj = JSON.parse(xhr.responseText);
      } catch (e) {
      }
      var urlParts = manifestUrl.split('/');
      urlParts.pop();
      var assetBase = urlParts.join('/')+'/';
      if (Array.isArray(obj.assets)) {
        for (var i=0; i<obj.assets.length; obj++) {
          getAsset(obj.name, assetBase, obj.assets[i]);
        }
      }
    };
    xhr.send();
  }
  
  /**
   * Function: remoteStorage.apps.getInstalledApps
   *
   * Get a dictionary of apps whihch the user has installed.
   *
   * Parameters:
   *   (none)
   *
   * Returns: A dictionary from string app names to objects that follow the
   *              apps/app schema defined above.
   */
  function getInstalledApps() {
    return apps;
  }
 
  
  /**
   * Function: remoteStorage.apps.getAvailableApps
   *
   * Get a dictionary of apps whihch the user does not have installed, but
   * which are available to install.
   *
   * Parameters:
   *   (none)
   *
   * Returns: A dictionary from string app names to objects that follow the
   *              apps/app schema defined above.
   */
  function getAvailableApps(cb) {
    fetchDefaultApps(function() {
      var i, availableApps = {};
      for (i in defaultApps) {
        if (!apps[i]) {
          availableApps[i] = defaultApps[i];
        }
      }
      console.log('available apps', availableApps);
      cb(availableApps);
    });
  }

  //...
  init();

  return {
    exports: {
      onChange: onChange,
      setAppChannel: setAppChannel,
      installApp: installApp,
      uninstallApp: uninstallApp,
      getInstalledApps: getInstalledApps,
      getAvailableApps: getAvailableApps,
      cloneApp: cloneApp
    }
  };
});
