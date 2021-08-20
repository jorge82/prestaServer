class DoliUsersRepository {
  constructor(dao) {
    this.dao = dao;
    // const sql= 'DROP TABLE IF EXISTS doliusers';
    // return this.dao.run(sql);
    this.createTable();
  }

  createTable() {
    const sql =
      "CREATE TABLE IF NOT EXISTS doliusers ( id INTEGER PRIMARY KEY, name TEXT, firstName TEXT, lastName TEXT,  email TEXT ,phone TEXT , address TEXT, zip TEXT, city  TEXT, country TEXT)";
    return this.dao.run(sql);
  }

  insert(user) {
    const {
      id,
      name,
      firstName,
      lastName,
      email,
      phone,
      address,
      zip,
      city,
      country,
    } = user;
    return this.dao.run(
      "INSERT INTO doliusers ( id , name , firstName , lastName,  email, phone, address, zip, city, country  ) VALUES (?, ?, ?, ?, ?, ?,?, ?,?,?)",
      [id, name, firstName, lastName, email, phone, address, zip, city, country]
    );
  }
  update(user) {
    const {
      id,
      name,
      firstName,
      lastName,
      email,
      phone,
      address,
      zip,
      city,
      country,
    } = user;

    return this.dao.run(
      `UPDATE doliusers  SET name = ? , firstName = ?, lastName = ?,  email = ?, phone= ?, address= ?, zip= ?, city= ?, country= ? WHERE  id = ?`,
      [name, firstName, lastName, email, phone, address, zip, city, country, id]
    );
  }

  delete(id) {
    return this.dao.run("DELETE FROM doliusers WHERE id=?", [id]);
  }
  getByID(id) {
    return this.dao.get("SELECT * FROM doliusers WHERE id=?", [id]);
  }
  async getAll() {
    return this.dao.all(`SELECT * FROM doliusers`);
  }
}

module.exports = DoliUsersRepository;
