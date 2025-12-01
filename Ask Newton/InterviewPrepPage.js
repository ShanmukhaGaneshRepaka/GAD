// InterviewPrepPage.js
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../../services/ApplicantAPIService";
import { useUserContext } from "../../components/common/UserProvider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Snackbar from "../../components/common/Snackbar";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./InterviewPrepPage.css"
import botImage from '../../images/dashboard/mobilebanners/Bot.png';
import toggleimg from "../../images/icons/toggle.svg";

function InterviewPrepPage() {
  const { user } = useUserContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [openOptionsId, setOpenOptionsId] = useState(null);
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [applicantProfile, setApplicantProfile] = useState(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [queuedMessage, setQueuedMessage] = useState("");
  const chatEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const textInputRef = useRef(null);
  const cooldownIntervalRef = useRef(null);
  const resendTimeoutRef = useRef(null);
  const [snackbars, setSnackbars] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, chatId: null, title: '' });
  const [titleModal, setTitleModal] = useState({ open: false, mode: null, chatId: null, value: '' });
  const [isTitleSubmitting, setIsTitleSubmitting] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const isExistingChat = savedChats.some(c => c.id === currentChatId);
  const [followUps, setFollowUps] = useState([]);
  const title = generateChatTitle(messages);
  const [isChatCleared, setIsChatCleared] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

 const toggleSidebar = () => {
  setShowSidebar(prev => !prev);
};

