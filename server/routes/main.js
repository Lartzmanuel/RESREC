
const express = require('express')
const router = express.Router()
const session = require('express-session');
const {getUdemyCourse, getYoutubeVideo, getGoogleBooks} = require('../../public/js/recommender');
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser');
const User = require('../../model/users');
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
        isPreferencePage: true,
    }
    res.render('preference', {locals})
})

router.get('/register', (req, res) => {
    const locals = {
        title: "Register",
        description: "Register page",
        isRegisterPage: true,
    }
    res.render('register', {locals})
})

router.get('/login', (req, res)=> {
    const locals = {
        title: "login",
        description: "login page",
        isloginPage: true,
    }
    res.render('login', {locals})
})

router.get('/about', (req, res)=> {
    const locals = {
        title: "About",
        description: "About page"
    }
    res.render('about', {locals})
})

router.get('/home', checkAuthenticated,async (req, res)=> {
    const locals = {
        title: "Home",
        description: "Home page"
    }
    res.render('home', {locals})
})

// router.get('/home', checkAuthenticated,async (req, res)=> {
//     const locals = {
//         title: "Home",
//         description: "Home page"
//     }
//     const userId= req.user.id;
//     const user = await User.findById(userId).populate('resourceHistory');
//     //console.log(user.resourceHistory);
//     res.render('home', {locals, resources: user.resourceHistory})
// })

router.get('/userProfile', (req, res)=> {
    const locals = {
        title: "User Profile",
        description: "User Profile"
    }
    res.render('userProfile', {locals, user: req.user})
})

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

router.get('/editProfile', checkAuthenticated, (req, res) => {
    const locals = {
        title: "Edit Profile",
        description: "Edit Profile Page"
    }
    res.render('editProfile', {locals, user: req.user})
})


router.post('/editProfile', checkAuthenticated, async (req, res) => {
    try {
        const { bio, interests } = req.body;
        const user = await User.findById(req.user._id);
        user.bio = bio;
        user.interests = interests;
        
        await user.save();
        res.redirect('/userProfile')

    } catch (err) {
        console.error(err)
        res.redirect('/editProfile')
    }
})

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect('/login');
    });
});

router.get('/reset_password', (req, res) => {
    const locals = {
        title: 'Reset Password',
        description: 'Reset Password'
    }
    res.render('reset_password', { locals })
})

router.post('/reset_password', async (req, res) => {
    try {
        const { securityQuestion, securityAnswer, newPassword } = req.body;
        const user = await User.findOne({ securityQuestion });

        if (!user) {
            req.flash('error_msg', 'Invalid email or security question');
            return res.redirect('/reset_password');
        }

        const isAnswerCorrect = await bcrypt.compare(securityAnswer, user.securityAnswer);
        if (!isAnswerCorrect) {
            req.flash('error_msg', 'Incorrect security answer');
            return res.redirect('/reset_password');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        

        console.log(`Password reset successful for user: ${user.email}`); // Log to confirm password reset
        req.flash('success_msg', 'Password reset successful. You can now log in with your new password.')

        res.redirect('/login');

    } catch (error) {

        console.log(error)
        req.flash('error_msg', 'Server error. Please try again later.');
        res.redirect('/reset_password');
    }
});

router.get('/history', async (req, res) => {
    const locals = {
        title: 'History',
        description: 'History'
    }

    const userId= req.user.id;
    const user = await User.findById(userId).populate('resourceHistory');

    res.render('history', { locals, resources: user.resourceHistory})
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
  


// router.post('/submit', (req, res) => {
//     const topic = req.body.Topic;
//     const resourceType = req.body.resourceType;
//     req.session.topic = req.body.Topic;
//     console.log(topic);
//     req.session.resourceType = req.body.resourceType;
  
//     let redirectUrl;
  
//     switch(resourceType) {
//       case 'Udemy Courses':
//         redirectUrl = '/udemy';
//         break;
//       case 'Youtube Videos':
//         redirectUrl = '/youtube';
//         break;
//       default:
//         redirectUrl = '/googleBooks';
//     }
  
//     res.redirect(redirectUrl);
//   });

module.exports = router;