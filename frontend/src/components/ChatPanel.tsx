import React, { useState } from "react";
import Panel from "./Panel";
import { api } from "../api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function ChatPanel({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm WeatherGPT. Ask me anything about the current weather, risk, rainfall or safety.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();

    if (!message || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
      },
    ]);

    setInput("");
    setLoading(true);
    setVoiceError("");

    try {
      const response = await api.chat(
        message,
        lat,
        lon
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.reply,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't process that request right now. Please check that the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceCommand = () => {
    setVoiceError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (listening) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (
      event: SpeechRecognitionEvent
    ) => {
      const transcript =
        event.results[0][0].transcript;

      console.log(
        "🎙️ Voice command:",
        transcript
      );

      setInput(transcript);

      // Automatically send voice command
      sendMessage(transcript);
    };

    recognition.onerror = (
      event: SpeechRecognitionErrorEvent
    ) => {
      console.error(
        "Voice recognition error:",
        event.error
      );

      setListening(false);

      if (event.error === "not-allowed") {
        setVoiceError(
          "Microphone permission denied. Please allow microphone access."
        );
      } else if (event.error === "no-speech") {
        setVoiceError(
          "No speech detected. Please try again."
        );
      } else {
        setVoiceError(
          "Voice recognition failed. Please try again."
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      setListening(true);
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start voice recognition:",
        error
      );

      setListening(false);

      setVoiceError(
        "Could not start microphone. Please try again."
      );
    }
  };

  return (
    <Panel title="WEATHERGPT AI">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: 420,
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                alignSelf:
                  message.role === "user"
                    ? "flex-end"
                    : "flex-start",

                maxWidth: "82%",

                background:
                  message.role === "user"
                    ? "rgba(34,211,238,0.12)"
                    : "rgba(255,255,255,0.05)",

                border:
                  message.role === "user"
                    ? "1px solid rgba(34,211,238,0.25)"
                    : "1px solid rgba(255,255,255,0.08)",

                borderRadius: 10,

                padding: "10px 12px",

                color:
                  message.role === "user"
                    ? "var(--accent-cyan)"
                    : "var(--text-primary)",

                fontSize: 12,

                lineHeight: 1.5,

                whiteSpace: "pre-wrap",
              }}
            >
              {message.text}
            </div>
          ))}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                color: "var(--accent-cyan)",
                fontSize: 12,
                padding: "8px 4px",
              }}
            >
              WeatherGPT is thinking...
            </div>
          )}
        </div>

        {/* Voice error */}
        {voiceError && (
          <div
            style={{
              color: "var(--accent-red)",
              fontSize: 10,
              padding: "4px 2px",
            }}
          >
            {voiceError}
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            borderTop:
              "1px solid rgba(255,255,255,0.08)",
            paddingTop: 10,
          }}
        >
          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Ask WeatherGPT..."
            disabled={loading}
            style={{
              flex: 1,
              minWidth: 0,
              background:
                "rgba(255,255,255,0.04)",
              border:
                "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "var(--text-primary)",
              outline: "none",
              fontSize: 12,
            }}
          />

          {/* Voice button */}
          <button
            onClick={startVoiceCommand}
            disabled={loading || listening}
            title={
              listening
                ? "Listening..."
                : "Voice Command"
            }
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              border: listening
                ? "1px solid #EF4444"
                : "1px solid var(--accent-cyan)",
              background: listening
                ? "rgba(239,68,68,0.15)"
                : "rgba(34,211,238,0.08)",
              color: listening
                ? "#EF4444"
                : "var(--accent-cyan)",
              cursor:
                loading || listening
                  ? "default"
                  : "pointer",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {listening ? "🔴" : "🎙️"}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={
              loading || !input.trim()
            }
            style={{
              height: 42,
              padding: "0 14px",
              borderRadius: 8,
              border: "none",
              background:
                "var(--accent-cyan)",
              color: "#061018",
              fontWeight: 700,
              cursor:
                loading || !input.trim()
                  ? "default"
                  : "pointer",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            SEND
          </button>
        </div>
      </div>
    </Panel>
  );
}