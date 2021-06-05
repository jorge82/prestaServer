
class UsersRepository{

    constructor(dao){
        this.dao=dao;
        this.createTable();
    }

    createTable(){
        const sql= 'CREATE TABLE IF NOT EXISTS users (tag TEXT, id TEXT, name TEXT, lastName TEXT,email TEXT, phone TEXT,cellPhone TEXT, address TEXT, postCode TEXT, city TEXT, products TEXT, dateAdded TEXT, dateUpdated TEXT, PRIMARY KEY (tag, id) )';
        return this.dao.run(sql);

    }

    insert(user){
        const {tag , id , name , lastName ,email , phone ,cellPhone , address , postCode, city , products , dateAdded , dateUpdated } = user;
        return this.dao.run("INSERT INTO users (tag , id , name , lastName ,email , phone ,cellPhone , address , postCode, city , products , dateAdded , dateUpdated ) VALUES (?, ?, ?,?,?,?,?,?,?,?,?,?,?)", [tag , id , name , lastName ,email , phone ,cellPhone , address , postCode, city , products , dateAdded , dateUpdated ])

    }
    update(user) {
        const {tag , id , name , lastName ,email , phone ,cellPhone , address , postCode, city , products , dateAdded , dateUpdated } = user;
        return this.dao.run(
          `UPDATE users  SET name = ? , lastName = ?, email = ?,  phone = ?, cellPhone = ?,  address = ?,  postCode = ?,  city = ?,  products = ?, dateAdded = ?,  dateUpdated = ? WHERE tag = ? and id = ?`,[ name , lastName ,email , phone ,cellPhone , address , postCode, city , products , dateAdded , dateUpdated,tag , id ]
          
        )
    }
    updateProducts(tag, id, products) {
        
        return this.dao.run(
          `UPDATE users  SET products = ?  WHERE tag = ? and id = ?`,[products ,tag , id ]
          
        )
    }
    delete(tag, id){
        return this.dao.run('DELETE FROM users WHERE tag=? AND id=?', [tag,id]);
    }
    getByID(tag,id){
        return this.dao.get('SELECT * FROM users WHERE tag=? AND id=?', [tag,id]);
    }
    getAll() {
        return this.dao.all(`SELECT * FROM users`)
      }


}

module.exports = UsersRepository;