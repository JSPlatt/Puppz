const { db } = require('../util/admin')

exports.getAllWoofs = (req, res)=> {
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
}

exports.postOneWoof = (req, res) => {
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
}