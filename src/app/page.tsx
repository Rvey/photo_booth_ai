/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Camera } from "react-camera-pro";

export default function Home() {
  const [sseMessage, setSseMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [action, setAction] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [photo_style, setPhotoStyle] = useState("");
  const [initializeCamera, setInitializeCamera] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");

  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Store ws in a ref to access it in handlers
  const wsRef = useRef<WebSocket | null>(null);

  // Hardcoded clientId for this session
  const [myClientId, setMyClientId] = useState("client-12345");

  useEffect(() => {
    let ws: WebSocket | undefined;
    setConnectionStatus("Disconnected");

    const connectWebSocket = (clientId: string) => {
      ws = new window.WebSocket("ws://localhost:3002");
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("Connected");
        // Identify this client to the server with the id
        ws.send(JSON.stringify({ type: "identify", clientId }));
        console.log("WebSocket connected and clientId sent", clientId);
      };

      ws.onmessage = (event) => {
        try {
          if (
            typeof event.data === "string" &&
            event.data.trim().startsWith("{")
          ) {
            const data = JSON.parse(event.data);
            if (data.message) setSseMessage(data.message);
            if (data.name) setUserName(data.name);
            if (data.email) setUserEmail(data.email);
            if (data.serverMessage) setServerMessage(data.serverMessage);
            if (data.phone) setUserPhone(data.phone);
            if (data.photo_style) setPhotoStyle(data.photo_style);
            if (data.action) setAction(data.action);
            console.log("WebSocket message:", data);
          } else {
            console.log("Non-JSON WebSocket message:", event.data);
          }
        } catch (e) {
          console.warn("WebSocket message parse error:", event.data);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("Disconnected");
        console.log("WebSocket disconnected, retrying in 3s...");
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.warn("WebSocket error:", err);
        ws?.close();
      };
    };

    connectWebSocket(myClientId);

    return () => {
      if (ws) {
        ws.close();
        console.log("WebSocket connection closed.");
      }
    };
  }, [myClientId]);

  // Add effect to handle whatsapptriggered action
  useEffect(() => {
    if (action === "whatsapptriggered") {
      // Generate a new unique clientId
      const newClientId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      setMyClientId(newClientId);
    }
  }, [action]);

  useEffect(() => {
    if (action === "show_camera") {
      setCameraReady(false);
    }
  }, [action]);

  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;
    if (action === "show_camera") {
      setCameraReady(false);
      pollTimer = setInterval(() => {
        if (camera.current) {
          setCameraReady(true);
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 100);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [action]);

  useEffect(() => {
    if (action === "show_camera" && cameraReady) {
      // Add a 3 second delay before starting the countdown
      const delayTimer = setTimeout(() => {
        setCountdown(5);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev === 1) {
              clearInterval(timer);
              // Take photo after countdown
              if (camera.current && camera.current.takePhoto) {
                setImage(camera.current.takePhoto());
              }
              return null;
            }
            return prev ? prev - 1 : null;
          });
        }, 1000);
      }, 1000);
      return () => {
        clearTimeout(delayTimer);
      };
    } else {
      setCountdown(null);
    }
  }, [action, cameraReady]);

  return (
    <main className="h-screen w-screen flex flex-col bg-white max-w-lg mx-auto px-12 relative">
      <header className="p-4 text-center bg-white shadow">
        <h1 className="text-2xl font-bold">Showy</h1>
        <p className="text-sm text-gray-500">
          Connection Status:{" "}
          <span
            className={`${
              connectionStatus === "Connected"
                ? "text-green-500"
                : "text-red-300"
            }`}
          >
            {connectionStatus} - ({myClientId})
          </span>{" "}
        </p>
        {/* {userName && <h1 className="text-2xl font-bold">Hello {userName}</h1>}
        {serverMessage && (
          <h4 className="text-2xl font-bold">{serverMessage}</h4>
        )} */}
      </header>
      <div className="flex flex-col gap-4 p-4 justify-center h-full">
        {action === "whatsapptriggered" ? (
          <div className="text-center">
            <h1 className="text-center">{serverMessage}</h1>
          </div>
        ) : action === "information_gathering" ? (
          <div className="text-center">
            <h1 className="text-center">{serverMessage}</h1>
          </div>
        ) : action === "photo_style" ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-center">{serverMessage}</h1>
            <div className="flex flex-row gap-4 justify-center">
              <div className="w-66 h-66 bg-red-300 rounded-lg">Ghibli</div>
              <div className="w-66 h-66 bg-blue-300 rounded-lg">Sketch</div>
              <div className="w-66 h-66 bg-green-300 rounded-lg">Anime</div>
            </div>
          </div>
        ) : action === "selected_style" ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-center">{serverMessage}</h1>
            <div className="flex flex-row gap-4 justify-center">
              {photo_style === "Ghibli" ? (
                <div className="w-66 h-66 bg-red-300 rounded-lg">Ghibli</div>
              ) : photo_style === "Sketch" ? (
                <div className="w-66 h-66 bg-blue-300 rounded-lg">Sketch</div>
              ) : photo_style === "Anime" ? (
                <div className="w-66 h-66 bg-green-300 rounded-lg">Anime</div>
              ) : null}
            </div>
          </div>
        ) : action === "show_camera" ? (
          <div className="flex flex-col gap-4">
            <h1 className="text-center">Camera</h1>
            <Camera ref={camera} errorMessages={{}} />
            {countdown !== null && countdown > 0 && (
              <div
                className="text-center text-6xl text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]
 font-bold absolute top-1/2 left-1/2"
              >
                {" "}
                {countdown}
              </div>
            )}
            {/* <img src={image} alt="Taken photo" /> */}
          </div>
        ) : action === "processing_image" ? (
          <div className="text-center flex flex-col gap-4">
            <h1 className="text-center">{serverMessage}</h1>
            <div className="flex flex-row gap-4 justify-center">
              <img
                src={image}
                alt="Taken photo"
                className="w-66 h-66 bg-red-300 rounded-lg"
              />
              <div className="w-66 h-66 bg-red-300 rounded-lg">
                {photo_style}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {showForm ? (
              <div className="flex flex-col gap-4">
                <h1>Form</h1>
                <FormComponent
                  setEmail={setUserEmail}
                  setName={setUserName}
                  setPhone={setUserPhone}
                  email={userEmail}
                  name={userName}
                  phone={userPhone}
                  setAction={setAction}
                />
              </div>
            ) : (
              <>
                <button
                  className="bg-blue-500 text-white p-2 rounded"
                  onClick={() => {
                    setShowForm(true);
                    setInitializeCamera(true);
                    setSelectedStyle("qr");
                  }}
                >
                  Start
                </button>

                <div className="text-center">or</div>

                <div className="flex flex-col gap-4">
                  <h1 className="text-center">Scan qr code</h1>
                  <img src="./qr.png" alt="QR Code" />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export function FormComponent({
  setName,
  setEmail,
  setPhone,
  setAction,
  name,
  email,
  phone,
}: {
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setAction: (action: string) => void;
  setPhone: (phone: string) => void;
  name: string;
  email: string;
  phone: string;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAction("show_camera");
    console.log("Form submitted:", { name, email, phone });
    // Handle form submission logic here
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="tel"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Submit
      </button>
    </form>
  );
}
