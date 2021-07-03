const express = require("express");
const routes = express.Router();


const { auth, requiresAuth } = require("express-openid-connect");



const api=require('../Api/ApiPresta');


const AppDAO = require('../database/dao')
const ConectionRepository = require('../database/conectionsRepository')
const AmoConectionRepository = require('../database/amoConectionsRepository')
const UsersRepository = require('../database/usersRepository');
const OrdersRepository= require('../database/ordersRepository');
const AddressRepository= require('../database/addressRepository');
const AmoUsersRepository = require ('../database/amoUsersRepository')
const DoliUsersRepository = require ('../database/doliUsersRepository')

const {getContacts,getAccessToken, refreshAccessToken}= require('../Api/ApiAmo');



const {exportExcel, filterContactData} = require('../utils/utils');

const {updateAmoToken, updatePrestaData, updateDoliContacts, updateAmoContacts, addNewContactsToDoli , getNewUsers,getCommonDoliUsers}=require('../model/DBupdater')

const redis = require("redis");
const client = redis.createClient();

client.on("error", function(error) {
  console.error(error);
});





const dao = new AppDAO('./database/database.sqlite3')

const conectionRepo = new ConectionRepository(dao)
const amoconectionRepo = new AmoConectionRepository(dao)
const userRepo= new UsersRepository(dao);
const orderRepo= new OrdersRepository(dao);
const addressRepo= new AddressRepository(dao);
const amoRepo= new AmoUsersRepository(dao);
const doliRepo= new DoliUsersRepository(dao);

/* Intervalo de actualizacion cada una hora */
const INTERVALODEACTUALIZACION=3600000;
setInterval(updatePrestaData, INTERVALODEACTUALIZACION);

setInterval(updateDoliContacts, INTERVALODEACTUALIZACION + 30000);
setInterval(updateAmoContacts, INTERVALODEACTUALIZACION + 60000);


/* Intervalo de actualiacion del token cada 8 horas y media */
const INTERVALODEACTUALIZACIONTOKEN=30600000;
setInterval(updateAmoToken, INTERVALODEACTUALIZACIONTOKEN);





