const express = require("express");
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cors = require('cors');
var cookieParser = require('cookie-parser');
// var cookie = require('cookie');
const bodyParser = require("body-parser");

const app = express();

// middleware list
app.use(cors({
  origin: true,
  credentials: true
}));
/*
  Credentials(인증서) 이 있는 CORS 요청은 Client와 Server
  둘다 Credentials를 사용하겠다는 속성을 설정해줘야 통신이 가능
*/

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
// 이 세션함수는 반드시 passport.session() 전에 사용해야한다
app.use(session({
  secret: 'secret key',
  resave: true,
  saveUninitialized: false,
  secure: false, // 이건 뭘까
  store: new FileStore()
}));

const passport = require('passport');
const Strategy = require('passport-local').Strategy;

// passport.use(strategy); 이후에 미들웨어를 사용해야함
app.use(passport.initialize());
app.use(passport.session());

let strategy = new Strategy({
  usernameField: 'email', // input name
  passwordField: 'password', //input name
  session: true, // session에 저장 여부
  passReqToCallback: true, // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
}, (req, email, password, done) => {
  if (email === 'test@naver.com' && password === '1234') {
    let userInfo = {
      email: 'test@naver.com',
      name: '홍길동',
      birth: '1102.05.29'
    }
    done(null, userInfo);
  } else {
    done(null, false, { message: "Incorrect ID/PW" });
  }
});
passport.use(strategy);


/*
 serializeUser는 로그인 성공을 하면 세션을 저장해주는 코드이고,
 deserializeUser는 세션이 있을때 세션정보를 꺼내주는 코드라고 생각하면된다.
 세션이 있다면 req.user로 접근이 가능하다.
*/

passport.serializeUser(function (user, done) {
  console.log("serializeUser user : ", user);
  done(null, user);
}); // 로그인 성공했을때 호출됌
passport.deserializeUser(function (user, done) {
  console.log("deserializeUser user : ", user);
  done(null, user); // 여기 유저는 serializeUser에서 done으로 넘겨준 user임
  // 여기서 최종으로 넘기면 세션에 저장되서 req.user로 사용가능하다?
}); // 모든요청마다 호출됌

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // 요놈이 들어가야 한다.

app.get('/', (req, res) => {
  console.log('req.user', req.user);
  // passport.authenticate('local', {}, (err, user, message)=>{
  //   console.log(user);
  // })
  res.json({ userInfo: req.user});
});


// passport.authenticate를 하면 req.login()함수가 자동 실행됌
app.post('/login', (req, res, next) => {
  console.log('/login', req.session);
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/' },
    (err, user, message) => {
      console.log("req.user : "+ JSON.stringify(req.user));
      if (user !== undefined) {
        console.log('app.post : ', user);
        req.logIn(user, (err)=>{
          if(err)return next(err);
          res.json({ result: 'User have sesseion' });
        });
      }
    }
  )(req, res, next);
});

app.get('/logout', (req, res) => {
  // console.log('/logout', req.session);
  req.logOut();
  res.json({ result: 'User have not sesseion' });
})


app.listen(80, () => {
  console.log('80포트 실행됌')
})
