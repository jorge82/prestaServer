const express= require('express')
const { auth, requiresAuth } = require("express-openid-connect");
//const api=require('./Api');
//const Api2=require('./Api3');
const api=require('./Api4');
var bodyParser = require('body-parser')
const ExportExcel=require('./exportExcel');

const Promise = require('bluebird')
const AppDAO = require('./database/dao')
const ConectionRepository = require('./database/conectionsRepository')
const AmoConectionRepository = require('./database/amoConectionsRepository')
const UsersRepository = require('./database/usersRepository');
const OrdersRepository= require('./database/ordersRepository');
const AddressRepository= require('./database/addressRepository');
const AmoUsersRepository = require ('./database/amoUsersRepository')

const {getContacts,getAccessToken, refreshAccessToken}= require('./ApiAmo');
const exportExcel = require('./exportExcel');


const app=express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
// express-session


const dao = new AppDAO('./database/database.sqlite3')

const conectionRepo = new ConectionRepository(dao)
const amoconectionRepo = new AmoConectionRepository(dao)
const userRepo= new UsersRepository(dao);
const orderRepo= new OrdersRepository(dao);
const addressRepo= new AddressRepository(dao);
const amoRepo= new AmoUsersRepository(dao);

app.set('view engine' , 'ejs');
const PORT = process.env.PORT || 3000;
//INTERVALO DE TIEMPO 1 HORA = 60*60= 3600 SEGUNDOS=3600000 MILISEGUNDOS
const INTERVALODEACTUALIZACION=3600000;
require('dotenv').config();
app.use(express.static(__dirname + '/views'));


setInterval(() => {
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

  , INTERVALODEACTUALIZACION)

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get("/", requiresAuth(),(req,res)=>{

  res.render('home')
  // res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

app.get('/profile', requiresAuth(),(req,res)=>{
    res.send(JSON.stringify(req.oidc.user))
})

app.post('/connections', requiresAuth(),(req,res)=>{
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

app.get('/refreshamotoken', requiresAuth(),(req,res)=>{


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
  })
    
  


app.post('/amoconnections', requiresAuth(),(req,res)=>{
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

app.get('/connections/delete/:id', requiresAuth(),(req,res)=>{
  console.log(req.params.id)
  conectionRepo.delete(req.params.id);
 
  res.redirect('/connections');


})
app.get('/amoconnections/delete', requiresAuth(),(req,res)=>{
  console.log(req.query.id)
  amoconectionRepo.delete(req.query.id);
 
  res.redirect('/amoconnections');


})

app.get('/connections', requiresAuth(),(req,res)=>{
  conectionRepo.getAll().then((rows)=>{
    console.log("conections: ", rows);
    res.render('conections', {conections:rows,message:null})
  })
})
app.get('/amoconnections', requiresAuth(),(req,res)=>{
  amoconectionRepo.getAll().then((rows)=>{
    console.log("amoconections: ", rows);
    res.render('amoconections', {conections:rows,message:null})
  })
})

app.get('/customers', requiresAuth(),async (req,res)=>{
 

 

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
app.get('/addresses', requiresAuth(),async (req,res)=>{
 

 addressRepo.getAll().then((rows)=>{


  res.render('addresses', {addresses:rows})

 })
  .catch(err=>{
    console.log(err);
  }
  )


})
app.get('/orders', requiresAuth(),async (req,res)=>{
 

  orderRepo.getAll().then((rows)=>{
 
 
   res.render('orders', {orders:rows})
 
  })
   .catch(err=>{
     console.log(err);
   }
   )
 
 
 })
app.get('/users', requiresAuth(),(req,res)=>{

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
app.get('/getamocontacts', requiresAuth(),(req,res)=>{

  let page=1;
  let hasNextPage=true;
  amoconectionRepo.getAll().then(rows=>{
    console.log("data", rows)
    if(rows.length>0){
    
      getContacts(rows[0].url, rows[0].accessToken, page).then(data=>{
        //console.log("amo contacts are:",data)
      

        data.map((contact, index)=>{
    
          let contactInfo= {id:contact.id ,name: contact.name, first_name:contact.first_name , last_name:contact.last_name }
          // console.log("custom fields:", contact.custom_fields_values)
          if(contact.custom_fields_values){
          contact.custom_fields_values.map(custom=>{
            contactInfo[custom.field_name]=custom.values[0].value;
          })
        }

          amoRepo.getAll().then(rows=>{
            datos_actuales=rows;
            let found= datos_actuales.some(el=> el.id==contactInfo.id)
            if(!found){
              console.log("pushing:", contactInfo)
              // amoContactData.push(contactInfo)
                amoRepo.insert(contactInfo);

            }

          })
        
        })
       
      })
    // }
    }
  })



})



app.get('/amocontacts', requiresAuth(),(req,res)=>{


  amoRepo.getAll().then(rows=>{
    res.render('amoContacts', {users:rows})

  })

})

app.get('/combined', requiresAuth(),(req,res)=>{

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

    res.render('combined', {users:filtered2})


  })
})
})

app.get('/contacts', requiresAuth(),(req,res)=>{

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
   
    res.json({users:data})

  })

})


app.get('/export', requiresAuth(),(req,res)=>{
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
    const file = __dirname +'/'+fileName+'.xlsx' 
    res.download(file)
   }, 2000);
   
  })

  
})

app.get('/exportamo', requiresAuth(),(req,res)=>{


 amoRepo.getAll().then(rows=>{

  const data= rows.map(value=>{
    value.id=value.id.toString();
    return value;
  })
 
   const fileName='AmoUsers'
   exportExcel(Object.keys(data[0]), data, fileName)
   setTimeout(() => {
    const file = __dirname +'/'+fileName+'.xlsx' 
    res.download(file)
   }, 2000);
   
  })

  
})


app.get('/exportcombined', requiresAuth(),(req,res)=>{

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
   const file = __dirname +'/'+fileName+'.xlsx' 
   res.download(file)
  }, 2000);


  })
})
})
app.listen(PORT, ()=>{
    console.log("Listenign to port", PORT);
})