useEffect(() => {
  const checkWidth = () => {
    setShowSidebar(window.innerWidth <= 992);
  };

  checkWidth(); 

  window.addEventListener("resize", checkWidth);
  return () => window.removeEventListener("resize", checkWidth);
}, []);


  function generateChatTitle(messages) {
  if (!messages || messages.length === 0) return "New Chat";

  const greetings = [
    "hi", "hello", "hey", "ok", "thanks", "thank you", "hii", "thankyou", "thx"
  ];

  // Get first 3 messages
  const firstThree = messages.slice(0, 3).map(m => m.text.trim().toLowerCase());

  // Filter out empty strings
  const meaningful = firstThree.filter(t => t !== "");

  // 1️⃣ If ALL messages are greetings → title = Greeting
  if (meaningful.every(t => greetings.includes(t))) {
    return "Greetings";
  }

  // Remove ONLY greeting messages from the content
  const cleaned = meaningful.filter(t => !greetings.includes(t));

  // If everything was greeting except one message, use that message
  if (cleaned.length === 0) {
    return "Greetings";
  }

  let combined = cleaned.join(" ").trim();

  // 2️⃣ Topic detection (smart)
  const keywords = [
    "java", "python", "docker", "css", "html", "react", "api",
    "machine learning", "ml", "ai", "deep learning",
    "sql", "database", "spring", "resume", "interview"
  ];

  const foundKeyword = keywords.find(word => combined.includes(word));

  if (foundKeyword) {
    // Capitalize properly
    return foundKeyword
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // 3️⃣ Fallback → short meaningful title
  if (combined.length > 60) {
    combined = combined.slice(0, 57) + "...";
  }

  return combined.charAt(0).toUpperCase() + combined.slice(1);
}


const handleFollowUpClick = (question) => {
  //setMessages(prev => [...prev, { sender: "user", text: question }]);
  setFollowUps([]); // Remove old follow-ups immediately
  sendMessage(question); // Reuse existing send logic
};

  const extractFollowUps = (rawResponse) => {
  try {
    let obj;

    if (typeof rawResponse === "object" && rawResponse !== null) {
      obj = rawResponse;
    } else {
      obj = JSON.parse(rawResponse);
    }

    // Ensure it returns an array
    return obj.followup || obj.followUp || obj.followups || [];

  } catch (err) {
    console.error("extractFollowUps error:", err);
    return [];
  }
};

const formatResponse = (rawResponse) => {
  try {
    let text = "";

    // If response is JSON from backend (wrapped), parse it
    if (typeof rawResponse === "string") {
      try {
        const parsed = JSON.parse(rawResponse);
        text = parsed.response || parsed.text || rawResponse;
      } catch {
        text = rawResponse; // already plain text / markdown
      }
    } else if (typeof rawResponse === "object" && rawResponse !== null) {
      text =
        rawResponse.response ||
        rawResponse.text ||
        JSON.stringify(rawResponse);
    } else {
      text = String(rawResponse);
    }

    text = String(text);

    // ----------- CRITICAL FIX -----------
    // DO NOT strip braces or quotes — code blocks need them!
    // Only convert escaped \n to real newlines
    text = text.replace(/\\n/g, "\n");

    // Clean accidental wrapping quotes
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      text = text.slice(1, -1);
    }

    return text.trim();
  } catch (err) {
    console.error("formatResponse error:", err);
    return rawResponse;
  }
};




  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addSnackbar = (snackbar) => {
    setSnackbars((prev) => [...prev, snackbar]);
  };

  const handleCloseSnackbar = (index) => {
    setSnackbars((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const onGlobalMouseDown = (e) => {
      if (!openOptionsId) return;
      const withinOptions = e.target?.closest?.('[data-role="options-btn"], [data-role="options-menu"]');
      if (!withinOptions) {
        setOpenOptionsId(null);
      }
    };
    document.addEventListener('mousedown', onGlobalMouseDown);
    return () => document.removeEventListener('mousedown', onGlobalMouseDown);
  }, [openOptionsId]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        if (!user?.id) return;
        const jwtToken = localStorage.getItem('jwtToken');
        const resp = await axios.get(`${apiUrl}/applicantprofile/${user.id}/profile-view`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setApplicantProfile(resp?.data || null);

      } catch (e) {
        console.error('Failed to fetch applicant skills', e);
        setApplicantProfile(null);
      }
    };
    fetchSkills();
  }, [user?.id]);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        if (!user?.id) return;
        const jwtToken = localStorage.getItem('jwtToken');
        const { data } = await axios.get(`${apiUrl}/aiPrepChat/getAllChatTitles/${user.id}`, {
          headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : undefined,
        });
        const list = Array.isArray(data) ? data : (data?.titles || []);
        const toJsDate = (v) => {
          try {
            if (Array.isArray(v)) {
              const [y, mo, d, h = 0, mi = 0, s = 0, nano = 0] = v;
              return new Date(y, (mo || 1) - 1, d || 1, h, mi, s, Math.floor((nano || 0) / 1e6));
            }
            return v ? new Date(v) : null;
          } catch (_) {
            return null;
          }
        };
        const mapped = list
          .map((t) => ({
            id: t.id ?? t.chatId ?? t.chatID ?? t.chat_id,
            title: t.title ?? t.name ?? 'Untitled',
            createdAt: (() => { const dt = toJsDate(t.createdAt ?? t.created_at); return dt ? dt.getTime() : undefined; })(),
          }))
          .filter((t) => t.id != null);
        if (mapped.length) setSavedChats(mapped);
      } catch (e) {
        console.error('Failed to load saved chat titles', e);
      }
    };
    fetchTitles();
  }, [user?.id]);

