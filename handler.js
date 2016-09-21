const parser = require('./parser.js');

$('#btn-get').on('click', function () {
    let address = $('#address').val();
    if (address !== '') {
        parser.getFiles(address);
    } else {
        alert('enter address');
    }
});

