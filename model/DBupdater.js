
const AppDAO = require('../database/dao')
const ConectionRepository = require('../database/conectionsRepository')
const AmoConectionRepository = require('../database/amoConectionsRepository')
const UsersRepository = require('../database/usersRepository');
const OrdersRepository= require('../database/ordersRepository');
const AddressRepository= require('../database/addressRepository');
const AmoUsersRepository = require ('../database/amoUsersRepository')
const DoliUsersRepository = require ('../database/doliUsersRepository')

const {getContacts,getAccessToken, refreshAccessToken, addContactsToAmo}= require('../Api/ApiAmo');

const {getContactsFromDoli,addContatToDoli,editContactLinkInDoli,editContactInDoli}= require('../Api/ApiDoli')


const {exportExcel, filterContactData} = require('../utils/utils');

const logger= require('../utils/Logger');

const dao = new AppDAO('./database/database.sqlite3')

const conectionRepo = new ConectionRepository(dao)
const amoconectionRepo = new AmoConectionRepository(dao)
const userRepo= new UsersRepository(dao);
const orderRepo= new OrdersRepository(dao);
const addressRepo= new AddressRepository(dao);
const amoRepo= new AmoUsersRepository(dao);
const doliRepo= new DoliUsersRepository(dao);


//const redis = require("redis");
//const client = redis.createClient();

// client.on("error", function(error) {
//   console.error(error);
// });

module.exports.updateDoliIDInAmoDB= async function updateDoliIDinAmoDB(){
  getCommonDoliUsers(async (users)=>{
    for (let user of users){
      amoRepo.updateDoliID(user.AmoID, user.id);
    }
  });
}

module.exports.updateAmoLinkInDoli = async function updateAmoLinkInDoli(callback){

  const URLDoli='dbarg.doli.ar/htdocs';
  const TOKENDoli="fp8x6y95";


  //console.log("New doli contacts to fetch!!")

  getCommonDoliUsers(async (users)=>{
    //doliUsers=users.slice(5000,5210);
    doliUsers=users;
    const usersToAdd=doliUsers.length;

    const userBatch=10;
    console.log("# of users to edit", usersToAdd)
     console.log(" users to edit link", doliUsers)
    let initialValue=0;
    let i=0;
    while (i<usersToAdd) {
        let promises=[];
        //agrego usuarios;
        let max=initialValue+userBatch;
        
        for ( i=initialValue;i<max; i++){
          if(i<usersToAdd){
            //console.log("updating user", doliUsers[i]);  
            promises.push(editContactLinkInDoli(URLDoli, TOKENDoli,doliUsers[i]));
          }    
        }
  
        try{
            await Promise.all(promises);
                  console.log("Adding users bach", i-userBatch,"-",i-1 );
                  initialValue=i;
                  if(i>=usersToAdd-1){
                    console.log("Finished adding users");
                    callback(null);
                  }
          }catch (e) {
                callback(e);
            }
    }
   
  })


}

module.exports.insertAmoConmnection= async function insertAmoConmnection(url, integrationId, secretKey, code,callback){

  getAccessToken(url,integrationId,secretKey,code)
    .then(data=>{
      console.log("datos:", data)
        var newConection={
          accessToken: data.access_token,
          url:url,
          clientId: integrationId,
          clientSecret:secretKey,
          refreshToken:data.refresh_token
        }
  
        amoconectionRepo.insert(newConection)
          .then((data)=>{
            console.log("new connection", data);
            callback(null, newConection);
          })
          
        .catch(err=>{
              callback(err);
        })
  
      
      
    }).catch(err=>{
      callback(err);
})


}
module.exports.exportAmoUsers= async function exportAmoUsers(callback){
  try{
  amoRepo.getAll().then(rows=>{
    const data= rows.map(value=>{
      value.id=value.id.toString();
      return value;
    })
     const fileName='AmoUsers';
     exportExcel(Object.keys(data[0]), data, fileName,
        ()=>{
        const file = __dirname +'/../'+fileName+'.xlsx'
        callback(null,file)})
        });
   }catch(error){
       callback(error);
   }    
}

