const express = require('express')
const app = express()

const connection = require('./database/database')
const Person = require('./models/Person')
const User = require('./models/User')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// JWT
const JWTSecret = '#####'

function auth(req, res, next){
    const authToken = req.headers['authorization']

    if(authToken != undefined){
        const bearer = authToken.split(' ')
        const token = bearer[1]

        jwt.verify(token, JWTSecret, (error, data) => {
            if(error){
                res.statusCode = 401
                res.json({error: 'Token inválido'})
            }else{
                req.token = token
                req.loggedUser = {id: data.id, email: data.email}
                next()
            }
        })
    }else{
        res.sendStatus(401)
    }
}

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

// persons
app.get('/persons', auth, async (req, res) => {
    
    let HATEOAS = [
        {
            href: 'http://localhost:8081/person/0',
            method: 'GET',
            rel: 'get_person'
        },
        {
            href: 'http://localhost:8081/auth',
            method: 'POST',
            rel: 'login'
        }
    ]

    try{
        let people = await Person.findAll()
        res.statusCode = 200
        res.json({people, _links: HATEOAS})
    }catch{
        res.status(404)
    }
})

app.get('/person/:id', auth, async (req, res) => {
    let id = req.params.id

    let HATEOAS = [
        {
            href: 'http://localhost:8081/person',
            method: 'POST',
            rel: 'post_person'
        },
        {
            href: 'http://localhost:8081/person',
            method: 'DELETE',
            rel: 'delete_person'
        },
        {
            href: 'http://localhost:8081/person',
            method: 'PUT',
            rel: 'put_person'
        },
        {
            href: 'http://localhost:8081/auth',
            method: 'POST',
            rel: 'login'
        }
    ]

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
                res.json({person, _links: HATEOAS})
            }
        }
    }catch{
        res.sendStatus(404)
    }
})

app.post('/person', auth, async (req, res) => {
    let name = req.body.name
    let age = req.body.age

    try{
        if(name == undefined || age == undefined || age < 0){
            res.sendStatus(400)
        }else{
            await Person.create({name, age})
            res.sendStatus(200)
        }
    }catch{
        res.sendStatus(500)
    }
})

app.delete('/person/:id', auth, async (req, res) => {
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

app.put('/person/:id', auth, async (req, res) => {
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

// user
app.get('/users', auth, async (req, res) => {
    try{
        let users = await User.findAll()
        res.statusCode = 200
        res.json(users)
    }catch{
        res.sendStatus(404)
    }
})

app.post('/user', async (req, res) => {
    let name = req.body.name
    let email = req.body.email
    let password = req.body.password

    let salt = bcrypt.genSaltSync(10)
    let hash = bcrypt.hashSync(password, salt)

    try{
        if(name == undefined || email == undefined || password == undefined){
            res.sendStatus(400)
        }else{
            await User.create({name, email, password: hash})
            res.sendStatus(200)
        }
    }catch{
        res.sendStatus(500)
    }
})

app.delete('/user/:id', auth, async (req, res) => {
    let id = req.params.id

    try{
        let user = await User.destroy({
            where: {
                id
            }
        }) 

        if(!user){
            res.sendStatus(404)
        }

        res.sendStatus(200)
    }catch{
        res.sendStatus(500)
    }
})

app.post('/auth', async (req, res) => {
    let email = req.body.email
    let password = req.body.password

    if(email == undefined){
        res.sendStatus(400)
    }else{
        let user = await User.findOne({
            where: {
                email
            }
        })
        if(user == undefined){
            res.sendStatus(404)
        }else{
            let validate = bcrypt.compareSync(password, user.password)

            if(validate){
                jwt.sign({id: user.id, email: user.email}, JWTSecret, {expiresIn: '48h'}, (error, token) => {
                    if(error){
                        res.sendStatus(400)
                    }else{
                        res.statusCode = 200
                        res.json({token})
                    }
                })
            }else{
                res.sendStatus(401)
            }
        }
    }
})

const port = 8081
app.listen(port, () => console.log('API is running'))
