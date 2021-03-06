const electron = require('electron');
// Module to control application life.
const {app} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;

const fs = require('fs');

const dialog = electron.dialog;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

var dir = 'data';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }
    
    const ChildProcess = require('child_process');
    const path = require('path');
    
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    
    const spawn = function (command, args) {
        let spawnedProcess, error;
        
        try {
            spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
        } catch (error) {
        }
        
        return spawnedProcess;
    };
    
    const spawnUpdate = function (args) {
        return spawn(updateDotExe, args);
    };
    
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus
            
            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);
            
            setTimeout(app.quit, 1000);
            return true;
        
        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers
            
            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);
            
            setTimeout(app.quit, 1000);
            return true;
        
        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
            
            app.quit();
            return true;
    }
}


function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({width: 800, height: 600, icon: __dirname + '/ico.png'});
    win.setMenu(null);
    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`);
    
    // Open the DevTools.
    //win.webContents.openDevTools();
    
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

exports.selectDirectory = function selectDirectory() {
    return dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    });
};