module.exports.exportCommonDoli= async function exportCommonDoli(callback){

  getCommonDoliUsers((rows)=>{
    const data= rows.map(value=>{
      value.id=value.id.toString();
      return value;
    })
    const fileName='CombinedDoliUsers';
     exportExcel(Object.keys(data[0]), data, fileName,
        ()=>{
        const file = __dirname +'/../'+fileName+'.xlsx'
        callback(null,file)})
  }).catch(error=>{
        callback(error);
    })    
}
module.exports.exportNew= async function exportNew(callback){

  getNewUsers((rows)=>{
    const data= rows.map(value=>{
      value.id=value.id.toString();
      return value;
    })
    const fileName='newUsers';
     exportExcel(Object.keys(data[0]), data, fileName,
        ()=>{
        const file = __dirname +'/../'+fileName+'.xlsx'
        callback(null,file)})
  }).catch(error=>{
        callback(error);
  })    
}

module.exports.exportDoliUsers= async function exportDoliUsers(callback){
  try{
    doliRepo.getAll().then(rows=>{
      const data= rows.map(value=>{
        value.id=value.id.toString();
        return value;
      })
      const fileName='doliUsers';
      exportExcel(Object.keys(data[0]), data, fileName,
        ()=>{
        const file = __dirname +'/../'+fileName+'.xlsx'
        callback(null,file)})
        });
   }catch(error){
       callback(error);
   }    
}
module.exports.getAmoUsers= async function getAmoUsers(callback){

  try{
      const KEY="amousers";
      // client.get(KEY, (err, data)=>{
          // if(data){
          //   callback(null, JSON.parse(data));
          // }else{
            amoRepo.getAll().then(rows=>{
              // client.setex(KEY,3600,JSON.stringify(rows))
              callback(null, rows);
            })
            .catch((error)=>{
              callback(error);
            });
        //}
      // });
  }catch(error){
     callback(error);
  }
}
module.exports.getDoliUsers= async function getDoliUsers(callback){

  try{
    const KEY="doliusers";
  
    // return client.get(KEY, (err, data)=>{
      // if(data){
      //       callback(null, JSON.parse(data));
      //     }else{
            doliRepo.getAll().then(rows=>{
              // client.setex(KEY,3600,JSON.stringify(rows))
              callback(null, rows);
            })
            .catch((error)=>{
              callback(error);
            });
        //}
      // });
  }catch(error){
     callback(error);
  }
}


module.exports.deleteAmoConnection= async function deleteAmoConnection(id, callback){
   try{
     const response = await amoconectionRepo.delete(id);
     const response2 = await amoRepo.deleteAll();
     callback(null);
   }
   catch(error){
    callback(error);
   }
}

/* function that get all amo connections
returns connecions with a callback */
module.exports.getAllAmoConnections= async function getAllAmoConnections(callback){
  amoconectionRepo.getAll().then((rows)=>{
    //console.log("data", rows)
    callback(null, rows);
  })
  .catch((error)=>{
    callback(error);
  });
}

