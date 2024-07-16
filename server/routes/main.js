
const express = require('express')
const router = express.Router()
const session = require('express-session');
const {getUdemyCourse, getYoutubeVideo, getGoogleBooks} = require('../../public/js/recommender');
//const getResource = require('../../public/js/script');
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

router.use(session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: true
  }));

router.get('/preference', (req, res) => {
  
    const locals = {
        title: "Preference",
        description: "Preference page",
        isPreferencePage: true
    }
    res.render('preference', {locals})
})

router.get('/about', (req, res)=> {
    const locals = {
        title: "About",
        description: "About page"
    }
    res.render('about', {locals})
})

router.get('/home', (req, res)=> {
    const locals = {
        title: "Home",
        description: "Home page"
    }
    res.render('home', {locals})
})

router.get('/youtube', async (req, res)=> {
  const topic = req.session.topic;
    const youtubeData = await getYoutubeVideo(topic);
    const locals = {
        title: "Youtube Resource",
        description: "Youtube Resource page"
    }
    res.render('youtube', {locals,youtubeData})
})

router.get('/googleBooks', async (req, res)=> {
  const topic = req.session.topic;
    const booksData = await getGoogleBooks(topic);
    const locals = {
        title: "GoogleBooks Resource",
        description: "GoogleBooks Resource page"
    }
    res.render('googleBooks', {locals,booksData})
})



router.get('/udemy', async (req, res)=> {
    const topic = req.session.topic;
    console.log(topic);
    const udemyCourseData = await getUdemyCourse(topic);
        const locals = {
        title: "Udemy Resource",
        description: "Udemy Resource page"
    }
    res.render('udemy', {locals,udemyCourseData})
})


router.post('/submit', (req, res) => {
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
  
    res.redirect(redirectUrl);
  });

module.exports = router;