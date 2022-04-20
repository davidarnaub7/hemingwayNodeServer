const express = require('express');
const bodyParser = require('body-parser');
const {graphqlHTTP} = require('express-graphql');
const mongoose = require('mongoose');
const { makeExecutableSchema } = require('graphql-tools');
const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');
const isAuth = require('./middleware/isAuthenticated');

const helmet = require("helmet");

const app = express();

// app.use(helmet()); //using helmet to secure our system.

app.use(express.static('assets'));
app.use(bodyParser.urlencoded({ extended: true, limit: '16mb' }));
app.use(bodyParser.json({ limit: '16mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

//CHECKING IF USER IS AUTHENTICATED
app.use(isAuth);

//Intializing graphql endpoint.
app.use('/graphql', graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true,
}))

mongoose.connect(process.env.MONGO_HOME,  { useNewUrlParser: true })
.then(() => 
app.listen(process.env.PORT, process.env.HOME)).
catch(error=>{
    console.log(error)
});