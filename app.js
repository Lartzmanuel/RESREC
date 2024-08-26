
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const express = require('express')
const app = express()
const PORT = process.env.PORT || 5000
const expressLayouts = require('express-ejs-layouts')
const bcrypt = require('bcrypt');
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const User = require('./model/users')
const Resource= require('./model/resource')


mongoose.connect(process.env.DATABASE_URL)
    .then(()=> {
        console.log('Successfully connected to Database')
        
    })
    .catch(err => console.error('Could not connect to Database:', err))


const initialize = require('./passport-config')
initialize(passport)

app.use(expressLayouts)
app.set('view engine', 'ejs')
app.set('layout', './layouts/main')


app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/login', checkNotAuthenticated, (req, res) => {
    const locals = {
        title: "Login",
        description: "Login page",
        isLoginPage: true
    }
    res.render('login', {locals})
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    const locals = {
        title: "Register",
        description: "Register page",
        isRegisterPage: true
    }
    res.render('register', {locals})
})


app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {

        const { securityQuestion, securityAnswer } = req.body;
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const hashedAnswer = await bcrypt.hash(securityAnswer, 10)

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword, securityQuestion,
            securityAnswer: hashedAnswer,
        });

        await user.save();
        console.log(user)

        res.redirect('/login')

    } catch (error) {
        console.log(error)
        res.status(500).send('Server Error')
    }
})


app.post('/submit', checkAuthenticated, async (req, res) => {

    const topic = req.body.Topic;
    const resourceType = req.body.resourceType;
    req.session.topic = req.body.Topic;
    console.log(topic);
    req.session.resourceType = req.body.resourceType;
  
    let redirectUrl;
  
    switch(resourceType) {
      case 'Udemy Courses':
        redirectUrl = '/udemy';
        break;
      case 'Youtube Videos':
        redirectUrl = '/youtube';
        break;
      default:
        redirectUrl = '/googleBooks';
    }
   
   const userId = req.user.id; // Assume you have a way to get the current user's ID
    console.log(userId);
    function capitalizeWords(topic) {
      return topic.replace(/\b\w/g, char => char.toUpperCase());
    }
    const capitalizedTopic = capitalizeWords(req.session.topic);
    try {
      const user = await User.findById(userId);
      if (user) {
        const topicExists = user.searchHistory.includes(capitalizedTopic);
        if (!topicExists) {
      user.searchHistory.push(req.session.topic);
      await user.save();
    }
        res.redirect(redirectUrl);
    } else {
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error(error);
      //res.status(500).json({ message: 'Error saving search query' });
    }
  
  });

  app.post('/click-resource', checkAuthenticated,async (req, res) => {
    const { courseId, title, link, image, description } = req.body; 
  
    try {

      const userId = req.user.id; // Get the current user's ID
      const courseId = Number(req.body.courseId); // or use String() if it's a string
    // Find the user and check if the resource is already in their history
    const user = await User.findById(userId).populate('resourceHistory');
    // console.log(user);
    // console.log(courseId);
    // console.log('courseId:', courseId, 'Type:', typeof courseId);
    // user.resourceHistory.forEach(resource => {
    //   console.log('Stored resource courseId:', resource.courseId, 'Type:', typeof resource.courseId);
    // })
    const existingResource = user.resourceHistory.find(resource => resource.courseId === courseId);
    console.log(existingResource);

    if (existingResource) {
      // Resource already accessed; redirect to the external link
      return res.status(200).json({ message: 'Resource already accessed', redirectTo: link });
  }
      // Create a new resource entry
      const newResource = new Resource({ 
        courseId,
        title, 
        link,
        image,
        description });
  
      // Save the resource entry
      await newResource.save();
  


      // Find the user and update their resource history
      await User.findByIdAndUpdate(userId, {
        $push: { resourceHistory: newResource.id}
      });
  
      res.status(200).json({ message: 'Resource saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error saving resource', details: error.message });
    }
  });

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
       return res.redirect('/home')
    }
    next()
}


// Importing and using routes from main.js
const mainRoutes = require('./server/routes/main');
app.use('/', mainRoutes);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})

