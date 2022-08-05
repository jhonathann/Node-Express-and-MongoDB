const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate");
const cors = require("./cors");

const Favorites = require("../models/favorites");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .populate("user")
      .populate("dishes")
      .then(
        (favorite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })

  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite == null) {
        Favorites.create({ user: req.user._id, dishes: req.body }).then(
          (favorite) => {
            Favorites.findById(favorite._id)
              .populate("user")
              .populate("dishes")
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
          },
          (err) => next(err)
        );
      } else {
        var mappedArray = favorite.dishes.map((dish) => dish.toHexString());
        for (let i = 0; i < req.body.length; i++) {
          if (mappedArray.indexOf(req.body[i]._id) === -1)
            favorite.dishes.push(req.body[i]);
        }

        favorite.save().then((favorite) => {
          Favorites.findById(favorite._id)
            .populate("user")
            .populate("dishes")
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            });
        });
      }
    });
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndDelete({ user: req.user._id })
      .then(
        (resp) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });
favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(
        (favorites) => {
          if (!favorites) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.json({ exists: false, favorites: favorites });
          } else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: false, favorites: favorites });
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: true, favorites: favorites });
            }
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite == null) {
        Favorites.create({
          user: req.user._id,
          dishes: [req.params.dishId],
        }).then(
          (favorite) => {
            Favorites.findById(favorite._id)
              .populate("user")
              .populate("dishes")
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              });
          },
          (err) => next(err)
        );
      } else {
        var mappedArray = favorite.dishes.map((dish) => dish.toHexString());
        if (mappedArray.indexOf(req.params.dishId) === -1)
          favorite.dishes.push(req.params.dishId);

        favorite.save().then((favorite) => {
          Favorites.findById(favorite._id)
            .populate("user")
            .populate("dishes")
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            });
        });
      }
    });
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite == null) {
        err = new Error("No favorites founded");
        err.status = 404;
        return next(err);
      } else {
        var mappedArray = favorite.dishes.map((dish) => dish.toHexString());
        if (mappedArray.indexOf(req.params.dishId) === -1) {
          err = new Error("This dish isn't marked as favorite");
          err.status = 404;
          return next(err);
        }

        favorite.dishes.pull({ _id: req.params.dishId });
        favorite.save().then((favorite) => {
          Favorites.findById(favorite._id)
            .populate("user")
            .populate("dishes")
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            });
        });
      }
    });
  });
module.exports = favoriteRouter;