useEffect(() => {
  try {
    const raw = localStorage.getItem("savedChatsV1");
    if (raw) {
      let parsed = JSON.parse(raw);

      // 🔥 REMOVE chats that have NO messages in backend
      parsed = parsed.filter(c => c.title && c.title !== "New Chat");

      const sorted = [...parsed].sort((a, b) => {
  return (b.createdAt || 0) - (a.createdAt || 0);
}); 

      setSavedChats(parsed);
      persistSavedChats(parsed);
    }
  } catch (e) {
    console.error("Failed to load saved chats:", e);
  }
}, []);


  const focusInput = () => {
    setTimeout(() => textInputRef.current?.focus(), 0);
  };

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const persistSavedChats = (chats) => {
    try {
      localStorage.setItem("savedChatsV1", JSON.stringify(chats));
    } catch (e) {
      console.error("Failed to persist chats:", e);
    }
  };

  const formatSeconds = (s) => {
    const sec = Math.max(0, Math.floor(s));
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    const mm = String(m).padStart(2, '0');
    const rr = String(r).padStart(2, '0');
    return `${mm}:${rr}`;
  };

  const clearCooldownTimers = () => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    if (resendTimeoutRef.current) {
      clearTimeout(resendTimeoutRef.current);
      resendTimeoutRef.current = null;
    }
  };

  const cancelCooldown = () => {
    clearCooldownTimers();
    setIsCoolingDown(false);
    setCooldownRemaining(0);
    focusInput();
  };

  const sendNow = () => {
    if (!queuedMessage || isLoading) return;
    clearCooldownTimers();
    setIsCoolingDown(false);
    setCooldownRemaining(0);
    resendQueuedMessage();
    focusInput();
  };

  const skillsRequired = (applicantProfile) => {
    if (
      applicantProfile &&
      applicantProfile.applicant &&
      Array.isArray(applicantProfile.applicant.skillsRequired)
    ) {
      return applicantProfile.applicant.skillsRequired
        .map(skill => skill.skillName)
        .filter(Boolean);
    }
    return [];
  };

  const skillsArray = skillsRequired(applicantProfile);
  console.log(skillsArray);

  const resendQueuedMessage = async () => {
    if (!queuedMessage) return;
    setIsLoading(true);

    try {
      const jwtToken = localStorage.getItem("jwtToken");

      const postBody = {
        applicantId: user?.id ?? null,
        chatId: currentChatId ?? null,
        request: queuedMessage,
      };

      const { data } = await axios.post(
        `${apiUrl}/aiPrepModel/postQuery`,
        postBody,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );

      if (data?.chatId) setCurrentChatId(data.chatId);

      const reply = formatResponse(data);
      setMessages(prev => [...prev, { sender: "bot", text: reply }]);
      setFollowUps(extractFollowUps(data));
      if (currentChatId) {
        const jwtToken2 = localStorage.getItem("jwtToken");

        const chatArray = [
          ...messages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            message: m.text,
            time: new Date().toISOString(),
          })),
          { role: "assistant", message: reply, time: new Date().toISOString() }
        ];

        const payload = {
          savedChat: JSON.stringify(chatArray)
        };

        await axios.put(
          `${apiUrl}/aiPrepChat/${currentChatId}/updateChatDetails/${user?.id}`,
          payload,
          { headers: jwtToken2 ? { Authorization: `Bearer ${jwtToken2}` } : undefined }
        );
      }

      setQueuedMessage("");
      setCooldownRemaining(0);
      setIsCoolingDown(false);
      clearCooldownTimers();
      setInput("");

    } catch (err) {
      console.error("Chat resend error:", err);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ Connection error. Try again." }
      ]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

