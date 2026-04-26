const firmwares = {
  "echo-zero-screen": [
    {
      v: "1.3",
      date: "2026-04-26",
    },
    {
      v: "1.1",
      date: "2026-04-20",
    },
  ],
  "echo-zero": [
    {
      v: "1.3",
      date: "2026-04-26",
    },
    {
      v: "1.1",
      date: "2026-04-20",
    },
  ],
};

export const DEVICE_DATA = Object.entries(firmwares).reduce((prev, [k, ev]) => {
  prev[k] = ev.map((e) => ({
    label: `v${e.v} | ${e.date}`,
    value: `${k}/v${e.v}`,
  }));
  return prev;
}, {});
