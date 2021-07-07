const functions = require("firebase-functions");
const admin = require('firebase-admin')

admin.initializeApp()

const express = require('express')
const app = express()


app.get('/woofs', (req, res)=> {
        admin
        .firestore()
        .collection('woofs')
        .get()
        .then(data => {
            let woofs = []
            data.forEach(doc => {
                woofs.push(doc.data())
             })
             return res.json(woofs)
            })
        .catch(err => console.error(err))
})  
app.post('/woof',(req, res) => {
    
    const newWoof = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
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

exports.api = functions.https.onRequest(app)