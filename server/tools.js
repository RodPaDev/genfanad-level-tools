var express = require('express');
var fs = require('fs-extra');
var dir = require('./directory.js');

var mesh = require('./tools/mesh.js');
var buildings = require('./tools/buildings.js');

const root_dir = './tmp/';

exports.init = (app) => {
    app.use('/mesh', mesh.init(express.Router()));
    app.use('/buildings', buildings.init(express.Router()));
    return app;
}