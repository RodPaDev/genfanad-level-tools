/**
 * Tools for editing the scenery definitions and instances in the map.
 */

var Jimp = require("jimp");
var fs = require('fs-extra');

const root_dir = './tmp/';

function json(content) {
    return JSON.stringify(content, null, 2);
}

function placeModel(workspace, body) {
    let metadata = JSON.parse(fs.readFileSync(root_dir + workspace + '/metadata.json'));
    let objects = JSON.parse(fs.readFileSync(root_dir + workspace + '/objects.json'));

    let x = Number(body.x), y = Number(body.y);
    let gx = x + Number(metadata.MIN_X), gy = y + Number(metadata.MIN_Y);

    // validate no model exists already
    for (let i in objects) {
        let o = objects[i];
        if (o.x == x && o.y == y) {
            console.log("Object already exists at " + x + "," + y);
            return false;
        }
    }

    let object = {
        x: x, y: y,
        gx: gx, gy: gy,
        object: body.object,
    }
    if (body.rotation) object.rotation = Number(body.rotation);
    if (body.tint) object.tint = body.tint;

    let key = gx + "," + gy;
    objects[key] = object;

    fs.writeFileSync(root_dir + workspace + '/objects.json', json(objects));

    return true;
}

function modifyModel(workspace, body) {
    console.log("Modify: " + workspace + ": " + json(body));
    return false;
}

function deleteModel(workspace, body) {
    console.log("Delete: " + workspace + ": " + json(body));
    return false;
}

function createDefinition(workspace, body) {
    console.log("Create Definition: " + workspace + ": " + json(body));
    return false;
}

function modifyDefinition(workspace, body) {
    console.log("Modify Definition: " + workspace + ": " + json(body));
    return false;
}

exports.init = (app) => {
    app.post('/instance/place/:workspace', (req, res) => {
        res.send(placeModel(req.params.workspace, req.body));
    })
    app.post('/instance/modify/:workspace', async (req, res) => {
        res.send(modifyModel(req.params.workspace, req.body));
    })
    app.post('/instance/delete/:workspace', async (req, res) => {
        res.send(deleteModel(req.params.workspace, req.body));
    })

    app.post('/definition/create/:workspace', async (req, res) => {
        res.send(createDefinition(req.params.workspace, req.body));
    })
    app.post('/definition/modify/:workspace', async (req, res) => {
        res.send(modifyDefinition(req.params.workspace, req.body));
    })
    return app;
}