const sendMessage = async (overrideMessage = null) => {
  const userMessage = overrideMessage ?? input.trim();

  if (!userMessage || isLoading || isCoolingDown) return;

  setIsLoading(true);

  // Add user message to chat
  setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
  focusInput();

  if (!overrideMessage) setInput("");

  try {
    const jwtToken = localStorage.getItem("jwtToken");

    const postBody = {
      applicantId: user?.id ?? null,
      chatId: currentChatId ?? null,
      request: userMessage
    };

    const { data } = await axios.post(
      `${apiUrl}/aiPrepModel/postQuery`,
      postBody,
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );

    // -------------------------------
    // ⭐ NEW CHAT CREATED → Add to savedChats immediately
    // -------------------------------
    if (data?.chatId) {
      setCurrentChatId(data.chatId);

      // If chatId NOT in savedChats, push it immediately
      if (!savedChats.some(c => c.id === data.chatId)) {
        const newChat = {
          id: data.chatId,
          title: generateChatTitle([{ sender: "user", text: userMessage }]),
          createdAt: Date.now()
        };

        setSavedChats(prev => {
          const updated = [newChat, ...prev]; // add on top
          persistSavedChats(updated);
          return updated;
        });
      }
    }
    // -------------------------------

    const reply = formatResponse(data);
    setMessages(prev => [...prev, { sender: "bot", text: reply }]);

    // 🔥 Update follow-up questions
    setFollowUps(extractFollowUps(data));

    // ===========================================
    // 🚫 DO NOT SAVE IF:
    //  - Chat was cleared
    //  - No valid messages exist
    // ===========================================
    if (
      currentChatId &&  
      !isChatCleared &&  
      messages.length > 0
    ) {
      const jwtToken2 = localStorage.getItem("jwtToken");

      const chatArray = [
        ...messages.map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          message: m.text,
          time: new Date().toISOString(),
        })),
        { role: "user", message: userMessage, time: new Date().toISOString() },
        { role: "assistant", message: reply, time: new Date().toISOString() }
      ];

      const updatedTitle = generateChatTitle([
        ...messages,
        { sender: "user", text: userMessage },
        { sender: "bot", text: reply }
      ]);

      const payload = {
        title: updatedTitle,
        savedChat: JSON.stringify(chatArray)
      };

      await axios.put(
        `${apiUrl}/aiPrepChat/${currentChatId}/updateChatDetails/${user?.id}`,
        payload,
        { headers: jwtToken2 ? { Authorization: `Bearer ${jwtToken2}` } : undefined }
      );
    }

  } catch (err) {
    console.error("Chat error:", err);
    setMessages(prev => [
      ...prev,
      { sender: "bot", text: "⚠️ Connection error. Try again." }
    ]);
  } finally {
    setIsLoading(false);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }
};







