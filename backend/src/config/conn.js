import { Sequelize } from "sequelize";

const conn = new Sequelize("todo3E","root","root", {
    host:"localhost",
    dialect: "mysql",
})

//Testando conexão com o banco
// try {
//     await conn.authenticate();
//     console.log('Connection MYSQL');
// } catch (error) {
//     console.error('Error:', error);
// }

export default conn;