const axios = require('axios');
var parseString = require('xml2js').parseString;

const TOKEN='MEBI4PG5WJH4PTF2YZQ32C56X4V4X8WH';
const URL='http://'+TOKEN+'@localhost:5000/jorgeStore2/api/';

var users=[];


async function getCustomerdata(id){
   axios.get(URL+'customers/'+id)
    .then(async function (response) {
        
        //var cleanedString = response.toString().replace("\ufeff", "");
        
      await parseString(response.data,  { explicitArray: false,
            trim: true },function (err, result) {

            if (err) {
                throw err
               }
               let userInfo=JSON.parse(JSON.stringify(result)).prestashop.customer;
               console.log('userifnfo: ', userInfo)
               let newUser={'id':id, 'name':userInfo.firstname,'lastName':userInfo.lastname,'email':userInfo.email ,'dateAdded':userInfo.date_add, 'dateUpdated':userInfo.date_upd,
                        'products':[]}
               console.log("new user:", newUser)
               users.push(newUser);
               console.log('users:', users)
          
        });
      
    })
    .catch(error => {
      console.log(error);
    });

}

async function getOrderById(id){
  axios.get(URL+'orders/'+id)
   .then(async function (response) {
       
       //var cleanedString = response.toString().replace("\ufeff", "");
       
     await parseString(response.data,  { explicitArray: false,
           trim: true },function (err, result) {

           if (err) {
               throw err
              }
              let order=JSON.parse(JSON.stringify(result)).prestashop.order;
             
              let products=order.associations.order_rows.order_row;

              //console.log('order searched:', order)
              //console.log('products searched:', products)
              const indice=users.findIndex(user=>user.id==order.id_customer._)
              
             if(Array.isArray(products)){ 

             for (let product of products){
            
              users[indice].products.push(product.product_name)

           }
          }else{
            users[indice].products.push(products.product_name)
          }

          console.log('users:', users)
         
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

async function getOrders(){

  axios.get(URL+'orders/')
  .then(async function (response) {
      
      //var cleanedString = response.toString().replace("\ufeff", "");
      
    await parseString(response.data,  { explicitArray: false,
          trim: true },function (err, result) {

          if (err) {
              throw err
             }
             //console.log('respuesta: ',JSON.parse(JSON.stringify(result)).prestashop.orders.order)
             
             let orders=JSON.parse(JSON.stringify(result)).prestashop.orders.order;
            

             for (let order of orders){
            
    
               getOrderById(order.$.id)
          
          }
            
          

             console.log('users:', users)
      });
    
  })
  .catch(error => {
    console.log(error);
  });




}

async function getCustomerAddress(id){
    axios.get(URL+'addresses/'+id)
     .then(async function (response) {
         
         //var cleanedString = response.toString().replace("\ufeff", "");
         
       await parseString(response.data,  { explicitArray: false,
             trim: true },function (err, result) {
 
             if (err) {
                 throw err
                }
                let addressInfo=JSON.parse(JSON.stringify(result)).prestashop.address;
        
                
                const indice=users.findIndex(user=>user.id==addressInfo.id_customer._)
                if(!('address' in users[indice])){
                  users[indice].city=addressInfo.city;
                  users[indice].address=addressInfo.address1;
                  users[indice].postcode=addressInfo.postcode;
                  users[indice].phone=addressInfo.phone;
                  users[indice].mobilePhone=addressInfo.phone_mobile;
                }else{
                  console.log("addres already added");
                }

                console.log('users:', users)


                
         });
       
     })
     .catch(error => {
       console.log(error);
     });
 
 }


 async function getAllCustomerAddress(){
  axios.get(URL+'addresses/')
   .then(async function (response) {
       
       //var cleanedString = response.toString().replace("\ufeff", "");
       
     await parseString(response.data,  { explicitArray: false,
           trim: true },function (err, result) {

           if (err) {
               throw err
              }
              //console.log('respuesta: ',JSON.parse(JSON.stringify(result)).prestashop.addresses.address)
              let addresses=JSON.parse(JSON.stringify(result)).prestashop.addresses.address;
              //console.log('address: ', addresses)
              //let newUser={'id':id, 'name':userInfo.firstname,'lastName':userInfo.lastname,'email':userInfo.email ,'dateAdded':userInfo.date_add, 'dateUpdated':userInfo.date_upd}
              //console.log("new user:", newUser)
              //users.push(newUser);

              for (let address of addresses){
             
                getCustomerAddress(address.$.id)
           
           }
             


              console.log('users:', users)
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

 async function getData(endpoint){
    axios.get(URL+endpoint)
    .then(response => {
        //console.log("respuesta:", response.data);
        //var cleanedString = response.toString().replace("\ufeff", "");
        
        parseString(response.data,  { explicitArray: false,
            trim: true },async function (err, result) {

            if (err) {
                throw err
               }
               let customers=JSON.parse(JSON.stringify(result)).prestashop.customers.customer;

               for (let customer of customers){
                    //console.log(customer)
                    getCustomerdata(customer.$.id)
               
               }
               getAllCustomerAddress();
               getOrders();
              

        });
      
    })
    .catch(error => {
      console.log(error);
    });

}



module.exports.getData=getData;
module.exports.users=users;

