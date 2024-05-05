import Server from './components/Server';
import {default as Logo} from './icons/favicon.ico';
import { ALL_SERVERS } from './config';


let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

export default function Root() {
    const servers = ALL_SERVERS.map((server, index) => {
        return (
            <Server key={index}
                pcName={server.name}
                location={server.location}
                insertLines={server.insertLines}
                executeLines={server.executeLines}
            />
        )
    })


    return (
        <div>
            <div className="header">
                <img src={Logo} width="48" alt="Home" />
                <div className="header-right" id="links">
                    <a className="active" href="http://mediaserver.local:5000" target="_blank">Manager</a>
                    <a className="active" href="http://192.168.3.1/" target="_blank">Router</a>
                    <a className="active" href="http://mediaserver.local:8080" target="_blank">VNC</a>
                    <a className="active" href="http://mediaserver.local:8123" target="_blank">Smart</a>
                </div>
            </div> 
            {servers}
        </div>
      );
}
