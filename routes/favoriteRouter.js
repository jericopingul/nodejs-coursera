const express = require('express')
const bodyParser = require('body-parser')
const Favorites = require('../models/favorite')
const authenticate = require('../authenticate')
const cors = require('./cors');

const favoriteRouter = express.Router()

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.user);
    Favorites.find({ user: req.user._id })
      .populate('user')
      .populate('dishes')
      .then(favorites => { 
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites); 
        }, err => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.user);
    Favorites.findOne({ user: req.user._id })
    .then(favorites => {
      // User favorites already exist
      if (favorites != null) {
        req.body.forEach(dish => favorites.dishes.push(dish._id));
        favorites.save()
          .then(favorites => {
            Favorites.findOne({ user: req.user._id })
              .populate('user')
              .populate('dishes')
              .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
              });
          });
      } else {
          // User favorites does not exist 
          Favorites.create({
            user: req.user._id,
            dishes: req.body || []
          })
            .populate('user')
            .populate('dishes')
            .then(favorites => {
              console.log('Favorites created', favorites);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorites);
            },err => next(err));
      }
    }, err => next(err))
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndDelete({ user: req.user._id })
      .then(resp => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
      }, err => next(err));
  });

favoriteRouter.route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    // res.statusCode = 403;
    // res.setHeader('Content-Type', 'text/plain');
    // res.end('GET operation not supported on /favorites/' + req.params.dishId);
    Favorites.findOne({ user: req.user._id })
      .then(favorites => {
        if(!favorites) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.json({ exists: false, favorites: favorites });
        } else {
          if(favorites.dishes.indexOf(req.params.dishId) < 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ exists: false, favorites: favorites });
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ exists: true, favorites: favorites })
          }
        }
      }, (err) => next(err))
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(favorites => {
        if(favorites.dishes.indexOf(req.params.dishId) === -1) {
          favorites.dishes.push(req.params.dishId);
          favorites.save()
          .then(favorites => {
            Favorites.findById(favorites._id)
              .populate('user')
              .populate('dishes')
              .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
              });
          });
        } else  {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites);
        }        
      });
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(favorites => {
        if(favorites != null) {
          favorites.dishes = favorites.dishes.filter(dishId => dishId != req.params.dishId);
          favorites.save()
          .then(favorites => {
            Favorites.findById(favorites._id)
              .populate('user')
              .populate('dishes')
              .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
              });
          });
        } 
      });
  });

module.exports = favoriteRouter;