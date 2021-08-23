const express = require('express')
const app = express()

const connection = require('./database/database')
const Person = require('./models/Person')
const User = require('./models/User')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// JWT
const JWTSecret = 'sdadsaafadsfdsafdssadsjfaaasfsafsa'

function auth(req, res, next){
    const authToken = req.headers['authorization']

    if(authToken == undefined){
        return res.status(401).json({error: 'Token não autorizado'})
    }

    const bearer = authToken.split(' ')
    const token = bearer[1]

    jwt.verify(token, JWTSecret, (error, data) => {
        if(error){
            return res.status(401).json({error: 'Token inválido'})
        }

        req.token = token
        req.loggedUser = {id: data.id,email: data.email}
        next()
    })
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

        res.status(200).json({people, _links: HATEOAS})
    }catch{
        return res.status(404).json('Não há pessoas cadastradas')
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
            href: 'http://localhost:8081/person/'+id,
            method: 'DELETE',
            rel: 'delete_person'
        },
        {
            href: 'http://localhost:8081/person/'+id,
            method: 'PUT',
            rel: 'put_person'
        },
        {
            href: 'http://localhost:8081/auth',
            method: 'POST',
            rel: 'login'
        }
    ]

    if(!id){
        return res.status(400).json({error: 'Id inválido'})
    }

    let person = await Person.findOne({
        where: {
            id
        }
    })

    if(!person){
        return res.status(404).json({error: 'Pessoa não cadastrada'})
    }

    res.status(200).json({person, _links: HATEOAS})
})

app.post('/person', auth, async (req, res) => {
    let { name, age } = req.body

    if(!name || !age || age < 0){
        return res.status(400).json({error: 'Dados inválidos'})
    }

    let person = await Person.create({name, age})

    if(!person){
        return res.status(500).json({error: 'Erro interno ao cadastrar pessoa'})
    }

    res.status(200).json({success: 'Pessoa cadastrada'})

})

app.delete('/person/:id', auth, async (req, res) => {
    let id = req.params.id

    if(!id){
        return res.status(400).json({error: 'Id inválido'})
    }

    let person = await Person.destroy({
        where: {
            id
        }
    })

    if(!person){
        return res.status(404).json({error: 'Pessoa não encontrada'})
    }

    res.status(200).json({success: 'Pessoa excluída'})
})

app.put('/person/:id', auth, async (req, res) => {
    let id = req.params.id
    let { name, age } = req.body

    if(!id){
        return res.status(400).json({error: 'Id inválido'})
    }

    let person = await Person.update({name, age}, {
        where: {
            id
        }
    }) 

    if(!person){
        return res.status(404).json({error: 'Pessoa não encontrada'})
    }

    res.status(200).json({success: 'Pessoa editada'})
})

// user
app.get('/users', auth, async (req, res) => {

    let HATEOAS = [
        {
            href: 'http://localhost:8081/user/0',
            method: 'GET',
            rel: 'get_user'
        },
        {
            href: 'http://localhost:8081/auth',
            method: 'POST',
            rel: 'login'
        }
    ]

    let users = await User.findAll()
    
    if(!users){
        return res.sendStatus(404).json({error: 'Não há usuários cadastrados'})
    }

    res.status(200).json({users, _links: HATEOAS})
})

app.get('/user/:id', auth, async (req, res) => {
    let id = req.params.id

    let HATEOAS = [
        {
            href: 'http://localhost:8081/user/'+id,
            method: 'POST',
            rel: 'post_user'
        },
        {
            href: 'http://localhost:8081/user/'+id,
            method: 'DELETE',
            rel: 'delete_user'
        },
        {
            href: 'http://localhost:8081/auth',
            method: 'POST',
            rel: 'login'
        }
    ]

    if(!id){
        return res.status(400).json({error: 'Id inválido'})
    }

    let user = await User.findOne({
        where: {
            id
        }
    })

    if(!user){
        return res.status(404).json({error: 'Usuário não encontrado'})
    }

    res.status(200).json({user, _link: HATEOAS})
})

app.post('/user', auth, async (req, res) => {
    let { name, email, password } = req.body
    let salt = bcrypt.genSaltSync(10)
    let hash = bcrypt.hashSync(password, salt)

    if(!name || !email || !password){
        return res.status(400).json({error: 'Dados inválidos'})
    }

    let user = User.create({name, email, password: hash})

    if(!user){
        return res.status(500).json({error: 'Erro interno ao cadastrar usuário'})
    }

    res.status(200).json({success: 'Usuário cadastrado'})
})

app.delete('/user/:id', auth, async (req, res) => {
    let id = req.params.id

    let user = await User.destroy({
        where: {
            id
        }
    })

    if(!user){
        return res.status(404).json({error: 'Usuário não encontrado'})
    }

    res.status(200).json({success: 'Usuário deletado'})
})

app.post('/auth', async (req, res) => {
    let { email, password } = req.body

    if(!email){
        return res.status(400).json({error: 'Email inválido'})
    }

    let user = await User.findOne({
        where: {
            email
        }
    })

    if(!user){
        return res.status(404).json({error: 'Usuário não cadastrado'})
    }

    let validate = bcrypt.compareSync(password, user.password)

    if(!validate){
        return res.status(401).json({error: 'Credenciais inválidas'})
    }
    
    jwt.sign({id: user.id, email: user.email}, JWTSecret, {expiresIn: '48h'}, (error, token) => {

        if(error){
            return res.status(400).json({error: 'Credenciais inválidas'})
        }

        res.status(200).json({token})
    })
})

const port = 8081
app.listen(port, () => console.log('API is running'))
