
class ConectionRepository{

    constructor(dao){
        this.dao=dao;
        this.createTable();
    }

    createTable(){
        const sql= 'CREATE TABLE IF NOT EXISTS conections (tag TEXT PRIMARY KEY, url TEXT, token TEXT)';
        return this.dao.run(sql);

    }

    insert(tag, url, token){
        return this.dao.run("INSERT INTO conections(tag, url, token) VALUES (?, ?, ?)", [tag, url, token])

    }
    update(conection) {
        const { tag, url, token } = conection
        return this.dao.run(
          `UPDATE conections  SET url = ?, SET token = ? WHERE tag = ?`,[ url, token, tag]
          
        )
    }
    delete(tag){
        return this.dao.run('DELETE FROM conections WHERE tag=?', [tag]);
    }
    getByID(tag){
        return this.dao.get('SELECT * FROM conections WHERE tag=?', [tag]);
    }
    getAll() {
        return this.dao.all(`SELECT * FROM conections`)
      }


}

module.exports = ConectionRepository;