function updatePrestaData(){

    conectionRepo.getAll().then((rows)=>{
        console.log('Updating data')
        rows.forEach(row=>{
          console.log("conecion;", row)
          api.getAllCustomerAddress(row.url, row.token, row.tag);
          api.getOrders(row.url, row.token, row.tag);
          api.getData(row.url, row.token, row.tag)
        })
        //pi2.getData(URL, TOKEN, TAG)
    
      })
      .catch(err=>{
        console.log(err);
      })


}
//Function that updates amoCrm token
//if there is an error it propagates with the callback
async function updateAmoToken(callback){
  logger.info("updateAmoToken: trying to update amo token");
    try{
      const rows= await amoconectionRepo.getAll();
      if (rows.length>0){
          try{
            data=rows[0];
            const info= await refreshAccessToken(data.url,data.clientId, data.clientSecret,data.refreshToken);
            const update= await amoconectionRepo.update(data.url, info.access_token, info.refresh_token);
          }catch(error){
            logger.error("updateAmoToken: error updating amo token");
            callback(error);
          }
      }
      callback(null);
    }catch(error){
      logger.error("updateAmoToken: error updating amo token");
      callback(error);
    }
}
function addContactsToAmoDB(data,doliUsers){
  const ids= data._embedded.contacts.map(value=>value.id);
  let amoUsers= doliUsers.map((user,index)=>{
          let amoUser={};
          amoUser.id=ids[index];
          amoUser.name=user.name;
          amoUser.first_name=user.firstName;
          amoUser.last_name=user.lastName;
          amoUser.Email=user.email;
          amoUser.Phone=user.phone;
          amoUser.Tag="DOli";
          amoUser.Link="https://jmbere.amocrm.com/contacts/detail/"+ids[index];
          amoUser.DoliID=user.id;
          return amoUser;
  })
  for(let contact of amoUsers){
    console.log("inserting contact to amoDB", contact);
    amoRepo.insert(contact);
  }
  return;
}
module.exports.addNewContactsToAmo=async function addNewContactsToAmo(users,doliUsers, callback){

    try{

      const rows= await amoconectionRepo.getAll();
      if (rows.length>0){
          try{
            data=rows[0];
            if(users.length<=250){
              console.log("Addinng last elements to amo");
              addContactsToAmo(data.url, data.accessToken, users).then((data)=>{
                //console.log("console.log doliusers", doliUsers);
                //console.log("data", data);
                  addContactsToAmoDB(data,doliUsers);
                  callback(null); 
              }).catch(e=>{
                  callback(e);
              })
            
            }else{
              console.log("Addinng 250 elements to amo");
              const userSlice= users.slice(0,250);
              const doliUserSlice= doliUsers.slice(0,250);
              addContactsToAmo(data.url, data.accessToken, userSlice).then(data=>{
                  addContactsToAmoDB(data,doliUserSlice);
                  users.splice(0, 250)
                  doliUsers.splice(0,250);
                  addNewContactsToAmo(users,doliUsers, callback);
              }).catch(e=>{
                  callback(e);
              })
            } 
          }catch(error){
            callback(error);
          }
      }
      callback(null);
    }catch(error){
      callback(error);
    }
}


function updateDoliContacts(callback){
  logger.info("Started to update doli contacts");
  var start = new Date()
    const URLDoli='dbarg.doli.ar/htdocs';
    const TOKENDoli="fp8x6y95";
    const TAGDoli="Doli"

    //console.log("Fetching doli contacts!!")
  try{
    doliRepo.getAll().then(rows=>{
        datos_actuales=rows;
        
        getContactsFromDoli(URLDoli, TOKENDoli, TAGDoli).then((data)=>{
       
            //console.log("In total there are :",data.length, " contacts")
        
            data.map((contact, index)=>{
        
                let contactInfo= {id:contact.id ,name: contact.name, firstName:contact.firstname , lastName:contact.lastname , email:contact.email, address:contact.address, zip:contact.zip, city:contact.town, country:contact.country, phone:contact.phone  }
        
                let found= datos_actuales.some(el=> el.id==contactInfo.id)
                    if(!found){
                     //console.log("pushing:", contactInfo)
                      doliRepo.insert(contactInfo);
                    }
     
            })
              const dif=new Date()-start;
              logger.info("Finished to update doli contacts in ms: "+ dif.toString());
              //updateDoliUsersInRedis()
              callback(null);
            
         }).catch((error)=>{
            callback(error);
        })
    })
    }catch(error){
      callback(error);
    }
}

async function addNewContactsToDoli(callback){
  logger.info("Started to add new contacts to doli");
  var start = new Date()

    const URLDoli='dbarg.doli.ar/htdocs';
    const TOKENDoli="fp8x6y95";
    const TAGDoli="Doli"

    console.log("New doli contacts to fetch!!")

    getNewUsers(async (users)=>{
      const usersToAdd=users.length;
      const userBatch=10;
      console.log("# of users to add", usersToAdd)
       console.log(" users to add", users)
      let initialValue=0;
      let i=0;
      while (i<usersToAdd) {
          let promises=[];
          //agrego usuarios;
          let max=initialValue+userBatch;
          
          for ( i=initialValue;i<max; i++){
            if(i<usersToAdd){
                promises.push(addContatToDoli(URLDoli, TOKENDoli,users[i]));
            }    
          }
    
          try{
              await Promise.all(promises);
                    console.log("Adding users bach", i-userBatch,"-",i-1 );
                    initialValue=i;
                    if(i>=usersToAdd-1){
                      const dif=new Date()-start;
                      logger.info("Finished to add new contacts to doli in ms: "+ dif.toString());;
                      callback(null);
                    }
            }catch (e) {
                  callback(e);
              }
      }
     
    })
}

