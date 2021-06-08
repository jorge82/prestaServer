const axios = require('axios');
var parseString = require('xml2js').parseString;
const AppDAO = require('./database/dao');
const UsersRepository = require('./database/usersRepository');
const OrdersRepository= require('./database/ordersRepository');
const AddressRepository= require('./database/addressRepository');




const dao = new AppDAO('./database/database.sqlite3')
const userRepo= new UsersRepository(dao);
const orderRepo= new OrdersRepository(dao);
const addressRepo= new AddressRepository(dao);

async function getCustomerdata(url,id, tag){
   await axios.get(url+'customers/'+id)
    .then(async function (response) {
        
        
      await parseString(response.data,  { explicitArray: false,
            trim: true }, async function (err, result) {

            if (err) {
                throw err
               }
               let userInfo=JSON.parse(JSON.stringify(result)).prestashop.customer;
               console.log("tryinf to insert user:", tag, id);
              //  let newUser={'tag':tag, 'id':id, 'name':userInfo.firstname,'lastName':userInfo.lastname,'email':userInfo.email, 'phone':"" ,'cellPhone':"", 'address':"" , 'postCode':"", 'city':"" , 'products':[] , 'dateAdded':userInfo.date_add, 'dateUpdated':userInfo.date_upd,
              //           'products':[]}
        
              let newUser={'tag':tag, 'id':id, 'name':userInfo.firstname,'lastName':userInfo.lastname,'email':userInfo.email,  'dateAdded':userInfo.date_add, 'dateUpdated':userInfo.date_upd}
        
               await userRepo.insert(newUser);
               
          
        });
      
    })
    .catch(error => {
      console.log(error);
    });

}

async function getOrderById(url,id, tag){
  

    await axios.get(url+'orders/'+id)
   .then( async function (response) {
       
   
       
       await parseString(response.data,  { explicitArray: false,
           trim: true },  async function (err, result) {
        

           if (err) {
               throw err
              }
              let order=  JSON.parse(JSON.stringify(result)).prestashop.order;
             
              let products=order.associations.order_rows.order_row;

              let prod=[];
              if (products){
                if(Array.isArray(products)){ 

                    for (let product of products){
                      if(!prod.includes(product.product_name)){
                        prod.push(product.product_name);
                      }
    
                    }
                }else{
                  if(!prod.includes(products.product_name)){
                        prod.push(products.product_name);
                  }
                }
              }
              let newOrder={id:id, tag:tag, id_customer:order.id_customer._, products:prod, invoice_date:order.invoice_date, total_paid:order.total_paid};
              console.log("inserting order", newOrder);
              await orderRepo.insert(newOrder);
             

         
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

async function getOrders(url,token,  tag){
  const URL='http://'+token+'@'+url+'/api/';
  //let orderPromisese=[];
  await axios.get(URL+'orders/')
  .then( function (response) {
   
      
     parseString(response.data,  { explicitArray: false,
          trim: true },async function (err, result) {

          if (err) {
              throw err
             }
            
             
             let orders=JSON.parse(JSON.stringify(result)).prestashop.orders.order;
            
             orderRepo.getAll().then(async (rows)=>{

              let  datos_actuales=rows;
              
              for (let order of orders){
                let found=datos_actuales.some((el)=>(el.id==order.$.id)&&(el.tag==tag));
                if(!found){
                  await getOrderById(URL, order.$.id, tag)
                }
            
              }
           })
  
      });
    
  })
  .catch(error => {
    console.log(error);
  });




}

async function getCustomerAddress(url,id,tag){
    await axios.get(url+'addresses/'+id)
     .then(async  function (response) {
   
         
       await parseString(response.data,  { explicitArray: false,
             trim: true },async function (err, result) {
             
             if (err) {
                 throw err
                }
                let addressInfo=JSON.parse(JSON.stringify(result)).prestashop.address;
                
      
                let newAdress={'tag':tag, 'id':id, 'id_customer':addressInfo.id_customer._,  'phone':addressInfo.phone ,'cellPhone':addressInfo.phone_mobile, 'address':addressInfo.address1 , 'postCode':addressInfo.postcode, 'city':addressInfo.city };

                console.log("Inserting new Address: ", newAdress)
                await addressRepo.insert(newAdress);
                
                
         });
       
     })
     .catch(error => {
       console.log(error);
     });
 
 }


 async function getAllCustomerAddress(url,token, tag){
  let promiseAddresses=[];
  const URL='http://'+token+'@'+url+'/api/';
  await axios.get(URL+'addresses/')
   .then(async function (response) {
       
  
       
     await parseString(response.data,  { explicitArray: false,
           trim: true },async function (err, result) {

           if (err) {
               throw err
              }
              let addresses=JSON.parse(JSON.stringify(result)).prestashop.addresses.address;

              addressRepo.getAll().then(async (rows)=>{
                let  datos_actuales=rows;
           
              for (let address of addresses){
              
                const found = datos_actuales.some(el => ((el.id ==address.$.id) && (el.tag ==tag) ));
              
                if(!found){
                  await getCustomerAddress(URL, address.$.id,tag)
                }
                
                
            }

          });
             

         
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

 async function getData(url,token,tag ){

  const URL='http://'+token+'@'+url+'/api/';
 
  let datos_actuales=[]

    await axios.get(URL+'customers')
    .then(response => {
  
        parseString(response.data,  { explicitArray: false,
            trim: true },async function (err, result) {

            if (err) {
                throw err
               }
               let customers=JSON.parse(JSON.stringify(result)).prestashop.customers.customer;
               userRepo.getAll().then(async (rows)=>{
                datos_actuales=rows
        
             
               for (let customer of customers){
                  
                const found = datos_actuales.some(el => ((el.id ==customer.$.id) && (el.tag ==tag) ));
              
                    if(!found){
                      await getCustomerdata(URL, customer.$.id,tag)
                    }

               }
                  //  await getAllCustomerAddress(URL,tag);
               
                  //  await getOrders(URL,tag);
                
                
            
            });
           
        });
      
    })
    .catch(error => {
      console.log(error);
    });

}






module.exports.getData=getData;
module.exports.getAllCustomerAddress=getAllCustomerAddress;
module.exports.getOrders=getOrders;


