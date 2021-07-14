const express = require("express");
const routes = express.Router();

const { auth, requiresAuth } = require("express-openid-connect");

const {updateAmoToken, addNewAmoContact,deleteAmoContact, updateAmoContact, exportNewToAmo, addNewContactsToAmo ,updatePrestaData, getNewToAmo,updateDoliContacts, updateAmoContacts, addNewContactsToDoli ,exportNew, getNewUsers,getCommonDoliUsers,exportCommonDoli}=require('../model/DBupdater')

const { convertDoliFormatToAmo} = require("../utils/utils")


  //let newContacts=[];
  routes.post('/contactsWebHook', (req, res, next)=>{

    //console.log("recinbing new contact from amo", req.body);
    try{
      //newContacts.push(req.body);
      const data=req.body.contacts;
      console.log("data received:", data)
      if(data.add){
        addNewAmoContact(data.add[0]);
      }
      if(data.update){
        updateAmoContact(data.update[0]);
      }
      if(data.delete){
        deleteAmoContact(data.delete[0]);
      }
      res.status(200).end();
    }catch(e){
        next(e);
    }
  });
  routes.get('/contactsWebHook', (req, res, next)=>{

   
    res.status(200).send(newContacts);

  })

  routes.get('/combinedDoli', requiresAuth(),(req,res)=>{

      getCommonDoliUsers((common)=>{
        //console.log("new users ",common)
        res.status(200);
        res.render('combinedDoli', {users:common});
      })  
    }
  )
   routes.get('/newToAmo', requiresAuth(),(req,res)=>{

      getNewToAmo((newUsers)=>{
        //console.log("new users ",common)
        newUsers.map(user=>{
          
         convertDoliFormatToAmo(user);
        })
        res.status(200);
        res.render('newToAmo', {users:newUsers});
      })  
    }
  )

  

  routes.get('/addNewUsersToAmo', requiresAuth(),  (req,res, next)=>{

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
                    res.status(200);
                  }
                });  
            
        })
      
        // res.status(200);
        // res.send(amoSlice);
        //res.render('newToAmo', {users:newUsers});
      }
     })  
     
      console.log("RETURNEDDDDDDDDDDDDDDDDDDDDDDDDD!")
    })





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
    //console.log("adding!!!")
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
                          //console.log("users correctry updated");
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