import React, { useState } from "react";
import * as esptooljs from "esptool-js";
import { DEVICE_DATA } from "./firmwares";

const ESPLoader = esptooljs.ESPLoader;
const Transport = esptooljs.Transport;

const colors = {
  bg: "#000000",
  cardBg: "#111111",
  text: "#ffffff",
  accent: "#FFC107",
  border: "#333333",
};

const IconUSB = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 22h2" />
    <path d="M7 10v2a5 5 0 0 0 10 0v-2" />
    <path d="M12 2v10" />
    <path d="m16 8-4-4-4 4" />
  </svg>
);
const IconFile = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconZap = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

function App() {
  const [deviceType, setDeviceType] = useState(Object.keys(DEVICE_DATA)[0]);
  const [selectedFirmware, setSelectedFirmware] = useState(
    DEVICE_DATA[Object.keys(DEVICE_DATA)[0]][0].value,
  );
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("SYSTEM READY");
  const [isFlashing, setIsFlashing] = useState(false);

  const handleDeviceChange = (e) => {
    const type = e.target.value;
    setDeviceType(type);
    setSelectedFirmware(DEVICE_DATA[type][0].value);
  };

  const flashDevice = async () => {
    try {
      setIsFlashing(true);
      setStatus("INITIALIZING SERIAL...");

      const device = await navigator.serial.requestPort();
      const transport = new Transport(device);

      const robustTerminal = {
        log: (msg) => console.log(msg),
        write: (msg) => console.log(msg),
        writeLine: (msg) => console.log(msg),
        info: (msg) => console.info(msg),
        error: (msg) => console.error(msg),
        clean: () => console.clear(),
      };

      setStatus("CONNECTING TO CHIP...");

      const esploader = new ESPLoader({
        transport: transport,
        baudrate: 115200,
        terminal: robustTerminal,
      });

      await esploader.main();

      const firmwareParts = [
        { path: "bootloader.bin", address: 0x0 },
        { path: "partitions.bin", address: 0x8000 },
        { path: "firmware.bin", address: 0x10000 },
      ];

      setStatus(`FETCHING BINARY...`);
      const fileArray = [];
      for (const part of firmwareParts) {
        setStatus(`FETCHING ${part.path}...`);
        const res = await fetch(
          `${process.env.PUBLIC_URL}/firmwares/${selectedFirmware}/${part.path}`,
        );
        const blob = await res.arrayBuffer();
        fileArray.push({ data: new Uint8Array(blob), address: part.address });
      }

      setStatus("FLASHING ALL PARTS...");
      await esploader.writeFlash({
        fileArray: fileArray,
        flashSize: "keep",
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          setProgress(Math.round((written / total) * 100));
        },
      });

      setStatus("FLASH SUCCESSFUL");
      await transport.disconnect();
    } catch (err) {
      console.error("Flash Error:", err);
      setStatus(`ERROR: ${err.message?.toUpperCase() || "CONNECTION FAILED"}`);
    } finally {
      setIsFlashing(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        minHeight: "100vh",
        padding: "60px 20px",
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      <div style={{ maxWidth: "750px", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1
            style={{
              color: colors.accent,
              fontSize: "3.5rem",
              letterSpacing: "4px",
              margin: "0",
              fontWeight: "900",
            }}
          >
            CHARLIE ECHO
          </h1>
          <div
            style={{
              backgroundColor: colors.accent,
              color: "#000",
              display: "inline-block",
              padding: "4px 12px",
              fontWeight: "bold",
              marginTop: "10px",
              fontSize: "1.1rem",
            }}
          >
            WEB-BASED FIRMWARE FLASHER
          </div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {/* Step 1 */}
          <div style={stepCardStyle}>
            <div style={iconCircleStyle}>
              <IconUSB />
            </div>
            <div>
              <div style={labelStyle}>STEP 01</div>
              <p style={{ margin: 0, fontSize: "0.95rem" }}>
                Plug your Charlie Echo into the USB port.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={stepCardStyle}>
            <div style={iconCircleStyle}>
              <IconFile />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={labelStyle}>STEP 02</div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  marginBottom: "15px",
                }}
              >
                CONFIGURE TARGET
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                    DEVICE TYPE
                  </span>
                  <select
                    style={selectStyle}
                    disabled={isFlashing}
                    value={deviceType}
                    onChange={handleDeviceChange}
                  >
                    {Object.keys(DEVICE_DATA).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                    FIRMWARE VERSION
                  </span>
                  <select
                    style={selectStyle}
                    disabled={isFlashing}
                    value={selectedFirmware}
                    onChange={(e) => setSelectedFirmware(e.target.value)}
                  >
                    {DEVICE_DATA[deviceType].map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={stepCardStyle}>
            <div style={iconCircleStyle}>
              <IconZap />
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={labelStyle}>STEP 03</div>
              <button
                onClick={flashDevice}
                disabled={isFlashing}
                style={{
                  ...btnStyle,
                  backgroundColor: isFlashing ? "#222" : colors.accent,
                  color: isFlashing ? colors.accent : "#000",
                }}
              >
                {isFlashing ? "FLASHING..." : "FLASH"}
              </button>
            </div>
          </div>
        </div>

        {/* Status Console */}
        {(isFlashing || progress > 0) && (
          <div
            style={{
              marginTop: "50px",
              padding: "30px",
              border: `2px solid ${colors.accent}`,
              backgroundColor: "#0a0a0a",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
                fontSize: "1.3rem",
                fontWeight: "bold",
              }}
            >
              <span style={{ color: colors.accent }}>{status}</span>
              <span>{progress}%</span>
            </div>
            <div
              style={{
                height: "14px",
                background: "#222",
                width: "100%",
                borderRadius: "7px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: colors.accent,
                  width: `${progress}%`,
                  transition: "width 0.2s",
                  borderRadius: "7px",
                  boxShadow: `0 0 15px ${colors.accent}`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const stepCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "30px",
  padding: "35px",
  background: colors.cardBg,
  borderLeft: `10px solid ${colors.accent}`,
  borderRadius: "0 8px 8px 0",
};

const iconCircleStyle = {
  color: colors.accent,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const labelStyle = {
  fontSize: "1rem",
  color: colors.accent,
  fontWeight: "bold",
  marginBottom: "8px",
};

const selectStyle = {
  width: "100%",
  background: "#000",
  color: "#fff",
  border: `2px solid ${colors.border}`,
  padding: "15px",
  fontSize: "1.1rem",
  fontWeight: "bold",
  outline: "none",
  marginTop: "5px",
};

const btnStyle = {
  width: "100%",
  padding: "20px",
  border: "none",
  fontWeight: "900",
  fontSize: "1.5rem",
  cursor: "pointer",
  letterSpacing: "1px",
};

export default App;
