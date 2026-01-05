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

  // Event listeners
  useEffect(() => {
    const onCallStart = () => {
      setLoading(false);
      setStarted(true);
    };
    const onCallEnd = () => {
      setStarted(false);
      setLoading(false);
    };
    const onSpeechStart = () => setAssistantIsSpeaking(true);
    const onSpeechEnd = () => setAssistantIsSpeaking(false);
    const onVolumeLevel = (level) => setVolumeLevel(level);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("volume-level", onVolumeLevel);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("volume-level", onVolumeLevel);
    };
  }, []);

  // Input change handler
  const handleInputChange = (setter) => (event) => setter(event.target.value);

  // Start assistant call
  const handleStart = async () => {
    if (!firstName || !lastName || !email || !phoneNumber) return;

    setLoading(true);
    try {
      const data = await startAssistant(firstName, lastName, email, phoneNumber);
      if (data?.id) {
        setCallId(data.id);
        setStarted(true);
      } else {
        alert("Failed to start call: Invalid response from assistant.");
      }
    } catch (err) {
      alert("Error starting call: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stop assistant call
  const handleStop = () => {
    stopAssistant();
    if (callId) getCallDetails(callId);
  };

  // Fetch call details
  const getCallDetails = (id, interval = 3000) => {
    if (!id) return;
    setLoadingResult(true);

    fetch("/call-details?call_id=" + id)
      .then((response) => response.json())
      .then((data) => {
        if (data.analysis && data.summary) {
          setCallResult(data);
          setLoadingResult(false);
        } else {
          setTimeout(() => getCallDetails(id, interval), interval);
        }
      })
      .catch((error) => {
        setLoadingResult(false);
        alert("Error fetching call details: " + error);
      });
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

      {loadingResult && <p>Loading call details... please wait</p>}

      {!loadingResult && callResult && (
        <div className="call-result">
          <p>Qualified: {callResult.analysis?.structuredData?.is_qualified?.toString()}</p>
          <p>{callResult.summary}</p>
        </div>
      )}

      {(loading || loadingResult) && <div className="loading"></div>}

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
