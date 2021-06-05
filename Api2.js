const axios = require('axios');
var parseString = require('xml2js').parseString;

//const TOKEN='MEBI4PG5WJH4PTF2YZQ32C56X4V4X8WH';
//const URL='http://'+TOKEN+'@localhost:5000/jorgeStore2/api/';

var users=[];


async function getCustomerdata(url,id){
   await axios.get(url+'customers/'+id)
    .then(async function (response) {
        
        
      await parseString(response.data,  { explicitArray: false,
            trim: true }, function (err, result) {

            if (err) {
                throw err
               }
               let userInfo=JSON.parse(JSON.stringify(result)).prestashop.customer;
               //console.log('userifnfo: ', userInfo)
               let newUser={'id':id, 'name':userInfo.firstname,'lastName':userInfo.lastname,'email':userInfo.email ,'dateAdded':userInfo.date_add, 'dateUpdated':userInfo.date_upd,
                        'products':[]}
               //console.log("new user:", newUser)
               users.push(newUser);
               //console.log('users:', users)
               console.log("adding customer: ",id )
          
        });
      
    })
    .catch(error => {
      console.log(error);
    });

}

async function getOrderById(url,id){
  

    await axios.get(url+'orders/'+id)
   .then( async function (response) {
       
   
       
       await parseString(response.data,  { explicitArray: false,
           trim: true },  function (err, result) {
        

           if (err) {
               throw err
              }
              let order=  JSON.parse(JSON.stringify(result)).prestashop.order;
             
              let products=order.associations.order_rows.order_row;

             
              const indice= users.findIndex(user=>user.id==order.id_customer._)
              
             if(Array.isArray(products)){ 

                for (let product of products){
                
                  users[indice].products.push(product.product_name)

                }
             }else{
                 users[indice].products.push(products.product_name)
              }
              //console.log("products:",users[indice].products)
              console.log('adding order :', id)
         
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

async function getOrders(url){
  //let orderPromisese=[];
  await axios.get(url+'orders/')
  .then( function (response) {
   
      
     parseString(response.data,  { explicitArray: false,
          trim: true },async function (err, result) {

          if (err) {
              throw err
             }
            
             
             let orders=JSON.parse(JSON.stringify(result)).prestashop.orders.order;
            

             for (let order of orders){
            
              

              await getOrderById(url, order.$.id)
             //orderPromisese.push(await getOrderById(url, order.$.id))
          
          }
          //await Promise.all(orderPromisese)
          

            //console.log('users:', users)
      });
    
  })
  .catch(error => {
    console.log(error);
  });




}

async function getCustomerAddress(url,id){
    await axios.get(url+'addresses/'+id)
     .then(async  function (response) {
      console.log("adding address: ",id )
         
       await parseString(response.data,  { explicitArray: false,
             trim: true },function (err, result) {
             
             if (err) {
                 throw err
                }
                let addressInfo=JSON.parse(JSON.stringify(result)).prestashop.address;
        
                
                const indice=users.findIndex(user=>user.id==addressInfo.id_customer._)
                if(indice!=undefined){
                  if(!('address' in users[indice])){
                    users[indice].city=addressInfo.city;
                    users[indice].address=addressInfo.address1;
                    users[indice].postcode=addressInfo.postcode;
                    users[indice].phone=addressInfo.phone;
                    users[indice].mobilePhone=addressInfo.phone_mobile;
                  }else{
                    console.log("addres already added");
                  }
                }

                //console.log('users:', users)

                return true;
                
         });
       
     })
     .catch(error => {
       console.log(error);
     });
 
 }


 async function getAllCustomerAddress(url){
  let promiseAddresses=[];
  await axios.get(url+'addresses/')
   .then(async function (response) {
       
  
       
     await parseString(response.data,  { explicitArray: false,
           trim: true },async function (err, result) {

           if (err) {
               throw err
              }
              let addresses=JSON.parse(JSON.stringify(result)).prestashop.addresses.address;
           
              for (let address of addresses){
              
              //promiseAddresses.push(await getCustomerAddress(url, address.$.id))
                const data=await getCustomerAddress(url, address.$.id)
           
           }
             

              //console.log('users:', users)
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

 async function getData(url,token ){

  const URL='http://'+token+'@'+url+'/api/';
  console.log("url to use: ", URL);

    await axios.get(URL+'customers')
    .then(response => {
  
        parseString(response.data,  { explicitArray: false,
            trim: true },async function (err, result) {

            if (err) {
                throw err
               }
               let customers=JSON.parse(JSON.stringify(result)).prestashop.customers.customer;

               for (let customer of customers){
              
                  await getCustomerdata(URL, customer.$.id)
               
               }
              await getAllCustomerAddress(URL);
               
              await getOrders(URL);
                
                
               
                //console.log("finish addind data: ")
                //console.log('users:', users)
                //return users;
              

        });
      
    })
    .catch(error => {
      console.log(error);
    });

}






module.exports.getData=getData;
module.exports.users=users;

