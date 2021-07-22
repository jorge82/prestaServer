
class AmoConectionRepository{

    constructor(dao){
        this.dao=dao;
        //  const sql= 'DROP TABLE IF EXISTS amoconections';
        // return this.dao.run(sql);
        this.createTable();
    }

    createTable(){
        const sql= 'CREATE TABLE IF NOT EXISTS amoconections (url TEXT PRIMARY KEY, clientId TEXT, clientSecret TEXT ,accessToken TEXT, refreshToken TEXT)';
        return this.dao.run(sql);

    }

    insert(conection){
        console.log("inserting:", conection)
        const {  url, clientId, clientSecret, accessToken, refreshToken} = conection;
        return this.dao.run("INSERT INTO amoconections( url, clientId, clientSecret, accessToken, refreshToken) VALUES (?, ?, ?,?,?)", [  url, clientId, clientSecret, accessToken, refreshToken])

    }
    update(url, accessToken,refreshToken) {
    
      
        return this.dao.run(
          `UPDATE amoconections  SET accessToken = ?,refreshToken = ? WHERE url = ?`,[ accessToken, refreshToken, url]
          
        )
    }
    delete(url){
        return this.dao.run('DELETE FROM amoconections WHERE url=?', [url]);
    }
    getByID(url){
        return this.dao.get('SELECT * FROM amoconections WHERE url=?', [url]);
    }
    getAll() {
        return this.dao.all(`SELECT * FROM amoconections`)
      }


}

module.exports = AmoConectionRepository;