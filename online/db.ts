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
    tx.set(["tpvs", piid, id], tpv);
    // TODO: index by time & maybe position
  }
  await tx.commit();
}

export interface PiMeta {
  name: string;
  accentBackground: string;
  secret: string;
}

export async function getPi(piid: string) {
  const r = await kv.get<PiMeta>(["pi", "meta", piid]);
  return r.value;
}

export function getPis() {
  return kv.list({ prefix: ["pi", "meta"] });
}

export async function addPi(piid: string, meta: PiMeta) {
  await kv.set(["pi", "meta", piid], meta);
}
