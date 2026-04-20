const firmwares = {
  "echo-zero-screen": [
    { v: "1.1", date: "2026-04-20" },
    { v: "1.0", date: "2026-04-11" },
  ],
  "echo-zero": [
    { v: "1.1", date: "2026-04-21" },
    { v: "1.0", date: "2026-04-11" },
  ],
};

export const DEVICE_DATA = Object.entries(firmwares).reduce((prev, [k, ev]) => {
  prev[k] = ev.map((e) => ({
    label: `v${e.v} | ${e.date}`,
    value: `/firmwares/${k}/${e.v}_${e.date}.bin`,
  }));
  return prev;
}, {});
