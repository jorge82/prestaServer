const express= require('express')
const { auth, requiresAuth } = require("express-openid-connect");

const api=require('./Api/ApiPresta');
var bodyParser = require('body-parser')



const app=express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());



app.set('view engine' , 'ejs');
const PORT = process.env.PORT || 3000;


require('dotenv').config();
app.use(express.static(__dirname + '/views'));



const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
};



const routes = require('./routes/allroutes');


// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));




//  Connect all our routes to our application
app.use('/', routes);


app.listen(PORT, ()=>{
    console.log("Listenign to port", PORT);
})
