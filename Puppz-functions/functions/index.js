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

const firebase = require('firebase');
const { ObjectBuilder } = require("firebase-functions/lib/providers/storage");
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

const FBAuth = (req, res, next) => {
    let idToken
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1]
    } else {
        console.error('No token found')
        return res.status(403).json({ error: 'Unauthorized' })
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken 
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        }) 
        .then(data => {
            req.user.handle = data.docs[0].data().handle
            return next()
        })
        .catch(err => {
            console.error('Error while verifying token', err)
            return res.status(403).json(err)
        })
}

app.post('/woof',FBAuth,(req, res) => {
    if (req.body.body.trim() === ''){
        return res.status(400).json({ body: 'Body must not be empty' })
    }

    const newWoof = {
        body: req.body.body,
        userHandle: req.user.handle,
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

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if(email.match(regEx)) return true
    else return false
}

const isEmpty = (string) => {
    if(string.trim() === '') return true
    else return false
}

app.post('/signup', (req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

let errors = {}

if(isEmpty(newUser.email)) {
    errors.email = 'Must not be empty'
} else if(!isEmail(newUser.email)){
    errors.email='Must be a valid email address'
}

if(isEmpty(newUser.password)) errors.password = "Must not be empty"

if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = "Passwords must be the same"

if(isEmpty(newUser.handle)) errors.handle = "Must not be empty"

if(Object.keys(errors).length > 0) return res.status(400).json(errors)

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

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {}

    if(isEmpty(user.email)) errors.email = "Must not be empty"
    if(isEmpty(user.password)) errors.password = "Must not be empty"

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err)
            if(err.code === 'auth/wrong-password'){
                return res.status(403).json({ general: 'Wrong credentials, please try again'})
            }else return res.status(500).json({ error:err.code})
        })
})


exports.api = functions.https.onRequest(app)