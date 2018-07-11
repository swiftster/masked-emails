'use strict';

chrome.storage.sync.get('email', function (data) {
    let email = (data.email === undefined) ? "" : data.email;
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let domain = new URL(tabs[0].url).hostname;
        document.getElementById('alias').value = domain + email.substring(email.lastIndexOf('@'));
        findAlias();
    });
});

document.getElementById('alias').onchange = findAlias;

function findAlias() {
    chrome.storage.sync.get('API_KEY', function (result) {
        let API_KEY = result.API_KEY;

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
            let alias = document.getElementById('alias').value;
            fetch('https://www.googleapis.com/admin/directory/v1/users?' +
                'customer=my_customer&query=email:\'' + alias + '\'&key=' + API_KEY, init)
                .then((response) => response.json())
                .then(function (data) {
                    if (data.users !== undefined) {
                        document.getElementById('notification').innerHTML = alias
                            + ' is already masked to '
                            + data.users[0].primaryEmail;
                    }
                });
        });
    });
}

function createAlias(email, alias) {
    chrome.identity.getAuthToken({interactive: true}, function (token) {
        let url = 'https://www.googleapis.com/admin/directory/v1/users/' + encodeURIComponent(email) + '/aliases';
        let init = {
            method: 'POST',
            body: JSON.stringify({"alias": alias}),
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        };

        fetch(url, init).then(res => res.json())
            .catch(error => console.error('Error:', error))
            .then(function (response) {
                if (response.error) {
                    document.getElementById('notification').innerHTML = response.error.message;
                } else {
                    document.getElementById('notification').innerHTML = "Alias " + response.alias + " Created.";
                }
            });
    });
}

document.getElementById('create').onclick = function () {
    let emailList = document.getElementById('emailList');
    let email = emailList.options[emailList.selectedIndex].value;
    let alias = document.getElementById('alias').value;

    chrome.storage.sync.set({"email": email}, function () {
        createAlias(email, alias);
    });
    return false;
};

getEmails();

function getEmails() {
    chrome.storage.sync.get('API_KEY', function (result) {
        let API_KEY = result.API_KEY;

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