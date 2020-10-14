const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();


const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.bbk7z.mongodb.net:27017,cluster0-shard-00-01.bbk7z.mongodb.net:27017,cluster0-shard-00-02.bbk7z.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-1227kd-shard-0&authSource=admin&retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

const port = 5000;

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const adminCollection = client.db(process.env.DB_NAME).collection("admin");
    const serviceCollection = client.db(process.env.DB_NAME).collection("services");
    const clientOrderCollection = client.db(process.env.DB_NAME).collection("clientOrders");
    const reviewCollection = client.db(process.env.DB_NAME).collection("clientReviews");

    app.post('/addAdmin', (req, res) => { // add admin
        adminCollection.insertOne(req.body)
            .then(result => {
                res.status(200).send(result.insertedCount > 0)
            })
    });

    app.post('/isAdmin', (req, res) => { // check is admin or not
        adminCollection.find({ email: req.body.email })
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    })

    app.post('/addService', (req, res) => { // add services
        // Save Base64 on Mongodb
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;

        const newImg = file.data;
        const encImg = newImg.toString('base64');

        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ title, description, image })
            .then(result => {
                res.status(200).send(result.insertedCount > 0);
            })
    })

    app.get('/services', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    });

    app.get('/getServiceById', (req, res) => { // get service by id
        serviceCollection.find({ _id: ObjectID(req.query.id) })
            .toArray((err, documents) => {
                res.status(200).send(documents[0]);
            })
    });

    app.post('/addClientOrder', (req, res) => { // add client order
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const serviceName = req.body.serviceName;
        const projectDetail = req.body.projectDetail;
        const price = req.body.price;
        const serviceId = req.body.serviceID;
        const status = 'Pending';

        const newImg = file.data;
        const encImg = newImg.toString('base64');

        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        clientOrderCollection.insertOne({ name, email, serviceName, projectDetail, serviceId, price, status, image })
            .then(result => {
                res.status(200).send(result.insertedCount > 0);
            })
    })

    app.get('/getClientOrderByEmail', (req, res) => { // get service by email
        clientOrderCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    });

    app.get('/getClientOrder', (req, res) => { // get all client order 
        clientOrderCollection.find()
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    });
 
    app.patch('/updateClientOrderStatus/:id', (req, res) => { // Update client order status
        clientOrderCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { status: req.body.status }
            })
            .then(result => {
                res.send(result.modifiedCount > 0);
            })
    });

    app.post('/addReview', (req, res) => { // add client review
        reviewCollection.insertOne(req.body)
            .then(result => {
                res.status(200).send(result.insertedCount > 0)
            })
    });

    app.get('/getClientReview', (req, res) => {
        reviewCollection.find({}).limit(6)
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    });
});


app.listen(process.env.PORT || port)