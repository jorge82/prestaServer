const express= require('express')
var compression = require('compression')


const {updateAmoToken, addNewAmoContact,deleteAmoContact, updateAmoContact, exportNewToAmo, addNewContactsToAmo ,updatePrestaData, getNewToAmo,updateDoliContacts, updateAmoContacts, addNewContactsToDoli ,exportNew, getNewUsers,getCommonDoliUsers,exportCommonDoli}=require('./model/DBupdater')
const { convertDoliFormatToAmo} = require("./utils/utils")

const { auth, requiresAuth } = require("express-openid-connect");

const api=require('./Api/ApiPresta');
var bodyParser = require('body-parser');
const logger = require('./utils/Logger');




const app=express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(compression());

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
const amoroutes= require('./routes/amoRoutes');
const doliroutes= require('./routes/doliroutes');
const combined= require('./routes/amocombinedRoutes');

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));





const INTERVALODEACTUALIZACIONTOKEN=30600000;
setInterval(()=>{updateAmoToken((error)=>{
  if(!error){
    logger.info("Amo token successfully updated");
  }
})}, INTERVALODEACTUALIZACIONTOKEN);
const INTERVALODEACTUALIZACIONDOLICONTACTS=600000; //cada 10 minutos
setInterval(()=>updateDoliContacts((error)=>{
  if(!error){
    logger.info("Doli contacts successfully updated");
  }
}),[INTERVALODEACTUALIZACIONDOLICONTACTS]);
/*

const INTERVALODEACTUALIZACIONDOLITOAMO=INTERVALODEACTUALIZACIONDOLICONTACTS + 120000; //cada 12 minutos
setInterval(()=>{ 
  logger.info("Trying to add new users to Amo from doli");
  
      getNewToAmo((newUsers)=>{ 

        if(newUsers.length>0){
          const amoUsers= newUsers.map(user=>convertDoliFormatToAmo(user));
        
          addNewContactsToAmo(amoUsers, newUsers, (error)=>{
            if (error){
              logger.error("ERROR Adding new users to Amo from doli");
            }else{
              logger.info("Success adding new users to Amo from doli");
              res.status(200);
            }
          });
        }else{
          logger.info("Success adding new users to Amo from doli, no new users to add");
        }
      });
  
},[INTERVALODEACTUALIZACIONDOLITOAMO])
*/

//Para que Heroku no apague el servidor
var http = require("http");
setInterval(function() {
    http.get("http://jorgeserver.herokuapp.com");
    //http.get("http://localhost:3000");
    logger.info("Pinging the server");
}, 600000); // every 10 minutes (600000)

//  Connect all our routes to our application
app.use('/', routes);
app.use('/amo', amoroutes);
app.use('/doli', doliroutes);
app.use('/combined', combined);
//Error handler
app.use((error, req, res, next) => {
  logger.error("Server error 500: " + error.toString() );
  return res.status(500).json({ ServerError: error.toString() });
});

app.listen(PORT, ()=>{
    logger.info("Starting server in port " +PORT);
    console.log("Listening to port", PORT);
})
