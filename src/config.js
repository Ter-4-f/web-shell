export const ALL_SERVERS = [
    {
        name: "Raspberry",
        location: {
            host: "home.local",
            port: 22
        },
        insertLines: [
            {value: "echo test", label: "Test"}
        ],
        executeLines: [
            {value: "/mnt/private/download_repeat.sh", label: "Execute Repeat"}, 
            {value: "echo test", label: "Echo"}, 
            {value: "df", label: "Disk Size"}
        ]
    }
    // ,{
    //     name: "YT-DLP",
    //     location: {
    //         host: "home.local",
    //         port: 23
    //     },
    //     insertLines: [
    //         {value: "yt-dlp ", label: "yt-dlp"}
    //     ],
    //     executeLines: [
    //         {value: "curl ipconfig.io/json", label: "IP"},
    //         {value: "systemctl status openvpn@default.service", label: "IP"}
    //     ]
    // }
]