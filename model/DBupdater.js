
const AppDAO = require('../database/dao')
const ConectionRepository = require('../database/conectionsRepository')
const AmoConectionRepository = require('../database/amoConectionsRepository')
const UsersRepository = require('../database/usersRepository');
const OrdersRepository= require('../database/ordersRepository');
const AddressRepository= require('../database/addressRepository');
const AmoUsersRepository = require ('../database/amoUsersRepository')
const DoliUsersRepository = require ('../database/doliUsersRepository')

const {getContacts,getAccessToken, refreshAccessToken}= require('../Api/ApiAmo');

const {getContactsFromDoli,addContatToDoli}= require('../Api/ApiDoli')


const {exportExcel, filterContactData} = require('../utils/utils');

const dao = new AppDAO('./database/database.sqlite3')

const conectionRepo = new ConectionRepository(dao)
const amoconectionRepo = new AmoConectionRepository(dao)
const userRepo= new UsersRepository(dao);
const orderRepo= new OrdersRepository(dao);
const addressRepo= new AddressRepository(dao);
const amoRepo= new AmoUsersRepository(dao);
const doliRepo= new DoliUsersRepository(dao);


const redis = require("redis");
const client = redis.createClient();

client.on("error", function(error) {
  console.error(error);
});


async function insertAmoConmnection(newconection, callback){

  //const data= await getAccessToken(url,id,body.claveSecreta,code); 

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
      client.get(KEY, (err, data)=>{
          if(data){
            callback(null, JSON.parse(data));
          }else{
            amoRepo.getAll().then(rows=>{
              client.setex(KEY,3600,JSON.stringify(rows))
              callback(null, rows);
            })
            .catch((error)=>{
              callback(error);
            });
        }
      });
  }catch(error){
     callback(error);
  }
}
module.exports.getDoliUsers= async function getDoliUsers(callback){

  try{
    const KEY="doliusers";
  
    return client.get(KEY, (err, data)=>{
      if(data){
            callback(null, JSON.parse(data));
          }else{
            doliRepo.getAll().then(rows=>{
              client.setex(KEY,3600,JSON.stringify(rows))
              callback(null, rows);
            })
            .catch((error)=>{
              callback(error);
            });
        }
      });
  }catch(error){
     callback(error);
  }
}


