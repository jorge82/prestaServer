const express = require("express");
const routes = express.Router();

const { auth, requiresAuth } = require("express-openid-connect");
const {updateAmoToken, addNewAmoContact,deleteAmoContact, updateAmoContact, exportNewToAmo, addNewContactsToAmo ,updatePrestaData, getNewToAmo,updateDoliContacts, updateAmoContacts, addNewContactsToDoli ,exportNew, getNewUsers,getCommonDoliUsers,exportCommonDoli, updateAmoLinkInDoli}=require('../model/DBupdater')
const { convertDoliFormatToAmo} = require("../utils/utils")

const logger = require('../utils/Logger');


  routes.post('/contactsWebHook', (req, res, next)=>{

    //console.log("recinbing new contact from amo", req.body);
    try{
      //newContacts.push(req.body);
      const data=req.body.contacts;
      logger.info("Webhook call, data received: " + JSON.stringify(data) );
      //console.log("data received:", data)
      if(data.add){
        logger.info("Webhook call, adding: " + JSON.stringify(data.add[0]) );
        addNewAmoContact(data.add[0],(err)=>{
          if(err){
            logger.error("Webhook call error: " + err );
          }else{
            logger.info("Webhook call, adding success");
          }
        });
      }
      else if(data.update){
        logger.info("Webhook call, updating: " + JSON.stringify(data.update[0]) );
        updateAmoContact(data.update[0],(err)=>{
          if(err){
            logger.error("Webhook call error: " + err );
          }else{
            logger.info("Webhook call, updating success");
          }
        });
      }
      else if(data.delete){
        logger.info("Webhook call, deleting: " + JSON.stringify(data.delete[0]) );
        deleteAmoContact(data.delete[0],(err)=>{
          if(err){
            logger.error("Webhook call error: " + err );
          }else{
            logger.info("Webhook call, deleting success");
          }
        });
      }else{
        logger.warn("Webhook call not doing anything" );
      }
      res.status(200).end();
    }catch(e){
        logger.error("Webhook call error: " + e );
        next(e);
    }
  });
  routes.get('/contactsWebHook', requiresAuth() ,(req, res, next)=>{
  
    res.download('./logs/server.log', 'server.log', (err) => {
      if (err) {
        next(err);
      } else {
        res.status(200);
      }
    })

  })

  routes.get('/updateCommonLinksDoli',requiresAuth(),(req,res, next)=>{
   
      updateAmoLinkInDoli((err)=>{
        if (err){
          next(err);
        }else{
          res.status(200);
        }
      }); 

      //res.render('combinedDoli', {users:common});
  
  })

  routes.get('/combinedDoli', requiresAuth(),(req,res)=>{
    logger.info("combinedDoli:trying to getting common users");
      getCommonDoliUsers((common)=>{
        logger.info("combinedDoli:getting common users success");
        res.status(200);
        res.render('combinedDoli', {users:common});
      })  
    }
  )
   routes.get('/newToAmo', requiresAuth(),(req,res)=>{
    logger.info("newToAmo:trying to getting new users to amo");
      getNewToAmo((newUsers)=>{
        //console.log("new users ",common)
        newUsers.map(user=>{
          
         convertDoliFormatToAmo(user);
        })
        logger.info("newToAmo: getting new users to amo success");
        res.status(200);
        res.render('newToAmo', {users:newUsers});
      })  
    }
  )

  

  routes.get('/addNewUsersToAmo', requiresAuth(),  (req,res, next)=>{
    logger.info("addNewUsersToAmo:trying to add new users to amo");
     updateAmoContacts(1,(error)=>{
        if(error){
                  next(error);
        }else{
           getNewToAmo((newUsers)=>{
                //console.log("new users ",common)
                const amoUsers= newUsers.map(user=>convertDoliFormatToAmo(user));
                //const amoSlice=amoUsers.slice(0,500);
                const amoSlice=amoUsers;
                addNewContactsToAmo(amoSlice, (error)=>{
                  if (error){
                    next(error); 
                  }else{
                    logger.info("addNewUsersToAmo:success");
                    res.status(200);
                  }
                });  
        })
      }
     })  
    })





  routes.get('/newUsers', requiresAuth(),(req,res)=>{
    logger.info("newUsers: showing new users");
        getNewUsers((newusers)=>{      
          res.status(200);
          res.render('newUsers', {users:newusers});
        }) 
  })
   routes.get('/updateAll', requiresAuth(),(req,res,next)=>{
    logger.info("updateAll: updating");
       updateDoliContacts((error)=>{
          if (error){
              next(error);
          }else{
              updateAmoContacts(1, (error)=>{
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
    logger.info("addnewUsersToDoli: trying to update new user to doli");
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
                          logger.info("addnewUsersToDoli: success");
                          res.status(200);
                          //res.redirect('/combined/newusers')
                          }
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

  routes.get('/exportNewToAmo', requiresAuth(),(req,res,next)=>{
    exportNewToAmo((error, file)=>{
        if(error){
            next(error);
        }else{
            res.download(file);
        }
    })
 
  })


module.exports = routes;