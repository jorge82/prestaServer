const axios = require('axios');




const URL="https://ancajorgel.amocrm.com";

let ACCESSTOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjgyOWQ2MDNjMzFkNGI1ZWM3MDgwYzQ2NmEwNmEwNGE5OTkzYjhhZjkxZTYzYjRhYTM0NzlkODFiNTNiZjgyNTQyZGJhODU1MzEzY2U4NGIwIn0.eyJhdWQiOiJlMDcxYzM5My01ZjhhLTQwMWMtOWJkNy1jNDU2NWFjOTllZWUiLCJqdGkiOiI4MjlkNjAzYzMxZDRiNWVjNzA4MGM0NjZhMDZhMDRhOTk5M2I4YWY5MWU2M2I0YWEzNDc5ZDgxYjUzYmY4MjU0MmRiYTg1NTMxM2NlODRiMCIsImlhdCI6MTYyMzk1MDIwMywibmJmIjoxNjIzOTUwMjAzLCJleHAiOjE2MjQwMzY2MDMsInN1YiI6IjcxNTczMjciLCJhY2NvdW50X2lkIjoyOTU0MzQ5NSwic2NvcGVzIjpbInB1c2hfbm90aWZpY2F0aW9ucyIsImNybSIsIm5vdGlmaWNhdGlvbnMiXX0.RbLKhjRzU97UeHnvJt6uSQSCHjln_RDeqvPyXZhiJtdpi5TmV1Z3aNJHqTbc6xgiA2kjx7eEz42zxyKSY9LQ8mgWbcoA7S8cxYx8nXOUpM4QrFECmVh3slLpZgIEiRecoh9uQ-2sncCe6bx8pY_StCjumrViib9hTBzlg-IqsdoYVjAUKRtya2kqieukBKib171PmZn5NVoft8PC5iEO3l24kQ6Hkx83xoFQJIk31t0XZgCecdHS-2MZ6vhdA5oXicXK6zniFR3sl5Z9ll2Q1JvPSm9okmWYgpctghTDibGft58pAlk5cQ-q_OJC5oSyVjc7AMsKZckBA8apl1Z6xQ";
let REFRESHTOKEN="";



async function getContacts(url,accessToken, page){


  return axios.get(url+'/api/v4/contacts?limit=250&page='+page, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then((res) => {
          //console.log("respuesta:", res.data._embedded.contacts)
        const respuesta=res.data;
        return respuesta;
      })
      .catch((error) => {
        console.error("Error:", error)
        return [];
      })

}
async function getContacts2(url,accessToken, page){
try{
console.log("fetching page:", page)
  const response=await axios.get(url+'/api/v4/contacts?limit=250&page='+page, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      let data=[]
      if(response.data!=""){
        data= response.data._embedded.contacts
        console.log("calling")
      
          return data.concat( await getContacts2(url,accessToken, page+1));
        }else{

          console.log("termino")
          return data;
         } 
      
        }catch(error)  {
        console.error("Error:", error)
        return [];
      }

}

async function getAccessToken(url, id_integracion, clave_secreta, codigo_auto ){
  return axios.post(url+'/oauth2/access_token', {
    
      client_id: id_integracion,
      client_secret: clave_secreta,
      grant_type: "authorization_code",
      code:codigo_auto,
      redirect_uri: "https://jorgeserver.herokuapp.com/"
    
  })
  .then((res) => {
    //  console.log("respuesta:", res.data._embedded.contacts)
    const respuesta=res.data;
    return respuesta;
  })
  .catch((error) => {
    console.error("error:", error)
    return [];
  })

}

async function refreshAccessToken(url, id_integracion, clave_secreta, refreshToken ){
  return axios.post(url+'/oauth2/access_token', {
    
      client_id: id_integracion,
      client_secret: clave_secreta,
      grant_type: "refresh_token",
      refresh_token:refreshToken,
      redirect_uri: "https://jorgeserver.herokuapp.com/"
    
  })
  .then((res) => {
    //  console.log("respuesta:", res.data._embedded.contacts)
    const respuesta=res.data;
    return respuesta;
  })
  .catch((error) => {
    console.error("error:", error)
    return [];
  })

}
function addContacts(newContacts){






}


module.exports.getContacts=getContacts2;
module.exports.getAccessToken=getAccessToken;
module.exports.refreshAccessToken=refreshAccessToken;