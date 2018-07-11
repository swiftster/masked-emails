'use strict';

var API_KEY;

chrome.storage.sync.get('API_KEY', function (result) {
    document.getElementById('api-key').value = result.API_KEY;
    API_KEY = result.API_KEY;
});

document.getElementById('api-key').addEventListener('input', function () {
    API_KEY = this.value;
    chrome.storage.sync.set({"API_KEY": API_KEY}, function () {
        document.getElementById('notification').innerHTML = "API Key Updated to " + API_KEY;
    });
});


document.getElementById('emailList').onchange = saveEmail;

function saveEmail(event) {
    let email = event.target.value;
    chrome.storage.sync.set({"email": email}, function () {
        document.getElementById('notification').innerHTML = "Email Updated to " + email;
    });
    return false;
}

getEmails();
document.getElementById('refreshEmailList').onclick = getEmails;

function getEmails() {
    let API_KEY = document.getElementById('api-key').value;
    chrome.identity.getAuthToken({interactive: true}, function (token) {
        let init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        };
        fetch('https://www.googleapis.com/admin/directory/v1/users?' +
            'customer=my_customer&key=' + API_KEY, init)
            .then((response) => response.json())
            .then(function (data) {
                let emails = data.users.filter(function (user) {
                    return !user.suspended;
                }).map(function (user) {
                    return user.primaryEmail;
                });
                populateEmailList(emails);
            });
    });
    return false;
}

function populateEmailList(emails) {
    chrome.storage.sync.get('email', function (result) {
        let curEmail = result.email;
        let emailList = document.getElementById("emailList");
        for (let i = 0; i < emails.length; i++) {
            let email = emails[i];
            let emailOpt = document.createElement("option");
            emailOpt.textContent = email;
            emailOpt.value = email;
            emailList.appendChild(emailOpt);
            if (curEmail === email) {
                emailList.selectedIndex = i + 1;
            }
        }
    });
}