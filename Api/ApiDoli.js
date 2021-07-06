
const axios = require('axios');


function getContactsFromDoli(url, token){
    const URL= 'http://'+url+'/api/index.php/thirdparties?limit=100000';
    let datos_actuales=[];
    return axios.get(URL, { headers: { 'DOLAPIKEY': token } })
    .then(response=>{
          return response.data;
       
    })
    .catch(e=>{
        console.log("Error getting contacts from dolibar:", e);
        throw new Error("Error getting contacts from dolibar");
    });


}



function addContatToDoli(url, token, newUser){

    console.log("Adding user:", newUser, "to doli");
    const URL= 'http://'+url+'/api/index.php/thirdparties';

    return axios.post(URL,
        {
            "entity": "1",
            "name": newUser.name,
            "lastname": newUser.name,
            "firstname": newUser.first_name,
            "address": newUser.last_name,
            "client": "3",    //2 signifca prospecto de cliente,3 propecto y cliente
            "status": "1",    //1  significa cliente
            "phone":  newUser.Phone,
            "email":  newUser.Email,
            "note_public":"Imported from amo." + ( newUser.Tags!=""?("Tags: "+ newUser.tags):"")
            
    },{ headers: { 'DOLAPIKEY': token } })

    .then(response=>{
        console.log("user with id ", response.data," addded");
        return response.data;
    })
    .catch(e=>{
        console.log("Error adding contact",newUser ,"to doli.", e);
        return 0;
    });


}

module.exports.getContactsFromDoli=getContactsFromDoli;

module.exports.addContatToDoli=addContatToDoli;