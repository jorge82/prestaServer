
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

function updateAmoToken(){

    amoconectionRepo.getAll().then((rows)=>{
        if(rows.length>0){
            let data=rows[0];
            console.log("data to refresh", data)
            refreshAccessToken(data.url,data.clientId, data.clientSecret,data.refreshToken).then(info=>{
                    amoconectionRepo.update(data.url, info.access_token, info.refresh_token)
            })
        }
      })
      .catch(e=>{
        console.log("Error: ", e)
      })
}

function updateDoliContacts(){

    const URLDoli='dbarg.doli.ar/htdocs';
    const TOKENDoli="fp8x6y95";
    const TAGDoli="Doli"

    console.log("Fetching doli contacts!!")
  
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
            //espero 5 segundos  y actualizo la cache
            const TIME=5000; 
            setTimeout(updateDoliUsersInRedis, TIME);
            
         })
    })

}

function addNewContactsToDoli(){

    const URLDoli='dbarg.doli.ar/htdocs';
    const TOKENDoli="fp8x6y95";
    const TAGDoli="Doli"

    console.log("Fetching doli contacts!!")
  
    amoRepo.getAll().then(amoData=>{
  
        const filteredAmoData=amoData.filter(contact=>contact.Email!=null || contact.Phone!=null);

            doliRepo.getAll().then(doliData=>{
              
              // console.log("doli data:", doliData)
              const newUsers=filteredAmoData.filter(contact=>{
                

                for(let user of doliData){
                  //console.log("doli data:", user)

                  if((contact.name=="atencion amo crm") ||(!isNaN(contact.name))){
                      return false;
                  }

                   if(contact.Email){
                    if(contact.Email==user.email)
                      console.log("Encontrado!!!:", contact);
                      return false;
                   } 
                   if((contact.Phone)&&(user.phone)){
                    var phone=contact.Phone
                    let re = new RegExp(phone.replace('+',''));
                    //console.log("regular expresion:", re)
                    if(re.test(user.phone)){
                      console.log("Encontrado!!!:", contact);
                      return false;
                    }
          
                  
                } 
                return true;
              }
            })
            
               addContatToDoli(URLDoli, TOKENDoli,newUsers[0]);
  
              

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

function updateAmoContacts(){
    console.log("Updating amo contacts")
    let page=1;
    amoconectionRepo.getAll().then(rows=>{
      if(rows.length>0){
      
        getContacts(rows[0].url, rows[0].accessToken, page).then(data=>{
          amoRepo.getAll().then(rows=>{
            const datos_actuales=rows;  
            data.map((contact, index)=>{
                let contactInfo= {id:contact.id ,name: contact.name, first_name:contact.first_name , last_name:contact.last_name }
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
           //espero 5 segundos  y actualizo la cache
           const TIME=5000; 
           setTimeout(updateAmoUsersInRedis, TIME);
        })
        })
      }
    })
}


async function getNewUsers(callBack){

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
          for( let contact of filteredAmoData){
              //console.log("user:", user)
              const foundContact=doliData.find(doliUSer=> { 
                if(contact.email){
                  if( contact.Email==doliUSer.email){
                      return true;
                  }
                }
                 if((contact.Phone)&&(doliUSer.phone)){

                          var phone=contact.Phone.replace(/[- +]/g,'')
                          var phone2=doliUSer.phone.replace(/[- +]/g,'')

                          var lastSixAmo = phone.substr(phone.length - 6); 
                          var lastSixDoli = phone2.substr(phone2.length - 6); 
                   
                          if(lastSixAmo==lastSixDoli){    

                              console.log("Encontrado!!!:", contact, doliUSer);
                              return true;
                          }else{
                              return false;
                          }
                  }else{
                      return false;
                  }
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