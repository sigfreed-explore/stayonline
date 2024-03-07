use serde::{Serialize, Deserialize};
use gpsd_proto::Tpv;
use uuid::Uuid;

#[derive(Debug, Serialize)]
struct SyncMsg {
    tok: String,
    tpvs: Vec<Tpv>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let tree = sled::open("lined")?.open_tree("tpvs")?;
    // let _f = BloomFilter::with_rate(2f32.powi(-8), 256);

    let egressor = tokio::spawn(async move {
        let c = reqwest::Client::new();
        loop {
            let msg = SyncMsg { tok: format!("TODO"), tpvs: vec![]};
            let body = Vec::<u8>::new();
            ciborium::into_writer(&msg, &mut body);
            let res = c.post("https://important-crab-11.deno.dev/api/sync").body(body).send().await;
        }
    });

    let creator = tokio::spawn(async move {
        
    });

    creator.await?;
    egressor.await?;
    Ok(())
}
