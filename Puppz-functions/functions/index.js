const functions = require("firebase-functions");
require('dotenv').config()
const app = require('express')()

const FBAuth = require ('./util/fbAuth')

const { getAllWoofs, postOneWoof } = require('./handlers/woofs')
const { signup, login, uploadImage } = require('./handlers/users')

// Woof Routes
app.get('/woofs', getAllWoofs)
app.post('/woof',FBAuth, postOneWoof)  

// Users Routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)

exports.api = functions.https.onRequest(app)