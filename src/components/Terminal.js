import React, { useRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import Shell, { ShellInfo } from './Shell';
import './Terminal.css';
import { cancelCommand, createShell, deleteShell, loadShells } from '../services/ShellService';
import { OverflowDetector } from 'react-overflow';
import determineShellname from '../utils/ShellUtils';
import { v4 as uuidv4 } from 'uuid';


function TerminalHeader ({ shells, onSelect, onCreateShell, onDeleteShell }) {
    const [isOverFlow, setIsOverflow] = useState(false);
    const [headerIndex, setIndex] = useState(0);
    
    const onScroll = (e) => {
        const element = document.getElementsByClassName("shell-headers-content")[0];
        const delta = Math.sign(e.deltaY) * -30;
        let newVal = Math.min(parseInt((element.style.left || "0").replace("px", "")) + delta, 0);
        newVal = Math.max(-element.scrollWidth + element.clientWidth, newVal);
        element.style.left = newVal + "px";
    }

    function handleOverflowChange(isOverflowed) {
        setIsOverflow(isOverflowed);
    }

    const onHeaderClick = (index) => {
        setIndex(index);
        onSelect(index);
    }

    const mouseDownHandler = (event, index) => {
        if( event.button === 1 ) {
            onDeleteShell(index);
        }
    };

    const headers = shells.map((shell, index) => {
        return <div key={index} className={`shell-header ${index === headerIndex ? 'active' : ''}`}  onClick={() => onHeaderClick(index)} onMouseDown={(e) => mouseDownHandler(e, index)}>{shell}</div>
    });

    return (
        <div className="shell-headers" onWheel={onScroll}>
            {isOverFlow ? <div className='scroll-arrow left'>{"<"}</div> : null}
            <div style={{overflow: "hidden", width: "100%"}}>
                <OverflowDetector className="shell-headers-content" onOverflowChange={handleOverflowChange}>
                    {headers}
                    {(headers.length > 1 || headers[0].props.name != "") 
                    ?   <div className="shell-header shell-plus" onClick={onCreateShell}>+</div> 
                    :   null
                    }
                </OverflowDetector>
            </div>
            {isOverFlow ? <div className='scroll-arrow left'>{">"}</div> : null}
        </div>
        
    );
}


export default class Terminal extends React.Component {
    constructor(props) {
        super(props);
        // const [initShellName, setInitShellName] = useState("");
        this.shells = [];
        
        this.state = {
            shellIndex: 0,
            headerKey: "header"
        };

        loadShells(props.location)
                .then(response => {
                    if (response.length > 0) {
                        response.forEach(shell => this.shells.push(shell));
                        this.props.setActiveShell(this.shells[0]);
                        this.forceUpdate();
                    }
                })
    }

    onCancel = () => {
        cancelCommand(this.shells[this.state.shellIndex].shellId);
    };
    
    onSelect = (index) => {
        console.log("index", this.shells[index]);
        this.props.setActiveShell(this.shells[index]);
        this.setState({shellIndex: index});
    };

    onCreatedSession = () => {
        this.forceUpdate();
    }

    onShellDelete (index) {
        const removedShell = this.shells.splice(index, 1)[0];
        console.log("removed", removedShell);
        if (removedShell.shellId) {
            setTimeout(() => {deleteShell(removedShell.shellId)}, 0);
        }

        if (this.shells.length > 0) {
            let index = this.state.shellIndex;
            if (index <= this.shells.length) {
                index -= 1;
            }

            this.setState({shellIndex: index});
            this.props.setActiveShell(this.shells[index]);
        }

        this.forceUpdate();
    }

    createShell () {
        this.addShell();
        this.setState({headerKey: this.state.headerKey + "I"});
    }

    addShell () {
        createShell(this.props.location)
                .then(shell => {
                    this.shells.push(shell);
                    if (this.shells.length === 1) 
                        this.props.setActiveShell(this.shells[0]);                    
                    this.forceUpdate();
                })
                .catch(err => alert("Unable to connect to the server.", err));
    }

    onCreateShell () {
        createShell(this.props.location, "").then(dto => {
            this.setState({
                connection: ConnectionStatus.CONNECTED
            });

            this.info.id = dto.id;
            this.info.createdAt = dto.createdAt;
            this.info.name = determineShellname(dto.createdAt);

            if (this.props.onCreatedSession) {
                this.props.onCreatedSession();
            }
        })
        .catch(err => {
            this.setState({connection: ConnectionStatus.OFFLINE});
            alert(err);                
        });            
    }

    
    render() {
        const headers = this.shells.map((shell) => shell.name);
        const shell =   <div className="terminal-container">
                            <TerminalHeader key={this.headerKey} shells={headers} onSelect={this.onSelect} onDeleteShell={(shell) => this.onShellDelete(shell)} onCreateShell={() => this.createShell()}/>
                            <Shell key={uuidv4()} info={this.shells[this.state.shellIndex]} location={location} autoConnect={true} onConnect={this.onConnect}/>
                            <button className="cancel-btn warn" onClick={() => this.onCancel()}>cancel</button>            
                        </div>;

        const connectButton = <div className='hacker-body'>
            <button className='connect-btn' onClick={() => this.addShell()}>&gt;_ Start SSH</button>
            <div className="noise"/>
        </div>;
        

        return (
            <>
                { this.shells.length === 0 
                ? connectButton
                : shell
                }
            </>
            
        );
    }
};
