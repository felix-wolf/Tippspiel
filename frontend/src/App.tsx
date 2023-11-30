import {useState, useEffect} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import styles from './App.module.scss'

function App() {
    const [count, setCount] = useState(0)
    const [time, setTime] = useState("0")

    useEffect(() =>  {
        fetch("/api/time").then((res) => {
            try {
                console.log(res.status)
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
    }, [])


    return (
        <div  className={styles.root}>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className={styles.logo} alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className={styles.logo} alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className={styles.card}>
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}. Time is {time}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className={styles.readTheDocs}>
                Click on the Vite and React logos to learn more
            </p>
        </div>
    )
}

export default App
