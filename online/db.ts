const kv = await Deno.openKv();

// TODO: gen from rust struct
export interface TPV {
  time: string | null;
  lat: number | null;
  lon: number | null;
  [moar: string]: unknown;
}

export async function addTpvs(piid: string, tpvs: Record<string, TPV>) {
  const tx = kv.atomic();
  for (const [id, tpv] of Object.entries(tpvs)) {
    tx.set(["pis", piid, "tpvs", id], tpv);
    // TODO: index by time & maybe position
  }
  await tx.commit();
}

export async function getPiSecret(piid: string): Promise<string | null> {
  const r = await kv.get<string>(["pis", piid, "sec"]);
  return r.value;
}
