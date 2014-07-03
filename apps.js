RemoteStorage.defineModule('apps', function(privClient, pubClient) {
  var apps = {
    litewrite: {
      href: 'http://litewrite.net', // <-- optional; defaults to https://name.5apps.com/ (lowercased)
      img: '/img/litewrite.png', // <-- optional; defaults to /img/name.png (lowercased)
      name: 'litewrite' // <-- optional; defaults to name
    },
    Laverna: { href: 'https://laverna.cc/' },
    mcnotes: { },
    StackEdit: { href: 'https://stackedit.io/' },
    gHost: { },
    dogfeed: { },
    dogtalk: { },
    // sharesome: { img: 'none' },
    grouptabs: { },
    byoDB: { href: 'http://diafygi.github.io/byoDB/examples/diary/' },
    'time tracker': { href: 'http://shybyte.github.io/unhosted-time-tracker/', img: '/img/time.png' },
    'svg-edit': { href: 'https://svg-edit.5apps.com/editor/svg-editor.html'},
    browser: { href: 'https://remotestorage-browser.5apps.com/' },
    vidmarks: { },
    music: { href: 'https://music-michiel.5apps.com/' },
    drinks: { href: 'https://drinks-unhosted.5apps.com/' },
    todo: { href: 'https://todomvc.5apps.com/labs/architecture-examples/remotestorage/' },
    'dspace-client': { href: 'https://dspace-nilclass.5apps.com/', img: '/img/dspace.png' },
    strut: { href: 'http://tantaman.github.com/Strut/' },
    TiddlyWiki: { href: 'http://www.tiddlywiki.com/' },
    Fargo: { href: 'http://fargo.io/' },
    // Crypton: { href: 'http://crypton.io/', img: 'none' },
    // Dillinger: { href: 'http://dillinger.io/', img: 'none' },
    // 'freedom js': { href: 'http://freedomjs.org/', img: 'none' },
    // 'Peer CDN': { href: 'https://peercdn.com/', img: 'none' },
    // '+PeerServer': { href: 'http://www.peer-server.com/', img: 'none' },
    // Mylar: { href: 'http://css.csail.mit.edu/mylar/#Software', img: 'none' },
    // CryptoSphere: { href: 'http://cryptosphere.org/', img: 'none' },
    // editor: { href: 'https://editor-michiel.5apps.com/' },
    // social: { href: 'https://social-michiel.5apps.com/' },
    // email: { href: 'https://email-michiel.5apps.com/' },
    // smarkers: { href: 'https://smarker-nilclass.5apps.com/' },
  };

  function fillInBlanks(key, obj) {
    obj.href = obj.href || 'https://'+key.toLowerCase()+'.5apps.com/';
    obj.img = obj.img || '/img/'+key.toLowerCase()+'.png';
    obj.name = obj.name || key;
    return obj;
  }
  function addApp(name, obj) {
    app[name] = obj;
    privClient.storeObject('app', name, obj);
  }
  function removeApp(name) {
    delete apps[name];
    privClient.remove(name);
  }
  function getApps() {
    return apps;
  }

  //...
  RemoteStorage.config.changeEvents.window = true;
  
  privClient.declareType('app', {
    type: 'object',
    properties: {
      name: { type: 'string' },
      href: { type: 'string' },
      img: { type: 'string' }
    },
    required: ['name']
  });
  var changeHandler = function() {
    console.log('Please call remoteStorage.apps.onChange(handler)');
  };
  function onChange(handler) {
    changeHandler = handler;
  }
  function init() {
    privClient.cache('', 'ALL');
    privClient.on('change', function(evt) {
      apps[evt.relativePath] = evt.newValue;
      changeHandler(apps);
    });
    for (var name in apps) {
      privClient.storeObject('app', name, fillInBlanks(name, apps[name]));
    }
  }
  //...
  init();
  return {
    exports: {
      onChange: onChange,
      addApp: addApp,
      removeApp: removeApp
    }
  };
});