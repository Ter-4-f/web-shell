const backendBasePath = "http://localhost:8080";

async function cancelCommand (path, shellId) {
    const requestOptions = {
        method: 'POST'
    };

    const shellPath = `/shells/${shellId}/active-command:cancel`;

    return fetch(backendBasePath + path + shellPath, requestOptions)
        .then(response => {
            if (!response.ok) {
                console.error("Unable to cancel the shell", response);
            }
        });
}

export async function createShell(location, command) {
    const requestOptions = {
        method: 'POST',
        body: `{"command": "${command}"}`,
        headers: {
            "Content-Type": "application/json"
        }
    };
    const path = `/shells?host=${location.host}&port=${location.port}`;

    return fetch(backendBasePath + path, requestOptions)
        .then(async response => {
            if (response.ok) {
                return response.json();
            }

            const text = await response.text();
            throw new Error(text);
        });
}

export async function deleteShell(id) {
    const requestOptions = {method: 'DELETE'};
    const path = `/shells/${id}`;

    console.log("dell");
    return fetch(backendBasePath + path, requestOptions)
        .then(async response => {
            if (!response.ok) {
                console.log("unable to delete shell", await response.text());
            }
        });
}


//---- GET ----

export async function loadShells (location) {
    return fetch(backendBasePath + `/shells?host=${location.host}&port=${location.port}`)
        .then(response => response.json())
        .then(response => response.sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();

            return aTime - bTime;
          }));
}

export async function readOutput(id, onNext) {
    const requestOptions = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        }
    };
    const path = `/shells/${id}/output`;

    const response = await fetch(backendBasePath + path, requestOptions);
    const reader = response.body.getReader();
    
    const decoder = new TextDecoder('utf8');
    let first = true;
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                if (value) {
                    console.log("Chunking was marked as done but a chunk is still here:", value);
                }
                break;
            }

            // Process the current chunk data
            console.log("Value: \n", value);
            const chunkText = decoder.decode(value);
            console.log("Chunk: \n", chunkText);
            const result = checkBody(chunkText, first);

            if (onNext)
                result.forEach(line => {
                    onNext(line);
                });                
        }
    } catch (err) {
        console.log("Unable to read response: ");
        console.log(err);
    }
}


function checkBody (body) {
    let bodyLines = body.split('\n');

    bodyLines = bodyLines
    // .map(line => line.trim())
                         .map(line => {
                            if (line.startsWith("data:")) {
                                return line.replace("data:", "");
                            }
                            return line;
                         })
                         .filter(line => line !== "");
    console.log("Body: \n", bodyLines);

    return bodyLines;
}


// async function deleteShell(path, shellId) {
//     const requestOptions = {
//         method: 'DELETE'
//     };
//     const shellPath = `/shells/${shellId}`;

//     return fetch(backendBasePath + path + shellPath, requestOptions)
//         .then(response => {
//             if (!response.ok) {
//                 console.error("Unable to delete shell", response);
//             }
//         })
// }



// async function postCommand (path, command, shellId) {
//     const requestOptions = {
//         method: 'POST',
//         body: `{"command": "${command}"}`
//     };
//     const shellPath = shellId == null ? "/shells" : `/shells/${shellId}`;

//     return fetch(backendBasePath + path + shellPath, requestOptions)
//         .then(response => {
//             return response.json(); 
//         })
//         .then(command => {
//             try {
//                 return [convertCommand(command), command.output.lines];
//             } catch (error) {
//                 console.error("Unable to parse command: ", command, error);
//             }       
//             return null;
//         });
// }


// async function getCommandOutput (path, shellId, commandIndex, outputStart=0) {
//     const requestOptions = {
//         method: 'GET'
//     };
//     const pathArgs = `/shells/${shellId}/commands/${commandIndex}?startLine=${outputStart}`;

//     return fetch(backendBasePath + path + pathArgs, requestOptions)
//         .then(response => {
//             return response.json(); 
//         });
// }

// function convertCommand (commandDto) {
//     return new CliCommand(
//         commandDto.input, 
//         commandDto.status, 
//         commandDto.duration, 
//         new CliOutput(commandDto.output), 
//         commandDto.shellId
//     );
// }


// function convertCommands (commands) {
//     result = [];
//     commands.forEach(command => result.push(new CliCommand(
//         command.command, 
//         command.status, 
//         0, 
//         new CliOutput(command.output, command.lineCount), 
//         command.shellId
//     )));
//     return result;
// }
