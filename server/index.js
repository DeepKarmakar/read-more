const { response } = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const mysql = require("mysql");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "read_more",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("hello world");
});

app.post("/signup", (req, res) => {
  const reqBody = [req.body.email, req.body.password, req.body.name];

  db.query(
    `SELECT email FROM users WHERE email="${req.body.email}"`,
    function (err, result) {
      if (err) {
        throw err;
      }
      //You will get an array. if no users found it will return.

      if (result.length == 0) {
        // insert DB query
        const sqlEmailCheck = `SELECT * FROM users WHERE email = "${req.body.email}"`;
        db.query(sqlEmailCheck, (emailErr, emailRes) => {
          console.log(emailRes);
          console.log(emailErr, "error");
          res.send({ message: "User added successfully" });
        });
      } else {
        res.send({ message: "Email Already exist", isError: true });
      }
    }
  );

  // const sqlIntert = "INSERT INTO users (email, password, name) VALUES(?, ?, ?)";
  // db.query(sqlIntert, reqBody, (err, response) => {
  //   res.send("insert success");
  //   console.log(err);
  // });
});

app.get("/getUsers", (req, res) => {
  const sqlSelect = "SELECT * FROM users";
  db.query(sqlSelect, (err, response) => {
    res.send(response);
  });
});

app.listen(3001, () => {
  console.log("running on port 3001");
});
