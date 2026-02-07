// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
