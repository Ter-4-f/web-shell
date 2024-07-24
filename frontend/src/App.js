import Server from './components/Server';
import {default as Logo} from './icons/favicon.ico';
import { ALL_SERVERS, ALL_SHORTCUTS } from './local-config';
import { v4 as uuidv4 } from 'uuid';


let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);


function iOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.userAgent)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }



function Header () {
    const isIos = iOS();
    const shortCurts = ALL_SHORTCUTS.map(shortcut => {
        return <a key={uuidv4()} className="active" href={`http://${isIos ? shortcut.ip : shortcut.host}`} target="_blank">{shortcut.label}</a>
    })

    ALL_SHORTCUTS
    return  <div className="header">
                <img src={Logo} width="48" alt="Home" />
                <div className="header-right" id="links">
                    {shortCurts}
                </div>
            </div> 
}

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
        <div className="website">
            <Header />
            <div className="servers">
                {servers}
            </div>
        </div>
      );
}
