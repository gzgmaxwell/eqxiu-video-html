const common = ["User", "Tags", "editor", 'backgourdColor', "noobGuide"];
const models = [];
for (const one of common) {
    models.push(require(`./${one}.js`).default);
}

export default models;
