import { useState, useRef, useEffect } from "react";

console.log(">>>> VITE_API_URL is:", import.meta.env.VITE_API_URL);

export default function FeronChat() {
  const [walletAddress, setWalletAddress] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 🟡 Connect Wallet + Auto-detect
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    } else {
      alert("MetaMask not detected. Please install it.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feron`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMessage = { role: "assistant", content: data.reply };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "FERON encountered an issue or did not respond." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Error contacting FERON backend." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    setMessages((prev) => [
      ...prev,
      { role: "system", content: `Uploaded file: ${file.name}` },
    ]);
  };

  return (    
    <><div style={{ display: "flex", gap: "12px", justifyContent: "center", margin: "20px 0" }}>
      <a
        href="https://ferontriallicensebip.vercel.app/"
        style={{
          padding: "10px 20px",
          backgroundColor: "#4F46E5",
          color: "white",
          borderRadius: "6px",
          fontSize: "14px",
          textDecoration: "none"
        }}
      >
        Go to License MyAi Page
      </a>
    </div><div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", textAlign: "center" }}>
          FERON AI Manufacturing Assistant
        </h1>
        <p style={{ textAlign: "center", color: "#666" }}>
          What can I help you with today?
        </p>

        {!walletAddress ? (
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", marginBottom: "16px" }}>
              Connect your wallet to begin chatting with FERON
            </p>
            <button
              onClick={connectWallet}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4F46E5",
                color: "white",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                height: "300px",
                overflowY: "auto",
                marginTop: "20px",
                marginBottom: "20px",
                borderRadius: "6px",
                backgroundImage: "url('/feron-logo.png')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundColor: "#f9f9f9",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: msg.role === "user" ? "right" : "left",
                    backgroundColor: msg.role === "user"
                      ? "#d9ebff"
                      : msg.role === "assistant"
                        ? "#e6ffe6"
                        : "#eeeeee",
                    marginBottom: "8px",
                    padding: "8px",
                    borderRadius: "4px",
                    fontStyle: msg.role === "system" ? "italic" : "normal",
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask FERON something..."
                style={{ flex: 1, padding: "8px", fontSize: "14px" }} />
              <button onClick={sendMessage} disabled={isLoading} style={{ padding: "8px 16px" }}>
                {isLoading ? "..." : "Send"}
              </button>
            </div>

            <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "6px" }}>
              <label style={{ display: "block", marginBottom: "6px" }}>
                Upload File (Tier 1)
              </label>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
          </>
        )}
      </div></>
  );
}
