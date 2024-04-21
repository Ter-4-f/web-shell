import { ShellInfo } from "../components/Shell";
import determineShellname from "../utils/ShellUtils";

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

export async function createShell(location) {
    const requestOptions = {
        method: 'POST'
    };
    const path = `/shells?host=${location.host}&port=${location.port}`;

    return fetch(backendBasePath + path, requestOptions)
        .then(async response => {
            if (response.ok) {
                return response.json();
            }

            const text = await response.text();
            throw new Error(text);
        })
        .then(shell => {
            const name = determineShellname(shell.createdAt);
            const info = new ShellInfo(shell.id, name, () => {});
            connectionManager.addShell(info);
            return info;
        });
}

export async function sendCommand(shellId, command) {
    const requestOptions = {
        method: 'POST',
        body: `{"command": "${command}"}`,
        headers: {
            "Content-Type": "application/json"
        }
    };
    const path = `/shells/${shellId}`;

    return fetch(backendBasePath + path, requestOptions)
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }
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
          }))
          .then(response => response.map(shell => {
                const name = determineShellname(shell.createdAt);
                const info = new ShellInfo(shell.id, name, () => {});
                connectionManager.addShell(info);
                return info;
            })
          );
}

class ConnectionManager {
    constructor () {
        this.connections = {};
    }
    
    addShell (shellInfo) {
        this.connections[shellInfo.shellId] = shellInfo;
        readOutput(shellInfo.shellId, (line) => shellInfo.addLine(line));
    }

    getShell (shellId) {
        return this.connections[shellId];
    }


}
export const connectionManager = new ConnectionManager();



export async function readOutput(id, onNext) {
    const requestOptions = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        }
    };
    const path = `/shells/${id}/output`;

    console.log("read");
    const response = await fetch(backendBasePath + path, requestOptions);
    console.log("after await");
    const reader = response.body.getReader();
    
    const decoder = new TextDecoder('utf8');
    let first = true;
    try {
        console.log("read parts");
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                if (value) {
                    console.log("Chunking was marked as done but a chunk is still here:", value);
                }
                break;
            }

            // Process the current chunk data
            const chunkText = decoder.decode(value);
            console.log("Chunk: \n", chunkText);
            const result = checkBody(chunkText, first);
            console.log("Result: \n", result);
            result.forEach(element => {
                if (onNext)
                    onNext(element);
            });
        }
    } catch (err) {
        console.log("Unable to read response: ");
        console.log(err);
    }
}


function checkBody (body) {
    let bodyLines = body.split('\n');


    for (let index = 0; index < bodyLines.length; index++) {
        let line = bodyLines[index];
        if (line.startsWith("data:")) {
            line = line.replace("data:", "");
            bodyLines[index] = line + "\n";
        }

        if (line.includes("\u001b[?2004l") && line.includes("\u001b[?2004h")) {
            const splitIndex = line.indexOf("\u001b[?2004h");
            bodyLines.splice(index, 1, line.substring(0, splitIndex), line.substring(splitIndex));
        }
        

    }
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