const startNewChat = async () => {
  try {
    // 🔥 Enable saving again for NEW chat
    setIsChatCleared(false);

    const isExistingChat =
      currentChatId && savedChats.some(c => c.id === currentChatId);

    // Save ONLY if this chat is NEW and has real content
    if (
      messages.length > 0 &&
      currentChatId &&
      !isExistingChat &&
      messages[0]?.text?.trim() !== ""
    ) {

      const jwtToken = localStorage.getItem("jwtToken");

      const chatTitle = generateChatTitle(messages);

      const chatArray = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        message: m.text,
        time: new Date().toISOString(),
      }));

      const payload = {
        title: chatTitle,
        savedChat: JSON.stringify(chatArray)
      };

      await axios.put(
        `${apiUrl}/aiPrepChat/${currentChatId}/updateChatDetails/${user?.id}`,
        payload,
        { headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : undefined }
      );

      const newChat = {
        id: currentChatId,
        title: chatTitle,
        createdAt: Date.now()
      };

      setSavedChats(prev => [...prev, newChat]);
      persistSavedChats([...savedChats, newChat]);

      addSnackbar({
        message: "Chat saved successfully before starting a new one.",
        type: "success"
      });
    }

    // reset for brand new chat
    setMessages([]);
    setFollowUps([]);
    setCurrentChatId(null);
    setShowDropdown(false);
    focusInput();

  } catch (error) {
    console.error("Failed to save chat before new chat:", error);

    addSnackbar({
      message: "Unable to save previous chat. Starting new chat anyway.",
      type: "error"
    });

    setMessages([]);
    setFollowUps([]);
    setCurrentChatId(null);
    setShowDropdown(false);
    focusInput();
  }
};






  const loadChat = async (id) => {
  const chat = savedChats.find(c => c.id === id);
  setCurrentChatId(id); // this tells startNewChat() it is an existing chat
  setIsLoading(true);

  try {
    const jwtToken = localStorage.getItem("jwtToken");

    const { data } = await axios.get(
      `${apiUrl}/aiPrepChat/${id}/getChatDetailsById/${user?.id}`,
      { headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : undefined }
    );

    let messagesArr = [];

    if (data?.savedChat) {
      try {
        const parsed = JSON.parse(data.savedChat);
        messagesArr = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.messages)
          ? parsed.messages
          : [];
      } catch (err) {
        messagesArr = [];
      }
    }

    const mapped = messagesArr.map(m => ({
      sender: m.role === "user" ? "user" : "bot",
      text: m.message ?? m.content ?? m.text ?? "",
      timestamp: m.time ?? m.timestamp ?? undefined,
    }));

    setMessages(mapped);

  } catch (e) {
    console.error("Failed to load saved chat content", e);
    if (chat?.messages) setMessages(chat.messages);
  } finally {
    setIsLoading(false);
    focusInput();
  }
};


  const closeTitleModal = () => setTitleModal({ open: false, mode: null, chatId: null, value: '' });


  const deleteChat = async (id) => {
    const chat = savedChats.find((c) => c.id === id);
    if (!chat) return;
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      await axios.delete(`${apiUrl}/aiPrepChat/${id}/deleteChat/${user?.id}`, {
        headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : undefined,
      });
      const updated = savedChats.filter(c => c.id !== id);
      setSavedChats(updated);
      persistSavedChats(updated);
      if (currentChatId === id) {
        setMessages([]);
        setCurrentChatId(null);
      }
      addSnackbar({ message: 'Chat deleted successfully', type: 'success' });
    } catch (e) {
      console.error('Failed to delete chat on backend, removing locally anyway:', e);
      const updated = savedChats.filter(c => c.id !== id);
      setSavedChats(updated);
      persistSavedChats(updated);
      if (currentChatId === id) {
        setMessages([]);
        setCurrentChatId(null);
      }
      addSnackbar({ message: 'Removed locally. Server error deleting chat.', type: 'error' });
    }
    setOpenOptionsId(null);
  };

  const openDeleteConfirm = (id) => {
    const chat = savedChats.find((c) => c.id === id);
    setConfirmDelete({ open: true, chatId: id, title: chat?.title || 'this chat' });
  };

  const closeDeleteConfirm = () => setConfirmDelete({ open: false, chatId: null, title: '' });

  const confirmDeleteChat = async () => {
    const id = confirmDelete.chatId;
    if (!id) return;
    await deleteChat(id);
    closeDeleteConfirm();
  };

  const handleKeyPress = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    setInput("");          
    sendMessage(msg);      
  }
};


