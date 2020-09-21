class ModelLoader {
    constructor(root) {
        this.obj_loader = new THREE.OBJLoader();
        this.fbx_loader = new THREE.FBXLoader();
        this.cache = {};
        this.pending = {};
        this.root = root || '/static/models/';
    }

    useTextureManager(textures) {
        this.textures = textures;
    }

    useShaderUniforms(uniforms) {
        this.shader_uniforms = uniforms;
    }

    /**
     * Loads a model with a potential texture and material.
     * 
     * Unique models are model + material (optional).
     * Texture is added to mesh after loading.
     */
    loadModel(modelInfo, callback) {
        let key = modelInfo.model;
        if (modelInfo.material) key += modelInfo.material;

        if (key == 'polygon') {
            let geometry = new THREE.PlaneGeometry( 1, 1.6, 1, 1 ); // WALL_HEIGHT
            let material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
            let plane = new THREE.Mesh( geometry, material );
            plane.position.set(0,0.8,0);
            plane.name = 'mesh-polygon';
            //plane.matrixAutoUpdate = false;

            callback(this.applyTextures(modelInfo, plane));
            return;
        }

        if (key == 'fishing-spot') {
            let geometry = new THREE.PlaneGeometry( 1, 1, 1, 1 );
            let material = new THREE.MeshBasicMaterial( {
                color: 0xffffff, 
                side: THREE.DoubleSide
            } );
            let plane = new THREE.Mesh( geometry, material );
            plane.matrixAutoUpdate = false;
            plane.renderOrder = 20;

            callback(this.applyTextures(modelInfo, plane));
            return;
        }

        if (this.pending[key]) {
            this.pending[key].callbacks.push({ modelInfo: modelInfo, callback: callback });
            return;
        }

        this.pending[key] = {callbacks:[{ modelInfo: modelInfo, callback: callback }]};

        if (modelInfo.material) {
            // TODO: Lots of special-cased features in these.
            var mtlLoader = new THREE.MTLLoader();
            mtlLoader.load(this.root + modelInfo.material, (materials) => {
                materials.preload();
                let loader = new THREE.OBJLoader();
                loader.setMaterials( materials );
                loader.load(this.root + modelInfo.model, (model) => {
                    this.loadedModel(key, modelInfo, model);    
                });
            });
        } else {
            let path = modelInfo.model.split('.').pop();
            let loader = path == 'fbx' ? this.fbx_loader : this.obj_loader;
            loader.load(this.root + modelInfo.model, (model) => {
                this.loadedModel(key, modelInfo, model);
            }, undefined, (error) => {
                console.error(error);
            });
        }
    }

    loadedModel(key, modelInfo, model) {
        model.matrixAutoUpdate = false;
        
        this.cache[key] = model;
        for (let c in this.pending[key].callbacks) {
            this.pending[key].callbacks[c].callback(
                this.applyTextures(this.pending[key].callbacks[c].modelInfo, model)
            );
        }
        delete this.pending[key];
    }

    /**
     * Returns a clone of the mesh with textures applied.
     */
    applyTextures(definition, mesh) {
        let clone = mesh.clone();

        if (!definition.multitexture &&
            !definition.texture && 
            !definition.color && 
            !definition.shader) return clone;

        clone.traverse( (n) => {
            if (n instanceof THREE.Mesh && n.material) {
                if (Array.isArray(n.material)) {
                    let materials = [];
                    for (let m in n.material) {
                        materials[m] = this.tweakMaterial(n.material[m], definition);
                    }
                    n.material = materials;
                } else {
                    n.material = this.tweakMaterial(n.material, definition);
                }
            }
        });

        // Apply shader, if any.
        if (definition.shader) {
            fetch('/static/shaders/' + definition.shader)
                .then( response => response.text() )
                .then( (response) => {
                    let shaderMaterial = new THREE.ShaderMaterial({
                        uniforms: this.shader_uniforms,
                        vertexShader: 
                            " varying vec2 vUv; " +
                            " void main() " +
                            " {" +
                            " vUv = uv;" +
                            " vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);" +
                            " gl_Position = projectionMatrix * modelViewPosition; " +
                            " }",
                        fragmentShader: response,
                        transparent: true,
                        alphaTest: 0.1,
                    });

                    //shaderMaterial.depthTest = false;

                    clone.traverse( (n) => {
                        if (n.isMesh) {
                            n.material = shaderMaterial;
                        }
                    });
                })
        }

        return clone;
    }

    tweakMaterial(material, definition) {
        let m = material.clone();
        m.side = THREE.DoubleSide;

        if (definition.color) {
            m.color = new THREE.Color(definition.color);
        }

        let textureFound = false;
        if (definition.multitexture) {
            let key = m.name.toUpperCase();
            let d = definition.multitexture[key];
            if (d) {
                m.transparent = true;    
                m.map = this.textures.getUri('/static/models/' + d.texture);
                m.alphaTest = definition.alphaTest || 0.5;
                textureFound = true;
            }
        }

        if (!textureFound && definition.texture) {
            m.transparent = true;
            m.map = this.textures.getUri('/static/models/' + definition.texture);
            m.alphaTest = definition.alphaTest || 0.5;
        }
        m.needsUpdate = true;
        return m;
    }
}

class SceneryLoader {
    constructor() {}

    useModelLoader(models) {
        this.loader = models;
    }

    useSceneryDefinitions(defs) {
        this.definitions = defs;
    }

    createScenery(definition, callback) {
        let m = this.definitions[definition.object];

        if (!m) {
            console.log("Invalid model: " + definition.object)
            return;
        }

        this.loader.loadModel(m, (mesh) => {
            if (m.scale) mesh.scale.set(N(m.scale.x), N(m.scale.y), N(m.scale.z));

            if (m.offset) {
                mesh.position.set(
                    N(m.offset.x),
                    N(m.offset.y),
                    N(m.offset.z));
            } else if (m.position) {
                // I'm not sure why position has to be negative, but it works.
                mesh.position.set(
                    -N(m.position.x),
                    -N(m.position.y),
                    -N(m.position.z));
            }

            if (m.model == 'fishing-spot') {
                mesh.rotateX(THREE.Math.degToRad(-90));
            }

            mesh.updateMatrix();

            callback(mesh, m);
        });
    }
}