// req.isAuthenticated is provided from the auth router
routes.get("/", requiresAuth(),(req,res)=>{
    // routes.get("/",(req,res)=>{
    res.render('home')
    // res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
  });
  
  routes.get('/profile', requiresAuth(),(req,res)=>{
      res.send(JSON.stringify(req.oidc.user))
  })
  
  routes.post('/connections', requiresAuth(),(req,res)=>{
    console.log("body: ", req.body)
  
  
    if((req.body.tag=="") || (req.body.url=="" )|| (req.body.token=="" )){
      console.log("errorr!!")
      conectionRepo.getAll().then((rows)=>{
        console.log("conections: ", rows);
        res.render('conections', {conections:rows,  message: {type:'error', text:'Por favor complete todos los campos'}});
      })
    
    }else{
      var newConection={
        tag: req.body.tag,
        url:req.body.url,
        token:req.body.token
      }
      conectionRepo.insert(newConection.tag, newConection.url, newConection.token)
      .then((data)=>{
        console.log(data)
        conectionRepo.getAll().then((rows)=>{
          console.log("conections: ", rows);
          res.render('conections', {conections:rows,  message: {type:'success', text:'Coneccion agregada con exito'}});
        })
        })
        
      .catch(err=>{
        conectionRepo.getAll().then((rows)=>{
          console.log("coections: ", rows);
          res.render('conections', {conections:rows,  message: {type:'error', text:err}});
        })
      })
      
    }
  
  })
  
  routes.get('/refreshamotoken', requiresAuth(),(req,res)=>{
  
        updateAmoToken();
    })
      
    
  
  
  routes.post('/amoconnections', requiresAuth(),(req,res)=>{
    console.log("body: ", req.body)
  
  
    if((req.body.claveSecreta=="") || (req.body.url=="" )|| (req.body.code=="" )|| (req.body.id=="" )){
  
      conectionRepo.getAll().then((rows)=>{
      
        res.render('amoconections', {conections:rows,  message: {type:'error', text:'Por favor complete todos los campos'}});
      })
    
    }else{
      console.log(req.body.url)
      console.log(req.body.id)
      
      console.log(req.body.claveSecreta)
      console.log(req.body.code)
      
      
      getAccessToken(req.body.url,req.body.id,req.body.claveSecreta,req.body.code)
    .then(data=>{
      console.log("datos:", data)
      if(data.access_token){
        
  
        var newConection={
          accessToken: data.access_token,
          url:req.body.url,
          clientId:req.body.id,
          clientSecret:req.body.claveSecreta,
          refreshToken:data.refresh_token
        }
  
        amoconectionRepo.insert(newConection)
        .then((data)=>{
          console.log(data)
          amoconectionRepo.getAll().then((rows)=>{
          
            res.render('amoconections', {conections:rows,  message: {type:'success', text:'Coneccion agregada con exito'}});
          })
          })
          
        .catch(err=>{
          amoconectionRepo.getAll().then((rows)=>{
            console.log("conections: ", rows);
            res.render('amoconections', {conections:rows,  message: {type:'error', text:err}});
          })
        })
  
      }else{
        amoconectionRepo.getAll().then((rows)=>{
          console.log("conections: ", rows);
          res.render('amoconections', {conections:rows,  message: {type:'error', text:"Error al conectarse"}});
        })
      }
      
    })
  
      
      
    }
  
  })
  
  routes.get('/connections/delete/:id', requiresAuth(),(req,res)=>{
    console.log(req.params.id)
    conectionRepo.delete(req.params.id);
   
    res.redirect('/connections');
  
  
  })
  routes.get('/amoconnections/delete', requiresAuth(),(req,res)=>{
    console.log(req.query.id)
    amoconectionRepo.delete(req.query.id);
   
    res.redirect('/amoconnections');
  
  
  })
  
  routes.get('/connections', requiresAuth(),(req,res)=>{
    conectionRepo.getAll().then((rows)=>{
      console.log("conections: ", rows);
      res.render('conections', {conections:rows,message:null})
    })
  })
  routes.get('/amoconnections', requiresAuth(),(req,res)=>{
    amoconectionRepo.getAll().then((rows)=>{
      console.log("amoconections: ", rows);
      res.render('amoconections', {conections:rows,message:null})
    })
  })
  
  routes.get('/customers', requiresAuth(),async (req,res)=>{
   
  
   
  
    conectionRepo.getAll().then((rows)=>{
  
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
    }
      )
  
    //res.send(JSON.stringify(req.oidc.user))
  })
  routes.get('/addresses', requiresAuth(),async (req,res)=>{
   
  
   addressRepo.getAll().then((rows)=>{
  
  
    res.render('addresses', {addresses:rows})
  
   })
    .catch(err=>{
      console.log(err);
    }
    )
  
  
  })
  routes.get('/orders', requiresAuth(),async (req,res)=>{
   
  
    orderRepo.getAll().then((rows)=>{
   
   
     res.render('orders', {orders:rows})
   
    })
     .catch(err=>{
       console.log(err);
     }
     )
   
   
   })
  routes.get('/users', requiresAuth(),(req,res)=>{
  
    //const sql= 'SELECT * from users u INNER JOIN addresses a on u.id=a.id_customer';
    const sql= 'SELECT u.tag ,u.id, u.name, u.lastName, u.email, u.dateAdded, u.dateUpdated, a.phone, a.cellPhone, a.address, a.postCode,a.city,  GROUP_CONCAT(DISTINCT o.products) products , sum(o.total_paid) as total from users u INNER JOIN orders o on u.id=o.id_customer and u.tag=o.tag INNER JOIN addresses a on u.id=a.id_customer and u.tag=a.tag GROUP BY u.id,u.tag ORDER BY u.id,u.tag';
  
    const data=dao.all(sql);
    // console.log("data", data)
    data.then(rows=>{
      //console.log("data", rows)
      let data= rows.map((el)=>{
        const arr=el.products.split("\n");
        //console.log("productos:", [...new Set(arr)])
        el.products=[...new Set(arr)];
        return el;
      
      })
      data.sort((a,b)=>{
  
        return (a.id-b.id)
      })
      //console.log("data", data)
      
      res.render('users', {users:data})
  
    })
  
  })
  
  
  let amoContactData=[];
  routes.get('/getamocontacts', requiresAuth(),(req,res)=>{

        updateAmoContacts();  
  
  })
  
  routes.get('/getdolicontacts', requiresAuth(),(req,res)=>{
    updateDoliContacts(()=>{
      console.log("doli users updated");
    });
  })
  
  
  
  routes.get('/amocontacts', requiresAuth(),(req,res)=>{
  
    const KEY="amousers";
  
    return client.get(KEY, (err, data)=>{
      if(data){
        console.log('fetching data from cache-----');
        return  res.render('amoContacts', {users: JSON.parse(data)})
  
      }else{
      amoRepo.getAll().then(rows=>{
      client.setex(KEY,3600,JSON.stringify(rows))
      res.render('amoContacts', {users:rows})
  
    })
  
  }
  })
  
  })
  
  
  routes.get('/dolicontacts', requiresAuth(),(req,res)=>{
  
    const KEY="doliusers";
  
    return client.get(KEY, (err, data)=>{
      if(data){
        console.log('fetching data from cache-----');
        return  res.render('doliContacts', {users: JSON.parse(data)})
      }else{
        doliRepo.getAll().then(rows=>{
          client.setex(KEY,3600,JSON.stringify(rows))
          res.render('doliContacts', {users:rows})
      
        })
      }
    })
   
  })
  
  routes.get('/combined', requiresAuth(),(req,res)=>{
  
  const combinedUsers='combined'
    return client.get(combinedUsers,(err, combinedusers)=>{
    
    if (combinedusers) {
      console.log('fetching data from cache-----');
      return res.render('combined', {users:JSON.parse(combinedusers)})
       
      }else{
    
  
    var prestaUsers=[];
  
    amoRepo.getAll().then(amorows=>{
        const sql= 'SELECT u.tag ,u.id, u.name, u.lastName, u.email, u.dateAdded, u.dateUpdated, a.phone, a.cellPhone, a.address, a.postCode,a.city,  GROUP_CONCAT(DISTINCT o.products) products , sum(o.total_paid) as total from users u INNER JOIN orders o on u.id=o.id_customer and u.tag=o.tag INNER JOIN addresses a on u.id=a.id_customer and u.tag=a.tag GROUP BY u.id,u.tag ORDER BY u.id,u.tag';
  
        const data=dao.all(sql);
        // console.log("data", data)
        data.then(rows=>{
          //console.log("data", rows)
          let data= rows.map((el)=>{
            const arr=el.products.split("\n");
            //console.log("productos:", [...new Set(arr)])
            el.products=[...new Set(arr)];
            return el;
          
          })
          data.sort((a,b)=>{
      
            return (a.id-b.id)
          })
          //console.log("data", data)
          prestaUsers=data;
  
  
      const filtered=amorows.filter(contact=>contact.Email!=null || contact.Phone!=null)
      const filtered2=filtered.filter(contact=>{
  
  
      for(let i=0; i<prestaUsers.length;i++){
        if(contact.Email){
          if(contact.Email==prestaUsers[i].email){
            contact.name=prestaUsers[i].name  +" "+ prestaUsers[i].lastName;
            contact.first_name=prestaUsers[i].name;
            contact.last_name=prestaUsers[i].lastName;
            contact.DIRECCION=prestaUsers[i].address;
            contact.COD_POSTAL=prestaUsers[i].postCode;
            contact.CIUDAD=prestaUsers[i].city;
            contact.PRODUCTOS_COMPRADOS=prestaUsers[i].products;
            if(!contact.Phone){
              contact.Phone=prestaUsers[i].phone;
            }
            return true;
          }
        }else
          if((contact.Phone)&&(prestaUsers[i].phone)){
            var phone=prestaUsers[i].phone
            let re = new RegExp(phone.replace('+',''));
            //console.log("regular expresion:", re)
            if(re.test(contact.Phone)){
              contact.name=prestaUsers[i].name  +" "+ prestaUsers[i].lastName;
              contact.Email=prestaUsers[i].email;
              contact.first_name=prestaUsers[i].name;
              contact.last_name=prestaUsers[i].lastName;
              contact.DIRECCION=prestaUsers[i].address;
              contact.COD_POSTAL=prestaUsers[i].postCode;
              contact.CIUDAD=prestaUsers[i].city;
              contact.PRODUCTOS_COMPRADOS=prestaUsers[i].products;
              return true;
            }
  
          
        }
  
      }
      return false;
    })
    client.setex(combinedUsers, 3600, JSON.stringify(filtered2))
  
      res.render('combined', {users:filtered2})
  
  
    })
  })
  }
  })
  })
  
  routes.get('/combinedDoli', requiresAuth(),(req,res)=>{

    getCommonDoliUsers((common)=>{
      //console.log("new users ",common)
      res.status(200);
      res.render('combinedDoli', {users:common})

    })

  
      }
  )
  
  routes.get('/newUsers', requiresAuth(),(req,res)=>{
    /* pasing a callback */
    updateDoliContacts(()=>{
        updateAmoContacts(()=>{
            getNewUsers((newusers)=>{
              //console.log("new users ",newusers);
              res.status(200);
              res.render('newUsers', {users:newusers});
            })
        
        })
    })
  })

  routes.get('/addnewUsersToDoli', requiresAuth(),(req,res)=>{
  
    console.log("adding!!!")
    updateDoliContacts(()=>{
      addNewContactsToDoli(()=>{
        console.log("users correctry updated");
        res.status(200);
        setTimeout(()=>{
          res.redirect('/newusers')}
          , 2000);
      })
    

    });
 
  
    }
  )
  
  
  routes.get('/contacts', requiresAuth(),(req,res)=>{
  
    const userKey='contacts'
    return client.get(userKey,(err, data)=>{
    
    if (data) {
      console.log('fetching data from cache-----');
      return  res.json({users:data});
       
      }else{
  
    //const sql= 'SELECT * from users u INNER JOIN addresses a on u.id=a.id_customer';
    const sql= 'SELECT u.tag ,u.id, u.name, u.lastName, u.email, u.dateAdded, u.dateUpdated, a.phone, a.cellPhone, a.address, a.postCode,a.city,  GROUP_CONCAT(DISTINCT o.products) products , sum(o.total_paid) as total from users u INNER JOIN orders o on u.id=o.id_customer and u.tag=o.tag INNER JOIN addresses a on u.id=a.id_customer and u.tag=a.tag GROUP BY u.id,u.tag ORDER BY u.id,u.tag';
  
    const data=dao.all(sql);
    // console.log("data", data)
    data.then(rows=>{
      //console.log("data", rows)
      let data= rows.map((el)=>{
        const arr=el.products.split("\n");
        //console.log("productos:", [...new Set(arr)])
        el.products=[...new Set(arr)];
        return el;
      
      })
      data.sort((a,b)=>{
  
        return (a.id-b.id)
      })
      //console.log("data", data)
      client.setex(userKey, 3600, JSON.stringify(data))
      client.setex(userKey,3600, JSON.stringify(data))
      res.json({users:data})
  
    })
  }
  })
  
  })
  
  
  routes.get('/export', requiresAuth(),(req,res)=>{
    //const sql= 'SELECT u.tag ,u.id, u.name AS NOMBRE, u.lastName AS APELLIDO, u.email, u.dateAdded, u.dateUpdated, a.phone AS TELÉFONO, a.cellPhone, a.address AS DIRECCIÓN, a.postCode AS COD_POSTAL,a.city AS  CIUDAD ,  GROUP_CONCAT(DISTINCT o.products) products AS PRODUCTOS , sum(o.total_paid) as total from users u INNER JOIN orders o on u.id=o.id_customer and u.tag=o.tag INNER JOIN addresses a on u.id=a.id_customer and u.tag=a.tag GROUP BY u.id,u.tag';
    const sql= 'SELECT u.tag ,u.id, u.name  NOMBRE, u.lastName  APELLIDO, u.email  CORREO, a.phone  TELEFONO,  a.address  DIRECCION, a.postCode  COD_POSTAL,a.city   CIUDAD ,  GROUP_CONCAT(DISTINCT o.products) PRODUCTOS_COMPRADOS  from users u INNER JOIN orders o on u.id=o.id_customer and u.tag=o.tag INNER JOIN addresses a on u.id=a.id_customer and u.tag=a.tag GROUP BY u.id,u.tag';
    const data=dao.all(sql);
  
   data.then(rows=>{
    let data= rows.map((el)=>{
      const arr=el.PRODUCTOS_COMPRADOS .split("\n");
      //console.log("productos:", [...new Set(arr)])
      el.PRODUCTOS_COMPRADOS =[...new Set(arr)];
      // el.total=el.total.toString()
      return el;
    
    })
  
  
     //console.log("headers:",Object.keys(rows[0]));
     const fileName='users'
     exportExcel(Object.keys(data[0]), data, 'users')
     setTimeout(() => {
      const file = __dirname +'/../'+fileName+'.xlsx'
      res.download(file)
     }, 2000);
     
    })
  
    
  })
  
  routes.get('/exportamo', requiresAuth(),(req,res)=>{
  
  
   amoRepo.getAll().then(rows=>{
  
    const data= rows.map(value=>{
      value.id=value.id.toString();
      return value;
    })
   
     const fileName='AmoUsers'
     exportExcel(Object.keys(data[0]), data, fileName)
     setTimeout(() => {
      const file =__dirname +'/../'+fileName+'.xlsx';
      res.download(file)
     }, 2000);
     
    })
  
    
  })
  
  
  routes.get('/exportdoli', requiresAuth(),(req,res)=>{
  
  
    doliRepo.getAll().then(rows=>{
   
     const data= rows.map(value=>{
       value.id=value.id.toString();
       return value;
     })
    
      const fileName='doliUsers'
      exportExcel(Object.keys(data[0]), data, fileName)
      setTimeout(() => {
       const file = __dirname +'/../'+fileName+'.xlsx';
       res.download(file)
      }, 2000);
      
     })
   
     
   })
  
  
  routes.get('/exportcombined', requiresAuth(),(req,res)=>{
  
    var prestaUsers=[];
  
    amoRepo.getAll().then(amorows=>{
        const sql= 'SELECT u.tag ,u.id, u.name, u.lastName, u.email, u.dateAdded, u.dateUpdated, a.phone, a.cellPhone, a.address, a.postCode,a.city,  GROUP_CONCAT(DISTINCT o.products) products , sum(o.total_paid) as total from users u INNER JOIN orders o on u.id=o.id_customer and u.tag=o.tag INNER JOIN addresses a on u.id=a.id_customer and u.tag=a.tag GROUP BY u.id,u.tag ORDER BY u.id,u.tag';
  
        const data=dao.all(sql);
        // console.log("data", data)
        data.then(rows=>{
          //console.log("data", rows)
          let data= rows.map((el)=>{
            const arr=el.products.split("\n");
            //console.log("productos:", [...new Set(arr)])
            el.products=[...new Set(arr)];
            return el;
          
          })
          data.sort((a,b)=>{
      
            return (a.id-b.id)
          })
          //console.log("data", data)
          prestaUsers=data;
  
  
      const filtered=amorows.filter(contact=>contact.Email!=null || contact.Phone!=null)
      const filtered2=filtered.filter(contact=>{
  
  
      for(let i=0; i<prestaUsers.length;i++){
        if(contact.Email){
          if(contact.Email==prestaUsers[i].email){
            contact.name=prestaUsers[i].name  +" "+ prestaUsers[i].lastName;
            contact.first_name=prestaUsers[i].name;
            contact.last_name=prestaUsers[i].lastName;
            contact.DIRECCION=prestaUsers[i].address;
            contact.COD_POSTAL=prestaUsers[i].postCode;
            contact.CIUDAD=prestaUsers[i].city;
            contact.PRODUCTOS_COMPRADOS=prestaUsers[i].products;
            if(!contact.Phone){
              contact.Phone=prestaUsers[i].phone;
            }
            return true;
          }
        }else
          if((contact.Phone)&&(prestaUsers[i].phone)){
            var phone=prestaUsers[i].phone
            let re = new RegExp(phone.replace('+',''));
            //console.log("regular expresion:", re)
            if(re.test(contact.Phone)){
              contact.name=prestaUsers[i].name  +" "+ prestaUsers[i].lastName;
              contact.Email=prestaUsers[i].email;
              contact.first_name=prestaUsers[i].name;
              contact.last_name=prestaUsers[i].lastName;
              contact.DIRECCION=prestaUsers[i].address;
              contact.COD_POSTAL=prestaUsers[i].postCode;
              contact.CIUDAD=prestaUsers[i].city;
              contact.PRODUCTOS_COMPRADOS=prestaUsers[i].products;
              return true;
            }
  
          
        }
  
      }
      return false;
    })
    const data2= filtered2.map(value=>{
      value.id=value.id.toString();
      return value;
    })
    const fileName='CombinedUsers'
    exportExcel(Object.keys(data2[0]), data2, fileName)
    setTimeout(() => {
     const file =__dirname +'/../'+fileName+'.xlsx';
     res.download(file)
    }, 2000);
  
  
    })
  })
  })
  
  
  routes.get('/exportcombinedDoli', requiresAuth(),(req,res)=>{
  
   
            
            amoRepo.getAll().then(amoData=>{
  
              const filteredAmoData=amoData.filter(contact=>contact.Email!=null || contact.Phone!=null);
  
                  doliRepo.getAll().then(doliData=>{
                    
                    // console.log("doli data:", doliData)
                    const filteredDoliData=doliData.filter(contact=>{
  
  
                      for(let user of filteredAmoData){
                        //console.log("amo data:", user)
                        if(user.Email){
                          if(contact.email==user.Email){
                    
                            if(!contact.phone){
                              contact.phone=user.Phone;
                            }
                            if(!contact.name){
                              contact.name=user.name;
                            }
                            if(!contact.firstName){
                              contact.firstName=user.first_name;
                            }
                            if(!contact.lastName){
                              contact.lastName=user.last_name;
                            }
                            return true;
                          }
                        }else
                          if((user.Phone)&&(contact.phone)){
                            var phone=user.Phone
                            let re = new RegExp(phone.replace('+',''));
                            //console.log("regular expresion:", re)
                            if(re.test(contact.phone)){
                              if(!contact.name){
                                contact.name=user.name;
                              }
                              if(!contact.firstName){
                                contact.firstName=user.first_name;
                              }
                              if(!contact.lastName){
                                contact.lastName=user.last_name;
                              }
                              return true;
                            }
                  
                          
                        }
                  
                      }
                      return false;
                    })
  
                     const data2= filteredDoliData.map(value=>{
                      value.id=value.id.toString();
                      return value;
                    })
                    const fileName='CombinedDoliUsers'
                    exportExcel(Object.keys(data2[0]), data2, fileName)
                    setTimeout(() => {
                     const file = __dirname +'/'+fileName+'.xlsx' 
                     res.download(file)
                    }, 2000);
        
                    
  
                  })
  
  
  
  
            })
        
          
          
        
      }
  )
  
  
  
  routes.get('/export', requiresAuth(),(req,res)=>{
  
    const TYPE='newusers'
      return client.get(TYPE,(err, users)=>{
      
        /* Primero busco los datos de la chache redis*/ 
          if (users) {
            console.log('fetching data from cache-----');
            return res.render('newUsers', {users:JSON.parse(users)})
             /*si no se encuentran los busco en las bases de datos*/
          }else{
            
            amoRepo.getAll().then(amoData=>{
  
              const filteredAmoData=amoData.filter(contact=>contact.Email!=null || contact.Phone!=null);
  
                  doliRepo.getAll().then(doliData=>{
                    
                    // console.log("doli data:", doliData)
                    const newUsers=filteredAmoData.filter(contact=>{
                      
  
                      for(let user of doliData){
                        //console.log("doli data:", user)
  
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
                    //console.log("user in both systems, :", filteredDoliData)
                    // client.setex(TYPE, 3600, JSON.stringify(filteredDoliData))
                     res.render('newUsers', {users:newUsers})
        
                    
  
                  })
  
            })
      
        
          }
        })
      }
  )
  
  
  routes.get('/exportnew', requiresAuth(),(req,res)=>{
 
        getNewUsers((newUsers)=>{
          const data2= newUsers.map(value=>{
            value.id=value.id.toString();
            return value;
          })
          const fileName='newUsers'
          exportExcel(Object.keys(data2[0]), data2, fileName)
          setTimeout(() => {
           const file = __dirname +'/../'+fileName+'.xlsx' 
           res.download(file)
          }, 2000);
          res.status(200);
        })
 
  })


module.exports = routes;