/*
function updateDoliUsersInRedis(){
    const KEY="doliusers";
    doliRepo.getAll().then(rows=>{
        client.setex(KEY,3600,JSON.stringify(rows))
        console.log("Doli user updated in cache!");
    }) 
    .catch(e=>{
        console.log("Error updating redis cache:",e)
    })  
}

function updateAmoUsersInRedis(){
    const KEY="amousers";
    amoRepo.getAll().then(rows=>{
        client.setex(KEY,3600,JSON.stringify(rows))
        console.log("Amo user updated in cache!");
    }) 
    .catch(e=>{
        console.log("Error updating redis cache:",e)
    })  
}
*/
module.exports.addNewAmoContact=function addNewAmoContact(contact, callback){
  let allTags=[];
  const amoLink="https://jmbere.amocrm.com/contacts/detail/"+contact.id;
  const URLDoli='dbarg.doli.ar/htdocs';
  const TOKENDoli="fp8x6y95";

  try{
      let contactInfo= {id:contact.id ,name: contact.name, Phone:'',  Email:'', first_name:contact.first_name ||"" , last_name:contact.last_name ||"", Tags:allTags.join(), Link:amoLink, DoliID:0}

      if(contact.custom_fields){
          contact.custom_fields.map(custom=>{
              if (custom.id==243912){//243912 es el id de Phone)
                contactInfo["Phone"]=custom.values[0].value;
              }
              if (custom.id==243914){//243914 es el id de Email)
                contactInfo["Email"]=custom.values[0].value;
              }
                
          })
      }
      if (!amoContactIsValid(contactInfo)){
        callback("Contact not valid");
      }else{
        addNewContactFromAmoToDoli(contactInfo, callback);
    }
}catch(e){
    callback(new Error(e));
}

}
//Ver que pasa borrar id de doli
module.exports.deleteAmoContact=function deleteAmoContact(contact, callback){
  //console.log("trying to delete amo user id", contact.id)
  if(contact.id)
      amoRepo.delete(contact.id).catch(e=>{  
          callback(e);
      });
}
module.exports.updateAmoContact=function updateAmoContact(contact,callback){
  try{
      const amoLink="https://jmbere.amocrm.com/contacts/detail/"+contact.id;
    
      let allTags=[];
      if(contact.tags){
        for(let tag of contact.tags){
          allTags.push(tag.name);
        } 
      }
      let contactInfo= {id:contact.id ,name: contact.name, Phone:'',  Email:'', first_name:contact.first_name ||"" , last_name:contact.last_name ||"", Tags:allTags.join(), Link:amoLink }
      
      if(contact.custom_fields){
          contact.custom_fields.map(custom=>{
              if (custom.id==243912){//243912 es el id de Phone)
                contactInfo["Phone"]=custom.values[0].value;
              }
              if (custom.id==243914){//243914 es el id de Email)
                contactInfo["Email"]=custom.values[0].value;
              }
                
          })
      }
      if (!amoContactIsValid(contactInfo)){
          callback("Contact not valid");
      }else{
          addNewContactFromAmoToDoli(contactInfo, callback);
      }
     
  }catch(e){
      callback(e);
  }
}

async function addNewContactFromAmoToDoli(contactInfo, callback){
  const URLDoli='dbarg.doli.ar/htdocs';
  const TOKENDoli="fp8x6y95";
  const ID= parseInt(contactInfo.id, 10);
    
  amoRepo.getByID(ID).then(amoUsers=>{
    console.log("amouser fetched by id", amoUsers);

    /* si se enceuntra el usuario lo actualizo */
    if(amoUsers.length>0){
      const user= amoUsers[0];
        if(user.DoliID){
            if(user.DoliID>0){
              try{
                amoRepo.update(contactInfo);
                editContactInDoli(URLDoli, TOKENDoli,contactInfo, user.DoliID,3).then((doliUserId)=>{
                  const doliUSer={id:user.DoliID , name:contactInfo.name , firstName:contactInfo.first_name , lastName:contactInfo.last_name,  email:contactInfo.Email, phone:contactInfo.Phone, address:"", zip:"", city:"", country:""}
                  doliRepo.update(doliUSer);
                  callback(null);
              }).catch(e=>{
                  callback(e);
              })
                  
              }catch(e){
                  callback(e);
              }
         }else{//sino no se encuentra el id del usario de doli
            amoRepo.update(contactInfo);
         }
      }
   
    }else{
      console.log("user not found to update");
      amoRepo.insert(contactInfo).then(()=>{
        addContatToDoli(URLDoli, TOKENDoli,contactInfo,3).then((doliUserId)=>{
          try{
              contactInfo["DoliID"]=doliUserId;
              const newDoliUSer={id:doliUserId , name:contactInfo.name , firstName:contactInfo.first_name , lastName:contactInfo.last_name,  email:contactInfo.Email, phone:contactInfo.Phone, address:"", zip:"", city:"", country:""}
              doliRepo.insert(newDoliUSer).catch(e=>{
                callback(e);
              });
              amoRepo.update(contactInfo).catch(e=>callback(e));
              callback(null);
          }catch(e){
              callback(e);
          }
      }).catch(e=>{
        callbacck(e);
      })

      })
      .catch(e=>{ 
      callback(e);
      });
    }
  })
}




