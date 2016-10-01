const https = require('https');
const url = require('url');

const fs = require('fs');

const request = require('request');
const progress = require('request-progress');

const electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./main');

var withImgs = false;
var fileCounter = 0;
var arrOfLinks = [];
var addressLink = '';
var isWatching = false;
var isBreak = false;
var newPostsTimer;

var folder = __dirname + "\\data\\";

$('#folderAddress').val(folder);

exports.getFiles = getFiles;

function getFiles(address) {
    addressLink = address;
    arrOfLinks = [];
    isBreak = false;
    address = address.replace('.html', '.json');
    request({uri: address, method: 'GET', encoding: 'utf8'},
        (err, res) => {
            if (err) {
                alert(err.message);
                return;
            }
            //console.log(res.body);
            withImgs = $('#withImages').find('input').prop("checked");
            
            try {
                JSON.parse(res.body).threads[0].posts.forEach((post) => {
                    post.files.forEach((file) => {
                        arrOfLinks.push(file.path);
                    });
                });
                showProgress();
                downloadFile(arrOfLinks[fileCounter]);
            }
            catch (e) {
                console.error(e);
                let is404 = /<span class="notfound404">404<\/span>/.test(res.body);
                if (is404)
                    alert('Page not found, error 404');
                else
                    alert('Can\'t parse this page');
                clearInterval(newPostsTimer);
                return;
            }
            
            $('#btn-get').fadeOut(300, () => {
                $('#btn-break').fadeIn(600);
            });
        });
}

function downloadFile(path) {
    let ulrObj = url.parse(addressLink);
    let protocol = ulrObj.protocol;
    let host = ulrObj.host;
    let board = /\/\w{0,5}\//.exec(ulrObj.pathname);
    
    let href = protocol + "//" + host + board + path;
    let name = /\d{13,15}/.exec(path);
    let extension = /\.\w{0,10}/.exec(path);
    let fileAddress = folder + name + extension;
    
    console.log(href);
    
    if (extension != '.webm' && !withImgs) {
        counterHandler();
        return;
    }
    
    if (typeof path != 'undefined') {
        let file = fs.createWriteStream(fileAddress);
        
        progress(request(href).on('end', counterHandler), {
            throttle: 0
        }).on('progress', function (state) {
            $('#progress-bar').css('width', state.percentage * 100 + '%');
        }).on('error', function (err) {
            console.error(err);
        }).pipe(file)
        
    } else {
        counterHandler();
    }
    
    function counterHandler() {
        if (arrOfLinks.length && fileCounter < arrOfLinks.length) {
            downloadFile(arrOfLinks[++fileCounter]);
            updateStatus();
        }
        else if (!isBreak && !isWatching) {
            let needWatching = confirm('Thread was successfully parsed. \n' +
                'Do I need to wait for new posts and download them files?');
            if (needWatching)
                newPostsWatcher();
            else
                toBegin();
        }
    }
}

function showProgress() {
    $('#amount').fadeIn(600);
    $('#progress-wrapper').fadeIn(700);
    updateStatus();
}

function updateStatus() {
    $('#amount').text(fileCounter + ' out of ' + arrOfLinks.length);
}

function newPostsWatcher() {
    isWatching = true;
    newPostsTimer = setInterval(getFiles, 10000, addressLink);
}

function toBegin() {
    isBreak = true;
    
    $('#amount').fadeOut();
    
    $('#progress-wrapper').fadeOut();
    
    $('#btn-break').fadeOut(300, () => {
        $('#btn-get').fadeIn(600);
    });
    isWatching = false;
    clearInterval(newPostsTimer);
    arrOfLinks.length = 0;
    fileCounter = 0;
}

$('#btn-break').on('click', toBegin);

$('#btn-showFiles').on('click', function () {
    require('child_process').exec('start "" ' + '"' + folder + '"');
});

$('#folderChooser').on('click', _ => {
    var newFolderAddress = mainProcess.selectDirectory();
    if (newFolderAddress)
        folder = newFolderAddress + '\\';
    
    $('#folderAddress').val(folder);
});