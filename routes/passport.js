const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./config')
var mongoUtil = require('./mongoDB');
var dbo = mongoUtil.getDb();
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');


const LocalStrategy = require('passport-local').Strategy;


passport.use(new LocalStrategy({
    usernameField: 'login_email',
    passwordField: 'login_password'
},
    async function (email, password, cb) {
        const aggCursor = await dbo.collection("Credentials").aggregate([
            {
                '$match': {
                    'emailid': email
                }
            }
        ])
        let user;
        for await (const doc of aggCursor) {
            user = doc;

        }
        if (!user) {
            return cb(null, false, { message: 'Incorrect email or password.' });
        }
        if (!(user.password)) {
            return cb(null, false, { message: 'Incorrect email or password.' });
        }
        await bcrypt.compare(password, user.password).then(function (resultOfPasswordComparison) {
            if(!(resultOfPasswordComparison)){
                return cb(null, false, { message: 'Incorrect email or password.' });
            }
        }) 

        let userData = {}
        userData.id = true;
        userData.image = user.image || null;
        userData.emailid = { value: user.emailid },
            userData.account = { role: user.role, displayName: user.userName, compnayName: user.compnayName }

        return cb(null, userData, {
            message: 'Logged In Successfully'
        });
    }
));










function extractProfile(profile) {
    let imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value;
    }
    return {
        id: profile.id,
        displayName: profile.displayName,
        image: imageUrl,
        emailid: profile.emails[0],
    };
}
passport.use(new GoogleStrategy({
    clientID: config.clientId,
    clientSecret: config.secret,
    callbackURL: config.callback,
},
    (accessToken, refreshToken, profile, cb) => {
        cb(null, extractProfile(profile));
}));

passport.serializeUser(async (user, cb) => {
    cb(null, user);

});
passport.deserializeUser(async (obj, cb) => {
    cb(null, obj);
});



