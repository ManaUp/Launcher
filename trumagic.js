const electron = require('electron');
const url = require('url');
const path = require('path');
const exec = require('child_process').exec;
const fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

// SET ENV
process.env.NODE_ENV = 'production';

let mainWindow;

// Listen for app to be ready
app.on('ready', function() {
  // Create new window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: false,
    titleBarStyle: 'hidden-inset'
  });
  // Load html into window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert Menu
  Menu.setApplicationMenu(mainMenu)

});

// Handle creating the path window
function createChangeWindow() {
  pathWindow = new BrowserWindow({
    width: 400,
    height: 280,
    frame: false,
    titleBarStyle: 'hidden-inset',
    resizable: false,
    title: 'Specify Path'
  });
  // Load html
  pathWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  pathWindow.on('close', function() {
    pathWindow = null;
  });
}

// Path configuration
let config;

reloadConfig = (callback) => {
  fs.readFile('./config.json', 'utf-8', (err, data) => {
    if (err) throw err;
    config = JSON.parse(data);
    if (callback) {
      callback();
    }
  });
}

saveConfig = (configSettings) => {
  let content = JSON.stringify(configSettings);
  fs.writeFile("./config.json", content, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("Config updated");
  });
  reloadConfig(() => {
    console.log("Reloading config");
  });
}

// Initially load config
reloadConfig(() => {
  if (!config.customPath) {
    config.customPath = process.platform == 'darwin' ? config.macDefault : config.winDefault;
    saveConfig(config);
  }
});

// Catch start game
ipcMain.on('game:start', function (e) {
  console.log('starting shit');
  let command;
  if (process.platform == 'darwin') {
    command = `wine ${config.customPath}/Bin/WizardGraphicalClient.exe -L login.us.wizard101.com 12000 -A English`;
  }
  else {
    command = `${config.customPath}\Bin\WizardGraphicalClient.exe -L login.us.wizard101.com 12000 -A English`
  }

  mainWindow.webContents.send('started');

  exec(command,
    (error, stdout, stderr) => {
      console.log(`${stdout}`);
      console.log(`${stderr}`);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    }
  );
});

// Path change
ipcMain.on('path:change', function(e, newPath) {
  config.customPath = newPath; 
  saveConfig(config);
});

// Path request
ipcMain.on('request:reset', function(e) {
  let resetPath = process.platform == 'darwin' ? config.macDefault : config.winDefault;
  pathWindow.webContents.send('reset:path', resetPath);
});

// Path request
ipcMain.on('request:current', function(e) {
  let currentPath = config.customPath;
  pathWindow.webContents.send('current:path', currentPath);
});

// Catch quit
ipcMain.on('app:quit', function(e) {
  app.quit();
});

// Catch minimize
ipcMain.on('app:minimize', function(e) {
  mainWindow.minimize();
});


// Create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Specify Path',
        accelerator: process.platform == 'darwin' ? 'Command+M' : 'Ctrl+M',
        click() {
          createChangeWindow();
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  }
];

// If mac, add empty object to menu
if (process.platform == 'darwin') {
  mainMenuTemplate.unshift({});
}

let prod = true;
// Add developer tools item if not in production
if (prod) {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow){
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  });
}
