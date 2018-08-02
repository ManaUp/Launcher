const electron = require('electron');
const url = require('url');
const path = require('path');
const exec = require('child_process').exec;

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


// Catch quit
ipcMain.on('app:quit', function(e) {
  app.quit();
});

// Catch minimize
ipcMain.on('app:minimize', function(e) {
  mainWindow.minimize();
});

// Catch start game
ipcMain.on('game:start', function(e) {
  let command;
  if (process.platform == 'darwin') {
    command = 'wine ~/.wine/drive_c/ProgramData/Kingsisle\\ Entertainment/Wizard101/Bin/WizardGraphicalClient.exe -L login.us.wizard101.com 12000 -A English';
  }
  else {
    command = 'C:\ProgramData\KingsIsle Entertainment\Wizard101\Bin\WizardGraphicalClient.exe -L login.us.wizard101.com 12000 -A English'
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

// Create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
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

// Add developer tools item if not in production
if (process.env.NODE_ENV !== 'production') {
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
