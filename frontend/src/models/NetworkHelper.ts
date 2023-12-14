export class NetworkHelper {
  public static fetchOne<Type>(
    url: string,
    builder: (object: any) => Type,
  ): Promise<Type> {
    return this.executeFetch(url, builder);
  }

  public static fetchAll<Type>(
    url: string,
    builder: (object: any) => Type,
  ): Promise<Type> {
    return this.executeFetch(url, builder);
  }

  public static create<Type>(
    url: string,
    builder: (object: any) => Type,
    body: Object,
  ): Promise<Type> {
    const b: Object = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    return this.executeFetch(url, builder, b);
  }

  public static execute<Type>(
    url: string,
    builder: (object: any) => Type,
  ): Promise<Type> {
    return this.executeFetch(url, builder);
  }

  private static executeFetch<Type>(
    url: string,
    builder: (object: any) => Type,
    body?: Object,
  ): Promise<Type> {
    return new Promise((resolve, reject) => {
      fetch(url, body).then((res) => {
        if (res.status == 200) {
          res
            .json()
            .then((object) => {
              resolve(builder(object));
            })
            .catch((error) => {
              console.log("no or faulty json", error, url, res);
            });
        } else {
          res.text().then((error_text) => {
            reject({ status: res.status, text: error_text });
          });
        }
      });
    });
  }
}
