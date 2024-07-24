import { ShellInfo } from "../components/Shell";
import { backendPath } from "../config";
import determineShellname from "../utils/ShellUtils";

export async function cancelCommand (shellId) {
    const requestOptions = {
        method: 'POST'
    };

    const shellPath = `/shells/${shellId}:cancel`;
    return fetch(backendPath + shellPath, requestOptions)
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

    return fetch(backendPath + path, requestOptions)
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

    return fetch(backendPath + path, requestOptions)
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }
        });
}

export async function sendSignal(shellId, signal) {
    const requestOptions = {
        method: 'POST',
        body: `{"command": "${signal}"}`,
        headers: {
            "Content-Type": "application/json"
        }
    };
    const path = `/shells/${shellId}?asSignal=true`;

    return fetch(backendPath + path, requestOptions)
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }
        })
        .catch(err => { console.error("Unable to send signal", signal, err)});
}

export async function deleteShell(id) {
    const requestOptions = {method: 'DELETE'};
    const path = `/shells/${id}`;

    connectionManager.remvoeShell(id);

    return fetch(backendPath + path, requestOptions)
        .then(async response => {
            if (!response.ok) {
                console.log("unable to delete shell", await response.text());
            }
        });
}


//---- GET ----

export async function loadShells (location) {
    return fetch(backendPath + `/shells?host=${location.host}&port=${location.port}`)
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
        this.events = {};
    }
    
    addShell (shellInfo) {
        this.connections[shellInfo.shellId] = shellInfo;
        const event = readOutput(shellInfo.shellId, (line) => shellInfo.parser.readChunk(line));
        this.events[shellInfo.shellId] = event;
    }

    remvoeShell (shellId) {
        this.connections[shellId] = undefined;
        this.events[shellId].close();
        this.events[shellId] = undefined;
    }

    getShell (shellId) {
        return this.connections[shellId];
    }
}
export const connectionManager = new ConnectionManager();



export function readOutput(id, onNext) {
    const path = `/shells/${id}/output`;
    const eventSource = new EventSource(backendPath + path);

    eventSource.onmessage = function(event) {
        if (onNext) {
            // console.log("Escaped message ", event.data);
            const data = parseData(event.data.replaceAll(/\\\\/g, '\\'));
            onNext(data);
        }
    };

    return eventSource;
}

function parseData (data) {
    try {
        return JSON.parse(`"${data}"`);
    } catch (e) {
        if (e.columnNumber)  {
            const okData = data.slice(0, e.columnNumber);
            // console.log("OK: ", okData, "\nremoved: ", data.charAt(e.columnNumber));
            return okData + "�" + parseData(data.slice(e.columnNumber + 1));
        }
        else {
            console.error("Unable to parse data", e, data);
            return "ERROR: unable to decode the message fromn the server\n";
        }
    }

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
