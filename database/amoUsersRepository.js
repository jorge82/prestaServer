
class AmoUsersRepository{

    constructor(dao){
        this.dao=dao;
        // const sql= 'DROP TABLE IF EXISTS amousers';
        // console.log("dropping amousers")
        // return this.dao.run(sql);
        this.createTable();
    }

    createTable(){
       
        const sql= 'CREATE TABLE IF NOT EXISTS amousers ( id INTEGER PRIMARY KEY, name TEXT, first_name TEXT, last_name TEXT,  Email TEXT ,Phone TEXT, Tags TEXT, Link TEXT, DoliID INTEGER)';
        return this.dao.run(sql);

    }

    insert(user){
     
        const  {id , name , first_name , last_name,  Email, Phone, Tags, Link, DoliID } = user;
        return this.dao.run("INSERT INTO amousers ( id , name , first_name, last_name ,Email , Phone, Tags, Link, DoliID ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)", [id , name , first_name , last_name,  Email, Phone, Tags, Link, DoliID  ])

    }
    update(user) {
     
        const {id , name , first_name , last_name,  Email, Phone,Tags } = user;
      
        return this.dao.run(
            `UPDATE amousers  SET name = ? , first_name = ?, last_name = ?,  Email = ?, Phone= ? , Tags= ? WHERE  id = ?`,[name , first_name , last_name,  Email, Phone , Tags, id ]
            
          )
    }
 
    delete(id){
        return this.dao.run('DELETE FROM amousers WHERE id=?', [id]);
    }
    getByID(id){
        console.log("trying to fetch amo user id", id);
        return this.dao.all('SELECT * FROM amousers WHERE id=?', [id]);
    }
    getAll() {
        return this.dao.all(`SELECT * FROM amousers`)
      }
    deleteAll() {
    return this.dao.run(`DELETE  FROM amousers`)
    }

}

module.exports =  AmoUsersRepository;