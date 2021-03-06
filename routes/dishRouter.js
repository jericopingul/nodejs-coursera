const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Dishes = require('../models/dishes');

const dishRouter = express.Router()

dishRouter.use(bodyParser.json())

dishRouter.route('/')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, (req, res, next) => {
    Dishes.find(req.query) // { featured: true }
      .populate('comments.author')
      .then(dishes => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(dishes); 
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // when post comes in authenticate first using middleware
    Dishes.create(req.body)
      .then(dish => {
          console.log('Dish created', dish);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(dish);
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403
    res.end('PUT operation not supported on /dishes')
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.remove({})
      .then(resp => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(resp);
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })

dishRouter.route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate('comments.author')
      .then(dish => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403
    res.end('POST operation not supported on /dishes/' + req.params.dishId)
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
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
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
      .then(resp => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })

  dishRouter.route('/:dishId/comments')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate('comments.author')
      .then(dish => {
          if(dish != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments);
          } else {
            err = new Error(`Dish ${req.params.dishId} not found`);
            err.status = 404;
            return next(err);
          }
        }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.user);
    Dishes.findById(req.params.dishId)
      .then(dish => {
        console.log(req.user);
        if(dish != null) {
          req.body.author = req.user._id;
          dish.comments.push(req.body);
          dish.save()
            .then(dish => {
              Dishes.findById(dish._id)
                .populate('comments.author')
                .then(dish => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(dish);
                });
            });
        } else {
          err = new Error(`Dish ${req.params.dishId} not found`);
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403
    res.end('PUT operation not supported on /dishes/' + req.params.dishId + '/comments')
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .then(dish => {
        if(dish != null) {
          let comments = dish.comments;
          for(let i = (comments.length - 1); i >= 0; i --) {
            comments.id(comments[i]._id).remove();
          }
          dish.save()
            .then(dish => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(dish);
            }, err => next(err))
        } else {
          err = new Error(`Dish ${req.params.dishId} not found`);
          err.status = 404;
          return next(err);
        }
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })

dishRouter.route('/:dishId/comments/:commentId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate('comments.author')
      .then(dish => {
        if(dish != null && dish.comments.id(req.params.commentId) != null) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(dish.comments.id(req.params.commentId));
        } else if(dish == null){
          err = new Error(`Dish ${req.params.dishId} not found`);
          err.status = 404;
          return next(err);
        } else { // comment null
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err); 
        }
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403
    res.end('POST operation not supported on /dishes/' + req.params.dishId + 
      '/comments/' + req.params.commentId)
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .then(dish => {
        const comment = dish.comments.id(req.params.commentId);
        if(dish != null && comment != null) {
          if(!req.user._id.equals(comment.author)) {
            // not the same author
            err = new Error(`You are not authorized to perform this operation!`);
            err.status = 403;
            return next(err);
          }
          if(req.body.rating) {
            dish.comments.id(req.params.commentId).rating = req.body.rating;
          }
          if(req.body.comment) {
            dish.comments.id(req.params.commentId).comment = req.body.comment;
          }
          dish.save()
            .then(dish => {
              Dishes.findById(dish._id)
                .populate('comments.author')
                .then(dish => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(dish);
                });
            }, err => next(err));
        } else if(dish == null) {
          err = new Error(`Dish ${req.params.dishId} not found`);
          err.status = 404;
          return next(err);
        } else { // comment null
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err); 
        }
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .then(dish => {
        const comment = dish.comments.id(req.params.commentId);
        if(dish != null && comment != null) {
          if(req.user._id.equals(comment.author)) {
            // can delete own comment
            dish.comments.id(req.params.commentId).remove();
            dish.save()
              .then(dish => {
                Dishes.findById(dish._id)
                  .populate('comments.author')
                  .then(dish => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                  });
              }, err => next(err))
          } else {
            // unauthorized
            err = new Error(`You are not authorized to perform this operation!`);
            err.status = 403;
            return next(err);
          }
        } else if(dish == null){
          err = new Error(`Dish ${req.params.dishId} not found`);
          err.status = 404;
          return next(err);
        } else { // comment null
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err); 
        }
      }, err => next(err))
      .catch(err => next(err)); // send to overall error handler
  })

module.exports = dishRouter