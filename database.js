var pgtools = require("pgtools");
const config = {
  user: "postgres",
  host: "localhost",
  password: "antikadas",
  port: 5432

  
    

};

pgtools.createdb(config, "F", function(err, res) {
  if (err) {
    console.error(err);
    process.exit(-1);
  }
  console.log(res);
});
