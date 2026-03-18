import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "testagritrust",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "Filipinas1.",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql"
  }
);

export default sequelize;
