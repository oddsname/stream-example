import express from "express"
import {createReadStream, appendFileSync, unlinkSync, renameSync, existsSync, writeFileSync} from "node:fs"
import {join} from "node:path";
import cors from "cors"
import bodyParser from "body-parser";

const app = express();

app.use(cors({origin: 'http://localhost:5173'}))

const fileNames = {};

app.get('/', (req, res) => {
    const path = join(process.cwd(), 'files', 'test.txt');
    let iterations = 0;

    createReadStream(path)
        .on('data', () => console.log(iterations++))
        .pipe(res);
});

app.post(
    '/upload',
    bodyParser.raw({type: "application/octet-stream"}),
    (req, res) => {
        const {fileName, fileSize, start, end} = req.query;
        const ext = fileName.split('.').pop();

        //generate a random name for a file based on original name so all the chunks that we send will go to the same generated file
        if(!fileNames[fileName]) {
            fileNames[fileName] = 'tmp_' + randomStr(8) + "." + ext;
        }

        const newFileName = fileNames[fileName];

        //need to cut off the `data:application/octet-stream;base64,` part
        const fileContent = req.body.toString().split(',').pop()
        //base64 here is required
        const buffer = new Buffer(fileContent, 'base64');

        //write all the chunks to the new file
        appendFileSync('./files/' + newFileName, buffer);

        res.json({ success: true })
    }
);

app.listen(2500)

function randomStr(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}