function updateAmoContacts(numberRetries, callback){
    logger.info("Started to update amo contacts");
    var start = new Date()
  
    try{
    let page=1;
    amoconectionRepo.getAll().then(rows=>{
      if(rows.length>0){
        
      
        getContacts(rows[0].url, rows[0].accessToken, page).then(data=>{

          //console.log("Time to fetch amo users: %dms",new Date() - start );
          //amoRepo.getAll().then(rows=>{
          amoRepo.deleteAll().then(()=>{  
            //const datos_actuales=rows; 
            data.map((contact, index)=>{
              //console.log("tags", contact._embedded.tags);
              //console.log("amo contact", contact);
              let allTags=[];
              const amoLink="https://jmbere.amocrm.com/contacts/detail/"+contact.id;
                for(let tag of contact._embedded.tags){
                  allTags.push(tag.name);
                }
                let contactInfo= {id:contact.id ,name: contact.name, first_name:contact.first_name , last_name:contact.last_name, Tags:allTags.join(),  Link:amoLink, DoliId:0}
                // console.log("custom fields:", contact.custom_fields_values)
                if(contact.custom_fields_values){
                    contact.custom_fields_values.map(custom=>{
                         contactInfo[custom.field_name]=custom.values[0].value;
                    })
                }
                // let found= datos_actuales.some(el=> el.id==contactInfo.id)
                // if(!found){
                //     console.log("pushing:", contactInfo)
                    amoRepo.insert(contactInfo);
                // }
          })
            const dif=new Date() - start;
             logger.info("Time to update amo contacts in miliseconds: "+ dif.toString());
             //updateAmoUsersInRedis();
             callback(null);
        })
        }).catch((error)=>{
            if(numberRetries>0){
              console.log("Retrying");
                updateAmoToken((err)=>{

                    if(err){
                      callback(err);
                    }else{
                        updateAmoContacts(numberRetries-1, callback);
                    }
                })
            
            }else{
              callback(error);
            }
          
        })
      }else{
        console.log("no contacts!!");
        //updateAmoUsersInRedis();
        callback(null);
      }
    })
  }catch(error){
    callback(error);
  }
}


function comparePhones( phone_1, phone_2){
  if((phone_1)&&(phone_2)){

    var phone1=phone_1.replace(/[- +]/g,'')
    var phone2=phone_2.replace(/[- +]/g,'')

    var lastSix1 = phone1.substr(phone1.length - 6); 
    var lastSix2 = phone2.substr(phone2.length - 6); 

      if(lastSix1==lastSix2){    
          //console.log("Encontrado!!!:", contact, doliUSer);
          return true;
      }else{
          return false;
      }
  }else{  
      return false;
  }

}
/* Función que  devuelve el elemento con mas datos
Post: objeto   */
function returnContactWithMoreInfo( currentData, contact){
  let contactWithMoreInfo=currentData;
  try{
          //si el contacto tiene correo y no el guardado
        if((contact.Email)&& (!currentData.Email)){
            contactWithMoreInfo=contact;
        }else if((contact.Phone)&& (!currentData.Phone)){
            contactWithMoreInfo=contact;    
        }else if ((contact.last_name)&& (!currentData.last_name)){
            contactWithMoreInfo=contact;
        }

    
    return contactWithMoreInfo;
  }

  catch(e){
      console.log("Error:", e);
      return {};
  }

}
function returnDoliContactWithMoreInfo( currentData, contact){
  let contactWithMoreInfo=currentData;
  try{
          //si el contacto tiene correo y no el guardado
        if((contact.email)&& (!currentData.email)){
            contactWithMoreInfo=contact;
        }else if((contact.phone)&& (!currentData.phone)){
            contactWithMoreInfo=contact;    
        }else if ((contact.lastName)&& (!currentData.firstName)){
            contactWithMoreInfo=contact;
        }

    
    return contactWithMoreInfo;
  }

  catch(e){
      console.log("Error:", e);
      return {};
  }

}


