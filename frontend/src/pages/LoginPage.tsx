import {useEffect, useState} from "react";
import {Login} from "../components/Login";
import {Page} from "../components/Page";

export function LoginPage() {
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
        <Page title={""}>
            <Login/>
        </Page>
    )
}