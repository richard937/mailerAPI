const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

// Initialize the OAuth2Client with secret ID , key and redirect url
const Oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT,
);

const app = express();

// parse application/json
app.use(bodyParser.json())


const scope = "https://www.googleapis.com/auth/gmail.send";

// function to get the URL
const getConnectionUrl = () => {

    return Oauth2Client.generateAuthUrl({
        access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
        prompt: 'consent',
        scope: scope            // If you only need one scope you can pass it as a string
    });
}

// This function returns the request string in base64 encoded format
const mailBody = (to, subject, message) => {

    return new Buffer.from(
        "To:" + to + "\n" +
        "Subject:" + subject + "\n\n" +

        message
    ).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');

};

// This function returns the JSON to send post request
const makeData = (access_token) => {

    return {
        hostname: 'www.googleapis.com',
        port: '443',
        path: '/gmail/v1/users/me/messages/send',
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json"
        }
    }
};

app.get('/', (req, res) => {
    res.send("Welcome to the mailerAPI");
});

app.get('/auth', (req, res) => {

    let authURL = getConnectionUrl();
    res.redirect(authURL);
})

// After success we get access to the tokens. 
app.get('/redirect', (req, res) => {

    if (req.query.error == "access_denied") {
        res.send("Access denied by the user");
    }

    let code = req.query.code;

    Oauth2Client.getToken(code, (err, token) => {
        // If token generation fails
        if (err)
            return res.json({
                status: "failed",
                description: "Error while generating token",
            });

        // Credentials for user from where the mail will be sent is set
        Oauth2Client.setCredentials(token);


        // store the token to for later use
        fs.writeFile('token.json', JSON.stringify(token), (err) => {
            if (err)
                return res.json({
                    status: "failed",
                    description: "Error while saving the token",
                });

            res.json({
                status: "success",
                description: "Token successfully generated and stored",
            });
        });
    });

});


// using this endpoint we make a post request with mail body to send the mail
app.post('/mail', (req, res) => {

    fs.readFile('token.json', (err, data) => {
        if (err) {
            return res.json({
                msg: "Authorize the API using the redirection link",
                redirect: getAuthUrl(Oauth2Client),
            });
        }

        access_token = JSON.parse(data).access_token;
        const { to, subject, message } = req.body;
        let mail = mailBody(to, subject, message);
        let req_data = makeData(access_token);

        let post_req = https.request(req_data, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log(chunk);
            })
        })

        post_req.write(JSON.stringify({ "raw": mail }));
        post_req.end();
        res.json(
            {
                status: "delivered",
                address: req.body.to,
            })
    });

});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`app is running at port ${PORT}`);
})