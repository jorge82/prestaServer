
class OrdersRepository{

    constructor(dao){
        this.dao=dao;
        this.createTable();
    }

    createTable(){
        const sql= 'CREATE TABLE IF NOT EXISTS orders (tag TEXT, id TEXT,id_customer TEXT,products TEXT, invoice_date TEXT, total_paid REAL, PRIMARY KEY (tag, id) )';
        return this.dao.run(sql);

    }

    insert(info){
        const {tag , id, id_customer , products, invoice_date, total_paid } = info;
        return this.dao.run("INSERT INTO orders (tag , id, id_customer,  products, invoice_date, total_paid ) VALUES (?, ?, ?, ?, ?,?)", [tag , id , id_customer ,  products, invoice_date, total_paid ])

    }
    update(info) {
        const {tag , id, id_customer , products, invoice_date, total_paid } = info;
        return this.dao.run(
          `UPDATE orders   id_customer=?,  products = ?, invoice_date=?, total_paid  = ? WHERE tag = ? and id = ?`,[ id_customer, products, invoice_date,total_paid, tag, id ]  
        )
    }
  
    delete(tag, id){
        return this.dao.run('DELETE FROM orders  WHERE tag=? AND id=?', [tag,id]);
    }
    getByID(tag,id){
        return this.dao.get('SELECT * FROM orders  WHERE tag=? AND id=?', [tag,id]);
    }
    getAll() {
        return this.dao.all(`SELECT * FROM orders `)
      }


}

module.exports = OrdersRepository;