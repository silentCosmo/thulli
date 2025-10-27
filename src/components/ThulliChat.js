"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ThulliChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(true); // ✅ New state for global auto voice
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopSpeech = () => {
    if (window.responsiveVoice) {
      window.responsiveVoice.cancel();
      setSpeakingIndex(null);
    }
  };

  const toggleSpeak = (msg, index) => {
    if (!window.responsiveVoice) return;

    if (speakingIndex === index) {
      stopSpeech();
      return;
    }

    stopSpeech();
    window.responsiveVoice.speak(msg.content, "Australian Female", {
      rate: 1,
      pitch: 1,
      volume: 1,
      onend: () => setSpeakingIndex(null),
    });
    setSpeakingIndex(index);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();
      let { reply } = data;

      const imageMatch = reply.match(/\[Image preview\]\((.*?)\)/);
      const imageUrl = imageMatch ? imageMatch[1] : null;

      reply = reply
        .replace(/\[Image preview\]\(.*?\)/g, "")
        .replace(/🖼️/g, "")
        .replace(/\*\*/g, "")
        .trim();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          image: imageUrl,
          showImage: false,
          imageDimensions: null,
        },
      ]);

      if (imageUrl) {
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            lastMsg.imageDimensions = { width, height };
            return updated;
          });
        };
        img.src = imageUrl;
      }

      let i = 0;
      const interval = setInterval(() => {
        i += 2;
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          lastMsg.content = reply.slice(0, i);
          if (i >= reply.length) {
            lastMsg.showImage = true;

            // ✅ Auto-play voice when complete if enabled
            if (autoSpeak && window.responsiveVoice) {
              stopSpeech();
              window.responsiveVoice.speak(reply, "Australian Female", {
                rate: 1,
                pitch: 1,
                volume: 1,
                onend: () => setSpeakingIndex(null),
              });
              setSpeakingIndex(updated.length - 1);
            }
          }
          return updated;
        });
        endRef.current?.scrollIntoView({ behavior: "smooth" });
        if (i >= reply.length) clearInterval(interval);
      }, 15);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error connecting to Thulli." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-[#0a0a0f] via-[#151526] to-[#0a0a0f] overflow-hidden text-gray-100 font-sans">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,#7c3aed_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Header */}
      <header className="z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-purple-800/40 shadow-[0_0_15px_#7c3aed80]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Thulli Logo"
            className="h-10 w-10 object-contain animate-pulse"
          />
          <span className="bg-gradient-to-r from-[#8ECDF7] via-[#B29BF4] to-[#F188C0] text-transparent bg-clip-text font-semibold tracking-wide text-lg">
            THULLI INTERFACE
          </span>
        </div>

        {/* 🔊 Auto Speak Toggle */}
        <button
          onClick={() => {
            setAutoSpeak((prev) => !prev);
            stopSpeech();
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border backdrop-blur-xl shadow-[0_0_5px_#4c1d95b0] ${
            autoSpeak
              ? "border-pink-500/30 text-pink-300 bg-pink-950/40 hover:shadow-[0_0_2px_#F188C0]"
              : "border-purple-700/30 text-purple-300 bg-purple-950/50 hover:shadow-[0_0_2px_#B29BF4]"
          }`}
          title={autoSpeak ? "Auto Voice Enabled" : "Auto Voice Disabled"}
        >
          {autoSpeak ? (
            <>
              <Volume2 size={16} className="animate-pulse" /> Auto Voice ON
            </>
          ) : (
            <>
              <VolumeX size={16} /> Auto Voice OFF
            </>
          )}
        </button>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-3 backdrop-blur-lg">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 animate-pulse">
            👋{" "}
            <span className="bg-gradient-to-r from-[#8ECDF7] via-[#B29BF4] to-[#F188C0] text-transparent bg-clip-text">
              Say hi to Thulli...
            </span>
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="space-y-2">
              {/* Image */}
              {msg.image && (
                <div className="flex flex-col justify-start mt-2">
                  <div className="relative w-fit max-w-xs">
                    <div
                      className="rounded-xl absolute bg-gradient-to-r from-[#1e1b4b] via-[#3b0764] to-[#1e1b4b] animate-pulse border border-purple-700/40 shadow-lg"
                      style={{
                        width: msg.imageDimensions?.width || "auto",
                        height: msg.imageDimensions?.height || "auto",
                        opacity: msg.showImage ? 0 : 1,
                        transition: "opacity 0.5s ease-out",
                      }}
                    />
                    <img
                      src={msg.image}
                      alt="Preview"
                      className="rounded-xl shadow-lg border border-purple-700/40 hover:scale-[1.03] transition-all duration-500"
                      style={{
                        width: msg.imageDimensions?.width || "auto",
                        height: msg.imageDimensions?.height || "auto",
                        opacity: msg.showImage ? 1 : 0,
                        transition: "opacity 0.8s ease-in",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bubble */}
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative max-w-[80%] px-4 py-3 rounded-2xl transition-all duration-300 shadow-md ${
                    msg.role === "user"
                      ? "bg-purple-600/80 rounded-tr-none text-white shadow-[0_0_10px_#7c3aedb0]"
                      : "bg-gray-800/70 rounded-tl-none bg-gradient-to-r from-[#8ECDF7] via-[#B29BF4] to-[#F188C0] text-transparent bg-clip-text border border-purple-700/30 shadow-[0_0_10px_#4c1d95b0]"
                  }`}
                >
                  {msg.content.split("\n").map((line, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {line}
                    </div>
                  ))}

                  {/* Per-message play button (still works) */}
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => toggleSpeak(msg, i)}
                      className={`mt-2 flex backdrop-blur-3xl bg-black/80 group absolute -bottom-3 -right-3 items-center gap-2 p-1.5 rounded-full border text-sm transition-all ${
                        speakingIndex === i
                          ? "border-pink-400 text-pink-300 bg-pink-950 animate-pulse shadow-[0_0_10px_#F188C0]"
                          : "border-purple-600/50 text-purple-300 hover:bg-purple-950 backdrop-blur-3xl"
                      }`}
                    >
                      {speakingIndex === i ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Thinking... */}
        {loading && (
          <div className="flex items-center text-purple-400 space-x-2 mt-3">
            <span className="animate-pulse">Thulli is thinking</span>
            <span className="animate-bounce">.</span>
            <span className="animate-bounce [animation-delay:0.2s]">.</span>
            <span className="animate-bounce [animation-delay:0.4s]">.</span>
          </div>
        )}

        <div ref={endRef} />
      </main>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="z-10 flex items-center gap-3 p-4 border-t border-purple-800/40 bg-gray-900/60 backdrop-blur-md"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 rounded-xl bg-gray-900/80 border border-purple-700/40 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 opacity-90 font-semibold rounded-xl text-shadow-2xs text-shadow-gray-950 text-gray-300 bg-gradient-to-r from-[#8ECDF7]/60 via-[#B29BF4]/60 to-[#F188C0]/50 hover:from-purple-500 hover:to-indigo-500 transition-all active:shadow-[0_0_10px_#7c3aedb0] disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <script src="https://code.responsivevoice.org/responsivevoice.js?key=CZcJU4cs"></script>
    </div>
  );
}
