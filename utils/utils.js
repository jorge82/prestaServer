const xl = require('excel4node');





module.exports.exportExcel=function exportExcel(headers, data, fileName){
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