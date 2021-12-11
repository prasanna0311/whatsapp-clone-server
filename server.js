//imports
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import cors from 'cors'
import Pusher from 'pusher'



//app config
const app = express()
const port = process.env.PORT || 9000;

const connection_url ='mongodb+srv://prasanna:prasanna98@cluster0.nx947.mongodb.net/whatsappmern?retryWrites=true&w=majority';


const pusher = new Pusher({
    appId: "1315348",
    key: "7e06f9acc763c9eb3539",
    secret: "6f640f1e94009e78d1d2",
    cluster: "ap2",
    useTLS: true
  });




//middleware
app.use(express.json())
app.use(cors())


//dbconfig
mongoose.connect(connection_url, {
    useNewUrlParser : true,
    // useCreateIndex : true,
    useUnifiedTopology : true
})


//api routes

const db = mongoose.connection
db.once("open", () =>{
    console.log("db connected")

    const msgCollection = db.collection("whatsappmessages")

    const changeStream = msgCollection.watch()
    changeStream.on('change', change =>{
        console.log(change)

        if(change.operationType === "insert"){
            const messageDetails = change.fullDocument
            pusher.trigger("messages","inserted", {
                name: messageDetails.name,
                message : messageDetails.message,
                timestamp : messageDetails.timestamp,
                received : messageDetails.received

            })
        } else {
            console.log('error trigerring pusher')
        }
    })
})


app.get('/',(req,res) => res.status(200).send("whatsapp clone..."))

app.get('/messages/sync',(req,res) => {
    
    Messages.find((err,data) =>{
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})





app.post('/messages/new',(req,res) => {
    const dbMessage = req.body
    Messages.create(dbMessage,(err,data) =>{
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port,() => console.log(`listening on loaclhost: ${port}`))