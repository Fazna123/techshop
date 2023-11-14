const mongoose = require("mongoose")
//mongoose.connect("MONGODB_URL");

const express = require("express")

const config = require('./config/config')

const session = require('express-session')
const app = express();
const path = require('path')

const nocache = require("nocache")

require('dotenv').config();

//const morgan = require('morgan')


const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const paymentRoute = require('./routes/paymentRoute')


const mongoDBUrl = process.env.MONGODB_URL;

mongoose.connect(mongoDBUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
})

//app.use(morgan('tiny'))


app.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:false
}))


app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs');
// app.set('views','./views/users')

app.use(express.static('public'))


app.use('/',userRoute);

app.use('/admin',adminRoute);

app.use('/payment',paymentRoute)

app.use(nocache());


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});


// app.listen(3000,function(){
//     console.log('Server Started on http://localhost:3000')
// })



