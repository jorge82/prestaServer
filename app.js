const express= require('express')
const { auth, requiresAuth } = require("express-openid-connect");
const api=require('./Api');
const Api2=require('./Api3');
var bodyParser = require('body-parser')
const ExportExcel=require('./exportExcel');

const Promise = require('bluebird')
const AppDAO = require('./database/dao')
const ConectionRepository = require('./database/conectionsRepository')
const UsersRepository = require('./database/usersRepository');
const exportExcel = require('./exportExcel');


const app=express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
// express-session


const dao = new AppDAO('./database/database.sqlite3')

const conectionRepo = new ConectionRepository(dao)
const userRepo= new UsersRepository(dao);

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

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
 console.log("Respuesta: ", res)
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

app.get('/profile', requiresAuth(),(req,res)=>{
    res.send(JSON.stringify(req.oidc.user))
})

app.post('/conections', requiresAuth(),(req,res)=>{
  console.log("body: ", req.body)


  if((req.body.tag=="") || (req.body.url=="" )|| (req.body.token=="" )){
    console.log("errorr!!")
    conectionRepo.getAll().then((rows)=>{
      console.log("conections: ", rows);
      res.render('conections', {conections:rows,  message: {type:'error', text:'Por favor complete todos los campos'}});
    })
  
  }else{
    var newConection={
      tag: req.body.tag,
      url:req.body.url,
      token:req.body.token
    }
    conectionRepo.insert(newConection.tag, newConection.url, newConection.token)
    .then((data)=>{
      console.log(data)
      conectionRepo.getAll().then((rows)=>{
        console.log("conections: ", rows);
        res.render('conections', {conections:rows,  message: {type:'success', text:'Coneccion agregada con exito'}});
      })
      })
      
    .catch(err=>{
      conectionRepo.getAll().then((rows)=>{
        console.log("conections: ", rows);
        res.render('conections', {conections:rows,  message: {type:'error', text:err}});
      })
    })
    
  }
  //res.send(JSON.stringify(req.oidc.user))
})

app.get('/conections/delete/:id', requiresAuth(),(req,res)=>{
  console.log(req.params.id)
  conectionRepo.delete(req.params.id);
 
  res.redirect('/conections');


})

app.get('/conections', requiresAuth(),(req,res)=>{
  conectionRepo.getAll().then((rows)=>{
    console.log("conections: ", rows);
    res.render('conections', {conections:rows,message:null})
  })
 


})

app.get('/customers', requiresAuth(),async (req,res)=>{
 

 

  conectionRepo.getAll().then((rows)=>{

    rows.forEach(row=>{
      console.log("conecion;", row)
      Api2.getData(row.url, row.token, row.tag)
    })
    //pi2.getData(URL, TOKEN, TAG)

  })
  .catch(err=>{
    console.log(err);
  }
    )

  //res.send(JSON.stringify(req.oidc.user))
})

app.get('/users', requiresAuth(),(req,res)=>{

  userRepo.getAll().then(rows=>{


    res.render('users', {users:rows})

  })

  
})


app.get('/export', requiresAuth(),(req,res)=>{

  userRepo.getAll().then(rows=>{


   console.log("headers:",Object.keys(rows[0]));
   const fileName='users'
   exportExcel(Object.keys(rows[0]), rows, 'users')
   setTimeout(() => {
    const file = __dirname +'/'+fileName+'.xlsx' 
    res.download(file)
   }, 2000);
   
  })

  
})
app.listen(PORT, ()=>{
    console.log("Listenign to port", PORT);
})
