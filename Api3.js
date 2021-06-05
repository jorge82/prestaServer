const axios = require('axios');
var parseString = require('xml2js').parseString;
const AppDAO = require('./database/dao')
const UsersRepository = require('./database/usersRepository')




var users=[];
const dao = new AppDAO('./database/database.sqlite3')
const userRepo= new UsersRepository(dao);

async function getCustomerdata(url,id, tag){
   await axios.get(url+'customers/'+id)
    .then(async function (response) {
        
        
      await parseString(response.data,  { explicitArray: false,
            trim: true }, function (err, result) {

            if (err) {
                throw err
               }
               let userInfo=JSON.parse(JSON.stringify(result)).prestashop.customer;
               console.log("tryinf to insert user:", tag, id);
               let newUser={'tag':tag, 'id':id, 'name':userInfo.firstname,'lastName':userInfo.lastname,'email':userInfo.email, 'phone':"" ,'cellPhone':"", 'address':"" , 'postCode':"", 'city':"" , 'products':[] , 'dateAdded':userInfo.date_add, 'dateUpdated':userInfo.date_upd,
                        'products':[]}
        
            
               userRepo.insert(newUser);
               
          
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
           trim: true },  function (err, result) {
        

           if (err) {
               throw err
              }
              let order=  JSON.parse(JSON.stringify(result)).prestashop.order;
             
              let products=order.associations.order_rows.order_row;

              userRepo.getByID(tag, order.id_customer._).then((data)=>{
                let prod=data.products.split(',')
                //filtro cadenas vacias
                prod=prod.filter(elem=>elem)
                console.log("products:", prod)
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
                  userRepo.updateProducts(tag, order.id_customer._,prod)

                  
                }
                
              })
             

         
       });
     
   })
   .catch(error => {
     console.log(error);
   });

}

async function getOrders(url, tag){
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
              await getOrderById(url, order.$.id, tag)
          
          }
  
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
             trim: true },function (err, result) {
             
             if (err) {
                 throw err
                }
                let addressInfo=JSON.parse(JSON.stringify(result)).prestashop.address;
                

                userRepo.getByID(tag, addressInfo.id_customer._).then((data)=>{
              
                    if (data!=undefined){
                    if(data.address==''){
                        var userInfo=data;
                        userInfo.city=addressInfo.city;
                        userInfo.address=addressInfo.address1;
                        userInfo.postCode=addressInfo.postcode;
                        userInfo.phone=addressInfo.phone;
                        userInfo.cellPhone=addressInfo.phone_mobile;
                        userRepo.update(userInfo);

                    }
                    }
                })
                
                
         });
       
     })
     .catch(error => {
       console.log(error);
     });
 
 }


 async function getAllCustomerAddress(url,tag){
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
              
           
                await getCustomerAddress(url, address.$.id,tag)
                
           }
             

         
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
                   await getAllCustomerAddress(URL,tag);
               
                   await getOrders(URL,tag);
                
                
            
            });
           
        });
      
    })
    .catch(error => {
      console.log(error);
    });

}






module.exports.getData=getData;
module.exports.users=users;

