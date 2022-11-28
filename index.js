const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


const app = express()
const port = process.env.port || 5000


// middleware
app.use(cors())
app.use(express.json())








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjynjtn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// console.log(uri)

// jwt verify
const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send('Unauthorized request')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send('Unauthorized request')
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        // await client.connect();
        const categoryCollection = client.db("resellStore").collection("categories");
        const userCollection = client.db("resellStore").collection("user");
        const productCollection = client.db("resellStore").collection("products");
        const bookingCollection = client.db("resellStore").collection("booking");



        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body
            const price = parseInt(booking.price)
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                "payment_method_types": [
                    "card"
                ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })



        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.send({ token })
            console.log(user)
        })


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

        // patch user to update user role and email on social login
        app.patch('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.updateOne(
                { email: user.email },
                { $set: user },
                { upsert: true }
            )
            res.json(result)

        })

        // post new product to product collection
        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            // console.log(result)
            res.json(result)
        })

        // get product by id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const product = await productCollection.findOne({ _id: ObjectId(id) })
            res.send(product)
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


        // need jwt

        // filter products by seller email and skip the products which have the same email as the query
        app.get('/productsbyseller', async (req, res) => {
            const email = req.query.email;
            const cursor = productCollection.find({ selleremail: { $ne: email } });
            const products = await cursor.toArray();
            // console.log(products)
            res.send(products)
        })

        // need jwt

        // get products for a specific seller by seller email
        app.get('/productsforseller', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            console.log("products for seller", decoded)

            if (decoded.email !== req.query.email) {
                return res.status(401).send('Unauthorized request')
            }

            console.log(req.headers.authorization)
            const email = req.query.email;
            const cursor = productCollection.find({ selleremail: email });
            const products = await cursor.toArray();
            // console.log(products)
            res.send(products)
        })

        // update product status based on id params using patch method
        app.patch('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const result = await productCollection.updateOne(
                { _id: ObjectId(id) },
                { $set: product },
                { upsert: true }
            )
            res.json(result)
        })



        // add reported: true to product collection based on id params
        app.patch('/report/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const result = await productCollection.updateOne(
                { _id: ObjectId(id) },
                { $set: product },
                { upsert: true }
            )
            res.json(result)
        })

        // delete product based on id params
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const result = await productCollection.deleteOne({ _id: ObjectId(id) })
            res.json(result)
        })



        // update isAdvertise status based on id params using patch method
        app.patch('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const result = await productCollection.updateOne(
                { _id: ObjectId(id) },
                { $set: product },
                { upsert: true }
            )
            res.json(result)
        })

        // update price based on id params using patch method
        app.patch('/updateprice/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const result = await productCollection.updateOne(
                { _id: ObjectId(id) },
                { $set: product },
                { upsert: true }
            )
            res.json(result)
        })




        // post booking data to database
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            // console.log(result)
            res.json(result)
        })


        // need jwt

        // get bookings based on email query and match the email with selleremail
        app.get('/bookings', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            console.log("products for seller", decoded)

            if (decoded.email !== req.query.email) {
                return res.status(401).send('Unauthorized request')
            }
            const email = req.query.email;
            const cursor = bookingCollection.find({ selleremail: email });
            const bookings = await cursor.toArray();
            // console.log(bookings)
            res.send(bookings)
        })

        // need jwt
        // get bookings based on email query and match the email with buyeremail
        app.get('/buyerbookings', verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            console.log("products for seller", decoded)

            if (decoded.email !== req.query.email) {
                return res.status(401).send('Unauthorized request')
            }

            const email = req.query.email;
            const cursor = bookingCollection.find({ email: email });
            const bookings = await cursor.toArray();
            // console.log(bookings)
            res.send(bookings)
        })


        // get bookings by id
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const booking = await bookingCollection.findOne({
                _id: ObjectId(id)
            })
            res.send(booking)
        })

        // update booking isPaid status based on id params using patch method
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const booking = req.body;
            const result = await bookingCollection.updateOne(
                {
                    _id: ObjectId(id)
                },
                {
                    $set: booking
                },
                {
                    upsert: true
                }
            )
            res.json(result)
        })


        // get all the users
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find({});
            const users = await cursor.toArray();
            // console.log(users)
            res.send(users)
        })

        // delete user by email query
        app.delete('/users', async (req, res) => {
            const email = req.query.email;
            const result = await userCollection.deleteOne
                ({ email: email })
            res.json(result)
        })

        // update user role by email query
        app.patch('/users', async (req, res) => {
            const email = req.query.email;
            const user = req.body;
            const result = await userCollection.updateOne(
                { email: email },
                { $set: user },
                { upsert: true }
            )
            res.json(result)
        })

        // verify seller by email query
        app.patch('/verify', async (req, res) => {
            const email = req.query.email;
            const user = req.body;
            const result = await userCollection.updateOne(
                { email: email },
                { $set: user },
                { upsert: true }
            )
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