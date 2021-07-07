const express = require("express");
const routes = express.Router();

const { auth, requiresAuth } = require("express-openid-connect");


const {getContacts,getAccessToken, refreshAccessToken}= require('../Api/ApiAmo');

const {updateAmoToken,  updateAmoContacts, exportAmoUsers, getAmoUsers , deleteAmoConnections,getAllAmoConnections}=require('../model/DBupdater')


  
  routes.get('/refreshtoken', requiresAuth(),(req,res,next)=>{
        updateAmoToken((error)=>{
            if(error){
                next(error);// passing the error to the express error handler
            }else{
                // res.status(200).end();
            }

        });
    })
      
  
  routes.post('/connections', requiresAuth(),(req,res)=>{
    console.log("body: ", req.body)
  
    if((req.body.claveSecreta=="") || (req.body.url=="" )|| (req.body.code=="" )|| (req.body.id=="" )){
  
      conectionRepo.getAll().then((rows)=>{
      
        res.render('amoconections', {conections:rows,  message: {type:'error', text:'Por favor complete todos los campos'}});
      })
    
    }else{
      console.log(req.body.url)
      console.log(req.body.id)
      
      console.log(req.body.claveSecreta)
      console.log(req.body.code)
      
      
      getAccessToken(req.body.url,req.body.id,req.body.claveSecreta,req.body.code)
    .then(data=>{
      console.log("datos:", data)
      if(data.access_token){
        
  
        var newConection={
          accessToken: data.access_token,
          url:req.body.url,
          clientId:req.body.id,
          clientSecret:req.body.claveSecreta,
          refreshToken:data.refresh_token
        }
  
        amoconectionRepo.insert(newConection)
        .then((data)=>{
          console.log(data)
          amoconectionRepo.getAll().then((rows)=>{
          
            res.render('amoconections', {conections:rows,  message: {type:'success', text:'Coneccion agregada con exito'}});
          })
          })
          
        .catch(err=>{
          amoconectionRepo.getAll().then((rows)=>{
            console.log("conections: ", rows);
            res.render('amoconections', {conections:rows,  message: {type:'error', text:err}});
          })
        })
  
      }else{
        amoconectionRepo.getAll().then((rows)=>{
          console.log("conections: ", rows);
          res.render('amoconections', {conections:rows,  message: {type:'error', text:"Error al conectarse"}});
        })
      }
      
    })      
    }
  })


  routes.get('/connections/delete', requiresAuth(),(req,res,next)=>{
     deleteAmoConnection(req.query.id, (error)=>{
        if(error){
            next(error);
        }else{
            res.redirect('/amo/connections');
        }
    })
  })
  
  
  routes.get('/connections', requiresAuth(),(req,res,next)=>{
    getAllAmoConnections((error, data)=>{
        if(error){
            next(error);
        }else{
            res.render('amoconections', {conections:data,message:null})
        }
    })
  })
  
  routes.get('/getcontacts', requiresAuth(),(req,res, next)=>{
        updateAmoContacts((error)=>{
            if(error){
                next(error);
            }else{
                //Espero un segundo para redirigir a la pagina
                setTimeout(()=>{
                    res.status(200);
                    res.redirect('/amo/contacts')
                },1000)       
            }
        });  
  })
  
 
  
  
  routes.get('/contacts', requiresAuth(),(req,res, next)=>{
    getAmoUsers((error, data)=>{
        if(error){
            next();
        }else{
            res.render('amoContacts', {users:data})
        }

    })
  })
  
  routes.get('/export', requiresAuth(),(req,res, next)=>{
    exportAmoUsers((error, file)=>{
        if(error){
            next(error);
        }else{
            res.download(file);
        }
    })
  })
  
module.exports = routes;