function amoContactIsValid(contact){
    if(!contact.Email && !contact.Phone ||(!isNaN(contact.name))){
      //console.log("not email and not phone")
      return false;
  
    }else if (contact.name.includes("Llamada") ||contact.name.length<2 || contact.name.includes("prueba") || contact.name.includes('atencion amo') || (contact.name.includes('PROGRAMA DE'))|| contact.name.includes('Google')){
      //console.log("filtrado por llamadas")
      return false;
    }else if( contact.Email){
      let emailEnding=contact.Email.split('@')[1];
      if(contact.Email.includes('noreply')){
        return false;
      }else if  ((contact.Email=='uber@uber.com') || (emailEnding=="rackear.com.ar") ||(emailEnding=="blocket.com.ar") ||(emailEnding=="sendinblue.com") || (emailEnding=="db-arg.com") || (emailEnding=="musitec.com.ar") || (emailEnding=="dbdrums.com.ar")) {
            return false; 
        }else{
            return true;
        }
    }else{
      if(contact.Phone){
     
          if(contact.Phone.length<5)
            return false
      }  
      return true;
    }
}
function contactIsPresent(target, contact){

  if((target.Email!=null && contact.Email!=null &&  target.Email === contact.Email) || (comparePhones(target.Phone,contact.Phone))){
    return true;
  } else{
    return false;
  }

}
function doliContactIsPresent(target, contact){

  if((target.email!=null && contact.email!=null &&  target.email === contact.email) || (comparePhones(target.phone,contact.phone))){
    return true;
  } else{
    return false;
  }

}
function  removeAmoDuplicate(users){
  if(users.length==0){
    return users;
  }else{
  const filteredData = users.reduce((acc, current) => {
      
      const x = acc.find(item => contactIsPresent(current, item));
      const index = acc.findIndex(item => contactIsPresent(current, item));
      
        if (!x) {
          return acc.concat([current]);
        } else {
            acc[index]=returnContactWithMoreInfo(current,x);
          return acc;
        }
  }, []);
  return filteredData;
  }
}

function generateDoliEmailSet(doliusers){
    let usersSet= new Set();
    for(let user of doliusers){
      usersSet.add(user.email);
    }
    return usersSet;
}
function generateDoliPhoneSet(doliusers){
  let usersSet= new Set();
  for(let user of doliusers){
    if(user.phone){
    var phone=user.phone.replace(/[- +]/g,'')
    var lastSix = phone.substr(phone.length - 6);
    usersSet.add(lastSix);
    }
  }
  return usersSet;
}
function convertPhone(phone){
    var phoneString=phone.replace(/[- + .]/g,'')
    var lastSix = phoneString.substr(phoneString.length - 6);
    return lastSix;
}


function amoUserIsInDoli(doliEmailSet, doliPhoneSet, amouser){
  let foundContact=false;
 
    //console.log(doliSet);
    //console.log(doliphoneSet);
        if(amouser.Email){
            if(doliEmailSet.has(amouser.Email)){
              foundContact=true;
            }
        }
        if(amouser.Phone){
          if(doliPhoneSet.has(convertPhone(amouser.Phone))){
            foundContact=true;
          }
        }
        return foundContact;
  }

  function doliUserIsInAmo(amoEmailSet, amoPhoneSet, doliuser){
    let foundContact=false;
   
      //console.log(doliSet);
      //console.log(doliphoneSet);
          if(doliuser.email){
              if(amoEmailSet.has(doliuser.email)){
                foundContact=true;
              }
          }
          if(doliuser.phone){
            if(amoPhoneSet.has(convertPhone(doliuser.phone))){
              foundContact=true;
            }
          }
          return foundContact;
    }


