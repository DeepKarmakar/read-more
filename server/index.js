const { response } = require("express");
const cors = require("cors");
const express = require("express");
const app = express();
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const jwtSecretKey = "jwtSecret";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "read_more",
});

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "userId",
    secret: "subscribe",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expire: 60 * 60 * 24,
    },
  })
);

const verifyJwt = (req, res, next) => {
  console.log(req.headers);
  const token = req.headers["x-access-token"];

  if (!token) {
    res.send("don't have token, we need that");
  } else {
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: "failed to authenticate" });
      } else {
        req.useId = decoded.id;
        next();
      }
    });
  }
};

app.get("/", (req, res) => {
  res.send("Service up and running");
});

app.post("/signup", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err);
    }

    db.query(
      `SELECT email FROM users WHERE email="${req.body.email}"`,
      function (err, result) {
        if (err) {
          throw err;
        }
        if (result.length == 0) {
          const reqBody = [req.body.email, hash, req.body.name];
          // insert DB query
          const sqlEmailCheck =
            "INSERT INTO users (email, password, name) VALUES(?, ?, ?)";
          db.query(sqlEmailCheck, reqBody, (emailErr, emailRes) => {
            console.log(emailRes);
            console.log(emailErr, "error");
            res.send({ message: "User added successfully" });
          });
        } else {
          res.send({ message: "Email Already exist", isError: true });
        }
      }
    );
  });
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/login", (req, res) => {
  db.query(
    `SELECT password FROM users WHERE email="${req.body.email}"`,
    (err, result) => {
      if (err) {
        throw err;
      }
      if (result.length == 1) {
        bcrypt.compare(
          req.body.password,
          result[0].password,
          (error, response) => {
            if (response) {
              req.session.user = result;
              const id = result[0].id;
              const token = jwt.sign({ id }, jwtSecretKey, {
                expiresIn: 300,
              });
              // res.send(responseObj("Login Successfull"));
              res.json({ auth: true, token, result: result });
            } else {
              res.send(responseObj("password doesnot match", true));
            }
          }
        );
      } else {
        res.send(responseObj("Email not exist", true));
      }
    }
  );
});

const responseObj = (message, isError = false) => {
  return {
    message,
    isError,
    status: 200,
  };
};

app.get("/getUsers", verifyJwt, (req, res) => {
  const sqlSelect = "SELECT * FROM users";
  db.query(sqlSelect, (err, response) => {
    res.send(response);
  });
});

app.post("/createPost", verifyJwt, (req, res) => {
  const reqBody = [
    req.body.title,
    req.body.description,
    req.body.category,
    req.body.image,
    req.body.userId,
    req.body.isDraft,
    req.body.isApproved,
  ];
  const sqlSelect =
    "INSERT INTO posts (title, description, category, image, userId, isDraft, isApproved) values(?,?,?,?,?,?,?)";
  db.query(sqlSelect, reqBody, (err, response) => {
    if (err) {
      throw err;
    } else {
      res.send({ status: 200, message: "successfull" });
    }
  });
});

app.listen(3001, () => {
  console.log("running on port 3001");
});
