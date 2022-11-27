const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const productCollection = client.db("resellStore").collection("products");


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

        // get user role from userCollection based on email query
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.findOne({
                email: email
            })
            res.send(user)
        })

        // post new product to product collection
        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            // console.log(result)
            res.json(result)
        })



        // get all products from product collection
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const products = await cursor.toArray();
            // console.log(products)
            res.send(products)
        })

        // get all the products which have isAdvertised = "yes"
        app.get('/advertisedProducts', async (req, res) => {
            const cursor = productCollection.find({ isAdvertise: "yes" });
            const products = await cursor.toArray();
            // console.log(products)
            res.send(products.reverse())
        })

        // get lastly added 3 products from product collection
        app.get('/recents', async (req, res) => {
            const cursor = productCollection.find({}).sort({ _id: -1 }).limit(3);
            const products = await cursor.toArray();
            // console.log(products)
            res.send(products)
        })

        // get the category title based on id params
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const category = await categoryCollection.findOne({
                _id: ObjectId(id)
            })
            res.send(category)
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