export const backendBasePath = "http://localhost:8080";

export const ALL_SERVERS = [
    {
        name: "Raspberry",
        location: {
            host: "home.local",
            ip: "192.168.3.109",
            port: 22
        },
        insertLines: [
            {value: "echo test", label: "Test"}
        ],
        executeLines: [
            {value: "/mnt/private/download_repeat.sh", label: "Execute Repeat"}, 
            {value: "systemctl status openvpn@default.service", label: "vpn status"}, 
            {value: "df", label: "Disk Size"}
        ]
    }
    ,{
        name: "YT-DLP",
        location: {
            host: "home.local",
            ip: "192.168.3.109",
            port: 23
        },
        insertLines: [
            {value: "yt-dlp ", label: "yt-dlp"}
        ],
        executeLines: [
            {value: "curl ipconfig.io/json", label: "IP"},
            {value: 'yt-dlp \\"https://www.youtube.com/watch?v=I6rufOlNyYM\\"', label: "YT Test"},
        ]
    }
    ,{
        name: "NAS",
        location: {
            host: "mediaserver.local",
            ip: "192.168.3.92",
            port: 22
        },
        insertLines: [],
        executeLines: [
            {value: "echo activate browser", label: "activate browser"}
        ]
    }
]



export const ALL_SHORTCUTS = [
    {
        label: "Manager",
        host: "mediaserver.local",
        ip: "192.168.3.92"
    }
    ,{
        label: "VNC",
        host: "mediaserver.local:8080",
        ip: "192.168.3.92:8080"
    }
    ,{
        label: "Smart",
        host: "home.local:8123",
        ip: "192.168.3.109:8123"
    }
    ,{
        label: "Trans.",
        host: "home.local:9091",
        ip: "192.168.3.109:9091"
    }
    ,{
        label: "Router",
        host: "192.168.3.1",
        ip: "192.168.3.1"
    }
];
