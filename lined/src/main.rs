use std::collections::BTreeMap;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct SyncMsg {
    tok: String,
    tpvs: BTreeMap<Uuid, Tpv>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Tpv {
    time: String,
    lat: f64,
    lon: f64,
    // TODO: moar
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut tree = sled::open("lined")?.open_tree("tpvs")?;
    let tok = std::env::var("TOK")?;

    let egressor = tokio::spawn(async move {
        let c = reqwest::Client::new();
        loop {
            let msg = SyncMsg { tok: tok.clone(), tpvs: BTreeMap::new()};
            let mut body = Vec::<u8>::new();
            match ciborium::into_writer(&msg, &mut body) {
                // TODO
                Ok(_) => {},
                Err(e) => {
                    eprintln!("{}", e);
                    continue;
                },
            };
            let _res = c.post("https://important-crab-11.deno.dev/api/sync").body(body).send().await;
        }
    });

    let creator = tokio::spawn(async move {
        
    });

    creator.await?;
    egressor.await?;
    Ok(())
}
