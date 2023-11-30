import './App.css';
import {useEffect, useState} from "react";
import logo from "../src/assets/images/logo.svg"

export default function App() {
    const [time, setTime] = useState(0)

    useEffect(() =>  {
            fetch("/time").then((res) => {
                try {
                    if (res.status == 200) {
                        res.json().then((data) => {
                            setTime(data["Time"])
                        })
                    }
                }
                catch (e) {
                    console.log(e)
                }
            })
        }
    )

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload. This is a test.
                </p>
                <p>CurrentTime: {time}</p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}
