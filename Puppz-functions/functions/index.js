const functions = require("firebase-functions");
const admin = require('firebase-admin')

admin.initializeApp()

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello World!");
});

exports.getWoofs = functions.https.onRequest((req, res) => {
    admin.firestore().collection('woofs').get()
        .then(data => {
            let woofs = []
            data.forEach(doc => {
                woofs.push(doc.data())
            })
            return res.json(woofs)
        })
            .catch(err => console.error(err))
})  

exports.createWoof = functions.https.onRequest((req, res) => {
    const newWoof = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    }
    admin.firestore()
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