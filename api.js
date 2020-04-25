const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const { google } = require("googleapis");

const app = express();
const port = process.env.PORT || 4000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(require("body-parser").json());

async function getAuthorizedJwtClient() {
  const { client_email, private_key } = getCredentials();

  const jwtClient = new google.auth.JWT(client_email, null, private_key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
  await jwtClient.authorize();
  return jwtClient;
}

function getCredentials() {
  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  };
  if (credentials.client_email && credentials.private_key) return credentials;
  const credentialsFile = JSON.parse(
    fs.readFileSync("credentials.json", "utf8")
  );
  credentials.client_email = credentialsFile.client_email;
  credentials.private_key = credentialsFile.private_key;
  return credentials;
}

app.get("/threestyledata", async (req, res) => {
  const authorizedJwtClient = await getAuthorizedJwtClient();
  const sheets = google.sheets({ version: "v4", auth: authorizedJwtClient });
  const {
    data: { values: rows },
  } = await sheets.spreadsheets.values.get({
    spreadsheetId: "14wlxduDzjtvNZti9YI3lAyy580iXCwcQmp_yzb0m0LE",
    range: "A2:B",
  });
  const formattedData = rows.map((row) => ({ pair: row[0], alg: row[1] }));
  res.json(formattedData);
});

const MongoClient = require("mongodb").MongoClient;
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/cubing";
function runMongoCommand(cb) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(
      mongoURI,
      { useUnifiedTopology: true },
      (err, client) => {
        if (err !== null) {
          console.error(err);
          reject(err);
          return;
        }
        const db = client.db();
        cb(db)
          .then(resolve)
          .catch(reject)
          .then(() => client.close());
      }
    );
  });
}

const secret = process.env.AUTH_SECRET || "local-dev-secret";
function hash(password) {
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}
const passwordHash = process.env.PASSWORD_HASH || hash("password");
app.post("/validate-password", (req, res) => {
  if (hash(req.body.password) !== passwordHash) {
    res.sendStatus(401);
  } else {
    res.sendStatus(200);
  }
});
app.post("/log-result", async (req, res) => {
  if (hash(req.body.password) !== passwordHash) {
    res.sendStatus(401);
    console.error(`Incorrect password ${req.body.password}`);
    return;
  }
  const { pair, time, verdict } = req.body.data;
  const correct = verdict === "Correct";
  const backendResultToLog = { time, correct, dateTime: new Date().getTime() };
  runMongoCommand((db) => {
    return new Promise((resolve, reject) => {
      const collection = db.collection("corners");
      collection.find({ pair }).toArray(function (err, resultsForPair) {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        if (resultsForPair.length > 0) {
          collection.updateOne(
            { pair },
            { $push: { results: backendResultToLog } },
            (err, _result) => (err ? reject(err) : resolve())
          );
        } else {
          collection.insertMany(
            [{ pair, results: [backendResultToLog] }],
            (err, _result) => (err ? reject(err) : resolve())
          );
        }
      });
    }).then(
      () => res.sendStatus(200),
      () => res.sendStatus(500)
    );
  });
});

app.get("/statistics", (req, res) => {
  runMongoCommand((db) => {
    return new Promise((resolve, reject) => {
      const collection = db.collection("corners");
      collection.find({}).toArray((err, allPairs) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
          reject(err);
          return;
        }
        res.json(allPairs);
        resolve();
      });
    });
  });
});

app.listen(port);
