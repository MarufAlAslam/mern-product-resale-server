const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')

require('dotenv').config()


const app = express()
const port = process.env.port || 5000


// middleware
app.use(cors())
app.use(express.json())








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjynjtn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// console.log(uri)

async function run() {
    try {
        // await client.connect();
        const categoryCollection = client.db("resellStore").collection("categories");
        const userCollection = client.db("resellStore").collection("user");


        // get all categories from category collection
        app.get('/categories', async (req, res) => {
            const cursor = categoryCollection.find({});
            const categories = await cursor.toArray();
            // console.log(categories)
            res.send(categories)
        })


        // upsert user information to user collection
        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.updateOne
                ({ email: user.email }, { $set: user }, { upsert: true })

            res.json(result)
        })



    } finally {
    }
}

run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('e-trade server running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})