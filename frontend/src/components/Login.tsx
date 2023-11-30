import styles from "./Login.module.scss"
import logo from "../assets/icons/react.svg"
import {TextField} from "./TextField";
import {useCallback, useState} from "react";

export function Login() {

    const [name, setName] = useState("")
    const [password, setPassword] = useState("")

    const onLoginClick = useCallback(() => {
        fetch("/api/time").then((res) => {
            try {
                console.log(res.status)
                if (res.status == 200) {
                    res.json().then((data) => {
                        setName(data["Time"])
                    })
                }
            }
            catch (e) {
                console.log(e)
            }
        })
    }, [name, password]);

    return (
        <div className={styles.container}>
            <div className={styles.logo_container}>
                <img className={styles.logo} src={logo}/>
            </div>
            <h1 className={styles.greeting}>Willkommen</h1>
            <div className={styles.login_container}>
                <TextField type={"text"} placeholder={"Nutzername"} onInput={(input) => setName(input)}/>
                <TextField type={"passwort"} placeholder={"Passwort"} onInput={(input) => setPassword(input)}/>
                <button onClick={onLoginClick}>{name}</button>
            </div>
        </div>
    )
}