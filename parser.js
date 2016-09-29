const https = require('https');
const url = require('url');

const fs = require('fs');

const request = require('request');

const electron = require('electron');
const remote = electron.remote;
const mainProcess = remote.require('./main');

var withImgs = false;
var fileCounter = 0;
var arrOfLinks = [];
var addressLink = '';

var folder = __dirname + "\\data\\";

$('#folderAddress').val(folder);

exports.getFiles = function (address) {
    addressLink = address;
    address = address.replace('.html', '.json');
    request({uri: address, method: 'GET', encoding: 'utf8'},
        (err, res) => {
            if (err) {
                alert(err.message);
                return;
            }
            //console.log(res.body);
            withImgs = $('#withImages').prop("checked");
            
            try {
                JSON.parse(res.body).threads[0].posts.forEach((post) => {
                    post.files.forEach((file) => {
                        //  downloadFile(file.path); 2ch ban me when i try download all files at the same time
                        arrOfLinks.push(file.path);
                    });
                });
                showAmount();
                downloadFile(arrOfLinks[fileCounter]);
            }
            catch (e) {
                console.error(e);
                var is404 = /<span class="notfound404">404<\/span>/.test(res.body);
                if (is404)
                    alert('Page not found, error 404');
                else
                    alert('Can\'t parse this page');
                return;
            }
            
            $('#btn-get').fadeOut(300, () => {
                $('#btn-break').fadeIn(600);
            });
        });
};

function downloadFile(path) {
    var ulrObj = url.parse(addressLink);
    var protocol = ulrObj.protocol;
    var host = ulrObj.host;
    var board = /\/\w{0,5}\//.exec(ulrObj.pathname);
    
    var href = protocol + "//" + host + board + path;
    var name = /\d{13,15}/.exec(path);
    var extension = /\.\w{0,10}/.exec(path);
    var fileAddress = folder + name + extension;
    console.log(href);
    
    let file = fs.createWriteStream(fileAddress);
    console.log(folder + name + extension);
    request(href)
        .on('end', () => {
            if (arrOfLinks.length && fileCounter < arrOfLinks.length) {
                downloadFile(arrOfLinks[fileCounter]);
                fileCounter++;
                updateStatus();
            }
            else {
                alert('thread was successfully parsed');
                toBegin();
            }
        })
        .on('error', (err) => {
            console.error(err);
        })
        .pipe(file);
}

function showAmount() {
    $('#amount').fadeIn(600);
    updateStatus();
}

function updateStatus() {
    $('#amount').text(fileCounter + ' out of ' + arrOfLinks.length);
}

function toBegin() {
    $('#amount').fadeOut();
    
    $('#btn-break').fadeOut(300, () => {
        $('#btn-get').fadeIn(600);
    });
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