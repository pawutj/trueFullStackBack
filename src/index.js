var bodyParser = require("body-parser");
var app = require("express")();
var MongoClient = require('mongodb').MongoClient;
var cors = require('cors');
const jwt = require("jwt-simple");

const rand=()=>Math.random(0).toString(36).substr(2);

MongoClient.connect("mongodb://localhost:27017", (error, client) => {
    if (error) throw error;
    
    var db = client.db("MediumTutorial");

    app.listen(3010, () => {
        console.log("  App is running at http://localhost:3010");
        console.log("  Press CTRL-C to stop\n");
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(cors())


    const loginMiddleware = (req, res, next) => {
        if(req.body.username === "admin" && 
           req.body.password === "123456") next();
        else res.send("false") 
        
     }

     app.post("/login", loginMiddleware, (req, res) => {
        const payload = {
            sub: req.body.username,
            iat: new Date().getTime()
         };
         const SECRET = "sakurasaku"; 
         res.send(jwt.encode(payload, SECRET));
        
     })

    const ExtractJwt = require("passport-jwt").ExtractJwt;
    const JwtStrategy = require("passport-jwt").Strategy;   
    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromHeader("authorization"),
        secretOrKey: "sakurasaku"
        }
    const jwtAuth = new JwtStrategy(jwtOptions, (payload, done) => {
        if(payload.sub=== "admin") done(null, true);
        else done(null, false);
    })

    const passport = require("passport");
    passport.use(jwtAuth);

    const requireJWTAuth = passport.authenticate("jwt",{session:false});

    app.get(
        "/sakura",requireJWTAuth,
        (req, res) => {
            res.json({
                msg: "saku"
            });
        },
        );

    app.get(
        "/listProduct",
            (req, res) => {
                db.collection("true_db").find().toArray((err, result) => {
                    if (err) return res.status(500).send(err.toString());
                    res.status(200).send(result);
                });
            }
    );

    app.post("/addProduct",requireJWTAuth,(req,res) => {
            db.collection("true_db").insertOne({    
                id:rand(),
                name:req.body.name,
                cost:req.body.cost,
                total:req.body.total,
                type:req.body.type,
                date:Date.now(),
            },(err,result) => {
                if(err) return res.status(500).send(err.toString())
                res.sendStatus(200)
            })
        }
    )

    app.post(
    "/editProduct",requireJWTAuth,
    (req,res) => {
        db.collection("true_db").updateOne({
            id:req.body.id
        },{
            $set:{
                name:req.body.name,
                cost:req.body.cost,
                total:req.body.total,
                type:req.body.type,
                date:Date.now()
            }
        },
        (err,result) => {
            if(err) return res.status(500).send(err.toString())
            res.sendStatus(200)
        })
    })
    
    app.post(
        "/deleteProduct",requireJWTAuth,
    (req,res) => {
        db.collection("true_db").deleteOne({
            id:req.body.id
        }
        , (err,result) => {
            if(err) return res.status(500).send(err.toString())
            res.sendStatus(200)
        }
        )
    })

  

});
