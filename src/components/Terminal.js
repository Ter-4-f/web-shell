import React, { useRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import Shell from './Shell';
import './Terminal.css';
import { deleteShell, loadShells } from '../services/ShellService';
import { OverflowDetector } from 'react-overflow';
import determineShellname from '../utils/ShellUtils';





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
        console.log("Overflow", isOverflowed);
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
        this.addShell();
        
        this.state = {
            shellIndex: 0,
            headerKey: "header"
        };

        loadShells(props.location)
                .then(response => {
                    if (response.length > 0) {
                        this.shells = [];
                        console.log("reset");
                        response.forEach(shell => {
                            shell.name = determineShellname(shell.createdAt);
                            this.shells.push(<Shell key={crypto.randomUUID()} info={shell} location={location} autoConnect={true} onConnect={this.onConnect}/>);
                            console.log("Pushed new shell", this.shells.length);
                            this.forceUpdate();
                        });
                    }
                })
    }


    insertCommand = () => {
        
    };

    onCancel = () => {
        
    };
    
    onSelect = (index) => {
        this.setState({shellIndex: index});
    };

    onCreatedSession = () => {
        console.log("connected, shells?", this.shells.length);
        this.forceUpdate();
    }

    onShellDelete (index) {
        const removedShell = this.shells.splice(index, 1);
        if (removedShell.id) {
            setTimeout(() => {deleteShell(removedShell.id)}, 0);
        }
        

        if (this.shells.length === 0) {
            this.addShell();
        }

        this.forceUpdate();
    }

    addShell () {
        this.shells.push(<Shell key={crypto.randomUUID()} info={{name: ""}} location={this.props.location} onCreatedSession={(shell) => this.onCreatedSession(shell)} />);
    }

    
    render() {
        const activeShell = this.shells[this.state.shellIndex]
        const headers = this.shells.map((shell) => shell.props.info.name);

        console.log("render", headers);

        return (
            <div className="terminal-container">
                <TerminalHeader key={this.headerKey} shells={headers} onSelect={this.onSelect} onDeleteShell={(shell) => this.onShellDelete(shell)}/>
                {activeShell}       
                <button className="cancel-btn warn" onClick={() => this.onCancel()}>cancel</button>            
            </div>
        );
    }
};
