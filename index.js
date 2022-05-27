/**
 * lidonghao@2022.05.27
 */
const basePath = process.cwd();
const fs = require("fs");

const namePrefix = "Your Collection";
const description = "Remember to replace this description";
const baseUri = "ipfs://NewUriToReplace";

//套数x的路径，存放图片和完整的_metadata.json
const files1 = `${basePath}/files1`;
const files2 = `${basePath}/files2`;
//合并之后的路径
const mergeresult = `${basePath}/mergeresult`;
let attributesList = new Set();
let idList = new Set();
let metadataList = [];

const getMetaData = (path) => {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}
const cleanName = (_str) => {
    let nameWithoutExtension = _str.slice(0, -4);
    return nameWithoutExtension;
};
const generateAllJson = (path) => {
    let allJson = [];
    fs
        .readdirSync(path)
        .filter((item) => /.(json)$/g.test(item))
        .map((i, index) => {
            let jsonfile = `${path}/${i}`;
            const data = JSON.parse(fs.readFileSync(jsonfile, 'utf8'));
            let attrs = data.attributes;
            let newAttrs = [];
            attrs.map((attr) => {
                newAttrs.push(
                    {
                        "trait_type": attr.trait_type,
                        "value": attr.value
                    }
                )
            })
            let newMeta = {
                edition: i.slice(0, -5),
                name: `${namePrefix} #${i}`,
                description: description,
                image: `${baseUri}/${i}.png`,
                attributes: newAttrs,
            };
            allJson.push(newMeta);
        });
    //console.log(allJson);
    fs.writeFileSync(
        `${path}/json/_metadata.json`,
        JSON.stringify(allJson, null, 2)
    );

};

const getElements = (path) => {
    //合并所有json文件
    generateAllJson(path);
    const filesJson = `${path}/json/_metadata.json`;
    const metadatas = getMetaData(filesJson);
    //console.log("metadatas",metadatas);
    return fs
        .readdirSync(path)
        .filter((item) => /.(png)$/g.test(item))
        .map((i, index) => {
            if (i.includes("-")) {
                throw new Error(`layer name can not contain dashes, please fix: ${i}`);
            }
            let name = cleanName(i);
            //console.log(name,"name")
            let meta = metadatas.filter((data) => { return data.edition == name });
            let attributes = meta ? JSON.stringify(meta[0].attributes) : {};
            return {
                id: index,
                name: name,
                filename: i,
                path: `${path}/${i}`,
                meta: JSON.stringify(meta || {}),
                attributes: attributes,
            };
        });
};
const buildSetup = () => {
    if (fs.existsSync(mergeresult)) {
        fs.rmdirSync(mergeresult, { recursive: true });
    }
    fs.mkdirSync(mergeresult);
    fs.mkdirSync(`${mergeresult}/json`);
    fs.mkdirSync(`${mergeresult}/images`);
};
const saveImage = (item) => {
    var data = fs.readFileSync(item.path);
    fs.writeFileSync(`${mergeresult}/images/${item.name}.png`, data);
    console.log(`Writing image for ${item.name}`);
};
const saveMetaDataSingleFile = (item) => {
    let meta = item.meta;
    //console.log(meta)
    fs.writeFileSync(
        `${mergeresult}/json/${item.name}.json`,
        JSON.stringify(meta, null, 2)
    );
    console.log(`Writing metadata for ${item.name}`);
};
const saveAllMetaData = (_data) => {
    fs.writeFileSync(
        `${mergeresult}/json/_metadata.json`,
        JSON.stringify(_data, null, 2)
    );
};

const generateId = (min, max) => {
    let id = Math.floor(Math.random() * (max - min)) + min;
    if(!idList.has(id))
    {
        idList.add(id);
        return id;
    }else{
        generateId(min,max);
    }
}


const startCreating = async () => {
    try {
        let res1 = getElements(files1);
        let res2 = getElements(files2);
        let res = res1.concat(res2);
        res.map((item) => {
            let attributes = item.attributes;
            if (attributesList.has(attributes)) {
                throw new Error(`attributes already exists: ${attributes}`);
            } else {
                attributesList.add(attributes);
            }
        });
        let dateTime = Date.now();
        for (let i = 1; i <= res.length; i++) {
            
            //取随机id，唯一
            let id =generateId(0,10000);


            let item = res[i - 1];
            item.name = id;
            let oldMeta = JSON.parse(item.meta)[0];
            let attrs = oldMeta.attributes;
            let newAttrs = [];
            attrs.map((attr) => {
                newAttrs.push(attr)
            })

            //console.log(newAttrs)           

            let newMeta = {
                name: `${namePrefix} #${id}`,
                description: description,
                image: `${baseUri}/${id}.png`,
                //dna: oldMeta.dna,
                //edition: id,
                //date: dateTime,
                attributes: newAttrs,
                //compiler: oldMeta.compiler,
            }
            item.meta = newMeta;
            saveImage(item);
            saveMetaDataSingleFile(item);
            metadataList.push(newMeta);
        }
        saveAllMetaData(metadataList);
    }
    catch (e) {
        console.log(e)
    }
}
buildSetup();
startCreating();

//generateAllJson(files1);