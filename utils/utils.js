const xl = require('excel4node');
var util = require('util');




module.exports.exportExcel=function exportExcel(headers, data, fileName,callback){
    try{
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('users');


    const headingColumnNames = headers;

    //Write Column Title in Excel file
    let headingColumnIndex = 1;
    headingColumnNames.forEach(heading => {
        ws.cell(1, headingColumnIndex++)
            .string(heading)
    });

    //Write Data in Excel file
    let rowIndex = 2;
    data.forEach( record => {
        let columnIndex = 1;
        Object.keys(record ).forEach(columnName =>{
            ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
        });
        rowIndex++;
    }); 
    wb.write(fileName+'.xlsx');
    callback();
    
}
catch(err){
    console.log(err)
}
}


module.exports.filterContactData=function filterContactData( contact){

    if((contact.name=="atencion amo crm") || (contact.name=='Uber')||(contact.Email=="calendar-notification@google.com")  || (contact.Email=="googlemybusiness-noreply@google.com")|| (contact.Email=="google-noreply@google.com") || (!isNaN(contact.name))){
       return false;
    }else if(contact.Email){
        let emailEnding=contact.Email.split('@')[1];
            if  ((emailEnding=="rackear.com.ar") ||(emailEnding=="blocket.com.ar") || (emailEnding=="db-arg.com") || (emailEnding=="musitec.com.ar") || (emailEnding=="dbdrums.com.ar")) {
                return false;
            }else{
                return true;
            }
        
    }else{
            return  true;
        }

}

module.exports.convertDoliFormatToAmo= function convertDoliFormatToAmo(doliUser){

   const amoUser={
                
            "name": doliUser.name || "",
            "first_name": doliUser.firstName || "",
            "last_name": doliUser.lastName || "",
            "responsible_user_id": 6560570,
            "group_id": 0,
            "custom_fields_values": [
                {
                    "field_id": 243912,
                    "values": [
                        {
                            "value": doliUser.phone || ""
                        }
                    ]
                },
                {
                    "field_id":  243914,
                    "values": [
                        {
                            "value": doliUser.email || ""
                        }
                    ]
                }
            ],
            "_embedded": {
                    "tags": [
                       
                        {
                            "name": "Doli"
                        }
                    ],
                    "companies": []
                }
        }
                
    //console.log(util.inspect(amoUser, false, 7, true))
    return amoUser;
   } 


