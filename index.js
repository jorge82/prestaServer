const express= require('express')
var compression = require('compression')


const {updateAmoToken, addNewAmoContact,deleteAmoContact, updateAmoContact, exportNewToAmo, addNewContactsToAmo ,updatePrestaData, getNewToAmo,updateDoliContacts, updateAmoContacts, addNewContactsToDoli ,exportNew, getNewUsers,getCommonDoliUsers,exportCommonDoli}=require('./model/DBupdater')


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




/* Intervalo de actualizacion cada una hora */
const INTERVALODEACTUALIZACION=3600000;
//setInterval(updatePrestaData, INTERVALODEACTUALIZACION);
//Actualizo los los contactos de amo
/*
setInterval(()=>{updateAmoContacts(1,(error)=>{
        if(error){
                  console.log(error);
        }else{
               getNewToAmo((newUsers)=>{
                //console.log("new users ",common)
                const amoUsers= newUsers.map(user=>convertDoliFormatToAmo(user));
              
                //const amoSlice=amoUsers.slice(0,500);
               
                addNewContactsToAmo(amoUsers, (error)=>{
                  if (error){
                    console.log(error);
                  }
                });   
        });
      }
 }) } , INTERVALODEACTUALIZACION);

//a los 10 minutos actualizo los contactos de amo
setInterval( ()=>{
  updateDoliContacts((error)=>{
      if (error){
          console.log(error);
      }else{
            addNewContactsToDoli((error)=>{
                if (error){
                  console.log(error);
                }
            });
      }  
    })
  }, INTERVALODEACTUALIZACION + 60000);

*/
/* Intervalo de actualiacion del token cada 8 horas y media */
const INTERVALODEACTUALIZACIONTOKEN=30600000;
setInterval(updateAmoToken, INTERVALODEACTUALIZACIONTOKEN);



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
