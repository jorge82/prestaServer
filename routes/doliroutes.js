const express = require("express");
const routes = express.Router();


const { auth, requiresAuth } = require("express-openid-connect");

const { getDoliUsers,exportDoliUsers, updateDoliContacts, updateAmoContacts, addNewContactsToDoli , getNewUsers,getCommonDoliUsers}=require('../model/DBupdater')

  
  routes.get('/getcontacts', requiresAuth(),(req,res, next)=>{

    updateDoliContacts((error)=>{
        if(error){
            next(error);
        }else{
            //Espero un segundo para redirigir a la pagina
            setTimeout(()=>{
                res.status(200);
                res.redirect('/doli/contacts')
            },1000)       
        }
    });  
  })
  
  
  
  
  
  routes.get('/contacts', requiresAuth(),(req,res)=>{
  
    getDoliUsers((error, data)=>{
        if(error){
            next();
        }else{
            res.status(200).render('doliContacts', {users:data})
        }

    })
   
  })
  



  routes.get('/getcontacts', requiresAuth(),(req,res)=>{
        updateDoliContacts((error)=>{
            if(error){
                next(error);
            }else{
                //Espero un segundo para redirigir a la pagina
                setTimeout(()=>{
                    res.status(200);
                    res.redirect('/doli/contacts')
                },1000)       
            }
        });  
    }
  );
  
  
 
  
  
routes.get('/export', requiresAuth(),(req,res)=>{
  
    exportDoliUsers((error, file)=>{
        if(error){
            next(error);
        }else{
            res.download(file);
        }
    })   
})
  

module.exports = routes;
