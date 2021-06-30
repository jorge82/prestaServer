
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

module.exports.updateAmoToken=updateAmoToken;
module.exports.updatePrestaData=updatePrestaData;
module.exports.updateDoliContacts=updateDoliContacts;
module.exports.updateAmoContacts=updateAmoContacts;
module.exports.updateDoliUsersInRedis=updateDoliUsersInRedis;
module.exports.addNewContactsToDoli=addNewContactsToDoli;