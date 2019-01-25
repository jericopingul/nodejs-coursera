const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const Dishes = require('../models/dishes')

const dishRouter = express.Router()

dishRouter.use(bodyParser.json())

dishRouter.route('/')
  .get((req, res, next) => {
    Dishes.find({})
      .then(dishes => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(dishes);
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .post((req, res, next) => {
    Dishes.create(req.body)
      .then(dish => {
          console.log('Dish created', dish);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(dish);
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .put((req, res, next) => {
    res.statusCode = 403
    res.end('PUT operation not supported on /dishes')
  })
  .delete((req, res, next) => {
    Dishes.remove({})
      .then(resp => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(resp);
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })

dishRouter.route('/:dishId')
  .get((req, res, next) => {
    Dishes.findById(req.params.dishId)
      .then(dish => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .post((req, res, next) => {
    res.statusCode = 403
    res.end('POST operation not supported on /dishes/' + req.params.dishId)
  })
  .put((req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, {
      $set: req.body // update will be in body
    }, { new: true })
      .then(dish => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .delete((req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
      .then(resp => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })

module.exports = dishRouter