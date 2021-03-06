const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;
  const {url, method} = request;

  const userAlreadyExist = users.find(user => user.username === username);

  const regexTodos = new RegExp(/\/todos/gi);

  if(userAlreadyExist && url === '/users' && method === 'POST'){
    return response.status(401).json({error: "Username já existente"});
  }

  if(url.match(regexTodos)?.length > 0 && !userAlreadyExist){
    return response.status(404).json({error: "Usuário inexistente!"});
  }

  request.user = userAlreadyExist;
  next();
}

app.post('/users', checksExistsUserAccount, (request, response) => {
  const {name, username} = request.body;

  const newVerificationIfUserAlreadExist = users.find(user => user.username === username);

  if(newVerificationIfUserAlreadExist){
    return response.status(400).json({error: "Usuário já cadastrado"});
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user);
  return response.status(201).json({user: user});
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  return response.status(200).json({todos: user.todos});
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);
  users[users.indexOf(user)] = user;
  return response.status(201).json({user: user});
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request; 
  const { id } = request.params;
  const { title, deadline } = request.body;
  const getTodo = user.todos.find(todo => todo.id === id);
  
  if(!getTodo){
    return response.status(404).json({error: "Todo inexistente!"});
  }
  getTodo.title = title ?? getTodo.title;
  getTodo.deadline = deadline ?? getTodo.deadline;
  getTodo.updated_at = new Date();
  
  user.todos[user.todos.indexOf(getTodo)] = getTodo;
  users[users.indexOf(user)] = user;
  return response.status(200).json({user: user});
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request; 
  const { id } = request.params;
  const { done } = request.body;
  const getTodo = user.todos.find(todo => todo.id === id);

  if(!getTodo){
    return response.status(404).json({error: "Todo inexistente!"});
  }

  getTodo.done = done;

  user.todos[user.todos.indexOf(getTodo)] = getTodo;
  users[users.indexOf(user)] = user;
  return response.status(200).json({user: user});
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request; 
  const { id } = request.params;
  const getTodo = user.todos.find(todo => todo.id === id);
  
  if(!getTodo){
    return response.status(404).json({error: "Todo inexistente!"});
  }

  user.todos.splice(user.todos.indexOf(getTodo), 1);
  users[users.indexOf(user)] = user;
  return response.status(204).json({});

});

module.exports = app;