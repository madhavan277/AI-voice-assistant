import { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant } from "./ai";
import ActiveCallDetails from "./call/ActiveCallDetails";

function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [callResult, setCallResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Event listeners for vapi
  useEffect(() => {
    if (!vapi) return;

    const onStart = () => {
      setLoading(false);
      setStarted(true);
    };

    const onEnd = () => {
      setStarted(false);
      setLoading(false);
    };

    vapi.on("call-start", onStart);
    vapi.on("call-end", onEnd);
    vapi.on("speech-start", () => setAssistantIsSpeaking(true));
    vapi.on("speech-end", () => setAssistantIsSpeaking(false));
    vapi.on("volume-level", (level) => setVolumeLevel(level));

    return () => {
      vapi.off("call-start", onStart);
      vapi.off("call-end", onEnd);
    };
  }, []);

  const handleInputChange = (setter) => (e) => setter(e.target.value);

  // ✅ Robust Start Handler with mic check
  const handleStart = async () => {
    if (!firstName || !lastName || !email || !phoneNumber) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Mic access granted:", stream);

      // Start assistant only after mic is granted
      const data = await startAssistant(firstName, lastName, email, phoneNumber);

      if (!data || !data.id) {
        throw new Error("Invalid call response from assistant");
      }

      setCallId(data.id);
      setLoading(false);
    } catch (err) {
      console.error("Failed to start call:", err);

      let msg = "Failed to start call. Check mic permission & console.";

      // Provide specific error messages
      if (err.name === "NotAllowedError") {
        msg = "Mic access denied. Please allow microphone permission in browser.";
      } else if (err.name === "NotFoundError") {
        msg = "No microphone detected. Please connect a microphone.";
      } else if (err.name === "NotReadableError") {
        msg = "Microphone is already in use by another app.";
      }

      alert(msg);
      setLoading(false);
    }
  };

  const handleStop = () => {
    stopAssistant();
  };

  const showForm = !loading && !started && !loadingResult && !callResult;
  const allFieldsFilled = firstName && lastName && email && phoneNumber;

  return (
    <div className="app-container">
      {showForm && (
        <>
          <h1>Contact Details (Required)</h1>

          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            className="input-field"
            onChange={handleInputChange(setFirstName)}
          />

          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            className="input-field"
            onChange={handleInputChange(setLastName)}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            className="input-field"
            onChange={handleInputChange(setEmail)}
          />

          <input
            type="tel"
            placeholder="Phone number"
            value={phoneNumber}
            className="input-field"
            onChange={handleInputChange(setPhoneNumber)}
          />

          <button
            onClick={handleStart}
            disabled={!allFieldsFilled || loading}
            className="button"
          >
            Start Application Call
          </button>
        </>
      )}

      {loading && <div className="loading">Starting call…</div>}

      {started && (
        <ActiveCallDetails
          assistantIsSpeaking={assistantIsSpeaking}
          volumeLevel={volumeLevel}
          endCallCallback={handleStop}
        />
      )}
    </div>
  );
}

export default App;
