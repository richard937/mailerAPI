# mailerAPI
API in NodeJS to send emails using the Gmail REST API, OAuth2.0

## steps to follow:
- clone this repo

- go to the project directory and use `npm install` to get the node modules

- index.js is the main file, open it in a text editor 

- go to goolge developer [console](https://console.developers.google.com/) and create the credentials

- set the redirect uri to `localhost:3000/redirect`

- create a `.env` file and save the `client_id`, `client_secret` and `redirect_uri`

- do npm start 

- use `localhost:8080/auth` endpoint to authorize your server

-  send a post request with a JSON body to `localhost:8080/mail` to send the mail

![postman example](https://github.com/richard937/mailerAPI/blob/main/success.PNG)
