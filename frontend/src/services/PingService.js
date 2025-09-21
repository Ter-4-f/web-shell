import { backendPath } from "../config";

export const HostStatus = Object.freeze({
    INIT: "HostStatus.INIT",
    UNKNOWN: "HostStatus.UNKNOWN",
    AWAKE: "HostStatus.AWAKE",
    DOWN: "HostStatus.DOWN",
    SHUTTING_DOWN: "HostStatus.SHUTTING_DOWN"
});

export async function pingHost(location) {
    const requestOptions = {
        method: 'POST',
        body: `{"host": "${location.ip}"}`,
        headers: {
            "Content-Type": "application/json"
        }        
    };
    const path = `/ping`;

    return fetch(backendPath + path, requestOptions)
        .then(async response => {
            if (response.ok) {
                const result =  await response.json();
                return result.result ? HostStatus.AWAKE : HostStatus.DOWN;
            }

            return HostStatus.UNKNOWN;
        });
}

export async function shutdownHost(location) {
    const requestOptions = {
        method: 'delete'      
    };

    return fetch(backendPath + `/hosts?host=${location.host}&port=${location.port}`, requestOptions)
        .then(async response => {
            if (response.ok) {
                const result =  await response.json();
                return result.result ? HostStatus.SHUTTING_DOWN : HostStatus.AWAKE;
            }

            return HostStatus.AWAKE;
        });
}