import {useState, useRef} from 'react'


const CHUNK_SIZE = 10 * 1024 // amount * 1kb

const wait = (time) => {
    return new Promise((res, reject) => {
        setTimeout(() => res() , time)
    })
}

function App() {
    const fileRef = useRef();

    //these states we need only to display the progress
    const [fileSize, setFileSize] = useState(0);
    const [fileProgress, setFileProgress] = useState(0)
    const [loading, setLoading] = useState(false);
    const onBlockClick = () => {
        if (fileRef.current && !loading) {
            fileRef.current.click();
        }
    }

    const uploadChunk = (file, startChunk, endChunk) => {
        const reader = new FileReader();

        //GET parameters about chunk that we are sending here
        const params = new URLSearchParams();

        params.set('fileName', file.name)
        params.set('fileSize', file.size);
        params.set('start', startChunk);
        params.set('end', endChunk);

        console.log(startChunk, endChunk);
        const blob = file.slice(startChunk, endChunk);

        reader.onload = async (e) => {
            //here we receive data in right format (data:application/octet-stream;base64)
            const data = e.target.result

            //we actually can check response here and apply some logic, but I'm to lazy so I assume that everything is alright
            const response = await fetch(
                'http://localhost:2500/upload?' + params,
                {method: "POST", body: data, headers: {"Content-Type": "application/octet-stream"}},
            );
        }

        //after this function call data goes to `onload` event
        reader.readAsDataURL(blob);
    }

    const uploadFile = async (file) => {
        setFileSize(file.size);
        setLoading(true);
        //we always start uploading from the beginning of the file so startChunk is always 0
        let startChunk = 0;
        let endChunk = CHUNK_SIZE;

        while (endChunk < file.size) {
            //we use wait here just for more smooth display of progress
            await wait(100);
            //so on the first iteration we cut file data from 0 to CHUNK_SIZE
            uploadChunk(file, startChunk, endChunk)

            //after uploading of a chunk, we move forward to cut the next data of a file
            startChunk += CHUNK_SIZE;
            endChunk += CHUNK_SIZE;
            //our CHUNK_SIZE is static value so in case at the end left fileSize is smaller then our chunk
            //we calculate the rest of fileSize and set this value as endChunk
            //so we should always have the right chunkSize
            if (endChunk > file.size) {
                endChunk -= CHUNK_SIZE
                endChunk += (file.size - endChunk);
                // when we inside this function it means that this is the last iteration so we have to upload last chunk
                uploadChunk(file, startChunk, endChunk)
            }
            setFileProgress(endChunk);
        }

        setLoading(false);
    }

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            //in this example we work only with single file uploading
            const file = e.target.files[0];
            await uploadFile(file);
        }
    }


    return (
        <div className='center' onClick={onBlockClick}>
            <div className='file-upload__block'>
                <div className="file-upload__position-text">
                    <p className="file-upload__text">Upload Image</p>
                </div>

                <input type="file" className="hidden" ref={fileRef} onChange={onFileChange}/>

                <div className="center">
                    <div className="progress-block">
                        Progress<br />{fileProgress} / {fileSize}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default App
