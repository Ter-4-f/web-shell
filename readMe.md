# build Backend

cd backend  
mvn clean install
docker build -t web-shell/backend:0.0.1 .

# build frontend

cd frontend

1.  A local-config.js file is needed. Create it under src/  
    insert the following into it:

            export const backendBasePath = "/api"; // or ""
            export const backendPort = 8080; // only used locally, not behind proxy

            export const ALL_SERVERS = [
                {
                    name: "Raspberry",
                    location: {
                        host: "home.local",
                        ip: "192.168.1.X",
                        port: 22
                    },
                    insertLines: [
                        {value: "du -sh ", label: "size"}
                    ],
                    executeLines: [
                        {value: "systemctl status openvpn@default.service", label: "vpn status"},
                        {value: "df", label: "Disk Size"}
                    ]
                }
            ];

            export const ALL_SHORTCUTS = [{
                label: "Manager",
                host: "mediaserver.local",
                ip: "192.168.1.X"
            }]

2.  docker build -t web-shell/frontend:0.0.1 .
