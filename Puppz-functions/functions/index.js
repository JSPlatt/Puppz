const functions = require("firebase-functions");
const admin = require('firebase-admin')
const app = require('express')()
admin.initializeApp()

const config = {
    apiKey: "AIzaSyBGI4jr331la72In2uLU6_UDP5u-ZujawI",
    authDomain: "puppz-cc9cc.firebaseapp.com",
    projectId: "puppz-cc9cc",
    storageBucket: "puppz-cc9cc.appspot.com",
    messagingSenderId: "126943279881",
    appId: "1:126943279881:web:d29fe52c69719968edf1d8",
    measurementId: "G-6VZDXHPG0X"
  };

const firebase = require('firebase')
firebase.initializeApp(config)

app.get('/woofs', (req, res)=> {
        admin
        .firestore()
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
    admin
        .firestore()
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

    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(data => {
            return res.status(201).json({ message: `${data.user.uid} signed up successfully`})
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
})

exports.api = functions.https.onRequest(app)