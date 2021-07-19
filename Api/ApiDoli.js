
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
            "name_alias": "<a href="+ newUser.Link + " target=blank> GoAmoCrm</a>",
            "lastname": newUser.last_name,
            "firstname": newUser.first_name,
            "address": "",
            "client": "3",    //2 signifca prospecto de cliente,3 propecto y cliente
            "status": "1",    //1  significa cliente
            "phone":  newUser.Phone,
            "email":  newUser.Email,
            "note_public":"Imported from amo." + ( newUser.Tags!=""? ("Tags: "+ newUser.Tags):"")            
    }, {headers: {'DOLAPIKEY': token }})

    .then(response=>{
        console.log("user with id ", response.data," addded");
        return response.data;
    })
    .catch(e=>{
        console.log("Error adding contact",newUser ,"to doli.", e);
        throw new Error ("Error adding user to doli");
    });
}

function editContactInDoli(url, token, user){

    //console.log("Adding user:", user, "to doli");
    const URL= 'http://'+url+'/api/index.php/thirdparties/'+user.Id;

    return axios.put(URL,
        {
            "name": user.name,
            "name_alias": "<a href="+ user.Link + " target=blank> GoAmoCrm</a>",
            "lastname": user.last_name,
            "firstname": user.first_name,
            "phone":  user.Phone,
            "email":  user.Email,
            "note_public":"Imported from amo." + ( user.Tags!=""? ("Tags: "+ user.Tags):"")             
    }, {headers: {'DOLAPIKEY': token }})

    .then(response=>{
        console.log("user with id ", response.data.id," updated");
        return response.data.id;
    })
    .catch(e=>{
        console.log("Error adding link contact ",user.Id ,"to doli.",e);
        throw new Error ("Error adding user to doli");
    });
}

function editContactLinkInDoli(url, token, user){

    console.log("editinguser:", user, "to doli");
    const URL= 'http://'+url+'/api/index.php/thirdparties/'+user.id;

    return axios.put(URL,
        {
           
            "name_alias": "<a href="+ user.link + " target=blank> GoAmoCrm</a>",            
    }, {headers: {'DOLAPIKEY': token }})

    .then(response=>{
        console.log("user with id ", response.data.id," link addded");
        return response.data;
    })
    .catch(e=>{
        console.log("Error adding link contact ",user.Id ,"to doli.",e);
        throw new Error ("Error adding user to doli");
    });
}

module.exports.getContactsFromDoli=getContactsFromDoli;
module.exports.editContactLinkInDoli=editContactLinkInDoli;
module.exports.addContatToDoli=addContatToDoli;
module.exports.editContactInDoli=editContactInDoli;