const express = require('express')
const app = express()

const connection = require('./database/database')
const Person = require('./models/Person')
const cors = require('cors')

// cors
app.use(cors())

// body-parser
app.use(express.urlencoded({extended: false}))
app.use(express.json())

// DB connection 
connection.sync().then(() => {
    console.log('Conected with database')
}).catch(error => {
    console.log(error)
})

app.get('/persons', async (req, res) => {   
    try{
        let people = await Person.findAll()
        res.statusCode = 200
        res.json(people)
    }catch{
        res.status(404)
    }
})

app.get('/person/:id', async (req, res) => {
    let id = req.params.id

    try{
        if(isNaN(id)){
            res.sendStatus(400)
        }else{
            let person = await Person.findOne({
                where: {
                    id
                }
            })
            if(person == undefined || person == null){
                res.sendStatus(404)
            }else{
                res.statusCode = 200
                res.json(person)
            }
        }
    }catch{
        res.sendStatus(404)
    }
})

app.post('/person', async (req, res) => {
    let name = req.body.name
    let age = req.body.age

    try{
        if(name == undefined || age == undefined || age < 0){
            res.sendStatus(400)
        }else{
            await Person.create({name, age})
            res.sendStatus(200)
            res.redirect('/persons')
        }
    }catch{
        res.sendStatus(500)
    }
})

app.delete('/person/:id', async (req, res) => {
    let id = req.params.id

    try{
        if(isNaN(id)){
            res.sendStatus(400)
        }else{
            let person = await Person.destroy({
                where:{
                    id
                }
            })

            if(person == 0){
                res.sendStatus(404)
            }else if(person == 1){
                res.sendStatus(200)
            }
        }
    }catch{
        res.sendStatus(404)
    }
})

app.put('/person/:id', async (req, res) => {
    let id = req.params.id
    let name = req.body.name
    let age = req.body.age

    try{
        if(isNaN(id)){
            res.sendStatus(400)
        }else{
            let person = await Person.update({name, age}, {
                where: {
                    id
                }
            })
            
            if(person == 0){
                res.sendStatus(404)
            }else if(person == 1){
                res.sendStatus(200)
            }
        }
    }catch{
        res.sendStatus(404)
    }
})

const port = 8081
app.listen(port, () => console.log('API is running'))
