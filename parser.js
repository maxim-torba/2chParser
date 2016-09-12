const https = require('https');

const fs = require('fs');

const request = require('request');

var withImgs = false;
var fileCounter = 0;
var arrOfLinks = [];

exports.getFiles = function (address) {
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
            }
            
            $('#btn-get').fadeOut(300, () => {
                $('#btn-break').fadeIn(600);
            });
        });
};

function downloadFile(path) {
    
    var href = 'https://2ch.hk/b/' + path;
    var name = /\d{13,15}/.exec(path);
    var extension = /\.\w{0,10}/.exec(path);
    
    console.log(href);
    
    let file = fs.createWriteStream("data/" + name + extension);
    
    request(href)
        .on('end', () => {
            fileCounter++;
            updateStatus();
            
            if (arrOfLinks.length && fileCounter <= arrOfLinks.length)
                downloadFile(arrOfLinks[fileCounter]);
            else {
                arrOfLinks.length = 0;
                fileCounter = 0;
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

$('#btn-break').on('click', function () {
    $('#amount').fadeOut();
    
    $('#btn-break').fadeOut(300, () => {
        $('#btn-get').fadeIn(600);
    });
    arrOfLinks.length = 0;
    fileCounter = 0;
});