module.exports.deleteAmoConnection= async function deleteAmoConnection(id, callback){
   try{
     const response = await amoconectionRepo.delete(id);
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

    try{
      const rows= await amoconectionRepo.getAll();
      if (rows.length>0){
          try{
            data=rows[0];
            const info= await refreshAccessToken(data.url,data.clientId, data.clientSecret,data.refreshToken);
            const update= await amoconectionRepo.update(data.url, info.access_token, info.refresh_token);
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

    const URLDoli='dbarg.doli.ar/htdocs';
    const TOKENDoli="fp8x6y95";
    const TAGDoli="Doli"

    console.log("Fetching doli contacts!!")
  try{
    doliRepo.getAll().then(rows=>{
        datos_actuales=rows;
        
        getContactsFromDoli(URLDoli, TOKENDoli, TAGDoli).then((data)=>{
       
            console.log("In total there are :",data.length, " contacts")
        
            data.map((contact, index)=>{
        
                let contactInfo= {id:contact.id ,name: contact.name, firstName:contact.firstname , lastName:contact.lastname , email:contact.email, address:contact.address, zip:contact.zip, city:contact.town, country:contact.country, phone:contact.phone  }
        
                let found= datos_actuales.some(el=> el.id==contactInfo.id)
                    if(!found){
                    //console.log("pushing:", contactInfo)
                        doliRepo.insert(contactInfo);
                    }
     
            })
              updateDoliUsersInRedis()
              callback(null);
            
         }).catch((error)=>{
            callback(error);
        })
    })
    }catch(error){
      callback(error);
    }
}

function addNewContactsToDoli(callback){

    const URLDoli='dbarg.doli.ar/htdocs';
    const TOKENDoli="fp8x6y95";
    const TAGDoli="Doli"

    console.log("New doli contacts to fetch!!")

    getNewUsers((users)=>{

      console.log("# of users to add", users.length)
      let promises=[];
      //agrego usuarios;
      for (let i=0;i<10; i++){

        promises.push(addContatToDoli(URLDoli, TOKENDoli,users[i]));
      }
 

      Promise.all(promises).then(()=>{

        console.log("All updates where complited");
        callback();
      })
    })
}


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

function updateAmoContacts(callback){
    console.log("Updating amo contacts")
    try{
    let page=1;
    amoconectionRepo.getAll().then(rows=>{
      if(rows.length>0){
      
        getContacts(rows[0].url, rows[0].accessToken, page).then(data=>{
          amoRepo.getAll().then(rows=>{
            const datos_actuales=rows; 
            data.map((contact, index)=>{
              //console.log("tags", contact._embedded.tags);
              let allTags=[];
             
                for(let tag of contact._embedded.tags){
                  allTags.push(tag.name);
                }
                let contactInfo= {id:contact.id ,name: contact.name, first_name:contact.first_name , last_name:contact.last_name, Tags:allTags.join()}
                // console.log("custom fields:", contact.custom_fields_values)
                if(contact.custom_fields_values){
                    contact.custom_fields_values.map(custom=>{
                         contactInfo[custom.field_name]=custom.values[0].value;
                    })
                }
                let found= datos_actuales.some(el=> el.id==contactInfo.id)
                if(!found){
                    console.log("pushing:", contactInfo)
                    amoRepo.insert(contactInfo);
                }
          })
             updateAmoUsersInRedis();
             callback(null);
        })
        }).catch((error)=>{
          callback(error);
        })
      }else{
        console.log("no contacts!!");
        updateAmoUsersInRedis();
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

function contactIsPresent(target, contact){

  if((target.Email!=null && target.Email === contact.Email) || (comparePhones(target.Phone,contact.Phone))){
    return true;
  } else{
    return false;
  }

}


async function getNewUsers(callBack){

  amoRepo.getAll().then(amoData=>{
    const filteredAmoData=amoData.filter(contact=>contact.name.length>4 && (contact.Email!=null || contact.Phone!=null));
    const filteredAmoData2 = filteredAmoData.reduce((acc, current) => {
      //  const x = acc.find(item =>  (item.Email!=null && item.Email === current.Email) || 
      //                              comparePhones(item.Phone,current.Phone));
     const x = acc.find(item => contactIsPresent(current, item));
     const index = acc.findIndex(item => contactIsPresent(current, item));
     
      if (!x) {

        return acc.concat([current]);
      } else {
          //  console.log("encontrado", x ,"indece" , index)
          //  console.log("current", current )
          //  console.log("contact with more info:",returnContactWithMoreInfo(current,x));
           acc[index]=returnContactWithMoreInfo(current,x);
        
        return acc;
      }
    }, []);  
    
    let newUsers=[];
        doliRepo.getAll().then(doliData=>{
          for( let contact of filteredAmoData2){
              //console.log("user:", user)
              const foundContact=doliData.find(doliUSer=> { 
                if(contact.Email){
                
                  if( contact.Email==doliUSer.email){
                      return true;
                  }
                }
                return comparePhones(contact.Phone, doliUSer.phone);
              })
               //console.log("contact found", foundContact , "amo", contact)
              if(!foundContact){
                if(filterContactData(contact)){
                  newUsers.push(contact)
                }
              }
          }
          callBack(newUsers);
        })
  })
}

async function getCommonDoliUsers(callBack){

  amoRepo.getAll().then(amoData=>{
    const filteredAmoData=amoData.filter(contact=>contact.Email!=null || contact.Phone!=null);
    const filteredAmoData2 = filteredAmoData.reduce((acc, current) => {
      const x = acc.find(item => item.Email === current.Email);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);  
    
    let newUsers=[];
        doliRepo.getAll().then(doliData=>{
          for( let contact of doliData){
              //console.log("user:", user)
              const foundContact=filteredAmoData.find(amoUser=> { 
                if(contact.email){
                  if( contact.email==amoUser.Email){
                      return true;
                  }
                }
                 if((contact.phone)&&(amoUser.Phone)){

                          var phone=contact.phone.replace(/[- +]/g,'')
                          var phone2=amoUser.Phone.replace(/[- +]/g,'')

                          var lastSixAmo = phone.substr(phone.length - 6); 
                          var lastSixDoli = phone2.substr(phone2.length - 6); 
                   
                          if(lastSixAmo==lastSixDoli){    

                              console.log("Encontrado!!!:", contact, amoUser);
                              return true;
                          }else{
                              return false;
                          }
                  }else{
                      return false;
                  }
              })
               //console.log("contact found", foundContact , "amo", contact)
              if(foundContact){
                console.log("contact found", foundContact , "doli", contact)
                  newUsers.push(contact)
              }
          }
          callBack(newUsers);
        })
  })
}

module.exports.updateAmoToken=updateAmoToken;
module.exports.updatePrestaData=updatePrestaData;
module.exports.updateDoliContacts=updateDoliContacts;
module.exports.updateAmoContacts=updateAmoContacts;
module.exports.updateDoliUsersInRedis=updateDoliUsersInRedis;
module.exports.addNewContactsToDoli=addNewContactsToDoli;
module.exports.getNewUsers=getNewUsers;
module.exports.getCommonDoliUsers=getCommonDoliUsers;