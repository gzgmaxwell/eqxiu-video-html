const common = ['User', 'Tags', 'backgourdColor'];
const models = [];
for (const one of common) {
    models.push(require(`./${one}.js`).default);
}

export default models;
