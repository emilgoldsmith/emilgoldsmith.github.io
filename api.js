const request = require("request-promise-native");
const express = require("express");

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

app.get("/threestyledata", (req, res) => {
  request(
    "https://docs.google.com/spreadsheets/d/14wlxduDzjtvNZti9YI3lAyy580iXCwcQmp_yzb0m0LE/edit#gid=0"
  )
    .then((body) => {
      const prefix = "bootstrapData = {";
      const i = body.indexOf(prefix);
      let depth = 1;
      let stringifiedData = "{";
      for (let j = i + prefix.length; depth > 0; j++) {
        if (body[j] === "{") depth++;
        else if (body[j] === "}") depth--;
        stringifiedData += body[j];
      }
      data = JSON.parse(JSON.parse(stringifiedData).changes.firstchunk[0][1])[3]
        .map((x) => x[0][3][1])
        .slice(2)
        .reduce((prev, cur, index, arr) => {
          if (index % 2 == 0) {
            return prev.concat([{ pair: arr[index], alg: arr[index + 1] }]);
          }
          return prev;
        }, []);
      res.json(data);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

const MongoClient = require("mongodb").MongoClient;
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017";
function runMongoCommand(cb) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(mongoURI, (err, client) => {
      if (err !== null) {
        console.error(err);
        reject(err);
        return;
      }
      const db = client.db("cubing");
      cb(db)
        .then(resolve)
        .catch(reject)
        .then(() => client.close());
    });
  });
}

app.post("/log-result", async (req, res) => {
  const { pair, time, verdict } = req.body;
  const correct = verdict === "Correct";
  const backendResultToLog = { time, correct };
  runMongoCommand((db) => {
    return new Promise((resolve, reject) => {
      const collection = db.collection("corners");
      collection.find({ pair }).toArray(function (err, resultsForPair) {
        if (resultsForPair.length > 0) {
          collection.update(
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
    });
  });
  res.sendStatus(200);
});

app.listen(port);