const handleClearChat = async () => {
  try {
    if (currentChatId) {
      const jwtToken = localStorage.getItem("jwtToken");

      // ❌ DELETE chat from backend
      await axios.delete(
        `${apiUrl}/aiPrepChat/${currentChatId}/deleteChat/${user?.id}`,
        { headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : undefined }
      );

      // ❌ Remove from local list
      const updated = savedChats.filter(c => c.id !== currentChatId);
      setSavedChats(updated);
      persistSavedChats(updated);
    }
  } catch (err) {
    console.error("Failed to delete chat while clearing:", err);
  }

  // 🚫 Prevent saving future messages accidentally
  setIsChatCleared(true);

  // Reset UI
  setCurrentChatId(null);
  setMessages([]);
  setFollowUps([]);
  setShowDropdown(false);
  focusInput();
};



  const handleExportChat = async (chatId) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");

    // ✅ Fetch FULL chat from API (REAL source of truth)
    const { data } = await axios.get(
      `${apiUrl}/aiPrepChat/${chatId}/getChatDetailsById/${user?.id}`,
      { headers: jwtToken ? { Authorization: `Bearer ${jwtToken}` } : undefined }
    );

    let messagesArr = [];

    if (data?.savedChat) {
      try {
        const parsed = JSON.parse(data.savedChat);
        messagesArr = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.messages)
          ? parsed.messages
          : [];
      } catch (err) {
        messagesArr = [];
      }
    }

    // ❗ If still no messages, stop
    if (!messagesArr.length) {
      addSnackbar({ message: "No messages found to export.", type: "error" });
      return;
    }

    // Build hidden export element
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.padding = "20px";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.maxWidth = "800px";
    element.style.margin = "0 auto";

    const title = document.createElement("h1");
    title.textContent = data.title || "Chat Export";
    title.style.textAlign = "center";
    title.style.marginBottom = "20px";
    title.style.color = "#333";
    element.appendChild(title);

    const date = document.createElement("p");
    date.textContent = `Exported on: ${new Date().toLocaleString()}`;
    date.style.textAlign = "center";
    date.style.marginBottom = "30px";
    date.style.color = "#666";
    element.appendChild(date);

    // Render all messages into element
    messagesArr.forEach((msg) => {
      const messageDiv = document.createElement("div");
      messageDiv.style.marginBottom = "15px";
      messageDiv.style.padding = "10px 15px";
      messageDiv.style.borderRadius = "8px";
      messageDiv.style.maxWidth = "80%";

      if (msg.role === "user") {
        messageDiv.style.marginLeft = "auto";
        messageDiv.style.backgroundColor = "#fdf3e9";
        messageDiv.style.border = "1px solid #f0e0d0";
      } else {
        messageDiv.style.backgroundColor = "#f5f5f5";
        messageDiv.style.border = "1px solid #e0e0e0";
      }

      const content = document.createElement("div");
      content.innerHTML = (msg.message || msg.content || msg.text || "")
        .replace(/\n/g, "<br>")
        .trim();

      messageDiv.appendChild(content);

      const time = document.createElement("div");
      time.textContent = new Date(msg.time || msg.timestamp || Date.now()).toLocaleString();
      time.style.fontSize = "0.8em";
      time.style.color = "#666";
      time.style.marginTop = "5px";
      time.style.textAlign = "right";

      messageDiv.appendChild(time);
      element.appendChild(messageDiv);
    });

    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });

    document.body.removeChild(element);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);

    const fileName = `chat_${data.title || "export"}_${new Date()
      .toISOString()
      .split("T")[0]}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");

    pdf.save(fileName);
  } catch (error) {
    console.error("Error exporting chat:", error);
    addSnackbar({ message: "Failed to export chat.", type: "error" });
  }
};


  return (
    <div className="border-style">
      <div className="blur-border-style"></div>
      <div className="dashboard__content ai-chat-prep" >
        <div className="ai-perp">
          <div className="ask-newton-header">
            <div className="left-header">
             
<span
  className="hide-chat-toggle"
  onClick={toggleSidebar}
  style={{
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px",
  }}
  aria-label={showSidebar ? "Hide Saved Chat" : "Show Saved Chat"}
>
  <img
    src={toggleimg}
    alt="Toggle Sidebar"
    style={{
      width: "22px",   // adjust size as needed
      height: "22px",
      transform: showSidebar ? "rotate(0deg)" : "rotate(180deg)", // optional flip
      transition: "transform 0.3s ease",
    }}
  />
</span>

            </div>
            <div className="center">
              <h2 className="ask-newton-text">Ask Newton!</h2>
            </div>

            <div className="ai-top-buttons">
              <div className="clear-new-buttons">
                <button
                  className="ai-new-chat"
                  onClick={startNewChat}
                  style={{ textTransform: "none" }}
                >
                  New chat
                </button>
                <button
                  className="ai-clear-chat"
                  onClick={handleClearChat}
                  style={{ textTransform: "none" }}
                >
                  Clear chat
                </button>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="interview-prep-dashboard-content">
             <aside
  className={`interview-prep-sidebar ${!showSidebar ? "hidden" : ""} ${
    isMobile ? "interview-prep-mobile" : ""
  }`}
>
              <div className="interview-prep-sidebar-header">
                <span>
                  <img src={botImage} alt="Bot icon" />
                </span>
                <h2>Ask Newton!</h2>
              </div>

              <div className="ai-sidebar-saved-content">
                <div
                  className="interview-prep-chats-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <h3 className="interview-prep-chats-header">Saved chats</h3>
                  <span className="dropdown-icon">
                    {sidebarOpen ? "▲" : "▼"}
                  </span>
                </div>

                <div
                  className={`interview-prep-chats-list-wrapper ${
                    sidebarOpen ? "open" : ""
                  }`}
                >
                  <div className="interview-prep-chats-list">
                    {savedChats.length === 0 ? (
                      <div className="interview-prep-no-chats">
                        No saved chats yet
                      </div>
                    ) : (
                      <ul
                        className="interview-prep-chat-list"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                      >
                        {savedChats.map((c) => (
                          <li
                            key={c.id}
                            className={`interview-prep-chat-item ${
                              selectedChatId === c.id ? "selected" : ""
                            }`}
                            onClick={() => {
                              loadChat(c.id);
                              setSelectedChatId(c.id);
                            }}
                            title={new Date(c.createdAt).toLocaleString()}
                          >
                            <div className="interview-prep-chat-info">
                              <span className="interview-prep-chat-title">
                                {c.title}
                              </span>
                            </div>

                            <span
                              className="interview-prep-chat-options"
                              data-role="options-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenOptionsId(
                                  openOptionsId === c.id ? null : c.id
                                );
                              }}
                            >
                              ⋮
                            </span>

                            {openOptionsId === c.id && (
                              <div
                                className="interview-prep-options-menu"
                                data-role="options-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span
                                  className="interview-prep-option-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportChat(c.id);
                                    setOpenOptionsId(null);
                                  }}
                                >
                                  Export chat
                                </span>
                                <span
                                  className="interview-prep-option-btn"
                                  onClick={() => openDeleteConfirm(c.id)}
                                >
                                  Delete chat
                                </span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="interview-prep-main">

              <div className="interview-prep-chat-container">

                {isCoolingDown && (
                  <div className="interview-prep-cooldown-notice">
                    We’re a bit busy right now. Your last message will be sent automatically in {formatSeconds(cooldownRemaining)}.
                    <div className="interview-prep-cooldown-actions">
                      <button
                        className="interview-prep-cooldown-btn"
                        onClick={sendNow}
                        disabled={!queuedMessage || isLoading}
                      >
                        Send now
                      </button>
                      <button
                        className="interview-prep-cooldown-btn"
                        onClick={cancelCooldown}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="interview-prep-messages">
  {messages.length === 0 ? (
    <div className="interview-prep-welcome-message">
      Hello! What can I help you with today?
    </div>
  ) : (
    messages.map((msg, idx) => (
      <div
        key={idx}
        className={`interview-prep-message ${
          msg.sender === "user"
            ? "interview-prep-user-message"
            : "interview-prep-assistant-message"
        }`}
      >
        <div className="interview-prep-message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="interview-prep-markdown-p" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="interview-prep-markdown-li" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="interview-prep-markdown-ul" {...props} />
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code
                    className="interview-prep-markdown-inline-code"
                    {...props}
                  />
                ) : (
                  <pre className="interview-prep-markdown-code-block">
                    <code {...props} />
                  </pre>
                ),
              h1: ({ node, ...props }) => (
                <h1 className="interview-prep-markdown-h1" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="interview-prep-markdown-h2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="interview-prep-markdown-h3" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="interview-prep-markdown-ol" {...props} />
              ),
            }}
          >
            {msg.text}
          </ReactMarkdown>
        </div>

        {/* FOLLOW-UP QUESTIONS */}
        {msg.sender === "bot" &&
          idx === messages.length - 1 &&
          followUps.length > 0 && (
            <div className="followup-section">
              <h3 className="followup-heading">Choose the related question</h3>
              <div className="followup-list">
               {followUps.map((q, i) => (
  <div
    key={i}
    className="followup-item"
    onClick={() => handleFollowUpClick(q)}
  >
    <b>Q{i + 1}:</b> {q}
  </div>
))}
              </div>
            </div>
          )}
      </div>
    ))
  )}

  {isLoading && (
    <div className="interview-prep-typing-indicator">
      <div className="interview-prep-typing-dots">
        <span className="interview-prep-typing-dot"></span>
        <span className="interview-prep-typing-dot"></span>
        <span className="interview-prep-typing-dot"></span>
      </div>
      <span>Loading...</span>
    </div>
  )}

  <div ref={chatEndRef} className="interview-prep-chat-end" />
</div>

                <div className="interview-prep-input-container">
  <input
    type="text"
    className="interview-prep-chat-input"
    value={input}
    onChange={(e) => {
      const v = e.target.value;
      setInput(v);
      if (isCoolingDown) setQueuedMessage(v);
    }}
    placeholder="Ask newton!"
    onKeyDown={handleKeyPress}
    disabled={isLoading || isCoolingDown}
    aria-label="Chat input"
    ref={textInputRef}
  />

  <span
    onClick={() => (sendMessage(), setInput(""))}
    aria-label="Send message"
    style={{
      cursor: input.trim() ? "pointer" : "default",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="14.976"
      viewBox="0 0 16 14.976"
    >
      <g transform="translate(-11.874 -14.302)">
        <path
          d="M27.633,21.411,12.471,14.342a.42.42,0,0,0-.571.527l2.238,6.5h6.782a.42.42,0,1,1,0,.839H14.139L11.9,28.723a.43.43,0,0,0-.021.136.42.42,0,0,0,.6.38L27.633,22.17a.42.42,0,0,0,0-.759Z"
          style={{
            fill: input.trim() ? "#F97316" : "#d3d3d3", // ACTIVE / INACTIVE COLOR
            transition: "0.2s ease",
          }}
        />
      </g>
    </svg>
  </span>
</div>

              </div>
            </div>

        


           
          </div>
        </div>
        {snackbars.map((snackbar, index) => (
  <Snackbar
    key={index}
    index={index}
    message={snackbar.message}
    type={snackbar.type}
    onClose={() => handleCloseSnackbar(index)}
    className="interview-prep-snackbar"
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 99999,        // <-- higher than sidebar
      pointerEvents: "auto" // allow clicking close button
    }}
  />
))}
      </div>
       <div
  className={`interview-prep-modal ${confirmDelete.open ? 'interview-prep-modal-show' : ''}`}
  style={{
    display: confirmDelete.open ? "flex" : "none",
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
    backdropFilter: "blur(2px)"
  }}
  onClick={(e) => { if (e.target === e.currentTarget) closeDeleteConfirm(); }}
>

  <div
    style={{
      width: "450px",
      background: "#ffffff",
      borderRadius: "14px",
      boxShadow: "0 6px 25px rgba(0,0,0,0.18)",
      padding: "30px 28px",
      display: "flex",
      flexDirection: "column",
      gap: "22px",
      animation: "fadeIn 0.2s ease"
    }}
  >

    {/* TEXT */}
    <div style={{ fontSize: "16px", color: "#333", lineHeight: "1.6" }}>
      You are about to delete <b>{confirmDelete.title}</b>.  
      This action cannot be undone.
    </div>

    {/* DIVIDER */}
    <div style={{
      height: "1px",
      background: "#e5e7eb",
      margin: "0 -10px"
    }} />

    {/* BUTTONS */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "5px"
      }}
    >
      {/* Cancel Button */}
      <button
        onClick={closeDeleteConfirm}
        style={{
          padding: "10px 28px",
          borderRadius: "6px",
          border: "1px solid #f97316",
          background: "#fff",
          color: "#f97316",
          fontSize: "15px",
          cursor: "pointer",
          transition: "0.2s ease"
        }}
      >
        Cancel
      </button>

      {/* Delete Button */}
      <button
        onClick={confirmDeleteChat}
        style={{
          padding: "10px 28px",
          borderRadius: "6px",
          border: "none",
          background: "linear-gradient(90deg, #f97316, #fbbf24)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "0.2s ease"
        }}
      >
        Delete
      </button>
    </div>

  </div>
</div>

    </div>
  );
}

export default InterviewPrepPage;
