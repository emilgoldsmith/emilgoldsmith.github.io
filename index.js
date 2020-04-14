const request = require("request-promise-native");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/threestyledata", (req, res) => {
  request(
    "https://docs.google.com/spreadsheets/d/14wlxduDzjtvNZti9YI3lAyy580iXCwcQmp_yzb0m0LE/edit#gid=0"
  )
    .then(body => {
      const prefix = "bootstrapData = {";
      const i = body.indexOf(prefix);
      let depth = 1;
      let stringifiedData = "{";
      for (let j = i + prefix.length; depth > 0; j++) {
        if (body[j] === "{") depth++;
        else if (body[j] === "}") depth--;
        stringifiedData += body[j];
      }
      data = JSON.parse(JSON.parse(stringifiedData)
        .changes.firstchunk[0][1])[3].map(x => x[0][3][1])
        .slice(2)
        .reduce((prev, cur, index, arr) => {
          if (index % 2 == 0) {
            return prev.concat([{ pair: arr[index], alg: arr[index + 1] }]);
          }
          return prev;
        }, []);
      res.json(data);
    })
    .catch(err => {
      console.error(err);
      res.sendStatus(500);
    });
});

app.listen(port);
