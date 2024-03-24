import { Head, IS_BROWSER } from "$fresh/runtime.ts";
import { effect, signal } from "@preact/signals";
import { Map, Overlay, View } from "ol/index.js";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";
import { useGeographic } from "ol/proj.js";
import type { TPV } from "../db.ts";
useGeographic();
// https://openlayers.org/en/latest/examples/geographic.html

export default function MapComp({ piids }: { piids: string[] }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Head>
        <link rel="stylesheet" href="https://esm.sh/ol@9.0.0/ol.css" />
      </Head>
      {IS_BROWSER ? <ClientMap piids={piids} /> : <div class="spinner" />}
    </div>
  );
}

function ClientMap({ piids }: { piids: string[] }) {
  const lkls = signal<Record<string, TPV>>({});
  effect(() => {
    const ws = new URL("/api/watch", window.location.href);
    ws.protocol = ws.protocol.replace("http", "ws");
    const soc = new WebSocket(ws);
    soc.onopen = () => soc.send(JSON.stringify(piids));
    soc.onmessage = (m) =>
      lkls.value = Object.assign(lkls.value, JSON.parse(m.data));
    return () => soc.close();
  });
  const m = signal<HTMLDivElement | null>(null);
  effect(() => {
    if (!m.value) return;
    const map = new Map({
      target: m.value,
      layers: [new TileLayer({ source: new OSM({}) })],
      view: new View({
        center: [-89.733092, 43.413964],
        zoom: 15,
      }),
    });
    map.addOverlay(new Overlay({}));
    return () => map.setTarget();
  });
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        filter: "invert(100%) hue-rotate(180deg)",
      }}
      ref={(e) => m.value = e}
    />
  );
}
