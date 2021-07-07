const functions = require("firebase-functions");
const admin = require('firebase-admin')
const app = require('express')()
admin.initializeApp()
require('dotenv').config()

const config = {
    apiKey: process.env.API_KEY,
    authDomain: "puppz-cc9cc.firebaseapp.com",
    projectId: "puppz-cc9cc",
    storageBucket: "puppz-cc9cc.appspot.com",
    messagingSenderId: "126943279881",
    appId: "1:126943279881:web:d29fe52c69719968edf1d8",
    measurementId: "G-6VZDXHPG0X"
  };

const firebase = require('firebase')
firebase.initializeApp(config)

const db = admin.firestore()

app.get('/woofs', (req, res)=> {
        db
        .collection('woofs')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let woofs = []
            data.forEach(doc => {
                woofs.push({
                    woofId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHanlde,
                    createdAt: doc.data().createdAt
                })
             })
             return res.json(woofs)
            })
        .catch(err => console.error(err))
})  
app.post('/woof',(req, res) => {
    
    const newWoof = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }
    db
        .collection('woofs')
        .add(newWoof)
        .then(doc => {
            res.json({message: `document ${doc.id} created successfully`})
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong' })
            console.error(err)
        })  
})

app.post('/signup', (req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

let token, userId
db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({ handle: 'this handle is already taken' })
        } else {
            return firebase
                .auth()
                .createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data => {
        userId = data.user.uid
        return data.user.getIdToken() 
    })
    .then((idToken) => {
        token = idToken
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        }
        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
        return res.status(201).json({ token })
    })
    .catch(err => {
        console.error(err)
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400).json({ email: 'Email is already in use' })
        } else {
        return res.status(500).json({ error: err.code })
        }
    })
})

exports.api = functions.https.onRequest(app)