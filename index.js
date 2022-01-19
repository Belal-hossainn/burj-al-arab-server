const express = require('express')
const { MongoClient } = require('mongodb');
const port = 5000;
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.askxa.mongodb.net/burj-al-arab?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { initializeApp } = require('firebase-admin/app');

var admin = require("firebase-admin");

var serviceAccount = require("./burj-al-arab-7e7cd-firebase-adminsdk-rlm5b-dcd2edbd23.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burj-al-arab").collection("booking");

  app.post("/addBooking", (req, res)=> { 
    const newBooking = req.body;
    bookings.insertOne(newBooking)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  app.get("/bookings", (req, res)=>{
    const bearer= req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(" ")[1];
      console.log({idToken});
          admin.auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        const tokenEmail = decodedToken.email;
        const queryMail = req.query.email;
        console.log(tokenEmail, queryMail)
        if(tokenEmail === req.query.email){
          bookings.find({email: req.query.email})
          .toArray((err, document)=>{
          res.status(200).send(document)
          })
        }else{
          res.status(401).send('unauthorized  mail')
        }
      })
      .catch((error) => {
        res.status(401).send('unauthorized mail access')
      });
    }else{
      res.status(401).send('unauthorized access mail')
    }
    
  })
  
});

app.get('/', function (req, res) {
  res.send('hello world')
});

app.listen(port)