async function getNewUsers(callBack){
  var start = new Date()
  amoRepo.getAll().then(amoData=>{
    //console.log("Time to get amo  data: %dms",new Date() - start );
    var start1 = new Date()
    const filteredAmoData=amoData.filter(contact=>{return(amoContactIsValid(contact))});

    //console.log("Time to filter amo: %dms",new Date() - start1 );
   
    let newUsers=[];
        doliRepo.getAll().then(doliData=>{
          //creo dos set a modo de indice para bajar el tiempo de búsqueda
          let doliEmailSet=generateDoliEmailSet(doliData);
          let doliPhoneSet= generateDoliPhoneSet(doliData); 
          //console.log(doliSet);
          //console.log(doliphoneSet);
          var start2 = new Date()
          let foundContact=false;
          for( let contact of filteredAmoData){
  
              foundContact=amoUserIsInDoli(doliEmailSet, doliPhoneSet, contact);
              if(!foundContact){
                console.log("contact phone is:",contact.Phone,"converted is:",convertPhone(contact.Phone));
                console.log("doli  phone is:",convertPhone('37853092'))
                  newUsers.push(contact)
              }
             
          }
          let usersWithOutDup=removeAmoDuplicate(newUsers);
          //console.log("Time to compare: %dms",new Date() - start2 );
          //console.log("Time to find new users: %dms",new Date() - start );
          const dif=new Date() - start;
          logger.info("Time to find new users to doli in miliseconds: "+ dif)
          callBack(usersWithOutDup);
        })
  })
}

async function getCommonDoliUsers(callBack){
  var start = new Date()
  amoRepo.getAll().then(amoData=>{
    const filteredAmoData=amoData.filter(contact=>{return(amoContactIsValid(contact))});
  
    let users=[];
        doliRepo.getAll().then(doliData=>{

          const filterDoliData=doliData.filter(filterDoliContacts);
       
          let amoEmailSet=generateAmoEmailSet(filteredAmoData);
          let amoPhoneSet= generateAmoPhoneSet(filteredAmoData); 
          let amoEmailDic=generateAmoEmailDictionary(filteredAmoData);  
          let amoPhoneDic=generateAmoPhoneDictionary(filteredAmoData); 
          let amoIDEmailSet= generateAmoIDEmailDictionary(filteredAmoData);
          let amoIDPhoneSet= generateAmoIDPhoneDictionary(filteredAmoData);           
            //console.log(amoEmailDic);
            //console.log(amoPhoneDic);
            let foundContact=false;
          for( let contact of filterDoliData){
              
              foundContact=doliUserIsInAmo(amoEmailSet, amoPhoneSet, contact)
               //console.log("contact found", foundContact , "amo", contact)
              if(foundContact){
                //console.log("contact found", foundContact , "doli", contact)
                  
                      
                  if(amoEmailDic[contact.email]){
                    contact.link= amoEmailDic[contact.email];
                    contact.AmoID= amoIDEmailSet[contact.email];
                  }else{
                    //console.log("contatc", contact)
                    const convertedPhone=convertPhone(contact.phone);
                    contact.link= amoPhoneDic[convertedPhone];
                    contact.AmoID= amoIDPhoneSet[convertedPhone];
                  }    
                  users.push(contact)
              }
          }
          //let usersWithOutDup=removeDoliDuplicate(users)
          //console.log("Time to find common users: %dms",new Date() - start );
          const dif=new Date() - start;
          logger.info("Time to find common users in miliseconds: "+dif)
          callBack(users);
        })
  })
}


function filterDoliContacts(contact){

  if(!contact.email && !contact.phone || (!isNaN(contact.name) || (contact.name.length<2) || (contact.email=="jmbere@gmail.com") || (contact.email=="@"))){
    //console.log("not email and not phone")
    return false;
  }else if (contact.name.includes("Llamada") || contact.name.includes("prueba") || contact.name.includes('atencion amo') || contact.name.includes('PROGRAMA') || contact.name.includes('Google')){
    //console.log("filtrado por llamadas")
    return false;
  }else if( contact.email){
    let emailEnding=contact.email.split('@')[1];
    if(contact.email.includes('noreply')){
      return false;
    }else if  ((contact.email=='uber@uber.com') || (emailEnding=="rackear.com.ar") || (emailEnding=="sendinblue.com") ||(emailEnding=="blocket.com.ar") || (emailEnding=="db-arg.com") || (emailEnding=="musitec.com.ar") || (emailEnding=="dbdrums.com.ar")) {
          return false;
      }else{
          return true;
      }
  }else{
    return true;
  }

}

