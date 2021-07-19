const express = require("express");
const routes = express.Router();

const { auth, requiresAuth } = require("express-openid-connect");


const {getContacts,getAccessToken, refreshAccessToken}= require('../Api/ApiAmo');

const {updateAmoToken,  updateAmoContacts, exportAmoUsers, getAmoUsers , deleteAmoConnection,getAllAmoConnections, insertAmoConmnection}=require('../model/DBupdater')


  
  routes.get('/refreshtoken', requiresAuth(),(req,res,next)=>{
        updateAmoToken((error)=>{
            if(error){
                next(error);// passing the error to the express error handler
            }else{
                 res.status(200);
            }

        });
    })
      
  
  routes.post('/connections', requiresAuth(),(req,res, next)=>{
    console.log("body: ", req.body)
  
    if((req.body.claveSecreta=="") || (req.body.url=="" )|| (req.body.code=="" )|| (req.body.id=="" )){
        console.log("Here")
      // conectionRepo.getAll().then((rows)=>{
      
      //   res.render('amoconections', {conections:rows,  message: {type:'error', text:'Por favor complete todos los campos'}});
      // })
       res.status(200).render('amoconections', {conections:[],message:{type:'error', text:'Faltan datos!'}});
    }else{

      insertAmoConmnection(req.body.url, req.body.id,req.body.claveSecreta,req.body.code,(err, newConect)=>{
        if(err){
            next(err);
        }else{
          let data=[];
          data.push(newConect)
          res.render('amoconections', {conections:data,  message: {type:'success', text:'Coneccion agregada con exito'}});
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
        updateAmoContacts(1,(error)=>{
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
            res.status(200).render('amoContacts', {users:data})
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