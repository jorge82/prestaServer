const express = require("express");
const routes = express.Router();

const { auth, requiresAuth } = require("express-openid-connect");

const {updateAmoToken, updatePrestaData, updateDoliContacts, updateAmoContacts, addNewContactsToDoli ,exportNew, getNewUsers,getCommonDoliUsers,exportCommonDoli}=require('../model/DBupdater')



  routes.get('/combinedDoli', requiresAuth(),(req,res)=>{

      getCommonDoliUsers((common)=>{
        //console.log("new users ",common)
        res.status(200);
        res.render('combinedDoli', {users:common});
      })  
    }
  )
  
  routes.get('/newUsers', requiresAuth(),(req,res)=>{
        getNewUsers((newusers)=>{      
          res.status(200);
          res.render('newUsers', {users:newusers});
        }) 
  })
   routes.get('/updateAll', requiresAuth(),(req,res,next)=>{
       updateDoliContacts((error)=>{
          if (error){
              next(error);
          }else{
              updateAmoContacts((error)=>{
                if (error){
                  next(error);
                }else{
                    res.status(200);
                    res.redirect('/combined/newusers')
                }
              });
          }
       });
  })

  routes.get('/addnewUsersToDoli', requiresAuth(),(req,res,next)=>{
    console.log("adding!!!")
    updateDoliContacts((error)=>{
      if (error){
          next(error);
      }else{
            addNewContactsToDoli((error)=>{
                if (error){
                  next(error);
                }else{
                    updateDoliContacts((error)=>{
                        if(error){
                          next(error);
                        }else{  
                          console.log("users correctry updated");
                          res.status(200);
                          res.redirect('/combined/newusers')}
                        });
                }
             });
      }  
    });
  });
  
 
  routes.get('/export', requiresAuth(),(req,res,next)=>{
    exportCommonDoli((error, file)=>{
        if(error){
            next(error);
        }else{
            res.download(file);
        }
    })
  });
  

  
  routes.get('/exportnew', requiresAuth(),(req,res,next)=>{
    exportNew((error, file)=>{
        if(error){
            next(error);
        }else{
            res.download(file);
        }
    })
 
  })


module.exports = routes;