function generateAmoEmailSet(amousers){
  let usersSet= new Set();
  for(let user of amousers){
    usersSet.add(user.Email);
  }
  return usersSet;
}

function generateAmoEmailDictionary(amousers){
    let emailDic= new Object();
    for(let user of amousers){
      if(user.Email){
        emailDic[user.Email]=user.Link;
      } 
    }
    return emailDic;
}
function generateAmoIDEmailDictionary(amousers){
  let emailDic= new Object();
  for(let user of amousers){
    if(user.Email){
      emailDic[user.Email]=user.id;
    } 
  }
  return emailDic;
}
function generateAmoIDPhoneDictionary(amousers){
  let phoneDic= new Object();
  for(let user of amousers){
    if(user.Phone){
      var phone=user.Phone.replace(/[- +]/g,'')
      var lastSix = phone.substr(phone.length - 6);
      phoneDic[lastSix]=user.id;
      } 
  }
  return phoneDic;
}
function generateAmoPhoneDictionary(amousers){
  let phoneDic= new Object();
  for(let user of amousers){
    if(user.Phone){
      var phone=user.Phone.replace(/[- +]/g,'')
      var lastSix = phone.substr(phone.length - 6);
      phoneDic[lastSix]=user.Link;
      } 
  }
  return phoneDic;
}
function generateAmoPhoneSet(amousers){
let usersSet= new Set();
for(let user of amousers){
  if(user.Phone){
  var phone=user.Phone.replace(/[- +]/g,'')
  var lastSix = phone.substr(phone.length - 6);
  usersSet.add(lastSix);
  }
}
return usersSet;
}
function  removeDoliDuplicate(users){
  if(users.length==0){
    return users;
  }else{
  const filteredData = users.reduce((acc, current) => {
      
      const x = acc.find(item => doliContactIsPresent(current, item));
      const index = acc.findIndex(item => doliContactIsPresent(current, item));
      
        if (!x) {
          return acc.concat([current]);
        } else {
            acc[index]=returnDoliContactWithMoreInfo(current,x);
          return acc;
        }
  }, []);
  return filteredData;
  }
}
async function getNewToAmo(callBack){
  var start = new Date()
  
  amoRepo.getAll().then(amoData=>{
     
      const filteredAmoData=amoData.filter(contact=>{return(amoContactIsValid(contact))}) ;
      //console.log("filtred", filteredAmoData)
    

    let users=[];
        doliRepo.getAll().then(doliData=>{
          const filterDoliData=doliData.filter(filterDoliContacts);
       
          let amoEmailSet=generateAmoEmailSet(filteredAmoData);
          let amoPhoneSet= generateAmoPhoneSet(filteredAmoData);    
        
            // console.log(amoEmailSet);
            // console.log(amoPhoneSet);
            let foundContact=false;
          for( let contact of filterDoliData){
            
            foundContact=doliUserIsInAmo(amoEmailSet, amoPhoneSet, contact)
              if(!foundContact){
                  if(contact.email=='@')
                    contact.email='';
                  users.push(contact)
              }
              
          }
          let usersWithOutDup=removeDoliDuplicate(users)
          //console.log("Time to find new users: %dms",new Date() - start );
          const dif=new Date() - start;
          logger.info("Time to find new users to amo in miliseconds: "+ dif)
          callBack(usersWithOutDup);
        })
  })
}
module.exports.exportNewToAmo= async function exportNewToAmo(callback){

  getNewToAmo((rows)=>{
    const data= rows.map(value=>{
      value.id=value.id.toString();
      return value;
    })
    const fileName='newUserstoAmo';
     exportExcel(Object.keys(data[0]), data, fileName,
        ()=>{
        const file = __dirname +'/../'+fileName+'.xlsx'
        callback(null,file)})
  }).catch(error=>{
        callback(error);
  })    
}
module.exports.updateAmoToken=updateAmoToken;
module.exports.updatePrestaData=updatePrestaData;
module.exports.updateDoliContacts=updateDoliContacts;
module.exports.updateAmoContacts=updateAmoContacts;
//module.exports.updateDoliUsersInRedis=updateDoliUsersInRedis;
module.exports.addNewContactsToDoli=addNewContactsToDoli;
module.exports.getNewUsers=getNewUsers;
module.exports.getCommonDoliUsers=getCommonDoliUsers;
module.exports.getNewToAmo=getNewToAmo;