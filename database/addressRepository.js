
class AddressRepository{

    constructor(dao){
        this.dao=dao;
        this.createTable();
    }

    createTable(){
        const sql= 'CREATE TABLE IF NOT EXISTS addresses (tag TEXT, id TEXT,id_customer TEXT, phone TEXT,cellPhone TEXT, address TEXT, postCode TEXT, city TEXT, PRIMARY KEY (tag, id) )';
        return this.dao.run(sql);

    }

    insert(info){
        const {tag , id, id_customer , phone ,cellPhone , address , postCode, city } = info;
        return this.dao.run("INSERT INTO addresses (tag , id, id_customer , phone ,cellPhone , address , postCode, city ) VALUES (?, ?, ?,?,?,?,?,?)", [tag , id , id_customer , phone ,cellPhone , address , postCode, city ])

    }
    update(info) {
        const {tag , id, id_customer , phone ,cellPhone , address , postCode, city } = info;
        return this.dao.run(
          `UPDATE addresses  id_customer=?,  phone = ?, cellPhone = ?,  address = ?,  postCode = ?,  city = ? WHERE tag = ? and id = ?`,[ id_customer, phone ,cellPhone , address , postCode, city ,tag , id ]
          
        )
    }
  
    delete(tag, id){
        return this.dao.run('DELETE FROM addresses WHERE tag=? AND id=?', [tag,id]);
    }
    getByID(tag,id){
        return this.dao.get('SELECT * FROM addresses WHERE tag=? AND id=?', [tag,id]);
    }
    getAll() {
        return this.dao.all(`SELECT * FROM addresses`)
      }


}

module.exports =AddressRepository;