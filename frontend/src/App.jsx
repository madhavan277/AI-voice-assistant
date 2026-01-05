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

  // safe event binding
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

  //FIXED START HANDLER
  const handleStart = async () => {
    if (!firstName || !lastName || !email || !phoneNumber) return;

    setLoading(true);

    try {
      // 🔐 Mic permission (CRITICAL)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const data = await startAssistant(
        firstName,
        lastName,
        email,
        phoneNumber
      );

      if (!data || !data.id) {
        throw new Error("Invalid call response");
      }

      setCallId(data.id);
    } catch (err) {
      console.error("Start failed:", err);
      alert("Failed to start call. Check mic permission & console.");
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

      {loading && <div className="loading"></div>}

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
