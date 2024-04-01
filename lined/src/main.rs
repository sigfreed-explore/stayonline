use std::collections::BTreeMap;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use tokio::sync::Mutex;
use std::sync::Arc;
use ciborium::from_reader;
use clap::Parser;

#[derive(Parser)]
struct Args {
  tok: String,
  persist_dir: String,
}

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
    let args = Args::parse();
    let tree = Arc::new(Mutex::new(sled::open(args.persist_dir)?.open_tree("tpvs")?));

    let egressor = tokio::spawn(async move {
        let c = reqwest::Client::new();
        loop {
            let mut tpvs = BTreeMap::new();
            let t= tree.lock().await;
            for e in t.iter() {
              match e {
                Ok((k, v)) => {
                    // TODO: fail gracefully rather than `expect`ing
                    let k = Uuid::from_slice(&k).expect("bad sled key");
                    let v = from_reader(v.as_ref()).expect("bad sled val");
                    tpvs.insert(k,v);
                },
                Err(e) => eprintln!("Error reading TPV: {}", e),
              }
            }
            let msg = SyncMsg { tok: args.tok.clone(), tpvs };
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
        // let t = tree.lock().await;
        // t.insert("", "").expect("failed to write");
    });

    creator.await?;
    egressor.await?;
    Ok(())
}
