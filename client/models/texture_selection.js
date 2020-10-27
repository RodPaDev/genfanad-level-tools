function titleCase(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getNameFromFilename(n) {
    return n.split("-").pop().split(".")[0];
}

function createImageElement(src) {
    let img = document.createElement("img");
    img.src = src;
    return img;
}

function createDiv(className) {
    let div = document.createElement("div");
    div.className = className;
    return div;
}

function createTextNode(name, element) {
    let textNode = document.createElement(element);
    textNode.id = name;
    textNode.textContent = name;
    return textNode;
}

class TextureSelection {
    openBuildingSelection(id) {
        this.building_id = id;
        this.building_type = id.split("-").slice(-2, -1)[0] + "s";
        this.texture_path = "/workspaces/" + WORKSPACES.opened + "/buildings/";

        this.selected_texture = document.getElementById(this.building_id).value;

        $("#buildings-dialog").dialog("open");
        $("#buildings-dialog").window("center");
        $("#buildings-dialog").dialog("setTitle", titleCase(this.building_type) + " Selection");
        $("#buildings-dialog").empty();

        this.displayTexturePreview();
    }

    displayTexturePreview() {
        let modal = document.getElementById("buildings-dialog");

        this.grouped_textures = this.createTextureGroups();

        this.previewElements = this.createPreviewElements();
        modal.appendChild(this.previewElements);
    }

    createPreviewElements() {
        let groups = createDiv("groups-container " + this.building_type);

        for (let [key, value] of Object.entries(this.grouped_textures)) {
            let group = createDiv("texture-group " + this.building_type);

            let imgWrapper = createDiv("img-wrapper");
            group.appendChild(createTextNode(key, "h1"));
            group.appendChild(imgWrapper);

            if (this.building_type === "roofs") {
                imgWrapper.appendChild(this.createRoofsBox(key, value));
            } else {
                for (let texture of value) {
                    imgWrapper.appendChild(this.createImageBox(texture));
                }
            }

            groups.appendChild(group);
        }

        return groups;
    }

    selectTexture(selectedElement) {
        let imgBox = document.getElementsByClassName("img-box");
        selectedElement.addEventListener("click", (e) => {
            e.preventDefault();

            Array.from(imgBox).forEach((box) => {
                box.classList.remove("tree-node-selected");
            });
            // this.selected_texture = e.target.dataset.textureId
            document.getElementById(this.building_id).value = e.target.dataset.textureId;
            selectedElement.classList.add("tree-node-selected");
        });
    }

    createRoofsBox(roofGroup, roofs) {
        let imgBox = createDiv("img-box roofs");
        let button = document.createElement("button");
        button.dataset.textureId = roofGroup;

        for (let [side, texture] of Object.entries(roofs)) {
            let roofsBox = createDiv("roofs-box");
            let img = createImageElement(this.texture_path + texture);
            let text = createTextNode(getNameFromFilename(side), "h2");

            roofsBox.appendChild(img);
            roofsBox.appendChild(text);
            imgBox.appendChild(roofsBox);
        }
        imgBox.appendChild(button);
        this.selectTexture(imgBox);
        return imgBox;
    }

    createImageBox(texture) {
        let imgBox = createDiv("img-box");
        let button = document.createElement("button");
        button.dataset.textureId =
            this.building_type === "walls"
                ? texture.split("/").pop().split(".")[0]
                : texture;

        let img =
            this.building_type === "floors"
                ? createImageElement(this.texture_path + this.building_type + "/" + texture)
                : createImageElement(this.texture_path + texture);

        let text = createTextNode(getNameFromFilename(texture), "h2");

        imgBox.appendChild(img);
        imgBox.appendChild(text);
        imgBox.appendChild(button);

        this.selectTexture(imgBox);
        return imgBox;
    }

    createTextureGroups() {
        let loadedTextures = WORKSPACES.current_map.loadedArgs[this.building_type];
        let groups = {};

        for (let tx in loadedTextures) {
            let key =
                this.building_type === "walls"
                    ? tx.split(".")[0].split("-").slice(0, -1).join("-")
                    : tx.split("-")[0].split(".")[0];

            if (!groups.hasOwnProperty(key)) groups[key] = [];

            groups[key] = groups[key].concat(loadedTextures[tx].texture);
        }
        return this.building_type === "roofs" ? loadedTextures : groups;
    }
}

var TEXTURE_SELECTION = new TextureSelection();
